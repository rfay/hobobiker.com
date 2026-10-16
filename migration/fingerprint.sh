#!/usr/bin/env bash
# Prints a fingerprint of the local site's state: row counts for the tables that matter, a content
# checksum, and a count and total size of the files directory. Two runs that print the same output
# describe the same site. Used to prove a restore really restored.
#
#   migration/fingerprint.sh            # print
#   migration/fingerprint.sh > a.txt    # compare later with diff

set -euo pipefail
cd "$(dirname "$0")/.."

# group_concat_max_len defaults to 1024 bytes, which would silently checksum only the first rows.
ddev mysql -N -e "
SET SESSION group_concat_max_len = 1073741824;
SELECT 'nodes', COUNT(*) FROM node
UNION ALL SELECT 'nodes_published', COUNT(*) FROM node WHERE status = 1
UNION ALL SELECT 'node_revisions', COUNT(*) FROM node_revisions
UNION ALL SELECT 'comments', COUNT(*) FROM comments
UNION ALL SELECT 'url_alias', COUNT(*) FROM url_alias
UNION ALL SELECT 'menu_links', COUNT(*) FROM menu_links
UNION ALL SELECT 'files', COUNT(*) FROM files
UNION ALL SELECT 'term_data', COUNT(*) FROM term_data
UNION ALL SELECT 'variable', COUNT(*) FROM variable
UNION ALL SELECT 'body_md5', MD5(GROUP_CONCAT(MD5(CONCAT(r.vid, r.title, r.body)) ORDER BY r.vid SEPARATOR ''))
  FROM node n JOIN node_revisions r ON n.vid = r.vid
UNION ALL SELECT 'comment_md5', MD5(GROUP_CONCAT(MD5(CONCAT(cid, comment)) ORDER BY cid SEPARATOR '')) FROM comments;
" | sed 's/\t/ /'
ddev exec -d /var/www/html/docroot/sites/default/files \
  'printf "files_on_disk %s\nfiles_bytes %s\n" "$(find . -type f | wc -l)" "$(find . -type f -printf "%s\n" | awk "{s+=\$1} END {print s}")"'
