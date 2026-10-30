# Part 3: the opening prompt (draft)

For the live session on Friday, Oct 30. Paste the prompt below into a **new** Claude Code session started in
`~/workspace/hobo/hobobiker-d11`, on the branch `live-start` (tag `s3-start`), after `scripts/00-reset.sh`. Edit it
freely; it is a draft. Notes for the owner are after it.

---

We're migrating hobobiker.com, a Drupal 6 site from 2003-2009 (a 2.5-year bicycle trip through the Americas), to
Drupal 11, live, in front of an audience. This is Part 3 of a series. In Part 1 we froze a baseline of everything
the original shows and built a test suite around it; in Part 2 we retired the site to a static HTML archive that
passes that suite. Now the target is this project: an empty Drupal 11.4 site.

Start by reading:

1. `~/workspace/hobo/hobobiker-d11/AGENTS.md` here: the environment and the rules.
2. `~/workspace/hobo/hobobiker-copy/AGENTS.md`, `~/workspace/hobo/hobobiker-copy/PART3-PLAN.md`: the reference
   site, and the owner's decisions for this rebuild ("Decisions taken"). Treat those decisions as requirements.
3. The test suite's view of the site: `~/workspace/hobo/hobobiker-copy/test/playwright/data/manifest.json` and
   `baseline/semantic/index.json` (what has to come over), and `expected-differences.json` (how deliberate
   changes are declared).

Then explore the source: the schema `d6` in this project's database `ddev mysql d6`, and the original's code in
`~/workspace/hobo/hobobiker-copy/docroot` (its custom modules and theme). Find out what is stored and what the
original made at render time.

**Your first deliverable is a plan, not code.** Write `docs/PLAN.md` (one or two pages): the steps of a pipeline that
builds this site from nothing with scripts, in order; what each step creates and the counts it should print; how
each Drupal 6 module's behavior will be reproduced in Drupal 11; what you expect the tests to say after each step;
and the risks. Then stop and show it to me. Don't start building until I say so.

When we build, it is one step at a time. Each step is a script in `scripts/` that prints a count and can be rerun;
after each step, run the relevant tests, stop, summarize what was done and what it measured, explain the next
step, and ask before going on. Reproduce the site, don't repair it: anything you change on purpose gets declared,
narrowly, with a reason.

Don't look at this repository's `main` branch or its `s3-*` tags: those are from a rehearsal, and today is a fresh build from scratch.
