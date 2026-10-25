#!/usr/bin/env bash
# Complete the crawl where wget cannot see what the pages use. Runs after the rewrite.
#
# 1. /files is the uploads directory, as on the original. There, docroot/files is a symlink to
#    sites/default/files, so every upload answers under both paths. wget saved only what it fetched under
#    /files into a real directory, so a /files URL nobody linked (a map's data-kml, read by JavaScript)
#    answered 404 (2026-10-25: /files/gps/SouthAmerica.kmz). Each file under docs/files is checked
#    against its sites/default/files counterpart (the byte-exact upload; the /files copy may be wget's
#    converted one) and dropped, or moved there if it has none; then docs/files becomes the same symlink.
# 2. Files only JavaScript asks for: Leaflet builds the paths of its marker images (marker-icon-2x.png,
#    marker-shadow.png) at run time, so wget never sees them. Fetch every file in the libraries' images/
#    directories that the crawl does not have, from PREP.
# 3. Every map's data-kml file must resolve in the archive, unless the original lacks it too.
#
# Prints counts. Exits 1 if a map file the original serves is missing.
source "$(dirname "$0")/lib.sh"
guard_prep
cd "$STATIC_DOCROOT"

# 1. files/ -> sites/default/files
same=0 differ=0 moved=0
if [ -d files ] && [ ! -L files ]; then
  while IFS= read -r -d '' f; do
    c="sites/default/files/${f#files/}"
    if [ -f "$c" ]; then
      if cmp -s "$f" "$c"; then same=$((same + 1)); else differ=$((differ + 1)); fi
    else
      mkdir -p "$(dirname "$c")"
      mv "$f" "$c"
      moved=$((moved + 1))
    fi
  done < <(find files -type f -print0)
  rm -rf files
fi
[ -L files ] || ln -s sites/default/files files
echo "files-symlink: files -> sites/default/files; $same identical and $differ converted copies dropped, $moved moved"

# 2. Library images that only JavaScript requests
lib=sites/all/modules/tripinfo/lib
fetched=0 present=0
while IFS= read -r -d '' f; do
  rel=${f#"$PREP/docroot/"}
  if [ -f "$rel" ]; then present=$((present + 1)); continue; fi
  mkdir -p "$(dirname "$rel")"
  curl -sSf --cacert "$CA" -o "$rel" "$PREP_URL/$rel"
  fetched=$((fetched + 1))
done < <(find "$PREP/docroot/$lib" -path '*/images/*' -type f -print0)
echo "files-symlink: library images: $fetched fetched, $present already crawled"

# 3. Every data-kml target
missing=0 kept=0 ok=0
while IFS= read -r k; do
  p=$(python3 -I -c 'import sys,urllib.parse; print(urllib.parse.unquote(sys.argv[1].split("?")[0]).lstrip("/"))' "$k")
  if [ -f "$p" ]; then ok=$((ok + 1)); continue; fi
  status=$(curl -s -o /dev/null -w '%{http_code}' --cacert "$CA" "https://$(basename "$ORIGINAL").ddev.site$k")
  if [ "$status" = 200 ]; then echo "files-symlink: MISSING map file the original serves: $k" >&2; missing=$((missing + 1)); else kept=$((kept + 1)); fi
done < <(grep -rhoE --include='*.html' "data-kml=[\"'][^\"']+" . | sed -E "s/^data-kml=[\"']//" | sort -u)
echo "files-symlink: map files: $ok present, $kept missing on the original too (kept broken), $missing missing"
[ "$missing" = 0 ]
