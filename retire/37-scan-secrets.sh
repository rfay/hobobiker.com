#!/usr/bin/env bash
# Gate: nothing secret or personal in the static archive. Runs after the rewrite, before the checks.
# It looks for the secret shapes in migration/secret-patterns.sh (AWS, Google and Maps v1 keys, private
# keys, passwords inside URLs) in every text file; for the files removed from production for their personal
# data; for database dumps; for the value of any credential-named variable still set on PREP; and, with
# NEEDLES=<file> (one string per line, kept outside every repository), for each of those strings.
# Prints names and counts only, never a value. Exits 1 on any finding.
#
#   NEEDLES=/path/outside/the/repo/needles.txt retire/37-scan-secrets.sh
source "$(dirname "$0")/lib.sh"
source "$ORIGINAL/migration/secret-patterns.sh"
dir="$STATIC_PUBLIC"
failures=0
fail() { echo "secrets: FAIL: $*"; failures=$((failures + 1)); }
# grep exits 1 for "no match" and 2 for an error; an error must stop the run, never pass.
search() {
  local rc=0
  grep "$@" || rc=$?
  [ "$rc" -le 1 ] || { echo "secrets: grep exited $rc" >&2; exit 3; }
}
files=$(find "$dir" -type f | wc -l | tr -d ' ')

for p in "${secret_patterns[@]}"; do
  name=${p%%=*} re=${p#*=}
  hits=$(search -rlEI -e "$re" "$dir" | sed "s|^$dir/||")
  [ -z "$hits" ] || fail "$name in $(echo "$hits" | wc -l | tr -d ' ') file(s): $(echo "$hits" | head -5 | tr '\n' ' ')"
done

for f in "${removed_personal_files[@]}"; do
  for p in "sites/default/files/$f" "files/$f"; do
    [ ! -e "$dir/$p" ] || fail "removed personal-data file is present: $p"
  done
done

dumps=$(find "$dir" -type f \( -iname '*.sql' -o -iname '*.sql.*' -o -iname '*.mysql' -o -iname '*.mysql.*' \) | sed "s|^$dir/||")
[ -z "$dumps" ] || fail "database dump(s): $(echo "$dumps" | head -5 | tr '\n' ' ')"

# Values of credential-named variables still set on PREP (the sanitized snapshot should leave none).
values=$(mktemp)
trap 'rm -f "$values"' EXIT
in_prep ddev mysql -N -e "SELECT name, value FROM variable
  WHERE name REGEXP '(^|_)(key|secret|token|password|pass|auth|apikey|private)(_|\$)'
    AND name NOT LIKE 'user\_mail\_%'
    AND value NOT IN ('', 's:0:\"\";', 'N;', 'b:0;', 'i:0;')" |
  sed -nE 's/^([^\t]+)\ts:[0-9]+:"(.{8,})";$/\1\t\2/p' > "$values"
nvalues=$(grep -c . "$values" || true)
while IFS=$'\t' read -r name value; do
  n=$(search -rlFI -e "$value" "$dir" | wc -l | tr -d ' ')
  [ "$n" = 0 ] || fail "the value of variable $name in $n file(s)"
done < "$values"

if [ -n "${NEEDLES:-}" ]; then
  [ -s "$NEEDLES" ] || { echo "secrets: NEEDLES file '$NEEDLES' is missing or empty" >&2; exit 2; }
  n=$(search -rlFI -f "$NEEDLES" "$dir" | wc -l | tr -d ' ')
  [ "$n" = 0 ] || fail "$n file(s) contain a needle"
  needles_note="$(grep -c . "$NEEDLES") needles"
else
  needles_note="needles not checked (set NEEDLES=<file>)"
fi

echo "secrets: $files file(s) scanned; ${#secret_patterns[@]} patterns, ${#removed_personal_files[@]} removed files, $nvalues credential value(s) on prep, $needles_note; $failures failure(s)"
[ "$failures" = 0 ]
