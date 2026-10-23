#!/usr/bin/env bash
# Put PREP back to the pristine state with PREP's own restore script (database and files from its
# .tarballs/, caches cleared, fingerprint compared). Everything after this is a script.
source "$(dirname "$0")/lib.sh"
guard_prep
"$PREP/migration/restore-pristine.sh" | tail -1
nodes=$(in_prep ddev mysql -N -e "SELECT COUNT(*) FROM node n JOIN node_revisions r ON n.vid = r.vid WHERE n.status = 1")
echo "restore: $PREP has $nodes published nodes (expect 1255)"
