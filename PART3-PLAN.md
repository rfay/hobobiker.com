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
  **Not a git repository yet.** No pipeline scripts.
- The model to copy: `~/workspace/randyfay-d11/scripts/` (`run-all.sh`, `10-site-shell.php`, `20-import.php`,
  `30-copy-files.sh`, `40-views.php`, `50-theme-*.php`; about 600 lines in all, rebuilds in about 20 s). The source
  database is loaded into a second schema in the target's own database, and the scripts read it from there.
- The suite: the baseline was re-frozen 2026-10-25. `expected-differences.json` has no `drupal11` entries. The
  stored tier is enforced for `drupal11` (`migration.config.mjs`), but **the kit has no Drupal 11 exporter**
  (`scripts/stored-exporters/` has only `drupal6.mjs`), so that tier cannot run yet.
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

The owner decides; my recommendation comes first in each row. The ones marked **before** need an answer before any
rehearsal; the rest can be settled during the rehearsal or live.

| # | Decision | Recommendation | Alternatives | When |
|---|---|---|---|---|
| D1 | How content moves | **A rerunnable PHP script** per step, as in randyfay-d11: short, readable on screen, fast to rerun | Migrate API with core's `d6_*` plugins (standard source; but 11 text formats, custom filters and dead modules mean a lot of custom process plugins) | before |
| D2 | Where the D6 data comes from | A schema `d6` in hobobiker-d11's database, loaded from `.tarballs/db.sql.zst` (the same snapshot as the baseline) | Read hobobiker-prep's database across projects (fragile networking) | before |
| D3 | Where the pipeline lives | `hobobiker-d11` as its own git repo (rfay/hobobiker-d11), `scripts/` plus `config/sync`; the tests stay here | Scripts in this repo (mixes the source and the target) | before |
| D4 | How much is pre-built vs live | Rehearse the whole pipeline this week; live, rebuild it with Claude from the plan, with tagged checkpoints to fall back on | Run the finished pipeline live and spend the hour on failures | before |
| D5 | Content types | Keep the live types (`triplog`, `blog`, `story`, `page`, `wp`, `book`); fold the dead-module types (`acidfree`, `image`, `audio`, `forum`, `poll`) into one or two, since they render as a title and little else | Keep all 12 | rehearsal |
| D6 | The 15 PHP nodes | Store the HTML they rendered (from the prep copy) as the body; drop the PHP | Port the PHP | rehearsal |
| D7 | Tripinfo: 15 route tables and the 545 `tripinfo*` pages | Route tables: render once, store as HTML (the audit's advice; the site is frozen). The 545 day pages: decide after measuring; cheapest is generating them as static nodes or files from the D6 data | A small D11 module that reproduces the routes (more code, more to show live) | rehearsal |
| D8 | `[hobophoto:]` macros (119 nodes) | Expand to markup at import | A tiny D11 text filter (closer to the original, more code) | rehearsal |
| D9 | Maps (Leaflet, `data-kml`) | Keep the markup; attach the same `lib/` files as a library | Drop the maps (a real loss: the owner wants them) | rehearsal |
| D10 | Listings: `/blog`, per-trip blogs, taxonomy pages, the panels home page | Views with the original's page size and order, so `?page=N` matches page for page | Accept and declare the listing differences | rehearsal |
| D11 | Comments | Import all 447 for the stored tier; hide them on pages, as the original does | Show them (a deliberate change to declare) | rehearsal |
| D12 | File URLs | Keep the files under `sites/default/files` and set the public path to match, so 1,793 URLs don't change; legacy hand-made files (`files/Northwest/maps/*.htm`, `files/mexico/`) served as they are | Rewrite URLs (many references in bodies) | rehearsal |
| D13 | Looks | Olivero plus a documented allowlist (step 1 of the kit's theming ladder); a subtheme only if time allows | Port `hobo_golden` (out of scope for an hour) | live |
| D14 | Users | Import the 4 users from the sanitized snapshot (names show in "By rfay"); no passwords | | rehearsal |

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
