# Part 3: the opening prompt (draft)

For the live session on Friday, Oct 30. Paste the prompt below into a **new** Claude Code session started in
`~/workspace/hobo/hobobiker-d11`, on the branch `live-start` (tag `s3-start`), after `scripts/00-reset.sh`. Edit it
freely; it is a draft. Notes for the owner are after it.

---

We're migrating hobobiker.com, a Drupal 6 site from 2005-2010 (a 2.5-year bicycle trip through the Americas), to
Drupal 11, live, in front of an audience. This is Part 3 of a series. In Part 1 we froze a baseline of everything
the original shows and built a test suite around it; in Part 2 we retired the site to a static HTML archive that
passes that suite. Now the target is this project: an empty Drupal 11.4 site.

Start by reading, in this order:

1. `AGENTS.md` here: the environment and the rules. They are not negotiable, especially the ones about production
   and secrets.
2. `~/workspace/hobo/hobobiker-copy/AGENTS.md` and `~/workspace/hobo/hobobiker-copy/PART3-PLAN.md`: the reference
   site, and the owner's decisions for this rebuild ("Decisions taken"). Treat those decisions as requirements.
3. The test suite's view of the site: `~/workspace/hobo/hobobiker-copy/test/playwright/data/manifest.json` and
   `baseline/semantic/index.json` (what has to come over), and `expected-differences.json` (how deliberate
   changes are declared).

Then explore the source: the schema `d6` in this project's database, and the original's code in
`~/workspace/hobo/hobobiker-copy/docroot` (its custom modules and theme). Find out what is stored and what the
original made at render time.

**Your first deliverable is a plan, not code.** Write `docs/PLAN.md` (one or two pages): the steps of a pipeline that
builds this site from nothing with scripts, in order; what each step creates and the counts it should print; how
each Drupal 6 module's behaviour will be reproduced in Drupal 11; what you expect the tests to say after each step;
and the risks. Then stop and show it to me. Don't start building until I say so.

When we build, it is one step at a time. Each step is a script in `scripts/` that prints a count and can be rerun;
after each step, run the relevant tests, stop, summarize what was done and what it measured, explain the next
step, and ask before going on. Reproduce the site, don't repair it: anything you change on purpose gets declared,
narrowly, with a reason.

Don't look at this repository's `main` branch or its `s3-*` tags: that is a rehearsal, and today is a fresh build.

---

## Notes for the owner

- **What the audience should see in the first 10 minutes:** Claude reading the rules and the decisions, querying
  `d6` (types, counts, formats, the PHP, the custom modules), and a plan that names the hard parts: the PHP
  `tripinfo_table()` calls, the `[hobophoto:]` macros, the tripinfo pages, the Views, the theme.
- **Expected first steps live:** the content model (`10-site-shell.php`), the file copy, the import, then the
  stored tier going from 1,445 failures to all passing. The rehearsed version of each is on `main`
  (`git show s3-import:scripts/20-import.php`) if you want to compare afterwards.
- **Switching to the rehearsed result:** stop the session, `git switch main`, `scripts/00-reset.sh &&
  scripts/run-all.sh` (about a minute), then the suite (`PART3-PLAN.md`, "Friday: the hour").
- **The last sentence** keeps the fresh session from copying the rehearsal. Delete it if you would rather show
  Claude finding and reusing earlier work.
- `PART3-PLAN.md`'s decision record also tells it a lot (the PHP rewrite, the theme port). That is realistic, since a
  new engineer gets the owner's decisions; but if you want the plan to show more of its own reasoning, point it at
  a shorter list of rules instead.
