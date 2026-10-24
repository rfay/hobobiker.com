# Agent instructions: disposable migration copy

This is a **disposable local copy** of hobobiker.com (Drupal 6, PHP 7.3, MariaDB 10.2), used to
build and rehearse the migration-testing method in
[rfay/site-migration-kit](https://github.com/rfay/site-migration-kit) (local checkout:
`~/workspace/site-migration-kit`). Nothing here is production.

**Work in progress (2026-10-24): read `HANDOFF.md` first.** Personal data and credentials were found in
published copies; the cleanup and the Leaflet map repair are planned there, step by step.

## What this environment is

- Local URL: https://hobobiker-copy.ddev.site. In this Coder workspace the same site is also served
  through https://hobobiker-copy--remotework--rfay.coder.ddev.com. Both point at this local copy.
- HTTP requests from inside the container (`ddev exec curl ...`) just work. From the host, pass
  mkcert's CA (`--ca "$(mkcert -CAROOT)/rootCA.pem"` for the kit's scripts) or use `curl -k`.
- Browsing the site through its Coder URL bakes that hostname into Drupal's render cache
  (`cache_filter`, `cache_page`). Harmless for tests; a restore clears it.
- The database and files restore from a pristine snapshot with one command:
  `migration/restore-pristine.sh`. It loads `.tarballs/db.sql.zst` and `.tarballs/files.tar`
  (gitignored, never committed). Rebuilding from scratch is cheap and expected.
- Destructive changes to the **local database and local files** are fine and expected in
  `hobobiker-prep` (see "Sibling projects" below): bulk `UPDATE`s, deleting content, rewriting
  bodies in place. Work directly; do not ask for confirmation on each one. Prefer scripts over
  one-off edits. This checkout's site is the reference the baseline came from: restoring it is fine,
  changing it is not.

## What is NOT disposable

- **Production** (hobobiker.com, www.hobobiker.com, and the host `ddevprod.thefays.us`): never connect
  to it or write to it. `.ddev/providers/hobobiker.com.yaml` can pull over SSH (its push section was
  removed on purpose). **Never run `ddev pull`, `ddev push`, `ddev auth ssh`, or `rsync`/`scp`/`ssh`
  to a remote host.** The human runs those themselves. Do not attempt interactive SSH authentication.
- **Never request `hobobiker.com`.** Old content hardcodes that domain. The test suite treats it as
  this site (`ownDomains`) and resolves those references against the target being tested.
- **Git:** `origin` is the real GitHub repository. Never `git push`. Do not commit unless the human asks.
- The frozen **baseline** (`test/playwright/baseline/`) is read-only once frozen. Transforms and
  pipeline runs must never regenerate it.
- On this workspace, a tripwire hook (`.claude/hooks/deny-production.sh`, registered in the uncommitted
  `.claude/settings.local.json`, patterns in `.agent-protected-patterns`) blocks commands that match
  these rules. If it fires, stop and ask; do not work around it.

## Ground rules for this work

- **Reproduce the site, don't repair it.** Do not fix inconsistencies you find. Record each one in
  `DISCOVERIES.md` instead. A page that is broken on the original should stay broken the same way, and
  an unpublished page should still return 403.
- Anything changed deliberately goes in `test/playwright/expected-differences.json` with a reason.
  Never change something silently.
- Every script reports a count of what it found or changed.
- Drupal 6 schema: current-revision queries join `node_revisions` on `node.vid = node_revisions.vid`.
  `url_alias` has `src`/`dst` columns. Files are listed in `files`.
- Background reading: `MIGRATION_PREP.md` (an audit from 2026-09-21; this copy differs from it in
  places, see `DISCOVERIES.md`).
- `test/playwright/kit/` is vendored from site-migration-kit. **Never edit it here.** Change the kit,
  commit it there, and vendor it again with the kit's `scripts/vendor-into.sh`.

## Sibling projects (Parts 2 and 3)

Four DDEV projects sit side by side in `~/workspace/hobo/` (setup and check list: the kit's
`docs/system-prep.md`):

| Project | Role | Rule |
|---|---|---|
| `hobobiker-copy` (this checkout) | the original; the reference for every test | never modified by migration work |
| `hobobiker-prep` | a second checkout of this repo, restored and then prepared by scripts | the only place for destructive prep |
| `hobobiker-static` | the crawled HTML, docroot `public/`, served with the kit's `static-urls.nginx.conf` | not a git repo; the crawl replaces `public/` |
| `hobobiker-d11` | the Drupal 11 rebuild (Part 3) | not built yet |

- `migration/restore-pristine.sh` restores **the project whose checkout it is run from**; there is no
  guard. For Part 2 run `~/workspace/hobo/hobobiker-prep/migration/restore-pristine.sh`, never this
  checkout's copy.
- `hobobiker-prep` is a separate working copy: after a commit here is pushed, `git pull` there.
- All projects must be running before a pipeline or test run; a stopped one makes every test fail
  slowly.

## Commands that work

```bash
# Crawl the prep copy into the static project (from the host, in test/playwright)
node kit/scripts/mirror-static.mjs --root . --out ~/workspace/hobo/hobobiker-static/public \
  --from https://hobobiker-prep.ddev.site --ca "$(mkcert -CAROOT)/rootCA.pem"
# Make the crawl self-contained
node kit/scripts/rewrite-static.mjs --dir ~/workspace/hobo/hobobiker-static/public --root . \
  --rules rewrite-rules.json
# Run checks against any target (from the host, in this checkout)
ddev exec -d /var/www/html/test/playwright \
  'TEST_BASE_URL=https://hobobiker-static.ddev.site MIGRATION_TARGET=static npx playwright test --grep "semantic:|access:|asset:|static:|baseline:"'
```

- Drush is `ddev exec drush ...` (drush 5.9 in the container). `ddev drush` does not exist for
  drupal6 projects.
- Use `ddev restart`, not `ddev utility rebuild`: with the ddev-playwright add-on enabled the rebuild
  fails with `"/playwright": not found` (Lullabot/ddev-playwright#189). Workaround in the kit's
  `docs/system-prep.md`.
- These sites have public Coder URLs. Their PHP must carry the PHP2Shell fix (October 2026): check
  `ddev php -v` shows "built: Oct 21 2026" or later.
