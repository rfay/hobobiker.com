# Part 1 rehearsal log (2026-10-15)

Rehearsal for "Road Test" (live 2026-10-16). Timings, permission blocks and surprises, in the
order they happened. Not the final baseline: expect to redo it live.

## Step 0: safety and restore

| What | Time | Notes |
|---|---|---|
| `AGENTS.md`, `CLAUDE.md` (`@AGENTS.md`), tripwire hook + patterns | — | `.claude/hooks/deny-production.sh` from the kit; `.claude/hooks/test-deny-production.sh` has 16 cases, all pass |
| Files snapshot `tar -cf .tarballs/files.tar` | 2 s | 2,898 files, 1.19 GB, uncompressed (images are already compressed) |
| `migration/restore-pristine.sh` (DB + files + cache clear + fingerprint check) | 17–19 s | Verified by tampering with node 4196's title first; restore put it back and the fingerprint matched |

Surprises:

- **The hook went live as soon as it was written, and blocked the agent's own test of the hook**
  (the test command contained the strings it was testing). Keep hook self-tests in a script
  file, not inline in a command. Good evidence the hook is wired up.
- The first draft of the fetch pattern matched `grep "http://hobobiker.com"` (the bare word
  `http`, meant for HTTPie, matched the URL scheme). Fixed; that case is in the self-test now.
- `ddev drush` does not exist for `type: drupal6`; use `ddev exec drush` (drush 5.9).
- `GROUP_CONCAT` truncates at `group_concat_max_len`. DDEV's MariaDB sets 1 MB, so checksums
  were fine, but the fingerprint sets it explicitly so it is not luck.
- `.tarballs/db.sql.zst` equals the running database (the fingerprint matched before any restore).

## Step 1: audit

`migration/audit.sh` takes 23 s and is read-only. Its output (`migration/audit-output.txt`) is the
evidence for `DISCOVERIES.md`. **MIGRATION_PREP.md was wrong in about ten places for this copy**
(see the table at the top of DISCOVERIES.md). The improved prompt's "prefer checking to assuming"
paid off straight away. Two bugs in the audit script were caught on its first run: `GROUP_CONCAT`
inside a `UNION` came back empty on MariaDB 10.2, and `grep -c` counts lines, not matches, on a
one-line table.

## Step 2: harness

| What | Time | Notes |
|---|---|---|
| Vendor the kit (`vendor-into.sh test/playwright HEAD`) | 1 s | kit c89de965a |
| `ddev restart` #1 (dev-tools installs ddev-playwright) | 33 s | |
| `ddev restart` #2 (builds the Playwright web image, PHP 7.3 base) | **4 m 46 s** | Pre-bake this before going live |
| `npm ci` in the container | 2 s | reused randyfay's lockfile |
| `generate-manifest.mjs` | 2 s | 1,296 nodes, 1,601 published paths, 44 files rows |
| `export-stored-d6.mjs` (stored-content baseline) | 2 s | 1,296 nodes, 447 comments, 82 terms; 1.5 MB |

Surprises:

- **Only 1,601 published paths, not ~2,800.** 924 published nodes (the 549 triplogs and others)
  have no alias, and **274 node aliases are RSS feeds** (`node/N/feed`), not pages.
- **cheerio drops `<?php ... ?>`** (it parses as a processing instruction), so the stored-content
  tier first recorded node 4196 without its `tripinfo_table()` call. It now escapes PHP into text.
- The kit's dev-tools guard trusts "the primary URL is `*.ddev.site`" to mean "not production".
  **Verified safe:** production's `$DDEV_PRIMARY_URL` is `https://hobobiker.com`, so the guard skips it.
- The add-on's `.ddev/web-entrypoint.d/{mkcert-nssdb,php-fpm-capacity}.sh` were missing from the copied
  ignore list; they would have run on production if committed. Added to `.gitignore`.
- **The tripwire hook is deliberately not committed.** It is registered in `.claude/settings.local.json`
  (personal, uncommitted). Its rules (no `git push`, no fetching hobobiker.com) suit this disposable copy,
  not the repository. It fired twice more during the session, both times correctly: once on an inline
  test of itself, once on a docs edit whose text mentioned the blocked command.

## Steps 3–5: tiers, baseline, self-check

| What | Time | Result |
|---|---|---|
| Semantic export, first try (transitive discovery) | 10 m 51 s | 11,614 pages, **9,738 of them `tripinfo_item`**: runaway prev/next links. Stopped and decided: one hop |
| `list-tripinfo-items.mjs` | 1 s | 469 item pages, 354 days |
| Semantic export | **44 s** | 2,345 pages (1,601 node paths, 469 tripinfo items, 275 routes), 0 skipped |
| `export-baseline.mjs` (access and asset hashes, no bytes copied) | 8 s | 81 unpublished paths, all 403; 1,765 assets hashed; 8 broken on the source |
| Layout export | 2 m 14 s | After raising `/dev/shm` (below) |
| HTTP tiers vs original (`baseline:`, `semantic:`, `access:`, `asset:`) | **26 s** | 4,200 pass |
| Browser tiers vs original (`visible:`, `layout:`) | 5 m 19 s | 4,200 pass after the two fixes below |
| **Full self-check, every tier but `static:`, stored enforced** | **4 m 09 s** | **10,335 pass** |
| Source-drift check | 19 s | Kit bug (below). With the fix: no drift on 2,345 pages |

Fixes needed to reach green, in order:

1. **Images already broken on the source failed the image-load check** (9 pages; relative
   `src="sites/default/files/..."`). Declared narrowly in `expected-differences.json` as a workaround.
2. **Chromium crashed after ~2,000 page loads** ("Page crashed") because Docker's default
   `/dev/shm` is 64 MB. Fixed with `.ddev/docker-compose.shm.yaml` (`shm_size: 1gb`, one restart, 24 s).
3. **The visible-text tier failed 490 pages:**
   - 469 came from `.book-navigation` on tripinfo items: three adjacent `<a>` with no whitespace
     glue into one text line no browser shows. Recorded as a menu and dropped from content lines.
   - 21 came from `document.write()` email addresses: the HTML extractor records "Feel free to email ."
     with a hole. Declared for the visible tier only.

## Step 6: second target and negative controls

| What | Time | Result |
|---|---|---|
| `mirror-static.mjs` (wget, baseline URL list only) | 19 s | 4,194 files, 1.2 GB |
| `rewrite-static.mjs` with hosts `hobobiker-copy.ddev.site`, `hobobiker.com`, `www.hobobiker.com` | 5 s | 232 + 80 pages rewritten; 320 links to pages not in the copy unwrapped |
| HTTP and static tiers vs the mirror | 1 m 53 s | 6,066 pass, 479 fail (breakdown below) |
| Browser tiers vs the mirror (`visible:`, `layout:`) | 4 m 29 s | 4,422 pass, 268 fail: all `?page=N` pages (the serve-static artifact) |
| `negative-controls.mjs` (7 breaks on a copy of the mirror) | 2 s | |
| Targeted tests: clean mirror vs broken copy | 6 s each | clean 10/11 pass (only node/206 "got 404"); broken 2/11 pass. **Every break caught by the intended tier** |
| Additions report vs broken copy | 30 s | Leaked `[hobophoto:` found. 142 other pages listed, mostly the query-string artifact |
| Stored control (drop comment 1163, rename node 227) | 6 s | drupal11: 2 failures naming both; static: reported, passes |

The 479 failures against the mirror, explained:

- **282 (142 semantic + 140 static): `?page=N` listing pages.** wget saves `blog?page=1.html`, and the
  kit's `serve-static.mjs` ignores query strings, so it serves page 0. An artifact of the rehearsal
  server; the Part 2 nginx static project must serve these at their original URLs.
- **81 access: 404 instead of 403.** Needs the static-target decision randyfay made (`"target":
  "static"`, "a missing page is as private as a 403"). **Not added: it is your decision.**
- **80 tripinfo items: prev/next links unwrapped.** The real consequence of the one-hop decision.
  Part 2 decides: archive more days, or declare it.
- **36 routes: breadcrumb links to `/audio`, `/audio/by`, `/wp`, `/triplog` unwrapped.** Those pages
  return 200 on the source but are **missing from the baseline** (kit gap 3 below), so the mirror never
  fetched them.

## Gaps found in the kit, and what was done

All of these are in site-migration-kit commit `8010d41` on branch `hobobiker-rehearsal-fixes`, vendored
here with `vendor-into.sh` (identical to the working tree the runs below were made with).

| # | Gap | Kit change | Verified here |
|---|---|---|---|
| 1 | `check-source-drift.mjs` didn't pass `ownDomains`: 80 pages "drifted" right after freezing | Passes it; also ignores the new `broken` image field | No drift on 2,436 pages |
| 2 | The image-load check failed on images that never loaded on the source | Exporter marks `broken: <status>`; suite still requires presence, skips the load check | Workaround entry removed; 10 pages marked; self-check green |
| 3 | Discovery didn't follow the menus (breadcrumbs) of discovered routes | Follows links **and** menus of routes | `/audio`, `/audio/by`, `/audio/by/title`, `/audio/by/artist`, `/wp`, `/triplog` now captured, plus other menu-only listings |
| 4 | No way to bound a generated link space | `discover.noFollow: [{ from, links }]` | Replaces `list-tripinfo-items.mjs`: 526 one-hop item pages (356 days) |
| 5 | `serve-static.mjs` ignored query strings | Tries `a?b.html` first, like the nginx template | All 282 + 268 query-page failures gone |
| 6 | Chromium crashed past ~2,000 pages with 64 MB `/dev/shm` | Layout exporter passes `--disable-dev-shm-usage`; shm override in system-prep docs | Layout export of 2,436 pages |
| 7 | Script-built text is invisible to the HTML baseline | Documented as a known limit (semantic-tier, how-it-works) | Not fixed; the visible-tier declaration stays |
| 8 | No stored-content tier | `lib/stored.mjs`, `tests/stored-suite.mjs`, `scripts/stored-exporters/drupal6.mjs`, `docs/stored-tier.md`, `config.stored.enforceFor` | Site-local copies removed; site wrapper uses the kit |
| 9 | `rewrite-static.mjs` silently did nothing without hosts | Always includes the baseline host and own domains, and prints the list | Empty rules file: 295 pages rewritten |

Also in the kit: hook registration moved to `settings.local.json` with the reasons
(safe-demo-environment), dev-tools ignore-list and production check (dev-only-tooling), and measured
hobobiker timings in `webinar/PLAN.md`.

### After the kit changes (re-frozen and re-run)

| What | Time | Result |
|---|---|---|
| Re-freeze: semantic + layout + access/asset baselines | 3 m 18 s | 2,436 pages (835 routes, 526 of them tripinfo items), 1,770 assets |
| Full self-check, stored enforced | 4 m 44 s (incl. drift) | **10,613 pass**; no drift |
| Mirror + rewrite (empty rules) + HTTP and static tiers | 1 m 23 s | 6,564 pass; 168 fail = 81 access (404 vs 403) + 87 tripinfo prev/next links, **both open Part 2 decisions** |
| Negative controls | 14 s | Unchanged: every break caught by its tier |

## For tomorrow's live session (pre-bake list)

- Before going live: the Playwright image build (4 m 46 s), `npm ci`, the shm override, a frozen baseline.
- **Live-safe steps (under 1 minute each):** restore (19 s), audit (23 s), manifest (2 s), stored export
  (2 s), semantic export (44 s), HTTP tiers (26 s), mirror (19 s), negative controls (2 s, plus 6 s per run).
- **Pre-bake these:** layout export (2 m 14 s), browser tiers (5 m 19 s), full self-check (4 m 09 s).
- **Good live moments:** the tripinfo explosion (show the 9,738 count, then the one-hop decision); the
  CSS-hidden paragraph that only the visible tier sees; the stored control naming Javier Martin's
  missing comment.

## Permission blocks

**The session ran in auto mode** with the classifier's **default** rules: `~/.claude/settings.json`
had no `autoMode` block and no allow rules for these commands. (An earlier version of this log said
"not in auto mode"; that was wrong.)

- **Classifier blocks: none.** Everything the session ran went through: restores (`ddev import-db`,
  replacing the files directory), a deliberate `UPDATE` on `node_revisions`, three `ddev restart`s,
  installing a DDEV add-on, about 15,000 requests to the local site, and building and serving a 1.2 GB mirror.
- **Tripwire hook: 3 blocks, all correct.** An inline test of the hook, the same test reworded, and a
  docs edit through a shell heredoc whose text mentioned the blocked git command.
- **Not exercised yet:** bulk destructive `UPDATE`/`DELETE` on a prep copy (Part 2) and anything touching
  a sibling project. That is where the kit's `autoMode` block earns its place. Add it before Part 2.

## Decisions (2026-10-15)

- **Static target: unpublished pages may answer 404.** `expected-differences.json`, `"target": "static"`.
  A leak still fails ("expected 403, got 200", confirmed by the negative control); Drupal 11 is still held to 403.
- **Tripinfo day pages count only where linked; prev/next is not followed or kept.**
  `discover.noFollow` in the config, and an allowlist entry for `bookNav` links to `/tripinfo_item/`.
  The Up link is still required.
- After both: static copy 6,732 pass, 0 fail; original 4,296 pass on the HTTP tiers; controls unchanged.
