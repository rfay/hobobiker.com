# Discoveries: hobobiker.com (Drupal 6) copy

What we found while building the migration tests. **Nothing here is fixed by the migration.** We
reproduce the site; a human triages this list afterwards: load-bearing quirk, fix later, or dead
weight.

Evidence: `migration/audit.sh` (output in `migration/audit-output.txt`). Every count below comes
from that script against this copy, restored from `.tarballs/db.sql.zst`, on 2026-10-15.

## This copy differs from MIGRATION_PREP.md

MIGRATION_PREP.md (2026-09-21) audited an earlier state of the site. On this copy:

| Claim in MIGRATION_PREP.md | This copy | Consequence |
|---|---|---|
| 1,260 published nodes | **1,255**. Blog is 328 published and 14 unpublished, not 331 and 11. | Use the audit, not the doc |
| Comments are invisible because anonymous lacks `access comments` | The **`comment` module is disabled**. No role has `access comments`. No comment renders for anyone. | The baseline contains zero comments. See "Stored but never rendered" |
| Format 9 (tripinfo) has 14 live nodes, including 4006 | **13**. Node 4006 is unpublished. | |
| Format 6 (Wiki) has 8 live nodes, format 7 (Gmap) has 1 | **0 and 0**. No live node uses them. | D4's "raw wiki markup" concern does not apply |
| Format 0 has 193 live nodes | **191** | |
| 103 `[hobophoto:]` macros across 97 nodes | **421 macros across 117 nodes** | The hobophoto expansion is far more of the site than the doc suggests |
| 44 `files` rows, none on disk | **24 of 44 missing** (fids 1–24) | |
| Flash: nodes 4002 (slide.com), 4336 (Flickr .swf) and 4007 (YouTube) | All three are **unpublished** here | Published Flash is 9 YouTube nodes plus `<embed>` in node 3996 |
| `1pixelout` podcast player | No body contains it; the player comes from the `audio` module at render time | Check the rendered podcast pages instead |

Also not in the doc:

- **Node 2307** has an empty type and an empty title, and is unpublished.
- **Unpublished nodes in visible menus.** `menu-menu` and `primary-links` link to 3799, 3800, 3803, 215,
  216 ("Photos") and 206 ("Email List"). Drupal hides the menu entries for unpublished nodes from
  anonymous users, so the main nav still renders without them.
- **The rendered main navigation is built from `menu-menu`** (77 links), not `primary-links`.
- **73 system paths have more than one URL alias.** 25 of them are nodes; most of the rest are
  taxonomy terms. The aliases that aren't for nodes cover 110 taxonomy terms, 5 blog, 2 user, 2
  pathauto, 1 podcast and 1 gsitemap. Every alias is a path the migration must keep answering.

## Generated at render time (a database export misses it)

- **PHP evaluated at render:** format 2 (nodes 3802, 4196, 4197, 4281) and format 9 (13 nodes:
  3801, 3988, 4003, 4004, 4010, 4011, 4012, 4013, 4015, 4129, 4223, 4311, 4312).
- **15 nodes call `tripinfo_table()`:** 3801, 3802, 3988, 4004, 4010, 4011, 4012, 4013, 4015,
  4129, 4196, 4197, 4223, 4311, 4312. On `/node/4196` the generated table has 24 `<tr>` rows (23 data
  rows), each linking to `/tripinfo_item/...`. `/tripinfo_item` itself answers 200.
- **`tripinfo_item/DAY/START/END` pages run away.** Each per-day page's ‹ prev / next › links walk
  every triplog day and ignore the route's date range (for example, a 2003 Mexico day shown inside
  the 2008 range `/2008-07-13/2008-07-25`). Any combination of day and range answers 200. Following
  the links reaches **9,738 pages: 557 distinct days × about 18 range contexts**. Each day repeats
  its triplog node's data in another layout (day 2003-02-23 is node 2766). The route tables and range
  pages link 526 item pages covering 356 days.
  **Decision (2026-10-15):** the baseline captures those one-hop pages, not the transitive closure
  (`discover.noFollow` in `migration.config.mjs`). Their prev/next links need not survive a
  migration (allowlist entry); the Up link must.
  A static crawl that follows prev/next will meet the same explosion, and a one-hop archive leaves the
  prev/next links dead. Part 2 must decide on that.
- **274 node aliases are RSS feeds** (`<alias>/feed` for `node/N/feed`), not pages.
- **`[hobophoto:]`:** 421 macros in 117 live nodes, expanded by `hobobiker_filter`.
- **`[multisource:]`:** 13 nodes (Google Maps JS via `tripinfo`).
- **89 published triplog nodes have an empty body.** Their content is CCK fields
  (`content_type_triplog`), so they are probably not blank pages. The baseline must show that.

## Stored but never rendered (a crawl misses it)

- **447 comments** (169 published, 278 unpublished) on 154 nodes. The comment module is disabled, so
  none renders: 0 comment markup on `/node/4123`, which has 21 published comments. The heaviest
  threads are 4123 (21), 3880 (10), 4339 (10), 4291 (8) and 1064 (8).
- **77 `acidfree` nodes**, all published, all with an empty body. The `acidfree` module is disabled
  and has no tables.
- **8 `image` nodes** (227–234) are published. The `image` module is disabled and its table is gone.
- **18 `book` nodes** (334–339, 1290–1303), all unpublished. `book-toc-334` has 18 links to them.
  `/node/334` returns 403.
- **1 poll** with an empty body.

## Already broken on the original

- **`/node/206` ("Email List", in `primary-links`) returns 403** to anonymous visitors.
- `/big_trip_mexico_photos` and `/thanks` return 404.
- **Flash:** `<object>`/`<embed>` YouTube players in 3862, 3907, 3976, 3986, 4024, 4163, 4248, 4342,
  4343, and an `<embed>` in 3996.
- **`<script>`** in 3804 (`document.write` email), and in 4008, 4033 and 4057 (dead Flickr slideshows).
- **`<iframe>`** in 11 nodes: 3801, 3999, 4008, 4015, 4033, 4057, 4129, 4196, 4197, 4255, 4345.
- **24 `files` rows point at files that do not exist** (fids 1–24).
- **179 files under `sites/default/files` have spaces in their names.** None has non-ASCII characters.
- **`docroot/files/` is empty**, but some bodies reference `/files/...`.

- **Relative image paths break on every page except the root.** Some bodies use
  `src="sites/default/files/x.jpg"` (no leading slash), which resolves to `/node/sites/...` or
  `/blog/sites/...` and returns 404. Images 1271875309_61f77199da_m, 404736210_0b5213cce0_m, 52428135_c3fa36fba6_m and
  52435638_c5d25f7c16_m are broken this way on 9 baseline pages. `imagecache/240x180/297234846.jpg` is 404.
- **34 internal links are broken or restricted on the source** (`brokenOrRestrictedLinks` in
  `test/playwright/baseline/semantic/index.json`). They include `/files/Northwest/maps/*` and
  `/files/maps/NewEnglandRoute/*` (the old `/files` tree is gone), `taxonomy_menu/1/4/19`, `/forum`,
  `/subscribe_espanol`, and doubled prefixes such as `node/node/3852` and `blog/node/3852`.
- **The email address is built by `document.write()`** on 21 pages (node 3804 and the blog listings that
  show it). It isn't in the HTML, so the HTML baseline records "Feel free to email ." with a hole.
- **Pages reachable only through breadcrumbs:** `/audio`, `/audio/by`, `/audio/by/title`, `/audio/by/artist`,
  `/wp` and `/triplog` return 200 but are linked only from breadcrumbs on listing pages. An early
  baseline missed them; the kit's discovery now follows route menus and captures them.

## Hardcoded own-domain references

11 live bodies link to `http(s)://hobobiker.com`, and 29 to `www.hobobiker.com`. The suite treats
both as this site (`ownDomains`). None hardcodes a DDEV hostname.

## Security (out of scope for the migration; record and rotate)

- **Credentials with real values in `variable`:** `smtp_password`, `smtp_username`, `smtp_host`, `flickr_api_key`,
  `flickr_api_secret`, `flickr_auth_token`, `googlemap_api_key`, `tag1quo_token`. Names and lengths
  only were checked.
- **Leftover scripts answer 200:** `phpinfo.php`, `migrate_flickr_images.php`, `simple_migration_test.php`,
  `test_single_photo.php` and `bookmarks.html`. `flickr_migration.php` is 404 (already moved).

## Test-suite implications (decisions for this rehearsal)

- **The baseline will record zero comments**, which is faithful to what renders. A Drupal 11 target
  could drop every comment and still pass the render-based tiers. That is why there is a separate
  stored-content tier, enforced only for `MIGRATION_TARGET=drupal11`.
- Unpublished nodes (41: 14 blog, 18 book, 6 page, 2 story, plus 2307) must keep returning 403.
