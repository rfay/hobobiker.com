# Discoveries

What this copy actually contains and does, recorded while building the Part 1 baseline (2026-10-16).
**Nothing here was fixed.** Each item is for a human to triage later: load-bearing quirk, fix after
migration, or dead weight.

Evidence: `migration/audit.sh` (read-only; prints each query next to its result). The run used here is
saved in `migration/reports/audit.txt`. Database state is the pristine snapshot
(`migration/pristine.fingerprint`). All node counts are current revision (`node.vid = node_revisions.vid`).

## Where this copy differs from MIGRATION_PREP.md (2026-09-21)

| MIGRATION_PREP.md says | This copy | Evidence |
|---|---|---|
| 1,260 published nodes | **1,255** (blog 328 not 331, page 29 not 31) | audit §1 |
| 97 published nodes carry 103 `[hobophoto:]` macros | **117 nodes, 421 macros** | audit §5 |
| Comments are hidden because anonymous lacks `access comments` | The **`comment` module is disabled** (`system.status = 0`), and no role has `access comments` | audit §2, §6 |
| Flash nodes 4002 (slide.com) and 4336 (Flickr swf) are live | Both are **unpublished** | audit §6 |
| 12 Flash nodes; YouTube embeds in 3862, 3907, 3976, 3986, 4007, 4024, 4163, 4248, 4342, 4343 | 10 published Flash nodes: **3996 is in the list, 4007 is not** (4007 is unpublished) | audit §5 |
| `simplemenu` is enabled and its JS loads on every page | `simplemenu` is **disabled** | audit §6 |
| "85 published nodes render completely empty" (77 acidfree + 8 image) | 77 `acidfree` nodes have empty bodies. The 8 `image` nodes (227–234) render their caption text and tags, but **no image** | audit §6; `/node/227` |
| Format 2 (PHP) has 4 live nodes, format 9 has 14 | Format 9: 13 published of 14 | audit §4 |
| 447 comments, 169 published | Same | audit §2 |
| Not mentioned | **Node 2307**: empty type, empty title, unpublished | audit §1 |

## Inventory

- 1,296 nodes, 1,255 published. Types and counts: audit §1. All 18 `book` nodes, 14 blogs, 6 pages,
  2 stories and node 2307 are unpublished (nids listed in audit §6).
- Node types `image`, `acidfree` and `forum` have **no row in `node_type`** (their modules are disabled),
  yet 8 + 77 + 4 of their nodes are published and answer 200.
- 447 comments (169 published, 278 unpublished). 9 sit on unpublished nodes. Most-commented node: 4123
  (22). **None render**: the comment module is disabled. `/comment/reply/4123` returns 404.
- 82 taxonomy terms in 4 vocabularies (Topics 49, Adventures 30, Access Level 2, Image Galleries 1).

## Paths and menus

- 1,657 URL aliases over 1,577 distinct sources.
- **876 aliases point at `node/N` for nodes that do not exist.** Dead alias rows; harmless on the site,
  but an alias-driven redirect map would carry them.
- **924 published nodes have no alias** at all; they are only reachable as `node/N`.
- 23 nodes have more than one alias.
- **Visible menu links to unpublished nodes** (each answers 403 to a visitor):
  - `primary-links`: node/206 "Email List", node/3799 "Photos".
  - `menu-menu`: node/3799 (3 links), 3800, 3803, 215, 216, all titled "Photos".
  - `book-toc-334`: all 18 links to the unpublished book.

## Render-time content (a database export misses it)

- **15 published nodes contain `<?php`, and all 15 call `tripinfo_table()`**:
  3801, 3802, 3988, 4004, 4010, 4011, 4012, 4013, 4015, 4129, 4196, 4197, 4223, 4311, 4312. The table
  is built from `content_type_triplog` at render time and links to `tripinfo_item/DAY/START/END`.
- **421 `[hobophoto:]` macros in 117 published nodes**, expanded by `hobobiker_filter` into imagecache
  derivatives with a lightbox wrapper. Four presets: 180x240, 240x180, 600x800, 800x600. 404
  derivatives exist on disk at audit time; the rest are generated on request.
- 13 published nodes use `[multisource:]` (tripinfo map embeds).
- 0 `[flickr-photo]` macros remain.
- 43 published nodes have a stored teaser that is not the start of the body, so listing pages
  show text the node page does not.
- 89 published `triplog` nodes have an empty body; their pages show CCK fields only.

- **Live download counters: the test suite changes the site it measures.** The `audio` module prints
  "N downloads" (`audio.download_count`; `sites/all/modules/audio/audio.module:350`) on the 10 podcast
  nodes and on the `/audio` and `/podcast` listings, and each request to `/audio/download/N/<file>.mp3`
  increments it. Those 10 URLs are in the semantic baseline's assets, so every semantic export or run
  against the original adds one per podcast. Found by `check-source-drift.mjs` after a pristine restore:
  2 of 2,436 pages differed (`audio`, `podcast`: "8494 downloads" vs the baseline's "8495"); node pages
  were captured before the export's link check, listings after. Pristine counts: 3830 8,494; 3847 21,597;
  3865 8,650; 3890 23,572; 3921 13,571; 3939 7,782; 3971 8,999; 3972 6,744; 4009 5,762; 4036 12,278.
  `migration/fingerprint.sh` does not cover the `audio` table, so a restore cannot show this drift.
  Declared in `expected-differences.json` (regex `^• \d+ downloads$`, all targets): the line must exist,
  the number is not compared.

## Input formats

- 191 published nodes use format 0, which does not exist in `filter_formats` (default is format 1).
- Formats 6 (Wiki, `liquid_filters`), 7 (Gmap, `gmap`) and 8 (`gtspam`) run filters from modules that
  are disabled. Format 6 and 7 nodes are all unpublished; format 8 has 1 published node.
- Format 9 chains `tripinfo` → `php`: the filter emits PHP that the next filter evaluates.

## Dead or fragile client-side content

- `<script>` in 4 published bodies: 3804 (`document.write` email address), 4008, 4033, 4057 (Flickr
  slideshow, `type="javascript"`, never runs).
- Flash `<object>`/`<embed>`/`.swf` in 10 published nodes: 3862, 3907, 3976, 3986, 3996, 4024, 4163,
  4248, 4342, 4343.
- `<iframe>` in 11 published nodes (Google My Maps and others): 3801, 3999, 4008, 4015, 4033, 4057,
  4129, 4196, 4197, 4255, 4345.

## Assets

- 2,898 files on disk (1.19 GB). 179 have a space in the name; none are non-ASCII.
- The `files` table has 44 rows; **24 of their paths are not on disk**.
- Published bodies reference 539 distinct `sites/default/files/...` paths; **1 is missing**:
  `sites/default/files/297234846.jpg` in node 4300. (The audit also flags a saguaro image, which is
  a false positive of its text extraction; the file exists.)
- 33 published nodes hardcode `hobobiker.com/` URLs, 61 occurrences. The suite treats that domain as
  this site (`ownDomains`).
- **548 macOS AppleDouble files** (`._<name>.jpg`, resource-fork debris from a Mac copy) sit in the files
  directory, mostly at its top level. Served with 200; nothing links to them. **Deleted from production
  by the owner on 2026-10-16; deliberately left in this copy.** 532 of them (87 KB) are in the asset
  tier and the semantic baseline's asset list (the other 16 sit in excluded directories), so a target
  built from current production data would fail those 532 asset tests and "every baseline asset
  resolves" until this is reconciled (re-freeze without them, or declare them in
  `expected-differences.json`).
- **Database backups are downloadable on this copy.** `sites/default/files/backup_migrate/scheduled/`
  holds **12** `*.sql.gz` site backups (monthly 2017-04 to 2018-04, no 2018-02; 49 MB in all). **Deleted from production by the owner on
  2026-10-16; still present in this copy's snapshot** (`.tarballs/files.tar`). **All 12
  answer 200** (HEAD, 2026-10-16), e.g. `.../Hobobiker.comRandyandNancy039sBigBikeTrip-2018-04-.sql.gz`,
  4.2 MB. Their `.htaccess` deny is ignored by nginx, and DDEV's nginx deny rule
  (`.ddev/nginx_full/nginx-site.conf:112`, `\.(bak|...|sql|...)$`) does not match `.sql.gz`, which the
  static-file rule at line 89 (`gz`) serves. **Production does not run Apache either** (per the site
  owner, 2026-10-16), so these protections are likely ignored there too; not checked from here
  (production is out of bounds). Any static export or crawl must not pick these up.
- **Every `*.php` path is handed to PHP-FPM, including inside the files directory**
  (`.ddev/nginx_full/nginx-site.conf:59`, `location ~ [^/]\.php(/|$)`). 68 legacy `.php` files sit under
  `sites/default/files/` (Northwest 14, GreatDivide 26, mexico 28), leftovers of the pre-Drupal trip
  sites:
  - **10 execute** (they use `<?php`): Northwest `contact, index, journal, links, milesjournal, photos,
    photos2, route, stats, thanks`. Their response differs from the file.
  - **44 disclose their PHP source**: they use short `<?` tags, and `short_open_tag` is off in this
    container, so PHP-FPM passes the code through to the visitor as text. **With `short_open_tag` on
    (production's setting is unknown), they would execute instead.** No credentials or DB/mail calls
    found in them (grep for `mysql_connect`, `mysqli`, `PDO(`, `password`, `mail(`).
  - 14 contain no PHP.
- **Leftover scripts in the docroot** (MIGRATION_PREP.md D7), all still present and committed:
  `phpinfo.php`, `migrate_flickr_images.php` (bootstraps Drupal, no access control),
  `simple_migration_test.php`, `test_single_photo.php`, plus `bookmarks.html`. The nginx PHP location
  (`location ~ [^/]\.php(/|$)`, line 59) runs **any existing `.php` file, not only `index.php`**: proven
  safely with Drupal's own `/xmlrpc.php`, which bootstraps Drupal and answers "XML-RPC server accepts
  POST requests only." (200). `phpinfo.php` opens with a short `<?` tag, so here it returns its source
  (200, 116 bytes) instead of running. The other three open with `<?php` and would run; **deliberately
  not requested** (`migrate_flickr_images.php` connects to the database; per MIGRATION_PREP.md such a
  script once ran a migration on a GET). None of them is linked from any baseline page.
  **Removed from git on 2026-10-16 (commit `1e61ac8`, owner's request; all five now 404 here).** Still
  referenced by the historical `test_migration.sh` and `README_FLICKR_MIGRATION.md`.
- PHP execution in the files directory (detail above): the 10 pre-Drupal pages
  `sites/default/files/Northwest/*.php` (contact, index, journal, links, milesjournal, photos, photos2,
  route, stats, thanks) run as PHP: the file holds `<?php`, the response does not (e.g. `contact.php`
  is 5,112 bytes on disk, 5,317 served). The asset baseline holds them to what is served.
- **13 files on disk are refused (403) by the server**: 8 `WS_FTP.LOG`, 6 `*.html.bak` under
  `mexico/`, `mexico/.htaccess.1043466662`. Recorded in `baseline/assets.json` as `notServed`, not tested.
- Generated directories in files: `css/`, `js/`, `color/` (aggregates and colour-module output),
  `imagecache/` (404 derivatives), `tmp/`, `ctools/`.

## TODO (upstream, DDEV): nginx does not honour Drupal's files-directory protections

Drupal has always assumed Apache: it writes `sites/default/files/.htaccess` (`SetHandler
Drupal_Security_Do_Not_Remove_See_SA_2006_006`, `php_flag engine off`) to stop scripts running from the
files directory, and `backup_migrate/.htaccess` to block its dumps. Under DDEV's default nginx-fpm those
files are ignored. Checked in the local DDEV checkout (`~/workspace/ddev`, `2d1d017db`, 2026-10-15),
`pkg/ddevapp/webserver_config_assets/nginx-site-drupal{6..12}.conf` and `nginx-site-drupal.conf`: none
denies PHP under `sites/*/files/`; the only deny rules are dotfiles and the extension list
`bak|conf|dist|fla|in[ci]|log|psd|sh|sql|sw[op]`, which `*.sql.gz` escapes (the static `gz` rule serves it).
That is how the 10 executing and 44 source-disclosing `.php` files and the 12 downloadable backups above
come about on this copy. A patch to those templates is probably needed, e.g. a regex location ahead of the
PHP one (`location ~ ^/sites/[^/]+/files/.*\.php$ { deny all; }`) and `.sql.gz`/`backup_migrate` coverage.
**Applied 2026-10-16 at the owner's request (commit `d33f997`), for this copy and production:**
`.ddev/nginx_full/nginx-site.conf` is taken over from DDEV's drupal6 template (generated-file marker
removed; note DDEV detects the marker string anywhere in the file, even inside a comment) with one added
first regex location, `^/sites/[^/]+/files/.*\.php(/|$)` → deny. (A first version used a `^~` snippet in
`.ddev/nginx/`, which had to duplicate five other rules; replaced before pushing.) A deliberate site change made before the baseline is re-frozen from refreshed
production files, so the re-frozen baseline will record these 68 files as 403. Verified: 17-case
matrix (PHP under files/ → 403, including `route.php/extra`; `.htaccess`, `WS_FTP.LOG`, `.bak` still
403; images, AppleDouble files, MP3, ZIP, 404s unchanged; a deleted imagecache derivative regenerated
byte-identical) and the full HTTP suite against the current baseline (4,861 pass; the 68 failures name
only the 67 served `.php` files). `*.sql.gz` is not covered (the backups are gone from production).
The upstream DDEV templates still need the same fix.

**Gotcha for whoever edits nginx in DDEV: never run `sudo nginx -t` or `sudo nginx -s reload`.** The
master runs as the DDEV user; `nginx -t` as root chowns `/var/lib/nginx/{fastcgi,body,...}` to `nobody`
(mode 700, mtime unchanged), after which every PHP response too big for the in-memory buffers is cut
off (`open() "/var/lib/nginx/fastcgi/..." failed (13: Permission denied)`; curl exit 92). Here it
truncated the 55 MB podcast download at 6-8 MB and failed "every baseline asset resolves". Fixed with
`sudo chown -R <user>:<user> /var/lib/nginx/{body,fastcgi,proxy,scgi,uwsgi}` and a plain
`nginx -s reload`; a `ddev restart` also resets it.

## Snapshot refresh (2026-10-16): pruned files, hobobiker-assets v1.1

The files snapshot was replaced with production's pruned files (owner's decision): 2,898 → 2,218 files
on disk after the restore's cache clear. Gone: the 12 database dumps, all 548 AppleDouble files, the 67
legacy `.php` pages, and the whole of `Northwest/` and `GreatDivide/`. `mexico/` keeps its non-PHP files.
The database is unchanged (`stored.json` re-exported byte-identical). Re-frozen semantic baseline:
same 2,436 pages, lines, images, links and menus; assets 2,502 → 1,857.

- **`docroot/files` is a symlink to `sites/default/files`** (MIGRATION_PREP.md §C5/§D5 call it "empty"; it
  is not). Old content links files as `/files/...`, and those links work whenever the target exists.
- **Pruning `Northwest/` broke visible content.** Published nodes 4 (`new_maps_on_the_route_page`) and
  214 (`northwest_route`, `northwest/route`) reference 8 files under `/files/Northwest/maps/`, all of which
  existed: six state strip-map pages (`*.htm`), "Hobobiker Northwest Trip Strip Maps.pdf", and the
  overview image `OverviewMap_files/image_map.gif`. **Restored** (owner's decision): `Northwest/maps/` (34
  files, 3.8 MB, every file matching its SHA-256 in the earlier asset baseline) was extracted from
  hobobiker-assets v1.0 into this copy and the snapshot rebuilt (2,252 files); production gets it back from
  the owner's own older tarballs. `Northwest/` otherwise and all of `GreatDivide/` stay deleted (nothing
  referenced them).
- **`mexico/` is in use**: `/files/mexico/trippics/Page.html` is a working gallery linked from
  `mexico_trip_photos`.
- **Kit bug: working links to `.htm`/`.html` files are recorded as broken.** `export-semantic-baseline.mjs`
  normalizes a link to a key without `.htm`/`.html` (so `/a.html` and `/a` are one page), then checks the
  status of the *key*, not of the URL. `/files/maps/NewEnglandRoute/Manchester to Exeter.htm` is 200; its
  key without `.htm` is 404. In the current baseline 6 of the 36 "broken or restricted" links are such
  working files (5 New England route maps on `our_actual_route`, and the mexico gallery). Consequence: the
  suite does not require those links to resolve on a target (the asset tier still requires the files).
  The old baseline also recorded the six Northwest map pages as broken for this reason, which is why the
  loss above did not show up as a change in the re-freeze. **Fixed in the kit** (site-migration-kit `800f776`, vendored): the
  exporter requests the URL each key was first seen as, and a page found through a `.htm` link is recorded
  at that URL. Re-export result: those 12 links (6 Northwest maps, 5 New England maps, the mexico gallery)
  are no longer "broken" (35 → 23) and are captured as 12 new route pages. They have no `#content`, so
  `routeContent` now falls back to `body`.
- **The 11 pre-Drupal MapPoint pages are windows-1252 with no declared charset** (6 Northwest, 5 New England
  route maps): nginx sends bare `text/html`, and the pages have no `<meta charset>`. Browsers fall back to
  windows-1252 and show `©`; the kit read every page as UTF-8 and froze U+FFFD, so the visible tier failed on
  33 lines of those 11 pages against the original itself. **Fixed in the kit** (`1c8af19`, vendored): pages
  are decoded like a browser (header charset, `<meta charset>`, valid UTF-8, else windows-1252). Drupal pages
  send `charset=utf-8` and were never affected; the stored baseline had no U+FFFD.

## Secrets present in the `variable` table (names only)

`drupal_private_key`, `flickr_api_key`, `flickr_api_secret`, `flickr_auth_token`, `googlemap_api_key`,
`location_geocode_google_apikey`, `mydropwizard_customer_key`, `smtp_password`, `tag1quo_token`,
`googleanalytics_account`. Not inspected further; not to be published.

## Access, checked over HTTP

`/node/206` → 403, `/node/334` (book) → 403, `/node/227` (image) → 200, `/node/4196` (tripinfo) → 200.

## Decisions taken while building the suite

- **Every published node is required at every alias and at `node/N`.** Old content links to `node/N`
  heavily and 924 published nodes have no alias, so `node/N` is a URL visitors really use. 1,255
  published nodes → 1,601 baseline paths. A target that renumbers nodes must redirect or declare it.
- **Non-node aliases are not listed up front** (391: 274 `node/N/feed`, 110 taxonomy terms, blog, user,
  `gsitemap`). Route discovery captures the ones a visitor can reach by a link or menu.
- **The asset tier covers 2,423 uploaded files (1.13 GB) byte for byte**, read from disk (the `files`
  table is unreliable, see Assets). Left out: the generated directories above, and `backup_migrate/`,
  so no target is ever required to serve database dumps. The 548 AppleDouble files are **kept** in the
  tier (they are served today); dropping them is a decision for a target to declare.
- **Access is measured, not assumed:** all 81 paths of the 41 unpublished nodes answer 403 today
  (`baseline/access.json`), including node 2307 with no type.
- The static self-containment tier only registers for `MIGRATION_TARGET=static`.
- **Three suite limits are declared** in `expected-differences.json` (all targets, anchored regexes),
  found by the full browser run (visible + layout, 4,872 tests, 5 m 38 s: layout all pass; visible 546
  failures, all three causes below; 546 pass after declaring):
  - 21 pages with a `document.write` e-mail hole (node 3804 / `old_contact` plus "…feel free to email ."
    on 19 listing and teaser pages): visible kind only. No tier checks the address itself.
  - 526 tripinfo_item pages: the prev / Up / next pager is three `<a>` with no whitespace between them;
    the HTML extractor reads one run-together line, the browser (book CSS) shows three. Visible kind
    only; semantic still requires the line and links. **Kit gap**: `lib/extract.mjs` should split
    adjacent links that CSS renders as blocks; fixing it means re-freezing the semantic baseline.
  - The live download counter (see Render-time content).
- Playwright is pinned to **1.63.0**: the browsers baked into this DDEV image are Chromium 1243, which
  1.64 no longer uses (it wants 1248 and fails to launch). Kit gap: the kit does not say which version
  to pin, and `npx playwright --version` reports a different, freshly downloaded version.

## Second target: a wget mirror of this copy (rehearsal only, not Part 2's result)

Final run, against the final baseline (pruned snapshot with Northwest maps, kit `1c8af19`):
`kit/scripts/mirror-static.mjs` → `/tmp/hobo-static` in the container (5,011 files, 1.3 GB), then
`rewrite-static.mjs` (291 of 2,454 pages changed: 232 dead or restricted references kept and made relative,
153 made relative, 222 links to pages not in the copy unwrapped). HTTP tiers, `MIGRATION_TARGET=static`:
**4,227 pass, 107 fail; every semantic page passes.** Left for Part 2 to fix or declare; none allowlisted:

- **access, 81:** unpublished pages answer 404 in an archive instead of 403.
- **asset, 26:** legacy `.htm`/`.html` pages under `files/` (route maps, mexico galleries,
  `GreatParksTripRoughWriteup.htm`) are rewritten by wget's `--convert-links`, so their bytes no longer
  match what the original serves. (66 before the pruning, when the legacy `.php` pages were included.)
- An earlier run on the unpruned snapshot showed the same shape, plus 64 links to restricted pages that
  only the rewrite step makes relative.

Resolved in Part 2: see "Part 2: retired to static HTML" below.

## Negative controls (all named by the suite)

`scripts/negative-controls.mjs` breaks a hard-linked copy of the rewritten mirror; targeted run:

| Break | Reported |
|---|---|
| Paragraph deleted, node 4123 | `[lines] There is no road from Panama to Colombia...` |
| `[hobophoto:]` image removed, node 1152 | `[images] 210467196_salmon_glacier.jpg` |
| Tripinfo table row removed, node 4196 | `[lines] 2008-05-29`, `Cayambe to Quito, Ecuador`, ... and the `tripinfo_item` link |
| "Podcasts" removed from the main menu, node 2759 | `[menu] main: Podcasts -> /podcasts` |
| Paragraph hidden by CSS, node 4 | visible: `I used Microsoft Mappoint...`; **semantic passed** (the text is still in the HTML) |
| `audio/BikeTouristPodcastInterview.mp3` deleted | asset 404, and semantic "every baseline asset resolves" |
| Unpublished node 206 made public | `access: expected 403, got 200` |
| Comment 1163 dropped, node 1152 title changed (stored export) | drupal11: 2 failures, "comment 1163 on node 4123 by Javier Martin is missing"; static: passes with 2 annotations |

- **Tripinfo discovery is bounded at one hop.** `tripinfo_item/DAY/START/END` pages link prev/next
  across every day of every trip; following them all explodes the page count. The baseline captures
  the `tripinfo_item` pages linked from route tables and stops there (`discover.noFollow` in
  `test/playwright/migration.config.mjs`). A static crawl meets the same explosion and must decide too.
  **Part 2 decided:** the crawl fetches one hop past the baseline (`mirror-static.mjs --one-hop`); see below.

## Part 2: retired to static HTML (2026-10-23)

`retire/run.sh` restores `hobobiker-prep` from the pristine dump, prepares it, crawls it into
`hobobiker-static/public`, makes the crawl self-contained, and checks it against the frozen baseline with
`MIGRATION_TARGET=static`. From a clean restore, every tier: **11,699 pass, 0 fail, 399 s** (kit `cf31882`).
`HTTP_ONLY=1` skips the browser tiers. The baseline did not change.

Every stage prints a count. The final run:

| Stage | Count |
|---|---|
| restore | fingerprint matches; 1,255 published nodes |
| prep 10: remove the home page's Search pane | 1 pane removed; 0 forms left on the home page |
| prep 20: disable Google Analytics | module 1 -> 0; 0 references on 3 sample pages |
| crawl | 4,434 baseline URLs; one hop: 159 of 170 fetched (95 pages, 64 feeds; 11 normalization artifacts answer 404); 31 of 31 uploaded HTML/CSS files restored unconverted |
| rewrite | 379 of 2,544 pages changed (6 uploads, exact URL replacements only): 7,662 made relative, 232 kept as the original had them, 168 unwrapped |

### Survey: which of the Lullabot series' steps this site needs

Karen Stevenson's checklist ([kit docs](test/playwright/kit/docs/retirement-approach.md)) reduced to two
steps. Measured on the pristine database:

| Series step | This site | Done |
|---|---|---|
| Turn off comments | `comment` module already disabled; no comment renders on the original (see Inventory) | nothing to do |
| Remove search | `search` enabled; the theme's search box is off. **The only form on the whole site is a Search pane on the home page's Panel** (Page Manager page `trip_wrapped_up`, display 1, block `search-0`) | removed |
| Remove login and user blocks | none (the only enabled blocks are `boost` admin blocks; `boost` is disabled) | nothing to do |
| Other forms | the one poll (node 4291) is closed: it shows results, not a form | nothing to do |
| Strip shortlink and generator tags | Drupal 6 emits none (0 of 2,454 crawled pages) | nothing to do |
| Show all results instead of pagers | the baseline captures `?page=N`; the static nginx rule serves them at the same URLs | kept |
| Turn on CSS/JS aggregation | off; turning it on would only change asset URLs | kept off |
| Remove clickable table headers | Views tables on `wp` and `triplog` have sort links; they work on the original | kept (fetched one hop) |
| Status messages | none shown to visitors | nothing to do |
| (not in the series) Google Analytics | `analytics.js` (UA-13228261-1) on every page | disabled, owner's decision |

### Every failure, and what was done

Control run (no prep): 112 failures. First prepared run: 113. Then the kit fixes, then the declarations.

| Failures | Cause | Kind | Resolution |
|---|---|---|---|
| 81 access | unpublished pages answer 404 in an archive, 403 on Drupal | deliberate | declared, `target: static`, `equals: "expected 403, got 404"` (a leak, 403 -> 200, still fails) |
| 1 semantic + 1 visible, home page | the "Search" heading of the removed pane | deliberate | declared for path `""` only, `equals: "Search"` |
| 20 asset: route maps, `GreatParksTripRoughWriteup.htm` | wget `--convert-links` rewrote uploaded HTML: MapPoint CSS `url(#default#VML)` became `url(<page>.htm)`; a relative `./..._files/filelist.xml` (not fetched) became an **absolute URL on hobobiker-prep**, a dependency the static tier could not see (uploads are assets, not pages) | crawl gap | kit `93deb51`: the mirror fetches uploaded `.html/.htm/.css` again, unconverted |
| 6 asset: `mexico/gallery/Page.html`, `mexico/trippics/Page*.html` | the same conversion, then `rewrite-static` re-serialized each page (about 80 changed lines) to make its one own-domain link relative | crawl gap + deliberate | kit `93deb51`: uploads get exact URL replacements only; the one-link change (20 bytes each) declared per file with its exact size |
| 5 static: `trippics/Page*.html` link `/mexico/` | Drupal answers `/mexico/` as `/mexico`; in the archive the directory `mexico/` (alias `mexico/photos`) caught it: 403 | serving gap | kit `93deb51`: the nginx rule serves `/a/b/` from `a/b.html` first |
| 11 layout, `tripinfo_item` pages | the baseline's bounded discovery: **87 of 526 captured day pages link to a day the baseline never captured (180 links, 71 pages, all 200 on the original)**; the crawl did not have them, so the rewrite unwrapped the links. The semantic tier passed: it asserts only links to pages the baseline knows (`kit/lib/compare.mjs`) | baseline gap | kit `cf31882`: `mirror-static.mjs --one-hop`. Every baseline page keeps all its links; the 95 hop pages are untested, and their onward links to uncaptured days are unwrapped (the 168) |

No real loss was found. The full pager (about 540 days x 18 ranges, roughly 9,700 pages) was considered and
not crawled (owner's decision): the day data is also on the `triplog` node pages, which are captured.

### Found along the way

- **Browsing prep through its Coder URL leaks into the crawl.** On the first prepared run a browser loaded
  prep's home page through `hobobiker-prep--remotework--rfay.coder.ddev.com` (11:24:38-11:25:05, nginx log)
  between the prep step and the crawl. Drupal cached rendered output with that host, and the crawl took 18
  references on 6 pages from it. The rewrite made them relative (its `hosts` lists that URL), so no test
  changed, only the rewrite counts (297/171 instead of 291/153). `retire/30-crawl.sh` now clears prep's
  caches immediately before crawling.
- **The original's own render cache holds its Coder hostname.** `/` on `hobobiker-copy` serves three
  `imagecache/240x180` images as `https://hobobiker-copy--remotework--rfay.coder.ddev.com/...` (seen
  2026-10-23). Harmless: the baseline was frozen after a restore, and the crawl reads prep. Left as is
  (this site is the reference; a restore clears it).
- **The 6 mexico gallery pages are iso-8859-1 uploads** whose "Home" link points at the production domain
  (its root, and its `/mexico/`). They are the only uploads the archive changes.
- **Semantic-tier limit (kit):** a removed link to a page the baseline did not capture is invisible to every
  tier except, sometimes, layout. Recorded in the kit's `docs/static-self-containment.md`; not changed,
  because asserting those links would fail a Drupal 11 target for dynamic paths it serves differently.
- **Pipeline notes.** The static project's nginx rule is a copy of the vendored kit template; `run.sh`
  refuses to run if they differ. `restore-pristine.sh` has no guard; `retire/lib.sh` refuses a PREP that is
  the original or not named `*prep*`. drush 5.9 on PHP 7.3 prints about 20 deprecation warnings per call;
  the scripts show them only on failure.

## Re-frozen baseline (2026-10-25)

The Part 1 baseline was re-frozen, on purpose, after the 2026-10-24 exposure (personal data and credentials in
published copies; `HANDOFF.md`). Production had changed deliberately: `files/maps/` (personal-data XML files,
their viewers, pre-Drupal Maps v1 demos) deleted, credentials deleted, Google Analytics uninstalled, and the
maps rebuilt with Leaflet and OpenStreetMap (commit `72fcbc2`). The old baseline is in git history (`ccfe6c4`).

- **Source.** A `ddev pull` of production into this copy, then `migration/sanitize-snapshot.sh --needles`
  (the needles: the phone numbers and emails of the removed files, kept outside every repo). It deleted 1
  credential variable and the Backup and Migrate destination (its URL held the AWS key), sanitized 4 users, 447
  comments and 7 poll votes, and truncated 17 tables (83,381 rows: `watchdog`, `accesslog`, `sessions`,
  `cache*`, ...). The gate found no keys, removed files or needles. Both copy and prep restored from it;
  `migration/pristine.fingerprint` records it.
- **Collateral loss found and reverted.** Deleting all of `files/maps/` also removed `files/maps/NewEnglandRoute/`
  (29 files: the 5 pre-Drupal New England route maps and their images). Node 220 (`our_actual_route`,
  `new_england/route`, and the `new_england_blog` listing) then showed a broken `Overview.gif` and 5 links
  answering 404; the first export of the new baseline recorded that as normal. The 29 files were recovered
  byte for byte (each matched its SHA-256 in the old `assets.json`; none holds personal data) from the last
  crawl, restored on production by the owner, and the snapshot and baseline rebuilt with them. The snapshot's
  database is the one from the pull, not the copy's after the first export: the exports had advanced the
  live download counters.
- **Against the old baseline:** the same 2,455 pages; 1,255 published nodes; 81 private paths, all 403; 23
  broken or restricted links, unchanged. The asset tier lost exactly the 15 deliberately deleted files under
  `files/maps/` (1,796 → 1,781). References to `maps.googleapis.com` went from 435 page records to 0; no
  `AIza…` or `ABQIAAAA…` key remains anywhere in the baseline. 24 pages link to `.kmz` files without their old
  cache-busting query (`Peru.kmz?1=` → `Peru.kmz`, from the map repair; 5 new assets); 38 pages differ only
  in the live download counter (already declared). No visible line changed.
- **Self-check** against the restored copy, every tier (sanity, semantic, access, asset, visible, layout):
  **9,232 pass, 0 fail.**

## Part 2 re-run after the cleanup (2026-10-25)

`NEEDLES=<file> retire/run.sh` from a clean restore of the sanitized snapshot, every tier, kit `21f2226`:
**11,679 pass, 0 fail, 402 s.** The old archive, its git history and every local copy of the old data
(14,664 files: the 2026-10-23 control crawl, `.ddev/db_snapshots`, prep's `.ddev/.downloads` with the
personal-data files, `.tarballs/rehearsal*`) were deleted first, with the owner's confirmation.

| Stage | Count |
|---|---|
| restore | fingerprint matches; 1,255 published nodes |
| prep 10: Search pane | 1 removed; 0 forms left |
| prep 20: Analytics guard | module 0 -> 0, 0 references (uninstalled on production; the step now fails if it comes back) |
| crawl | 4,419 baseline URLs; one hop 159 of 170; 27 of 27 uploaded HTML/CSS restored unconverted; 2,540 pages, 2,591 other files |
| rewrite | 368 of 2,540 pages changed (6 uploads, exact URL replacements): 7,656 made relative, 232 kept as the original had them, 149 unwrapped |
| 36 files-symlink | `files -> sites/default/files`; 225 identical and 16 converted copies dropped; 2 library images fetched; map files 257 present, 1 missing on the original too |
| 37 secrets | 4,892 files: no secret shapes, no removed files, no credential values, none of the 58 needles |

Declared differences used: 81 access (403 -> 404), the home page's "Search", the 6 mexico uploads (one own-domain
link each), and the suite's own limits. No new entry was needed.

### What the re-run found and changed

- **The static tier now reads inline scripts** (kit `59ceae0`). The 434 `hobobiker-prep` URLs that had hidden in
  `Drupal.settings` JSON in the 2026-10-23 archive are what it would have caught: against that old archive it
  failed 435 pages (405 prep URLs, 35 own-domain URLs in the malformed route-map settings), and passed the
  other 2,020. In the new archive there is nothing to find: the Leaflet maps carry a site-relative `data-kml`.
- **A secrets gate in the pipeline** (`retire/37-scan-secrets.sh`, patterns shared with
  `migration/sanitize-snapshot.sh` in `migration/secret-patterns.sh`). Against the old archive it reported 10
  failures (the dead Google key in 464 pages, the Maps v1 key in 4, the 7 removed files, 3 files with needles).
- **`/files` must be a symlink in the archive too** (`retire/36-files-symlink.sh`). On the original,
  `docroot/files` points at `sites/default/files`, so every upload answers under both paths. wget made
  `public/files` a real directory with only the 241 files it fetched there, so `/files/gps/SouthAmerica.kmz`
  (read by a map's JavaScript, never linked) answered 404. The 16 legacy pages under `/files` that wget had
  converted are now served as the original serves them, byte for byte.
- **Files only JavaScript asks for.** Leaflet builds the paths of `marker-icon-2x.png` and `marker-shadow.png` at
  run time; wget never saw them. Fetched from prep by the same step; 0 broken markers at 2x.
- **A map broken on the original stays broken:** `[multisource:/files/regional_kml/CentralAmerica.kmz]` names a
  file that exists only as `files/gps/CentralAmerica.kmz` (404 on the original).
- **The maps draw the same** in the archive and the original (Playwright, 2x): a day page 1 route, node 4010 3
  routes, node 4003 19 routes and 4 markers. `south_america_route` and `colombia_route` embed Google My Maps
  iframes, not Leaflet.
- **The test runs were hammering OpenStreetMap.** After a day of browser-tier runs (464 map pages per run),
  `tile.openstreetmap.org` answered every tile with 429, for the original and the archive alike; its
  [tile policy](https://operations.osmfoundation.org/policies/tiles/) forbids automated bulk use. Kit `21f2226`
  adds `config.browser.blockHosts`; this site blocks `tile.openstreetmap.org` in the browser tiers and the
  layout exporter. Tiles sit inside a fixed-size box, so the measurements do not change (browser tiers 4,905
  pass with the block). The tests therefore no longer see tiles at all; that the tiles load is checked by eye.

## Part 3: Drupal 11 rebuild (2026-10-27)

The pipeline is in rfay/hobobiker-d11 (`scripts/run-all.sh`); decisions in `PART3-PLAN.md`.

- **Found in the data while importing:** 876 aliases of deleted nodes, 1 comment on deleted node 1198, node 2307
  with no type and an empty title (Drupal 11 can store neither), 24 `files` records whose file is gone (the image
  module's `images/` derivatives), 335 aliases to paths Drupal 11 does not have (`node/N/feed`, taxonomy feeds,
  `gsitemap`, pathauto leftovers). The sanitized user emails (`user+N@localhost`) are not valid addresses for
  Drupal 11.
- **Sideways photos are the original's.** Some photos show rotated 90°, for example
  `2851505864_Maria_Galarza_Valenzuela.jpg` on node 4269: the camera recorded the picture upright with EXIF
  Orientation 1, so the pixels themselves lie sideways, on the original as on the rebuild (full-size file and the
  240x180 derivative byte for byte identical on both). Of the 384 photos `[hobophoto:]` uses, 8 carry a real
  rotation tag (6 with 8, 2 with 6) and 64 none; the one rotated photo with a derivative
  (`3160167087_Randy_Hiking_near_Puerto_Frias.jpg`) also has identical derivatives on both. No check covers
  orientation: the tiers compare images by file name, the asset tier compares only the files the baseline lists.
- **Drupal 11 looks up aliases only for paths whose first segment is a route.** `/blog/1 → /blog/rfay` and
  `/podcast → /podcasts` were imported correctly but unused until Views created `/blog/%` and `/podcast`.
- **Drupal's database layer reads `[0-9]` in a query string as a quoted identifier**: a literal REGEXP matched
  nothing and every alias was imported. Pass a pattern as a placeholder.
- **The 11.4 standard install has no content types**, no body field and no comment type.
- **The original's listing sizes are not Views defaults:** `/blog` and `/blog/UID` show 8 per page
  (`default_nodes_main`); taxonomy pages sort sticky first, then oldest first.
