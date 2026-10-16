#!/usr/bin/env bash
# Read-only audit of this copy: inventory, render-time content, stored-but-hidden content, assets.
# Changes nothing. Every section prints the query (or command) it came from, so a number in
# DISCOVERIES.md can be traced back and re-run.
#
#   migration/audit.sh             # print everything
#   migration/audit.sh > a.txt     # keep a copy

set -euo pipefail
cd "$(dirname "$0")/.."

files_dir=docroot/sites/default/files
# Current revision of every node (Drupal 6: node.vid = node_revisions.vid).
CUR="node n JOIN node_revisions r ON n.vid = r.vid"

section() { printf '\n=== %s\n' "$1"; }
q() {
  printf -- '-- %s\n' "$(echo "$1" | tr -s ' \n' ' ')"
  ddev mysql -e "$1"
}

section "1. Inventory: nodes by type and status"
q "SELECT type, COUNT(*) total, SUM(status=1) published, SUM(status=0) unpublished FROM node GROUP BY type ORDER BY total DESC"
q "SELECT COUNT(*) total, SUM(status=1) published FROM node"
q "SELECT nid, type, status, title FROM node WHERE type = '' OR type NOT IN (SELECT type FROM node_type)"

section "2. Comments (Drupal 6 comments.status: 0 = published, 1 = unpublished)"
q "SELECT status, COUNT(*) FROM comments GROUP BY status"
q "SELECT c.nid, n.status node_status, COUNT(*) comments, n.title FROM comments c JOIN node n ON n.nid = c.nid GROUP BY c.nid ORDER BY comments DESC LIMIT 5"
q "SELECT COUNT(*) comments_on_unpublished_nodes FROM comments c JOIN node n ON n.nid = c.nid WHERE n.status = 0"
q "SELECT name, status FROM system WHERE type = 'module' AND name = 'comment'"
q "SELECT r.name role, p.perm LIKE '%access comments%' has_access_comments FROM role r LEFT JOIN permission p ON p.rid = r.rid"

section "3. Paths, menus, taxonomy"
q "SELECT COUNT(*) aliases, COUNT(DISTINCT src) sources FROM url_alias"
q "SELECT COUNT(*) aliases_to_missing_nodes FROM url_alias a WHERE a.src LIKE 'node/%' AND a.src REGEXP '^node/[0-9]+\$' AND NOT EXISTS (SELECT 1 FROM node n WHERE n.nid = SUBSTRING(a.src, 6))"
q "SELECT COUNT(*) nodes_with_several_aliases FROM (SELECT src FROM url_alias WHERE src REGEXP '^node/[0-9]+\$' GROUP BY src HAVING COUNT(*) > 1) x"
q "SELECT COUNT(*) published_nodes_without_alias FROM node n WHERE n.status = 1 AND NOT EXISTS (SELECT 1 FROM url_alias a WHERE a.src = CONCAT('node/', n.nid))"
q "SELECT menu_name, COUNT(*) links, SUM(hidden = 0) visible FROM menu_links GROUP BY menu_name ORDER BY links DESC"
q "SELECT m.menu_name, m.link_path, m.link_title, n.status FROM menu_links m JOIN node n ON m.link_path = CONCAT('node/', n.nid) WHERE n.status = 0 AND m.hidden = 0 AND m.menu_name NOT LIKE 'book-toc-%'"
q "SELECT m.menu_name, COUNT(*) visible_links_to_unpublished FROM menu_links m JOIN node n ON m.link_path = CONCAT('node/', n.nid) WHERE n.status = 0 AND m.hidden = 0 GROUP BY m.menu_name"
q "SELECT v.name vocabulary, COUNT(t.tid) terms FROM vocabulary v LEFT JOIN term_data t ON t.vid = v.vid GROUP BY v.vid"

section "4. Input formats: use by current revisions, and filters each runs"
q "SELECT r.format, f.name, COUNT(*) nodes, SUM(n.status) published FROM $CUR LEFT JOIN filter_formats f ON f.format = r.format GROUP BY r.format ORDER BY r.format"
q "SELECT f.format, f.name, GROUP_CONCAT(CONCAT(fl.module, '/', fl.delta) ORDER BY fl.weight) filters FROM filter_formats f LEFT JOIN filters fl ON fl.format = f.format GROUP BY f.format"
q "SELECT DISTINCT fl.module, s.status module_enabled FROM filters fl LEFT JOIN system s ON s.name = fl.module AND s.type = 'module' WHERE s.status IS NULL OR s.status = 0"
q "SELECT name, value FROM variable WHERE name = 'filter_default_format'"

section "5. Render-time content (published nodes, current revision)"
q "SELECT COUNT(*) php_nodes, GROUP_CONCAT(n.nid ORDER BY n.nid) nids FROM $CUR WHERE n.status = 1 AND r.body LIKE '%<?php%'"
q "SELECT COUNT(*) tripinfo_table_nodes, GROUP_CONCAT(n.nid ORDER BY n.nid) nids FROM $CUR WHERE n.status = 1 AND r.body LIKE '%tripinfo_table(%'"
q "SELECT COUNT(*) hobophoto_nodes, SUM((LENGTH(r.body) - LENGTH(REPLACE(r.body, '[hobophoto:', ''))) / LENGTH('[hobophoto:')) macros FROM $CUR WHERE n.status = 1 AND r.body LIKE '%[hobophoto:%'"
q "SELECT COUNT(*) multisource_nodes, GROUP_CONCAT(n.nid ORDER BY n.nid) nids FROM $CUR WHERE n.status = 1 AND r.body LIKE '%[multisource:%'"
q "SELECT COUNT(*) flickr_macro_nodes FROM $CUR WHERE n.status = 1 AND (r.body LIKE '%[flickr-photo%' OR r.body LIKE '%[flickr-photoset%')"
q "SELECT COUNT(*) script_nodes, GROUP_CONCAT(n.nid ORDER BY n.nid) nids FROM $CUR WHERE n.status = 1 AND r.body LIKE '%<script%'"
q "SELECT COUNT(*) document_write_nodes, GROUP_CONCAT(n.nid ORDER BY n.nid) nids FROM $CUR WHERE n.status = 1 AND r.body LIKE '%document.write%'"
q "SELECT COUNT(*) flash_nodes, GROUP_CONCAT(n.nid ORDER BY n.nid) nids FROM $CUR WHERE n.status = 1 AND (r.body LIKE '%<object%' OR r.body LIKE '%<embed%' OR r.body LIKE '%.swf%')"
q "SELECT COUNT(*) iframe_nodes, GROUP_CONCAT(n.nid ORDER BY n.nid) nids FROM $CUR WHERE n.status = 1 AND r.body LIKE '%<iframe%'"
q "SELECT COUNT(*) teaser_differs_from_body_start FROM $CUR WHERE n.status = 1 AND r.teaser <> '' AND LEFT(r.body, LENGTH(r.teaser)) <> r.teaser"

section "6. Stored but not rendered"
q "SELECT name, status FROM system WHERE type = 'module' AND name IN ('acidfree', 'image', 'comment', 'forum', 'poll', 'book', 'audio', 'tripinfo', 'hobobiker_filter', 'php', 'simplemenu', 'thickbox', 'lightbox2', 'imagecache', 'flickr_filter') ORDER BY name"
q "SELECT n.type, COUNT(*) published_with_empty_body FROM $CUR WHERE n.status = 1 AND TRIM(r.body) = '' GROUP BY n.type"
q "SELECT type, GROUP_CONCAT(nid ORDER BY nid) unpublished_nids FROM node WHERE status = 0 GROUP BY type"

section "7. Assets"
q "SELECT COUNT(*) files_rows FROM files"
printf -- '-- files rows whose filepath is not on disk\n'
missing_rows=0
while IFS= read -r fp; do
  [ -e "docroot/$fp" ] || missing_rows=$((missing_rows + 1))
done < <(ddev mysql -N -e "SELECT filepath FROM files")
echo "files_rows_missing_on_disk $missing_rows"

printf -- '-- local file references in published bodies (sites/default/files/...), checked on disk\n'
refs=$(ddev mysql -N -e "SELECT r.body FROM $CUR WHERE n.status = 1" \
  | grep -oE "sites/default/files/[^]\"'<>,)|]+" | sed 's/[[:space:]]*$//' | sort -u || true)
total=0; missing=0; missing_list=""
while IFS= read -r ref; do
  [ -n "$ref" ] || continue
  total=$((total + 1))
  decoded=$(printf '%b' "${ref//%/\\x}")
  if [ ! -e "docroot/$decoded" ]; then missing=$((missing + 1)); missing_list+="  $ref"$'\n'; fi
done <<< "$refs"
echo "distinct_local_refs $total"
echo "missing_on_disk $missing"
printf '%s' "$missing_list" | head -20

printf -- '-- find %s\n' "$files_dir"
echo "files_on_disk $(find "$files_dir" -type f | wc -l)"
echo "imagecache_derivatives_on_disk $(find "$files_dir/imagecache" -type f 2>/dev/null | wc -l)"
echo "names_with_spaces $(find "$files_dir" -type f -name '* *' | wc -l)"
echo "names_with_non_ascii $(find "$files_dir" -type f | LC_ALL=C grep -c '[^ -~]' || true)"
q "SELECT presetname FROM imagecache_preset ORDER BY presetname"

section "8. Hardcoded own-domain references in published bodies"
q "SELECT COUNT(*) nodes, SUM((LENGTH(r.body) - LENGTH(REPLACE(LOWER(r.body), 'hobobiker.com/', ''))) / LENGTH('hobobiker.com/')) occurrences FROM $CUR WHERE n.status = 1 AND LOWER(r.body) LIKE '%hobobiker.com/%'"

section "9. Secrets: variable names only (values not printed)"
q "SELECT name FROM variable WHERE name REGEXP 'key|secret|token|password|pass\$|account' ORDER BY name"

section "10. Anonymous access, checked over HTTP from inside the container"
for p in / /node/206 /node/227 /node/334 /node/4196 /comment/reply/4123; do
  printf '%s ' "$p"
  ddev exec "curl -sk -o /dev/null -w '%{http_code}\n' https://hobobiker-copy.ddev.site$p"
done
