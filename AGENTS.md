# Agent instructions: disposable migration copy

This is a **disposable local copy** of hobobiker.com (Drupal 6, PHP 7.3, MariaDB 10.2), used to
build and rehearse the migration-testing method in
[rfay/site-migration-kit](https://github.com/rfay/site-migration-kit) (local checkout:
`~/workspace/site-migration-kit`). Nothing here is production.

## What this environment is

- Local URL: https://hobobiker-copy.ddev.site. In this Coder workspace the same site is also served
  through https://hobobiker-copy--remotework--rfay.coder.ddev.com. Both point at this local copy.
- Make HTTP requests to the site **from inside the container** (`ddev exec curl ...`). The host does
  not trust the DDEV certificate authority.
- The database and files restore from a pristine snapshot with one command:
  `migration/restore-pristine.sh`. It loads `.tarballs/db.sql.zst` and `.tarballs/files.tar`
  (gitignored, never committed). Rebuilding from scratch is cheap and expected.
- Destructive changes to the **local database and local files** are fine and expected:
  bulk `UPDATE`s, deleting content, rewriting bodies in place. Work directly; do not ask
  for confirmation on each one. Prefer scripts over one-off edits.

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
