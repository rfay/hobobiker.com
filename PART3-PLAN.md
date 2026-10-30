# Part 3 plan: The Long Haul (Drupal 11), Friday Oct 30

The owner's plan for Part 3 of "Hobobiker Rides Again": rebuild hobobiker.com (Drupal 6) in Drupal 11 and judge it
with the same test suite. Rewritten 2026-10-28 for the day itself. The opening prompt is `PART3-PROMPT.md`; the
slides are `hobobiker-migration-slides/slides/part3-the-long-haul.md`; the session outline is the kit's
`webinar/PLAN.md` ("Part 3").

## Where things stand (2026-10-28)

**The rebuild is done and rehearsed.** From nothing (a fresh install, the Drupal 6 data reloaded) the pipeline
rebuilds the whole site in about a minute, and the suite passes in full:

| Tier | Checks | Result |
|---|---|---|
| semantic (words, links, images, menus, per page) | 2,457 | all pass |
| visible (what a visitor sees) | 2,455 | all pass |
| layout (column, colours, fonts, header) | 2,450 | all pass |
| assets (every file, byte for byte) | 1,781 | all pass |
| stored (bodies, 446 comments, 82 terms) | 1,445 | all pass |
| access (41 unpublished nodes answer 403) | 81 | all pass |
| **total** | **10,669** | **0 fail**, 10 declared differences |

Timings (2026-10-28): `00-reset.sh` 21 s, `run-all.sh` 38 s, every tier 4 min 18 s.

- **Two starting points in rfay/hobobiker-d11:** the tag `s3-start` (branch `live-start`): the empty site, its
  rules and the reset script, no pipeline, for building live. The branch `main` (tag `s3-rehearsal`): the finished
  pipeline. Checkpoints along the way: `s3-import`, `s3-views`, `s3-audio`, `s3-theme`.
- **The finished site, running:** the DDEV project `hobobiker-d11-rehearsed` (`~/workspace/hobo/hobobiker-d11-rehearsed`,
  rfay/hobobiker-d11 `main`), https://hobobiker-d11-rehearsed.ddev.site. The fallback: point the suite at it; nothing
  in hobobiker-d11 has to change. Also a DDEV snapshot in hobobiker-d11: `ddev snapshot restore s3-rehearsal`.
- Every repository is committed and pushed, the `s3-*` tags and `live-start` included.
- What went where: `hobobiker-d11/docs/MIGRATION-MAP.md`. Every page on all three sites: `PAGE-MAP.md`. What was
  found on the way: `DISCOVERIES.md`, "Part 3".

## Friday: the hour

The rule of the series: at each step Claude stops, summarizes, explains the next step and asks before going on.

| Min | What | How | If it runs long |
|---|---|---|---|
| 0-5 | Slides: last week, the confessions, DDEV v1.25.5, the target, the bar, the approach, "Today", the opening prompt | slides 1-15 | |
| 5-15 | **Onboard a fresh Claude**; it explores the Drupal 6 source and the empty target and writes its plan | `PART3-PROMPT.md`, in a new session in hobobiker-d11 on `live-start` | show its plan as it is; the plan's quality is the demo |
| 15-40 | **Build live, step by step:** the content model and the import, then the stored tier against it | Claude writes `scripts/`; the tests run from hobobiker-copy | stop after any step; the live site stays as it is |
| 40-50 | **The rehearsed result:** every tier against `hobobiker-d11-rehearsed` | restore the declarations (below), then the suite (below) with `hobobiker-d11-rehearsed` for `hobobiker-d11` | the tiers without the browser (semantic, access, stored) take about a minute |
| 50-60 | Read the results; the declared differences; what the layout tier caught; questions | slides "Looks", "Decisions" (the rehearsal numbers are in the notes of "Today"); `PAGE-MAP.md` for side by side | |

Tag the end state `s3-d11-run` (in hobobiker-d11, on `live-start`).

The suite, every tier (from hobobiker-copy; export the stored content first). For the rehearsed site, replace
`hobobiker-d11` with `hobobiker-d11-rehearsed` in the project directory and the URL:

```bash
cd ~/workspace/hobo/hobobiker-copy/test/playwright && node kit/scripts/stored-exporters/drupal11.mjs \
  --project-dir ~/workspace/hobo/hobobiker-d11 --out tmp/stored-d11.json
cd ~/workspace/hobo/hobobiker-copy && ddev exec -d /var/www/html/test/playwright \
  'TEST_BASE_URL=https://hobobiker-d11.ddev.site MIGRATION_TARGET=drupal11 STORED_TARGET_EXPORT=tmp/stored-d11.json npx playwright test --grep "semantic:|access:|asset:|baseline:|stored:|visible:|layout:"'
```

## Before the session

**Owner, once (before Friday):**

- [x] Push the start state and the checkpoints: in hobobiker-d11, `git push rfay live-start` and `git push rfay --tags`.
- [x] Read `PART3-PROMPT.md` and edit it.
- [ ] Decide F1 to F3 below (or leave them as discussion material).

**Friday morning:**

- [x] Start every project: `hobobiker-copy`, `hobobiker-prep`, `hobobiker-static`, `hobobiker-d11`,
      `hobobiker-d11-rehearsed` (`ddev start` in each; a workspace restart stops them all).
- [x] PHP2Shell fix: `ddev php -v` in each shows "built: Oct 21 2026" or later.
- [ ] Coder URLs public for `hobobiker-copy`, `hobobiker-static`, `hobobiker-d11`, `hobobiker-d11-rehearsed`.
- [x] Kit vendored and current: `cat test/playwright/kit/KIT_VERSION` (now `7db0c15`).
- [x] A last check of the fallback: the suite against `hobobiker-d11-rehearsed`, with the declarations in place;
      expect 10,669 pass (2026-10-30: 10,669 passed, 4 min 21 s).
- [x] Prepare the live start: in hobobiker-d11, `git switch live-start && scripts/00-reset.sh` (an empty site, `d6`
      loaded; the copied files stay).
- [ ] Hide the rehearsal's declarations (their reasons describe its solutions, and they would excuse failures
      the live build has not earned). In hobobiker-copy, not committed:

      ```bash
      cd ~/workspace/hobo/hobobiker-copy/test/playwright && jq '.entries |= map(select(.target != "drupal11"))' \
        expected-differences.json > tmp/ed.json && mv tmp/ed.json expected-differences.json   # 21 entries -> 11
      ```

- [ ] Open a **new** Claude Code session in `~/workspace/hobo/hobobiker-d11`.
- [ ] Slides open: https://rfay.github.io/hobobiker-migration-slides/part3.html

**Before switching to the rehearsed result** (minute 40, or any fallback): put the rehearsal's 10 declarations
back, or the rehearsed site fails on exactly those. Keep whatever Claude declared live first, if it is worth
keeping:

```bash
cd ~/workspace/hobo/hobobiker-copy
git diff test/playwright/expected-differences.json > test/playwright/tmp/live-declarations.diff   # optional
git checkout test/playwright/expected-differences.json
```

## Open decisions (owner)

| # | Question | Recommendation |
|---|---|---|
| F1 | The live part: build from `s3-start` with a fresh Claude, or only demonstrate the rehearsed pipeline? | Build live from `s3-start` for about 25 minutes (onboarding, plan, content model, import, stored tier), then switch to `main` for the full result. The plan quality and the first green stored tier are the story; the whole rebuild is too long for an hour. |
| F2 | GitHub Pages copy of the archive: 344 failures (326 are `?page=N`, which Pages ignores) | Accept and document for the Pages copy; the nginx-served archive passes everything. |
| F3 | The validity check (`hobobiker-d11/scripts/90-check-integrity.php`): every entity passes Drupal's validation; 330 findings remain, all aliases to paths Drupal 11 does not have (old feeds, pathauto leftovers) plus one user time zone | Leave as discussion material ("the data is valid Drupal 11 data, and here is how we know"); making it a kit tier with a negative control is after Part 3. |

## Decisions taken (record)

| # | Decision |
|---|---|
| D1 | Content moves with rerunnable PHP scripts (`hobobiker-d11/scripts/`), starting from randyfay-d11's; not the Migrate API. |
| D2 | The source is a copy of the sanitized snapshot in the schema `d6` of the target's database. Reading the original's database directly also works (`mysql -h hobobiker-copy-db -udb -pdb db` from hobobiker-d11's web container) and is common. |
| D3 | The pipeline lives in rfay/hobobiker-d11; the tests stay here. |
| D4 | Rehearse the whole pipeline before; live, build with Claude from a start state, with checkpoints to fall back on. |
| D5 | All 12 content types kept (the dead-module ones render their own data); the node with no type became a page, its empty title "(untitled)" (declared). |
| D6 | No PHP runs. The 17 `tripinfo_table()` calls became `[tripinfo:START,END]`, a text filter; the PHP statistics block became the HTML it rendered. |
| D7 | Tripinfo ported into the custom module `hobobiker`: the 526 day pages, the trip lists, the route tables, the maps. |
| D8 | `[hobophoto:]` stays in the content; a Drupal 11 filter plugin renders it with the original's markup; photos open in an overlay. |
| D9 | Maps: the same Leaflet library and markup. |
| D10 | Listings rebuilt from the Drupal 6 view definitions, with the original's page sizes and order (8 per page on /blog). |
| D11 | All comments imported for the stored tier, never shown (the comment module was off). |
| D12 | Files byte for byte at the same URLs, `/files/...` included. |
| D13 | Looks: the original theme ported (`hobo_golden` on stable9, the original's CSS unchanged); Olivero was tried first and passed every word check while looking nothing like the site. |
| D14 | The 4 users imported, emails `user+N@example.invalid`. |
| D15 | Validity: every entity through Drupal's `validate()`, orphan checks, Drupal's health (`90-check-integrity.php`). Aliases of deleted nodes (876) and the comment on a deleted node dropped. |

**Declared differences (10, all `"target": "drupal11"`):** node 2307's empty title; the comment on deleted node
1198; the three stored lines of each rewritten PHP call (`<?php`, `print tripinfo_table(...)`, `?>`); `/tripinfo`
without dates (a PHP fatal error on the original); `/blog_in_order/1` (a view argument); one image link now an
image style derivative; two self-links where a path has two aliases.

## Risks on the day

- **Time.** The full rebuild took two days of work; live, aim for the plan and the first steps, then switch.
- **A stale workspace.** A Coder restart stops every DDEV project and a stopped one makes every test fail slowly:
  start them first.
- **The tripwire hook** blocks any shell command that names `*hobobiker.com` (including static.hobobiker.com) or
  the production host, even in a heredoc. Expected; Claude should stop and ask, not work around it.
- **Caching is off** in hobobiker-d11 (`settings.local.php`), so pages are slower than a production site.
- **Map tiles** come from OpenStreetMap; the browser tiers block them, so that tiles load is checked by eye.

## How it got here (measured)

| Date | State | Suite |
|---|---|---|
| 2026-10-27 | the empty site | 1 pass, 3,981 fail (every tier but assets) |
| 2026-10-27 | content model and import | stored 1,445 of 1,445 |
| 2026-10-27 | menus, Views, tripinfo, home page | 3,934 of 3,982 (semantic, access, stored) |
| 2026-10-28 | audio, poll | 3,982 of 3,982 |
| 2026-10-28 | the theme ported | 8,887 of 8,887 (with the browser tiers) |
| 2026-10-28 | rebuilt from nothing | **10,669 of 10,669** (assets included) |
