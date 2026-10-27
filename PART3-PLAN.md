# Part 3 plan: The Long Haul (Drupal 11), Oct 30

The owner's plan for the week before Part 3: what to decide, what to build or rehearse before the session, and
what is left for the live hour. Written 2026-10-25. `HANDOFF.md` covers the Part 2 cleanup; this file covers Part 3
only. The session outline is in the kit's `webinar/PLAN.md` ("Part 3"); the slides are
`hobobiker-migration-slides/slides/part3-the-long-haul.md`.

## Goal

The same test suite, run with `MIGRATION_TARGET=drupal11` against `hobobiker-d11`, judged honestly. A green run is not
required; a reproducible run with every failure classified is.

Success at the end of the session:

- A pipeline that rebuilds `hobobiker-d11` from nothing with one command, every step a script that prints a count.
- The suite's result against it, each failure sorted into: a gap in the baseline or suite (fix), a real loss (fix
  the import), or a deliberate change (declared in `expected-differences.json` with `"target": "drupal11"`).
- Tag `s3-d11-run`.

## Where things stand (2026-10-25)

- `hobobiker-d11`: Drupal 11.4.11, PHP 8.4, MariaDB 11.8, installed with the standard modules and Olivero. Empty.
  Git repository rfay/hobobiker-d11 (2026-10-27), with `AGENTS.md` and the tripwire hook. No pipeline scripts yet.
  **The 11.4 standard install has no content types, no `body` field and no comment type** (only the `tags`
  vocabulary): the site-shell script creates all of them.
- `d6` schema loaded in hobobiker-d11's database (2026-10-27): 1,296 nodes, 447 comments, 1,657 aliases; checked
  sanitized (no Backup and Migrate destinations, no credential values, empty `watchdog` and `sessions`).
- The model to copy: `~/workspace/randyfay-d11/scripts/` (`run-all.sh`, `10-site-shell.php`, `20-import.php`,
  `30-copy-files.sh`, `40-views.php`, `50-theme-*.php`; about 600 lines in all, rebuilds in about 20 s). The source
  database is loaded into a second schema in the target's own database, and the scripts read it from there.
- The suite: the baseline was re-frozen 2026-10-25. `expected-differences.json` has no `drupal11` entries. The
  stored tier is enforced for `drupal11` (`migration.config.mjs`), but **the kit has no Drupal 11 exporter**
  (`scripts/stored-exporters/` has only `drupal6.mjs`), so that tier cannot run yet.
- **Starting point (P5, 2026-10-27), the empty D11 site**, every tier but `@assets`, 7 min 43 s: **1 pass, 3,981 fail**.
  Semantic 2,455 fail (every page), access 81 fail (the drafts answer 404, not 403), stored 1,445 fail (exported with
  the new `drupal11.mjs`: 0 nodes, 0 comments, 0 terms). The one pass is the suite's own check that the baseline
  covers every published path.
- **P6, first pass (2026-10-27):** `scripts/run-all.sh` in hobobiker-d11 rebuilds content model, files and content
  in 30 s: 1,296 nodes, 446 comments, 82 terms, 4 users, 781 aliases, 20 file records. Dropped and counted: 876
  aliases of deleted nodes, 1 orphan comment, 24 file records whose file is gone. Stored tier **1,445 pass**
  (2 deliberate changes declared). Kit `7db0c15` (Drupal 11 stored exporter) committed and vendored; not pushed.
  Not done yet: listings (Views), menus and breadcrumbs, the theme, tripinfo, PHP nodes, wiki/gmap/email filters,
  audio metadata and poll results, the integrity check (D15).
- **P6, 2026-10-27 evening:** menus, the `hobo` subtheme, Views (16 D6 views, blog, taxonomy, 3 tables), tripinfo
  (routes, `[tripinfo:]` and `[multisource:]` filters, Leaflet), the home page (D6 Panels panes in core's
  three-column layout), captions and read-more as on the original. Suite: **3,934 pass, 48 fail** (semantic 2,408 of
  2,456; access and stored all pass). Left: the audio module (46 failures), `/tripinfo` (a PHP fatal error on the
  original) and `blog_in_order/1` (a view argument) to declare. Caching is off in the development copy.
- Data: the sanitized database and files are hobobiker-assets v1.2 (also `.tarballs/` here).

## What has to come over

From the frozen baseline (`data/manifest.json`, `baseline/semantic/index.json`, `baseline/stored.json`):

| What | Count | Notes |
|---|---|---|
| Nodes | 1,296 (1,255 published, 41 unpublished) | 12 types: triplog 549, blog 342, wp 138, story 113, acidfree 77, page 35, book 18, audio 10, image 8, forum 4, poll 1, one without a type |
| Pages in the semantic baseline | 2,455 | besides the nodes: **545 `tripinfo*` pages**, **167 paginated listings** (`blog?page=N` and the per-trip blogs), 42 taxonomy term pages, the listings and other aliases |
| Published paths of nodes | 1,601 | `node/N` and aliases; keep every node ID |
| Files | 1,793, 1.1 GB | byte for byte, at the same URLs (`sites/default/files/...`, and `/files/...` as on the original) |
| Comments | 447 (169 published) | none render on the original (comment module off); the stored tier still counts them |
| Terms | 82 | |
| Users | 4 | 4 of them own nodes |

Render-time content (baseline tags): 15 `@php` nodes, 15 `@tripinfo` route tables, 119 `@hobophoto` nodes, 15
`@iframe`, 13 `@flash` (already broken), 168 `@empty-body`. Enabled D6 modules with no Drupal 11 equivalent:
`tripinfo`, `hobobiker_filter`, `php`, `panels`/`page_manager` (the home page), `acidfree`-era content, `audio`,
`imagecache`, `lightbox2`/`thickbox`, `nodewords`.

## Decisions

Owner's standing rule (2026-10-27): content types, text formats, and a custom module (`hobobiker`, for the photo filter and
possibly tripinfo) may be created wherever the rebuild needs them.

The owner decides; my recommendation comes first in each row. The ones marked **before** need an answer before any
rehearsal; the rest can be settled during the rehearsal or live.

| # | Decision | Recommendation | Alternatives | When |
|---|---|---|---|---|
| D1 | How content moves | **Decided (2026-10-27):** a rerunnable PHP script per step, starting from randyfay-d11's scripts | Migrate API with core's `d6_*` plugins | before |
| D2 | Where the D6 data comes from | **Decided, done (2026-10-27):** schema `d6` in hobobiker-d11's database | Read hobobiker-prep's database across projects | before |
| D3 | Where the pipeline lives | **Decided, done (2026-10-27):** rfay/hobobiker-d11, `scripts/` plus `config/sync`; the tests stay here | Scripts in this repo | before |
| D4 | How much is pre-built vs live | **Decided (2026-10-27):** rehearse the whole pipeline this week; live, rebuild with Claude from the plan, tagged checkpoints to fall back on | Run the finished pipeline live | before |
| D5 | Content types | Keep the live types (`triplog`, `blog`, `story`, `page`, `wp`, `book`); fold the dead-module types (`acidfree`, `image`, `audio`, `forum`, `poll`) into one or two, since they render as a title and little else. **Decided (owner):** the 1 node with no type is migrated to another type (declared) | Keep all 12 | rehearsal |
| D6 | PHP (no PHP filter in Drupal 11; owner, 2026-10-27: replace every use) | 15 nodes are exactly `<?php print tripinfo_table('START','END'); ?>` (formats 2 and 9; 3 more nodes in format 9 have no PHP). **Recommended:** the import rewrites the call to `[tripinfo:START,END]`, rendered by a text filter in the `hobobiker` module from the tripinfo data; the stored-body line declared with one anchored regex. The 3 stat blocks (custom blocks 11, 14, 18; PHP that sums miles): the site is frozen, so a plain custom block with the HTML they render now | Store each node's rendered HTML as its body | rehearsal |
| D7 | Tripinfo: 15 route tables and the 545 `tripinfo*` pages | Route tables: render once, store as HTML (the audit's advice; the site is frozen). The 545 day pages: decide after measuring; cheapest is generating them as static nodes or files from the D6 data | A small D11 module that reproduces the routes: allowed (owner, 2026-10-27), in the same custom module `hobobiker` as the photo filter | rehearsal |
| D8 | `[hobophoto:]` macros (119 nodes) | **Decided (owner):** a Drupal 11 text filter plugin (`@Filter`, Twig template) in a custom module `hobobiker` in `web/modules/custom/`, ported from `hobobiker_filter` (105 lines). Bodies keep the macros as stored on D6 (the stored tier matches them line for line); the filter renders them | Expand to markup at import | rehearsal |
| D9 | Maps (Leaflet, `data-kml`) | Keep the markup; attach the same `lib/` files as a library | Drop the maps (a real loss: the owner wants them) | rehearsal |
| D10 | Listings: `/blog`, per-trip blogs, taxonomy pages, the panels home page | Views with the original's page size and order, so `?page=N` matches page for page | Accept and declare the listing differences | rehearsal |
| D11 | Comments | Import all 447 for the stored tier; hide them on pages, as the original does | Show them (a deliberate change to declare) | rehearsal |
| D12 | File URLs | Keep the files under `sites/default/files` and set the public path to match, so 1,793 URLs don't change; legacy hand-made files (`files/Northwest/maps/*.htm`, `files/mexico/`) served as they are | Rewrite URLs (many references in bodies) | rehearsal |
| D13 | Looks | Olivero plus a documented allowlist (step 1 of the kit's theming ladder); a subtheme only if time allows | Port `hobo_golden` (out of scope for an hour) | live |
| D14 | Users | Import the 4 users from the sanitized snapshot (names show in "By rfay"); no passwords | | rehearsal |
| D15 | Is the imported data valid Drupal 11 data? | **An integrity check after every run**: (1) every entity through Drupal's own `validate()` as uid 1, violations counted by constraint; (2) SQL orphan checks (field items, comments, aliases, file usage pointing at nothing; files whose bytes are missing); (3) `drush updatedb:status` and entity-definition updates empty, `config:status` clean after `cex`, `core:requirements` with no errors; (4) open `/node/N/edit` as admin for a sample of each type. Output as JSON with counts; a kit tier fails `drupal11` on anything not declared. Negative control: plant an orphan comment and a node with a missing text format. **Decided (owner):** the 876 aliases to deleted nodes and the 1 comment on a missing node may be dropped (declared, exact); the 11 text formats are created in D11 | Trust the Entity API (a script that writes through it can still save invalid references: `save()` does not call `validate()`) | rehearsal |

## Prep work

| # | Who | Task | Notes |
|---|---|---|---|
| P1 | owner | Answer D1-D4 | |
| P2 | owner | Make `hobobiker-d11` a git repo and create rfay/hobobiker-d11 | the agent can `git init`; the owner creates the GitHub repo and pushes |
| P3 | agent | Add the protected-pattern hook and an `AGENTS.md` to hobobiker-d11, as in this repo | the rules: never touch production, never push, reproduce don't repair |
| P4 | agent | Kit: a Drupal 11 stored exporter (`scripts/stored-exporters/drupal11.mjs`), with the negative control | the owner pushes the kit; vendor it here |
| P5 | agent | Run the suite against the empty D11 now, to record the starting point | expect nearly every check to fail; the counts go in a slide note |
| P6 | agent | Build the pipeline per D1-D12 and run it end to end from nothing; record timings | DISCOVERIES.md gets a "Part 3" section |
| P7 | agent | Run the suite; classify every failure; declare deliberate changes narrowly | |
| P8 | both | Full rehearsal from a clean checkout, timed against the 60-minute outline | tag checkpoints: `s3-shell`, `s3-import`, `s3-files`, `s3-views` |
| P9 | owner | Write the opening prompt for the session (onboard Claude: read D6 source, learn D11, write the plan) | the plan's quality is the demo (webinar/PLAN.md) |
| P10 | agent | Update the slides with measured numbers after P7 | AGENTS.md of the slides repo: numbers from measured runs |
| P11 | owner | On the day: all four projects running, PHP2Shell build check, Coder URLs public, kit vendored | the kit's `docs/system-prep.md` |
| P12 | agent | The integrity check (D15): `scripts/90-check-integrity.php` here or in the kit, and a test tier that reads its JSON | known now in `d6`: 876 aliases to deleted nodes, 1 comment on a missing node, 1 node with no type, 11 text formats; each needs a decision (skip and declare, or keep) |

Order: P1-P5 first (P4 and P5 can run in parallel), then P6-P7, then P8 at least once a day before the session.

## Risks

- **Time.** 545 tripinfo pages and 167 paginated listings are more than randyfay.com needed. If D7 or D10 runs
  long, declare the gap and say so on screen rather than rushing a fix.
- **Copying files.** 1.1 GB; copy once into the D11 project and reuse it between runs instead of copying on every
  run (randyfay-d11's import deletes file bytes when it deletes file entities: run the copy after the import).
- **Allowlist hiding a real error.** Every `drupal11` entry exact (`equals` or anchored `regex`), each with a reason.
- **The tripwire hook** blocks any command that names a `*hobobiker.com` URL, including `static.hobobiker.com`.
  Expected; ask before working around it.

## Part 2 leftovers that touch this week

- The suite against GitHub Pages (https://static.hobobiker.com, 2026-10-25, without the `@assets` tests):
  4,648 pass, 344 fail. 326 are the `?page=N` listings (Pages ignores the query string and serves page 0); 11 are
  legacy `files/Northwest/maps/*.htm` pages missing their `©` lines (probably the charset Pages declares; not
  confirmed); 5 are `files/mexico/trippics/` links to the `mexico/` folder (no directory index on Pages); 1 is a
  `tripinfo?start_date=...` link on node/4003 (a query-string file); 1 was a 503 on node/2792 (probably transient).
  Open: accept and document these for the Pages copy, or host the archive where the nginx rule applies.
- `HANDOFF.md`'s open items (older backups to check for the 3 XML files).
