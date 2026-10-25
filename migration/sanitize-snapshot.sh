#!/usr/bin/env bash
# Builds a publishable pristine snapshot from this project's current database and files (normally a
# fresh `ddev pull` of production), without changing either: the database is copied into a separate
# `sanitize` database and cleaned there, then a gate checks the result and the files directory. Only if
# the gate passes are the snapshot files written:
#   .tarballs/db.sql.zst, db.sql.gz, files.tar, files.tar.gz
#
# Prints names and counts only, never a value. Why it exists: the dumps published in hobobiker-assets
# v1.0 and v1.1 had only been through `drush sql-sanitize`, which scrubs users, so they carried API
# credentials, an AWS key, visitor IPs and commenters' emails (HANDOFF.md, 2026-10-24 and 25).
#
#   migration/sanitize-snapshot.sh                         # sanitize, check, write
#   migration/sanitize-snapshot.sh --check-only            # sanitize and check; write nothing
#   migration/sanitize-snapshot.sh --needles FILE          # also fail on any line of FILE (a phone number,
#                                                          # an email) found anywhere; keep FILE outside the repo
#   migration/sanitize-snapshot.sh --out DIR               # write somewhere other than .tarballs/
#
# Then restore from it (migration/restore-pristine.sh) and record the new fingerprint:
#   migration/fingerprint.sh > migration/pristine.fingerprint

set -euo pipefail
cd "$(dirname "$0")/.."

out=.tarballs
needles=
check_only=
while [ $# -gt 0 ]; do
  case "$1" in
    --out) out=$2; shift 2 ;;
    --needles) needles=$2; shift 2 ;;
    --check-only) check_only=1; shift ;;
    *) echo "Unknown argument: $1" >&2; exit 2 ;;
  esac
done
[ -z "$needles" ] || [ -s "$needles" ] || { echo "Needles file '$needles' is missing or empty" >&2; exit 2; }

files_dir=docroot/sites/default/files
work=.tarballs/.sanitize-work   # .tarballs is gitignored
rm -rf "$work"
mkdir -p "$work" "$out"
trap 'rm -rf "$work"; ddev mysql -e "DROP DATABASE IF EXISTS sanitize" >/dev/null 2>&1 || true' EXIT

sql() { ddev mysql --database=sanitize -N "$@"; }

# --- 1. Copy the live database into `sanitize` -------------------------------------------------------
echo "Copying the live database into 'sanitize'"
ddev export-db --file="$work/live.sql.gz" >/dev/null
ddev import-db --database=sanitize --file="$work/live.sql.gz" --no-progress >/dev/null
rm -f "$work/live.sql.gz"

# --- 2. Remove what is known to be secret or personal ------------------------------------------------
# Credentials found in 2026-10 (most are already deleted on production; this keeps them out regardless).
secret_vars="'smtp_username','smtp_password','flickr_api_key','flickr_api_secret','flickr_auth_token',
  'tag1quo_token','tag1quo_siteid','drupal_private_key','googlemap_api_key'"
# Visitor logs, sessions and caches. cache_% includes cache_form, which holds form state.
truncate_tables=$(sql -e "SELECT table_name FROM information_schema.tables WHERE table_schema = 'sanitize'
  AND (table_name IN ('watchdog','accesslog','sessions','flood','batch','captcha_sessions')
       OR table_name LIKE 'cache%') ORDER BY table_name")

sql <<SQL | sed 's/\t/ /'
DELETE FROM variable WHERE name IN ($secret_vars);
SELECT 'variables deleted', ROW_COUNT();
-- An S3 destination keeps its access key and secret inside the location URL.
DELETE FROM backup_migrate_destinations;
SELECT 'backup_migrate destinations deleted', ROW_COUNT();
UPDATE backup_migrate_schedules SET enabled = 0 WHERE enabled <> 0;
SELECT 'backup_migrate schedules disabled', ROW_COUNT();
-- As drush sql-sanitize does: every password becomes "password", every email user+UID@localhost.
UPDATE users SET pass = MD5('password'), mail = CONCAT('user+', uid, '@localhost'),
  init = CONCAT('user+', uid, '@localhost') WHERE uid > 0;
SELECT 'users sanitized', ROW_COUNT();
-- Commenters' emails and IPs are never shown on the site; their names and homepages are.
UPDATE comments SET mail = '', hostname = '127.0.0.1' WHERE mail <> '' OR hostname <> '127.0.0.1';
SELECT 'comments sanitized', ROW_COUNT();
-- hostname is part of poll_votes' primary key, so each anonymous vote gets its own placeholder.
SET @vote = 0;
UPDATE poll_votes SET hostname = CONCAT('0.0.0.', (@vote := @vote + 1)) ORDER BY nid, uid, hostname;
SELECT 'poll votes sanitized', ROW_COUNT();
SQL
n=0
for t in $truncate_tables; do
  rows=$(sql -e "SELECT COUNT(*) FROM \`$t\`")
  sql -e "TRUNCATE TABLE \`$t\`"
  n=$((n + rows))
done
echo "tables truncated $(echo "$truncate_tables" | wc -w | tr -d ' ') ($n rows)"

ddev export-db --database=sanitize --compression=none --file="$work/db.sql" >/dev/null

# --- 3. The gate ---------------------------------------------------------------------------------------
# It does not trust the list above to be complete: it looks for anything shaped like a secret, in every
# table (via the dump's text) and in every file.
failures=0
fail() { echo "GATE FAIL: $*"; failures=$((failures + 1)); }
# grep exits 1 for "no match" and 2 for an error. A search that errors must stop the run, never pass.
search() {
  local rc=0
  grep "$@" || rc=$?
  [ "$rc" -le 1 ] || { echo "GATE ERROR: grep $1 exited $rc" >&2; exit 3; }
}

secret_patterns=(
  'aws_access_key=(AKIA|ASIA)[A-Z0-9]{16}'
  'google_api_key=AIza[0-9A-Za-z_-]{35}'
  'google_maps_v1_key=ABQIAAAA[0-9A-Za-z_-]{20}'
  'private_key=-----BEGIN [A-Z ]*PRIVATE KEY'
  "url_with_password=[a-z][a-z0-9+.-]*://[^/@:[:space:]'\"\\\\]+:[^/@[:space:]'\"\\\\]+@"
)

echo "Gate: database"
for p in "${secret_patterns[@]}"; do
  name=${p%%=*} re=${p#*=}
  # mysqldump writes each table's rows on INSERT lines, so the line names the table.
  tables=$(search -E -e "$re" "$work/db.sql" | search -oE -e '^INSERT INTO `[^`]+`' | sed 's/INSERT INTO //; s/`//g' | sort | uniq -c | awk '{printf " %s(%s)", $2, $1}')
  [ -z "$tables" ] || fail "$name in table(s):$tables"
done
# Any variable named like a credential must be empty.
named=$(sql -e "SELECT name FROM variable
  WHERE name REGEXP '(^|_)(key|secret|token|password|pass|auth|apikey|private)(_|\$)'
    AND name NOT LIKE 'user\_mail\_%'
    AND value NOT IN ('', 's:0:\"\";', 'N;', 'b:0;', 'i:0;')" | tr '\n' ' ')
[ -z "$named" ] || fail "credential-named variable(s) not empty: $named"
leftover=$(sql -e "
  SELECT CONCAT('users:', COUNT(*)) FROM users
    WHERE uid > 0 AND (pass <> MD5('password') OR mail <> CONCAT('user+', uid, '@localhost'))
  UNION ALL SELECT CONCAT('comments:', COUNT(*)) FROM comments WHERE mail <> '' OR hostname <> '127.0.0.1'
  UNION ALL SELECT CONCAT('poll_votes:', COUNT(*)) FROM poll_votes WHERE hostname NOT LIKE '0.0.0.%'
  UNION ALL SELECT CONCAT('backup_migrate_destinations:', COUNT(*)) FROM backup_migrate_destinations" |
  search -v ':0$' | tr '\n' ' ')
[ -z "$leftover" ] || fail "rows not sanitized: $leftover"
for t in $truncate_tables; do
  rows=$(sql -e "SELECT COUNT(*) FROM \`$t\`")
  [ "$rows" = 0 ] || fail "table $t still has $rows rows"
done

echo "Gate: files ($files_dir)"
# Personal data removed from production on 2026-10-24 (names only; the contents were never recorded).
for f in WSLNHandVT.xml NHWarmShowers.xml NEFamily.xml warmshowers.html warmshowers.xsl \
         newenglandcontacts.html NEFamily.xsl; do
  [ ! -e "$files_dir/maps/$f" ] || fail "removed personal-data file is present: maps/$f"
done
dumps=$(find "$files_dir" -type f \( -iname '*.sql' -o -iname '*.sql.*' -o -iname '*.mysql' -o -iname '*.mysql.*' \) | sed "s|^$files_dir/||" | tr '\n' ' ')
[ -z "$dumps" ] || fail "database dump(s) in files: $dumps"
for p in "${secret_patterns[@]}"; do
  name=${p%%=*} re=${p#*=}
  hits=$(search -rlEI -e "$re" "$files_dir" | sed "s|^$files_dir/||" | tr '\n' ' ')
  [ -z "$hits" ] || fail "$name in file(s): $hits"
done

if [ -n "$needles" ]; then
  echo "Gate: needles ($(grep -c . "$needles") lines from $needles)"
  n=$(search -cF -f "$needles" "$work/db.sql")
  [ "$n" = 0 ] || fail "$n database dump line(s) contain a needle"
  n=$(search -rlF -f "$needles" "$files_dir" | wc -l | tr -d ' ')
  [ "$n" = 0 ] || fail "$n file(s) contain a needle"
fi

if [ "$failures" -gt 0 ]; then
  echo "Gate: $failures failure(s); nothing written."
  exit 1
fi
echo "Gate: passed"
[ -z "$check_only" ] || { echo "--check-only: nothing written."; exit 0; }

# --- 4. Write the snapshot -----------------------------------------------------------------------------
# Like any `ddev import-files` archive, files.tar holds the contents of sites/default/files.
# COPYFILE_DISABLE keeps macOS tar from adding ._ resource-fork entries.
zstd -q -f -19 "$work/db.sql" -o "$out/db.sql.zst"
gzip -9 -c "$work/db.sql" > "$out/db.sql.gz"
COPYFILE_DISABLE=1 tar -cf "$out/files.tar" -C "$files_dir" .
gzip -9 -c "$out/files.tar" > "$out/files.tar.gz"
for f in db.sql.zst db.sql.gz files.tar files.tar.gz; do
  printf '%-13s %s bytes\n' "$f" "$(wc -c < "$out/$f" | tr -d ' ')"
done
echo "Written to $out/. Next: migration/restore-pristine.sh, then"
echo "  migration/fingerprint.sh > migration/pristine.fingerprint"
