#!/usr/bin/env bash
# Read-only audit of this Drupal 6 copy: re-checks the claims in MIGRATION_PREP.md Part 2 against
# the running database and site, and prints counts and IDs. Changes nothing. Re-run any time;
# the output is the evidence behind DISCOVERIES.md.
#
#   migration/audit.sh > migration/audit-output.txt

set -euo pipefail
cd "$(dirname "$0")/.."

SITE=https://hobobiker-copy.ddev.site
q() { ddev mysql -e "SET SESSION group_concat_max_len = 1073741824; $1"; }
h() { printf '\n## %s\n\n' "$1"; }

# Published, current-revision node bodies: the population almost every check below is about.
LIVE="FROM node n JOIN node_revisions r ON n.vid = r.vid WHERE n.status = 1"

h "Nodes by type and status"
q "SELECT IF(type = '', '(empty type)', type) AS type, SUM(status = 1) AS published, SUM(status = 0) AS unpublished, COUNT(*) AS total
   FROM node GROUP BY type ORDER BY total DESC"

h "Comments by status (Drupal 6: 0 = published, 1 = unpublished) and whether comments can render"
q "SELECT status, COUNT(*) AS comments, COUNT(DISTINCT nid) AS nodes FROM comments GROUP BY status"
q "SELECT name AS module, status AS enabled FROM system WHERE name = 'comment'"
q "SELECT r.name AS role, (p.perm LIKE '%access comments%') AS has_access_comments
   FROM role r LEFT JOIN permission p ON p.rid = r.rid ORDER BY r.rid"
q "SELECT c.nid, COUNT(*) AS published_comments FROM comments c WHERE c.status = 0
   GROUP BY c.nid ORDER BY published_comments DESC LIMIT 5"

h "Input formats: filters and live nodes per format"
q "SELECT f.format, f.name, GROUP_CONCAT(CONCAT(fi.module, ':', fi.delta) ORDER BY fi.weight) AS filters
   FROM filter_formats f LEFT JOIN filters fi USING (format) GROUP BY f.format"
q "SELECT r.format, COUNT(*) AS live_nodes $LIVE GROUP BY r.format"
q "SELECT fi.module, s.status AS enabled, (s.filename IS NOT NULL) AS in_system_table
   FROM (SELECT DISTINCT module FROM filters) fi LEFT JOIN system s ON s.name = fi.module"

h "Render-time code: PHP-evaluating formats (2 = PHP code, 9 = tripinfo emits PHP)"
q "SELECT r.format, GROUP_CONCAT(n.nid ORDER BY n.nid) AS nids, COUNT(*) AS n $LIVE AND r.format IN (2, 9) GROUP BY r.format"
q "SELECT COUNT(*) AS live_bodies_with_php_tag $LIVE AND r.body LIKE '%<?php%'"
q "SELECT GROUP_CONCAT(n.nid ORDER BY n.nid) AS nodes_calling_tripinfo_table, COUNT(*) AS n $LIVE AND r.body LIKE '%tripinfo_table(%'"

h "Macros"
q "SELECT 'hobophoto' AS macro, COUNT(*) AS live_nodes,
          SUM((LENGTH(r.body) - LENGTH(REPLACE(r.body, '[hobophoto:', ''))) / LENGTH('[hobophoto:')) AS instances
   $LIVE AND r.body LIKE '%[hobophoto:%'
   UNION ALL
   SELECT 'multisource', COUNT(*), SUM((LENGTH(r.body) - LENGTH(REPLACE(r.body, '[multisource:', ''))) / LENGTH('[multisource:'))
   $LIVE AND r.body LIKE '%[multisource:%'
   UNION ALL
   SELECT 'flickr-photo/photoset', COUNT(*), NULL $LIVE AND (r.body LIKE '%[flickr-photo:%' OR r.body LIKE '%[flickr-photoset:%')"

h "Embedded client-side tech in live bodies"
# One query per pattern: GROUP_CONCAT inside a UNION came back empty on this MariaDB 10.2.
for pat in '<object' '<embed' 'youtube.com/v/' '<script' '<iframe' 'document.write' 'slide.com' 'show.swf' '1pixelout'; do
  q "SELECT '$pat' AS pattern, COUNT(*) AS n, GROUP_CONCAT(n.nid ORDER BY n.nid) AS nids $LIVE AND r.body LIKE '%$pat%'" | tail -n +2
done

h "Stored-but-blank: published nodes with an empty body, by type, and the modules behind them"
q "SELECT n.type, COUNT(*) AS empty_body $LIVE AND TRIM(r.body) = '' GROUP BY n.type"
q "SELECT name AS module, status AS enabled FROM system WHERE name IN ('acidfree', 'image', 'image_gallery', 'audio', 'poll', 'book', 'forum', 'content')"
q "SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() AND (table_name LIKE 'acidfree%' OR table_name IN ('image', 'content_type_triplog', 'audio'))"

h "Unpublished content and menu links that point at it"
q "SELECT n.type, GROUP_CONCAT(n.nid ORDER BY n.nid) AS nids FROM node n WHERE n.status = 0 GROUP BY n.type"
q "SELECT ml.menu_name, ml.link_path, ml.link_title FROM menu_links ml
   JOIN node n ON ml.link_path = CONCAT('node/', n.nid) WHERE n.status = 0 AND ml.hidden = 0 AND ml.menu_name <> 'book-toc-334'"
q "SELECT 'book-toc-334 links to unpublished nodes' AS what, COUNT(*) AS n FROM menu_links ml
   JOIN node n ON ml.link_path = CONCAT('node/', n.nid) WHERE n.status = 0 AND ml.menu_name = 'book-toc-334'"

h "URL aliases"
q "SELECT COUNT(*) AS aliases, SUM(src LIKE 'node/%') AS node_aliases, SUM(src NOT LIKE 'node/%') AS other_aliases FROM url_alias"
q "SELECT COUNT(*) AS nodes_with_more_than_one_alias FROM (SELECT src FROM url_alias WHERE src LIKE 'node/%' GROUP BY src HAVING COUNT(*) > 1) x"
q "SELECT SUBSTRING_INDEX(src, '/', 1) AS src_kind, COUNT(*) AS n FROM url_alias WHERE src NOT LIKE 'node/%' GROUP BY src_kind"

h "Menus"
q "SELECT menu_name, COUNT(*) AS links, SUM(hidden = 0) AS visible FROM menu_links GROUP BY menu_name"

h "Files table vs disk"
total=0; missing=0; missing_list=""
while IFS=$'\t' read -r fid fp; do
  total=$((total + 1))
  if [ ! -e "docroot/$fp" ] && [ ! -e "docroot/sites/default/files/${fp#sites/default/files/}" ]; then
    missing=$((missing + 1)); missing_list+="$fid "
  fi
done < <(ddev mysql -N -e "SELECT fid, filepath FROM files")
echo "files rows: $total, missing on disk: $missing"
echo "missing fids: $missing_list"
echo "files on disk under sites/default/files: $(find docroot/sites/default/files -type f | wc -l)"
echo "file names with spaces: $(find docroot/sites/default/files -type f -name '* *' | wc -l)"
echo "file names with non-ASCII characters: $(find docroot/sites/default/files -type f | LC_ALL=C grep -c '[^ -~]' || true)"
echo "docroot/files entries (old path used by some bodies): $(find docroot/files -mindepth 1 2>/dev/null | wc -l)"

h "Own-domain references hardcoded in live bodies"
q "SELECT SUM(r.body LIKE '%://hobobiker.com%') AS bare_domain_nodes, SUM(r.body LIKE '%://www.hobobiker.com%') AS www_nodes,
          SUM(r.body LIKE '%hobobiker.ddev.site%' OR r.body LIKE '%hobobiker-copy.ddev.site%') AS ddev_host_nodes $LIVE"

h "Secrets present in the variable table (names only)"
q "SELECT name FROM variable WHERE name REGEXP 'api_key|secret|token|password|_pass|account|smtp' ORDER BY name"

h "Leftover scripts in the docroot (HTTP status from inside the container)"
for f in flickr_migration.php phpinfo.php migrate_flickr_images.php simple_migration_test.php test_single_photo.php bookmarks.html; do
  printf '%s %s\n' "$(ddev exec "curl -s -o /dev/null -w '%{http_code}' $SITE/$f")" "$f"
done

h "Spot checks over HTTP (anonymous)"
for p in / /node/206 /node/334 /node/4196 /node/4123 /node/227 /big_trip_mexico_route /big_trip_mexico_photos /thanks /tripinfo_item; do
  printf '%s %s\n' "$(ddev exec "curl -s -o /dev/null -w '%{http_code}' $SITE$p")" "$p"
done
# grep -o | wc -l, not grep -c: the generated table is on a single line.
printf 'tripinfo_item links on /node/4196: %s\n' "$(ddev exec "curl -s $SITE/node/4196" | grep -o 'tripinfo_item/' | wc -l)"
printf '<tr> rows on /node/4196: %s\n' "$(ddev exec "curl -s $SITE/node/4196" | grep -o '<tr' | wc -l)"
printf 'comment markup on /node/4123 (21 stored comments): %s\n' "$(ddev exec "curl -s $SITE/node/4123" | grep -o 'class="comment' | wc -l)"

h "Secrets: which credential variables hold a non-empty value (lengths only, never values)"
q "SELECT name, LENGTH(value) AS serialized_length FROM variable
   WHERE name IN ('smtp_password', 'smtp_username', 'smtp_host', 'flickr_api_key', 'flickr_api_secret', 'flickr_auth_token', 'googlemap_api_key', 'tag1quo_token')"
