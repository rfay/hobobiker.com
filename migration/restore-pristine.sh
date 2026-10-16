#!/usr/bin/env bash
# Restores this disposable copy to its pristine state: the database from .tarballs/db.sql.zst and
# the files directory from .tarballs/files.tar (both gitignored, never committed). Prints the
# fingerprint afterwards; compare it with migration/pristine.fingerprint.
#
#   migration/restore-pristine.sh            # database and files
#   migration/restore-pristine.sh --db-only  # database only

set -euo pipefail
cd "$(dirname "$0")/.."

db=.tarballs/db.sql.zst
files=.tarballs/files.tar
files_dir=docroot/sites/default/files

[ -f "$db" ] || { echo "Missing $db" >&2; exit 1; }

echo "Restoring database from $db"
ddev import-db --file="$db"

if [ "${1:-}" != "--db-only" ]; then
  [ -f "$files" ] || { echo "Missing $files" >&2; exit 1; }
  echo "Restoring files from $files"
  rm -rf "$files_dir"
  tar -xf "$files" -C docroot/sites/default
fi

# Drupal 6 caches rendered output in the database; a restored dump may carry stale cache rows.
# (DDEV has no `ddev drush` shortcut for drupal6 projects; the container has drush 5.9.)
ddev exec drush cc all >/dev/null 2>&1 || echo "warning: drush cc all failed; caches may be stale" >&2

migration/fingerprint.sh > .tarballs/last-restore.fingerprint
if diff -u migration/pristine.fingerprint .tarballs/last-restore.fingerprint; then
  echo "Restore OK: fingerprint matches migration/pristine.fingerprint"
else
  echo "Restore finished, but the fingerprint differs from migration/pristine.fingerprint (diff above)" >&2
  exit 1
fi
