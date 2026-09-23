# Migration Prep

Notes for moving an old database-driven site (here: hobobiker.com, Drupal 6) to a
new CMS or to static HTML.

Part 1 is generic and reusable on any site. Part 2 is the specific findings from a
review of this site done 2026-09-21.

---

# Part 1 — Preparing any website for migration

## Asking for the review

This document came out of a one-paragraph prompt. It's worth recording both what that
prompt got right and what it left to the agent's discretion, because several of the
most valuable findings were luck rather than instruction.

**The original prompt:**

```
This old Drupal 6 site will be migrated to another CMS or to static html.
Review the site content and navigation for serious problems that may not be
able to be migrated, like weird JS behaviors, etc.
```

**What it got right.** It named the destination ("another CMS or to static html"),
which is what makes a "problem" definable at all — a Flash embed is fatal for a static
capture and merely ugly for a CMS-to-CMS move. It gave a concrete example of the kind
of failure it cared about, which sets the altitude better than an abstract request for
"issues". And it was short, which left room to follow the evidence.

**What it left to chance.** It didn't mention that the site was running locally with
database access, so a literal-minded agent might have read only source files. It asked
for "serious problems" without asking for evidence, which invites confident prose over
counts and IDs. It anchored on JS behaviors, but the real blockers here were
render-time PHP and a permission setting. Most importantly, it only pointed at content
that *breaks* — the two largest findings (447 invisible comments, 85 empty nodes) were
content that renders *cleanly as nothing*, and those only surfaced because the agent
chose to look in that direction.

**An improved version**, general enough to paste at any old site:

```
This is <site>, an old <platform> site that I'm going to migrate to
<another CMS / static HTML>. It's running locally and you have shell and
database access. This is a read-only review — don't change anything.

Review the site for problems that will not survive that migration, and report
them with evidence: counts, page/node IDs, and the query or URL you got them
from. Prefer checking to assuming. Don't tell me how this platform usually
behaves; tell me how this install actually behaves.

Look in both directions:

- Content that is generated rather than stored — macros and shortcodes,
  embedded server-side code, input filters, template-built listings, and
  on-demand thumbnails. A database export misses all of it.
- Content that is stored but never renders — hidden by a permission, a publish
  flag, or a module that was uninstalled years ago. A crawl misses all of it,
  and it returns HTTP 200, so nothing looks wrong.

Also check: dead client-side tech (Flash, old embed formats, third-party
widgets, hover-only menus, JS that loads but is never used); referenced assets
that are missing; internal links and menu items that 404 or point at
unpublished content; external links that are dead; and any credentials sitting
in the database or config files.

Crawl the whole site logged out and compare that against the database — every
published item should have a non-trivial rendered page. Anything empty is a
problem I haven't found yet.

Finish with a prioritized list: hard blockers, silent-data-loss risks, things
already broken on the live site, and cosmetic cleanup. For each, say what the
fix is and whether it belongs before or after the migration. Tell me plainly
what checked out fine, too, so I know what I don't have to worry about.
```

The changes that matter most: stating that the site is running and read-only, demanding
evidence instead of assertions, naming the stored-but-invisible direction explicitly,
asking for the logged-out crawl to be diffed against the database, and asking for a
clean bill of health on the things that turned out fine. That last one is easy to skip
and genuinely useful — knowing all 103 image macros resolve is worth as much as knowing
which ones don't.

For a longer, more prescriptive version of the same request, see
[the full audit prompt](#full-audit-prompt) below.

## The core principle

**Migrate what the site *renders*, not what is *stored*.**

On an old CMS a large fraction of the visible page does not exist in the database.
It is produced at render time by input filters, shortcode/macro expanders, embedded
code, theme templates, view/query listings, and on-demand image derivatives. If you
export the `body` column you will get macros and template stubs, not content.

The corollary is equally important: **some stored content never renders**, because a
permission, a publish flag, or a missing module hides it. A crawl-based migration
loses that silently. So you need *both* views of the site and you need to diff them.

## Preparation checklist

### 1. Freeze and snapshot
- Take a database dump and a files-directory archive, and verify you can restore them.
- Get the site running locally (DDEV, Lando, Docker) so you can crawl it without
  touching production and without rate limits.
- Commit the codebase to git if it isn't already.

### 2. Inventory the content
- Count nodes/posts/pages by type and by published status.
- Count comments by status. Comments are frequently the most under-valued content
  on an old site and the easiest to lose.
- List taxonomy terms, menus, and URL aliases. The alias list is your redirect map.
- Identify content types whose data lives outside the main content table
  (galleries, attachments, custom fields).

### 3. Find the render-time magic
This is where migrations break. Search stored content for:
- **Macros / shortcodes** — `[something:...]`, `{{...}}`, `{something}`.
- **Embedded code** — `<?php`, template tags, server-side includes.
- **Iframes, `<object>`, `<embed>`, `<script>`** inside content bodies.
- **Input formats / filter chains** — enumerate every format and which filters each
  one runs, then count how many *live* items use each. Formats that run code or call
  external APIs are your blockers.

For each one, decide: pre-render it, rewrite it to plain HTML, or drop it.

### 4. Look for modules that are gone or off
Cross-check enabled modules against files on disk, and cross-check *content types and
input formats* against the modules that are supposed to power them. A content type
whose module was uninstalled years ago leaves behind nodes that render blank. These
are invisible in a crawl (they return HTTP 200) and invisible in a DB export (the body
is empty), so they only show up if you look for them on purpose.

### 5. Audit assets
- Verify every locally-referenced image/file actually exists on disk.
- Check whether image derivatives (thumbnails) are generated on demand. If so,
  pre-generate them all before crawling, or the crawl will capture broken images.
- Note filenames with spaces or non-ASCII characters — these break on some static hosts.
- Note files served through a code route (`/download/123/file.mp3`) rather than a
  direct path. Those routes vanish on a static host.

### 6. Audit links
- Internal links: resolve every one; find 404s and links to unpublished content.
- Menu links: check each target still exists and is publicly visible.
- External links: check them all with a HEAD/GET sweep. On a site older than ~10
  years, expect 25-40% rot. Decide up front whether to leave them, mark them, or
  point them at the Wayback Machine.

### 7. Check what an anonymous visitor actually sees
Crawl **logged out**. Compare the anonymous page against the admin view of the same
page. Anything that appears only when logged in will be missing from a static capture.
Pay particular attention to comments, attachments, and "read more" bodies.

### 8. Flag dead client-side technology
- **Flash** (`<object>`, `.swf`) — dead since 2020, renders as nothing.
- Old YouTube `/v/ID` Flash embeds — the video usually still exists; rewrite to
  `/embed/ID`.
- Third-party widgets (slideshow services, counters, weather badges) — mostly dead.
- `document.write()`, `<script type="javascript">` (an invalid MIME type modern
  browsers ignore), hover-only menus, and JS that is loaded but never used.

### 9. Secrets
Old databases and settings files routinely contain live API keys, tokens, SMTP
passwords, and mail credentials. Find them before the repo or a DB dump goes anywhere
public, and rotate anything real.

### 10. Decide the disposition of every bucket
For each group of content: **migrate / pre-render then migrate / rewrite / archive /
delete**. Write the decision down. Don't discover mid-migration that you have 80 blank
pages and no plan for them.

## Full audit prompt

The prompt above is the one to reach for first. This is the same request in expanded,
checklist form — useful when you want the agent to work through the areas
systematically rather than follow its nose, or when you're handing the job to a
less capable model that benefits from being told exactly what to enumerate.

```
You are auditing an old, database-driven website that I intend to migrate to a
different CMS or to static HTML. The site is running locally and you have shell
and database access. Do not change anything: this is a read-only review.

Produce a migration risk report. Work from evidence you gather yourself — query the
database, read the module/theme/plugin code, and crawl the running site with curl —
rather than from assumptions about how the platform usually behaves. Report counts
and specific IDs, not generalities.

Cover:

1. CONTENT INVENTORY. Items by type and published status. Comments by status.
   Taxonomy, menus, URL aliases.

2. RENDER-TIME GENERATION. Anything where the stored content is not the rendered
   content. Find every macro/shortcode syntax, embedded server-side code, input
   format or filter chain, and template-generated block. For each: what syntax,
   how many live items use it, what it expands to, and whether it can be
   pre-rendered. Call out anything that executes code or calls an external API at
   render time.

3. MISSING OR DISABLED DEPENDENCIES. Cross-check enabled modules/plugins against
   files on disk. Then cross-check content types and input formats against the
   modules meant to power them. Specifically look for content whose module is gone,
   so it renders blank while still returning HTTP 200. Check whether its data is
   recoverable from the database or from backups.

4. ASSETS. Verify every locally-referenced file exists. Check whether thumbnails
   are generated on demand. Flag filenames with spaces or non-ASCII characters, and
   files served through a code route instead of a direct path.

5. LINKS. Crawl all published URLs logged out; report non-200s. Resolve internal
   links and menu targets, flagging 404s and links to unpublished content. Check
   every external link and report the dead ones grouped by domain.

6. VISIBILITY GAP. Compare what is stored against what an anonymous visitor sees.
   Report any content class that exists in the database but never renders publicly —
   check permissions explicitly, don't infer them.

7. DEAD CLIENT-SIDE TECH. Flash/.swf, old-style video embeds, third-party widgets,
   document.write, invalid script types, hover-dependent navigation, and JS/CSS that
   loads but is never used.

8. SECRETS. API keys, tokens, and passwords in the database or config files.

Finish with a prioritized list: hard blockers, silent-data-loss risks, things that
are already broken on the live site, and cosmetic cleanup. For each, say what the
fix is and whether it should happen before or after the migration.
```

---

# Part 2 — hobobiker.com: findings (reviewed 2026-09-21)

Site state at review: 1,296 nodes (1,260 published), 447 comments, 1,657 URL aliases,
64 enabled modules, Drupal 6 on PHP 7.3.

| Type | Nodes | Published |
|---|---|---|
| triplog | 549 | 549 |
| blog | 342 | 331 |
| wp (Wonderful People) | 138 | 138 |
| story | 113 | 111 |
| **acidfree** | **77** | **77** |
| page | 35 | 31 |
| **book** | **18** | **0** |
| audio | 10 | 10 |
| **image** | **8** | **8** |
| forum | 4 | 4 |
| poll | 1 | 1 |

## A. Hard blockers — content that is generated, not stored

### A1. 18 nodes execute PHP at render time
Input format 2 (`PHP code`) and format 9 (`Tripinfo Google Map`) both run Drupal's PHP
evaluator. Format 9's filter chain is unusual and fragile: the `tripinfo` filter
*emits PHP source*, which the `php` filter then evaluates.

- Format 2, live: nodes **3802, 4196, 4197, 4281**
- Format 9, live: 14 nodes (**3801, 3988, 4003, 4004, 4006, 4010, 4011, 4012, 4013,
  4015, 4129, 4223, 4311, 4312**)

### A2. 15 route pages are built by `tripinfo_table()`
Those nodes call `tripinfo_table('YYYY-MM-DD','YYYY-MM-DD')`, which queries
`content_type_triplog` and builds an HTML mileage/elevation table at render time.
Verified working — e.g. node 4196 renders 23 data rows — but **none of that table is
in the node body.** A database export of these pages yields a `<?php` line and nothing
else.

The generated table also links to `/tripinfo_item/DATE/START/END`, a code route with
no static equivalent. `tripinfo` also defines `/tripinfo`, `/loadnode`, and `/mappage`.

**Fix:** crawl these pages and capture the rendered HTML, then paste the table back
into the body as static HTML. Decide separately what to do with the per-day
`tripinfo_item` links — either pre-render those pages too, or flatten the table cells
to plain text.

### A3. 103 `[hobophoto:...]` macros across 97 published nodes
Expanded by the custom `hobobiker_filter` module into imagecache-derivative markup with
a lightbox wrapper. **Good news: all 103 resolve — zero missing files.** But the macro
is meaningless outside this Drupal install.

**Fix:** pre-render. Crawl or write a conversion script that turns each macro into
plain `<a><img></a>` HTML. Pre-generate all imagecache derivatives first
(presets `240x180`, `180x240`, `600x800`, `800x600`) so nothing is generated on demand
during the crawl.

### A4. Absolute URLs carry the current hostname
The rendered HTML contains ~425 image URLs and ~924 node links written as absolute
`https://<hostname>/...`. If you crawl from DDEV, `hobobiker.ddev.site` gets baked into
the output. Crawl using the production hostname, or rewrite afterwards.

## B. Silent data loss — content that exists but never renders

These are the dangerous ones: they return HTTP 200 and look fine to a crawler.

### B1. All 447 comments are invisible to the public
The anonymous role has `access content` but **not `access comments`**. 169 comments are
published (Drupal 6 `status=0`) and include substantial reader contributions — node
4123 ("Info on Sailing from Panama to Cartagena") has 21, node 4339 has 10, node 3880
has 10. Verified: comment markup appears on **zero** of the 1,260 crawled pages.

**Fix:** decide whether comments are part of the migration. If yes, grant the
anonymous role `access comments` *before* crawling, or export them from the `comments`
table directly. If you crawl as-is, you lose all of them and won't notice.

### B2. 85 published nodes render completely empty
- **77 `acidfree` nodes** (photo albums — "Photo Albums", "New England 2005",
  "Manchester to Fryeburg, Maine", …). The `acidfree` module is disabled, its files are
  gone (`modules/contrib/acidfree/` does not exist), and it has **no database tables**.
  The node bodies are empty strings.
- **8 `image` nodes** (227–234, the New England 2005 photos). The core `image` module is
  disabled and the `image` table is gone.

The `files` table still lists 44 rows pointing at `images/DSC00070 Alternative Bike
Shop.JPG` and similar — but **none of those files exist on disk**, and they are absent
from the 2022 and 2025 backup tarballs. I checked `hobobiker.20220114.sql.gz`: no
`image` or `acidfree` tables there either.

**These 85 pages are unrecoverable locally.** The photos may exist on archive.org or in
personal photo storage.

**Fix:** unpublish or delete them before migrating. Otherwise you carry 85 blank pages
into the new site. If you want the New England 2005 album back, that's a separate
recovery project.

### B3. All 18 `book` nodes are unpublished but still menu-linked
The "Inuvik to Ushuaia Information Database" (nodes 334–339, 1290–1303 — country-by-
country info for Mexico, Guatemala, Honduras, Belize, Nicaragua, Costa Rica, Panama,
Peru, Ecuador, Bolivia, Chile, Argentina, plus General Resources) is entirely
unpublished. 19 links in the `book-toc-334` menu point at it.

**Fix:** decide — publish it (it looks like genuinely useful content) or delete the
menu. Right now it is neither visible nor gone.

### B4. "Email List" in the primary navigation is a 403
`primary-links` → node/206 ("Subscribe to the Hobobiker.com Email List") is
unpublished. Confirmed: `/node/206` returns **HTTP 403** for anonymous visitors. This
is a live bug on the current site, not just a migration issue.

## C. Already broken on the live site

### C1. Flash — 12 nodes
Flash has been dead since December 2020, so these render as nothing today.

- **11 YouTube videos across 10 nodes** using the old `<object>`/`<embed>` +
  `youtube.com/v/ID` Flash player: nodes **3862** (2 videos), **3907, 3976, 3986, 4007,
  4024, 4163, 4248, 4342, 4343**. *Recoverable* — the video IDs are right there in the
  markup. Rewrite each to `<iframe src="https://www.youtube.com/embed/ID">` (check each
  video still exists first).
- **node 4002** — `slide.com` slideshow widget. slide.com shut down in 2012. Not
  recoverable; the node is titled "Test slide.com slideshow" so deleting it is probably
  fine.
- **node 4336** — Flickr `show.swf` slideshow. Not recoverable; node is titled "tset",
  clearly a test. Delete.

### C2. Flickr slideshow scripts — 3 nodes
Nodes **4008, 4033, 4057** embed
`<script type="javascript" src="http://www.flickr.com/slideShow/index.gne?...">`.
Two failures at once: `type="javascript"` is not a valid MIME type so modern browsers
skip the tag entirely, and the endpoint is long dead. These nodes have **no fallback
content** — they are effectively blank today.

### C3. Podcasts are unplayable
All 10 podcast nodes use the `1pixelout` Flash player (`audio_player_mp3 = 1pixelout`).
Verified in the rendered HTML: 7 of the 10 emit a Flash `<object>` referencing a `.swf`;
the other 3 (**3830, 3847, 3865**) emit no player at all. No `<audio>` tag anywhere.

The MP3s themselves are fine — all 10 exist in `sites/default/files/audio/` and
download correctly (verified: node 3830's file returns 200, `audio/mpeg`, 6.3 MB).

Two migration problems:
- Downloads go through `/audio/download/NNNN/filename.mp3`, a PHP route that also
  increments a counter. No static equivalent.
- Several filenames contain spaces: `Hobobiker-Phillippe and Miriam.mp3`,
  `San Juan Chamula.mp3`, `Juchitan podcast.mp3`, `Nancy visit with Dionisio and
  Josefina.mp3`.

**Fix:** replace the Flash player with a plain `<audio controls>` tag, link the MP3s by
direct path, and rename the files to remove spaces.

### C4. Dead external links — 76 of 244
I checked all 244 unique external URLs in published content:

| Result | Count |
|---|---|
| 200 OK | 150 |
| 404 | 45 |
| Unreachable / DNS failure | 31 |
| 403 | 15 |
| 406 / 409 | 3 |

**76 links (31%) are dead** across 62 domains — including `panamerica.ch` (4),
`banners.wunderground.com` (4, weather badge images), `en.wikipedia.org` (3, moved
articles), `bike-dreams.com`, `www.blue-ant.tv`, `aplv.org`, `pushonnorth.com`,
`friendshipbridge.org.gt`, `magma.nationalgeographic.com`, `cards.webshots.com`.

Also 6 external `<img>` hotlinks that will show as broken images:
`banners.wunderground.com` (×4), `www.blue-ant.tv`, `www.stahlratte.org`,
`images.amazon.com`, `www.familycare.org`.

**Fix:** a pre-migration pass replacing dead links with Wayback Machine URLs
(`https://web.archive.org/web/2008/<original-url>`) preserves the reader's ability to
follow them. Hotlinked images should be downloaded locally or removed.

### C5. Missing internal targets
- `/big_trip_mexico_photos` → **HTTP 404**, linked from nodes 3887 and 3919.
- `/big_trip_mexico_route` → no alias, linked from node 4014.
- `/Northwest/route.php` (node 49) and `/Northwest/thanks.php` (node 27) — pre-Drupal
  paths, long gone.
- `/thanks` → 404.
- Node 4098 links to `/4015` (missing the `node/` prefix).
- Node 3802 references `/files/u1/PacificCoastComplete.gif` and `.pdf` — `docroot/files/`
  is **empty**; the real file directory is `sites/default/files`.

## D. Cleanup — do before migrating, low effort

### D1. Dead JavaScript still loading on every page
The recent nav rework (commit 5670a88) added `nav.js` but left the old machinery
enabled. Every page still loads:

- `simplemenu.js`, `simplemenu-<hash>.js`, `superfish-1.4.1.js` — **no simplemenu
  markup is emitted anywhere**. The module is still enabled; the JS is pure dead weight.
- `thickbox.js` — **zero `class="thickbox"` elements** in the rendered output.
- `jquery.preload.js` + `loadbigpics.js` — preloads `.flickr-img-wrapper a.thickbox`,
  a selector that no longer matches anything.
- `script.js` — binds `.togglebtn`; **that class appears nowhere** in the theme or in
  any of the 1,260 rendered pages.

`lightbox.js` is the one that's actually used (`rel="lightbox[group1]"` markup is real).
Note that the lightbox will not survive to a static site either — plan to replace it
with a plain link to the full-size image, or a modern CSS/JS lightbox.

**Fix:** disable `simplemenu` and `thickbox`, delete `script.js` and the
`jquery.preload` directory.

### D2. `document.write()` email obfuscation
Node **3804** ("Contact Information") builds a `mailto:` link via chained
`document.write()` calls with HTML entities. It works today only because it runs during
parse. It will break if the script is ever deferred or moved, and it defeats nothing —
the address is trivially readable in the source.

**Fix:** replace with a plain `mailto:` link, or a simple static obfuscation.

### D3. Input format 0 — 193 live nodes
193 published nodes have `format = 0`, which does not exist in `filter_formats`. They
currently fall through to Drupal's default. Harmless now, but any export script that
switches on format will mishandle them. Normalize before migrating.

### D4. Formats referencing modules that no longer exist
Three input formats point at modules that are disabled *and* absent from disk:

| Format | Name | Missing module | Live nodes |
|---|---|---|---|
| 6 | Wiki | `liquid_filters` | 8 |
| 7 | HTML (full) with Gmap | `gmap` | 1 |
| 8 | Full html with email obfuscation | `gtspam` | 1 |

Those filters are silently no-ops. The 8 "Wiki" nodes may be displaying raw wiki
markup — worth eyeballing before migration.

### D5. Google Maps embeds
14 nodes use `[multisource:...]` (expanded by `tripinfo` into a Google Maps JS API call,
using key `googlemap_api_key`). Several route pages also embed
`https://www.google.com/maps/d/u/0/embed?mid=...` iframes for "My Maps" maps.

The iframes will keep working as long as the Google account and the maps survive — but
they are an external dependency outside your control. The `.kmz` files they were built
from are referenced at `/files/gps/` and `/files/regional_kml/`, which **do not exist**
(`docroot/files/` is empty).

**Fix:** download the KMZ/KML source for each map and store it locally, and screenshot
each map as a static fallback.

### D6. Live secrets in the database
`variable` table contains real credentials:

- `flickr_api_key`, `flickr_api_secret`, `flickr_auth_token`
- `googlemap_api_key`
- `googleanalytics_account` (UA-13228261-1 — Universal Analytics, dead since 2023)

Check `sites/default/settings.php` and the SMTP module settings for mail credentials
too. Rotate or revoke anything still live before any DB dump or repo goes public. The
`.tarballs/` directory contains full database dumps — make sure it stays gitignored.

### D7. Web-accessible leftover scripts in the docroot

Six files sat in `docroot/` and were reachable over HTTP (all returned 200). All six
are committed to git.

| File | Risk | Status |
|---|---|---|
| `flickr_migration.php` | **Ran a live database migration on any GET request** | **Moved to project root 2026-09** |
| `phpinfo.php` | Full PHP config disclosure — paths, modules, versions | Still exposed |
| `migrate_flickr_images.php` | Bootstraps Drupal, no access control | Still exposed |
| `simple_migration_test.php` | Test scaffold | Still exposed |
| `test_single_photo.php` | Test scaffold | Still exposed |
| `bookmarks.html` | Stray browser bookmark export | Still exposed |

`flickr_migration.php` was the serious one. It takes `--dry-run` from `$argv`, which is
undefined under the web SAPI, so an HTTP request left `$dry_run = false` and the script
proceeded to its download-and-`UPDATE node_revisions` path. Verified: a plain `curl` of
the URL ran it end to end and printed "=== Migration Complete ===". It was harmless
*only* because the Flickr migration had already finished and it found 0 photos to
process — not because anything stopped it.

**Done:** moved to the project root. `/flickr_migration.php` now returns 404. The move
broke its relative paths (`$target_dir = 'sites/default/files'` resolves against CWD,
and the PDO host `db` only resolves inside the container), so it now carries a header
note and must be run as:

```
ddev exec -d /var/www/html/docroot php ../flickr_migration.php --dry-run
```

**Still to do:** remove the other five from the docroot, and add a
`php_sapi_name() === 'cli' or die()` guard to anything that mutates the database.

### D8. `.gitignore` typo

Line 8 reads `/docrootsites/default/settings.local.php` — missing the slash after
`docroot`. If a `settings.local.php` is ever created it will not be ignored, and local
database credentials could be committed. (`.tarballs` *is* correctly ignored, so the
database dumps there are safe.)

## E. Suggested order of work

1. **Decide the fate of the 85 empty nodes** (B2) and the 18 unpublished book nodes
   (B3). Delete or publish. Don't migrate blanks.
2. **Decide about comments** (B1). If keeping them, grant anonymous `access comments`
   now, before any crawl.
3. **Fix what's already broken** while you still have a working Drupal to do it in:
   rewrite the 11 YouTube embeds (C1), replace the podcast players with `<audio>` (C3),
   fix node 206 in the nav (B4), fix `document.write` (D2).
4. **Rotate secrets** (D6) and **delete the five remaining exposed docroot scripts** (D7).
5. **Pre-generate all imagecache derivatives**, then **crawl the site logged out** using
   the production hostname. That crawl is your source of truth for A1–A4.
6. **Diff the crawl against the database** — every published node should have a
   non-trivial rendered page. Anything empty is a problem you haven't found yet.
7. **Do the dead-link pass** (C4, C5) against the crawled HTML.
8. **Build the redirect map** from the 1,657 URL aliases. This is the single most
   valuable artifact for preserving the site's inbound links and search ranking.
9. Then migrate.

## F. Things that are fine

Worth stating explicitly, because they're the usual suspects and they check out here:

- **All 103 `[hobophoto:]` image paths resolve.** Zero missing files.
- **All 187 local `<img>` references in the rendered HTML resolve.** Zero broken images
  from local files.
- **All 1,260 published nodes return HTTP 200.** No render failures.
- **Zero PHP errors, warnings, or notices** in any of the 1,260 rendered pages.
- **No unrendered macros leak into output** — no stray `[hobophoto`, `[flickr-`, or
  `[gmap` in the HTML. (One `[multisource:` appears in node 4197, but it's inside an
  HTML comment.)
- **The Flickr macro migration is complete.** Zero `[flickr-photo:` or
  `[flickr-photoset:` tags remain in published content; `flickr_filter` is enabled but
  now has nothing to do. See `README_FLICKR_MIGRATION.md`.
- **`nav.js` is already migration-ready** — plain HTML/CSS/JS, click-to-toggle, no
  jQuery, no hover dependency. It will carry over unchanged.

## G. Notes toward the Drupal 11 migration

**The site is frozen.** Hobobiker hasn't had any new content in 15 years and is
unlikely to ever have any more. This changes the calculus on several of the "pre-render
vs. rewrite vs. drop" decisions above: since nothing will be edited or added again,
techniques that only work for a one-time, static recreation of the existing content
(hand-fixing a table, hardcoding a value, flattening a macro to plain HTML once and
throwing away the mechanism that generated it) are all fair game. There's no need to
preserve editability or re-buildability for content that will never be re-built.

**Where it's reasonable to keep similar features.** For a Drupal 11 target specifically
(as opposed to static HTML), it's reasonable to recreate the same content types
(`triplog`, `blog`, `story`, etc.) rather than collapsing everything into a generic
page type, and to recreate something like the `hobobiker_filter` / `[hobophoto:...]`
mechanism (A3) for presenting groups of images, rather than converting every macro
instance to raw `<img>` markup by hand. See `README_FLICKR_MIGRATION.md` for the
history of how `hobobiker_filter` came to replace the old Flickr-dependent filter, and
how its `[hobophoto:path=...,orientation=...,caption=...]` syntax works — that's the
filter a D11 equivalent would need to reproduce or emulate.

**Tripinfo (A1/A2) is the exception, not a pattern to preserve.** The `tripinfo` input
filter and `tripinfo_table()` PHP are the one piece of render-time magic that's
reasonable to eliminate outright rather than reimplement. Since the site is frozen,
there's no future need for the live, queryable mileage/elevation tables — crawling the
~15 route pages once, capturing the rendered HTML table output, and pasting it into
each node as a static Drupal 11 node body is simpler and lower-risk than porting the
custom PHP/filter chain to a new platform. The per-day `tripinfo_item` link targets
(A2) would need the same treatment: either flattened to plain text or pre-rendered as
their own static nodes.
