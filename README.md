# Hobobiker.com source and migration adventure

This is the Drupal 6 PHP source code for the old Drupal 6 hobobiker.com site, a blog where Randy Fay and Nancy Lewis documented their 2.5 year trip on bicycle through the Americas in 2006-2009 (along with some other trips). Since it evolved over years, and so many years have passed, it has layers and layers of different styles and capabilities, and an awesome number of flaws.

This is also prepared for an experimental AI demo of migration to other targets, including a static html site and Drupal 11 site. 

The static HTML archive from Part 2 is published permanently at <https://static.hobobiker.com> (GitHub
Pages, from <https://github.com/rfay/hobobiker-static>).

Recaps of the sessions on drupal.org: [Part 1: Road Test](https://www.drupal.org/docs/develop/development-tools/ai-coding-tools-for-drupal-development/drupal-ai-learners-club-sessions/2026-10-16-%E2%80%94-part-1-hobobiker-rides-again-plan-it-test-it-migrate-it-%E2%80%94-road-test-having-claude) (Oct 16) and
[Part 2: The Last Ride](https://www.drupal.org/docs/develop/development-tools/ai-coding-tools-for-drupal-development/drupal-ai-learners-club-sessions/2026-10-23-%E2%80%94-part-2-hobobiker-rides-again-plan-it-test-it-migrate-it-%E2%80%94-the-last-ride-sending-a) (Oct 23).

**During the live presentations only** (they go away afterwards), the working sites are public:

- The original (Drupal 6 working copy): <https://hobobiker-copy--remotework--rfay.coder.ddev.com>
- The prepared copy that Part 2 crawls: <https://hobobiker-prep--remotework--rfay.coder.ddev.com>
- The static HTML archive, as Part 2 built it: <https://hobobiker-static--remotework--rfay.coder.ddev.com>
- The Drupal 11 rebuild from Part 3: <https://hobobiker-d11--remotework--rfay.coder.ddev.com>

To compare any page across the original, the static archive and the Drupal 11 rebuild, see
[PAGE-MAP.md](PAGE-MAP.md): every node and every other page, with a link to each of the three
(regenerate with `node migration/page-map.mjs`; `--local` for the DDEV URLs).

Part 3 starts a fresh Claude Code session on the empty Drupal 11 site with [PART3-PROMPT.md](PART3-PROMPT.md):
the owner's decisions, what to read, and a plan as the first deliverable.

The Drupal 6 sites run PHP with the October 2026 PHP2Shell fix ([DDEV's notes](https://ddev.com/blog/php2shell-what-ddev-users-need-to-know/)).

## Artifacts for Migration

### PHP Source Code

The source code is here in this repository.

```
git clone https://github.com/rfay/hobobiker.com
```

## User-generated files (sites/default/files) and sanitized database

The files and a sanitized database are at <https://github.com/rfay/hobobiker-assets/releases/tag/v1.2>
(`db.sql.gz` or `db.sql.zst`, and `files.tar.gz`). Earlier releases were withdrawn: they held credentials and
personal data that are removed from v1.2.

You can import these with standard `ddev import-db` and `ddev import-files` commands.

## Site Migration Kit

The [site-migration-kit](https://github.com/rfay/site-migration-kit) is the results of experimentation with a different, simpler migration, and has strategies and scripts to help a migration of this type. It gets vendored into the experimental migration repo.

```
git clone https://github.com/rfay/site-migration-kit
```

## Slides

Slides for the live series (source: <https://github.com/rfay/hobobiker-migration-slides>):

- Part 1, Road Test: <https://rfay.github.io/hobobiker-migration-slides/>
- Part 2, The Last Ride: <https://rfay.github.io/hobobiker-migration-slides/part2.html>
- Part 3, The Long Haul: <https://rfay.github.io/hobobiker-migration-slides/part3.html>