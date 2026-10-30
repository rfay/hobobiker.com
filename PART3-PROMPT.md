# Part 3: the opening prompt (draft)

For the live session on Friday, Oct 30. Paste the prompt below into a **new** Claude Code session started in
`~/workspace/hobo/hobobiker-d11`, on the branch `live-start`, after `scripts/00-reset.sh`. Edit it
freely; it is a draft. Notes for the owner are after it.

---

We're migrating hobobiker.com, a Drupal 6 site from 2003-2009 (a 2.5-year bicycle trip through the Americas), to
Drupal 11, live, in front of an audience. This is Part 3 of a series. In Part 1 we froze a baseline of everything
the original shows and built a test suite around it; in Part 2 we retired the site to a static HTML archive that
passes that suite. Now the target is this project: an empty Drupal 11.4 site.

My decisions for this rebuild. Treat them as requirements:

- The site is built from nothing by rerunnable steps in `scripts/`, keeping the original IDs. The method is up to
  you: the Migrate API or your own scripts.
- No PHP stored in the content runs on Drupal 11. Content that used the PHP filter gets another approach.
- The `[hobophoto:]` photo macros work in a Drupal 11 way.
- You may create content types, text formats and a custom module (for the trip pages, for example).
- These may be dropped: URL aliases to deleted nodes, and the comment on a deleted node. The node with no content
  type moves to another type.
- The data must be valid Drupal 11 data, and you need a way to show that.
- The site should look like the original, not like a stock theme.

Start by reading:

1. `~/workspace/hobo/hobobiker-d11/AGENTS.md`: the environment, the reference site and the rules.
2. The test suite's view of the site: `~/workspace/hobo/hobobiker-copy/test/playwright/data/manifest.json` and
   `baseline/semantic/index.json` (what has to come over), and `expected-differences.json` (how deliberate
   changes are declared). The first two are large: summarize them with `jq`, don't read them whole.

Then explore the source: the schema `d6` in this project's database `ddev mysql d6`, and the original's code in
`~/workspace/hobo/hobobiker-copy/docroot` (its custom modules and theme). Find out what is stored and what the
original made at render time.

**Your first deliverable is a plan, not code.** Write `docs/PLAN.md` (one or two pages): the steps of a pipeline that
builds this site from nothing, in order; what each step creates and the counts it should print; how each Drupal 6
module's behavior will be reproduced in Drupal 11; what you expect the tests to say after each step; and the risks.
We have about 25 minutes of building live, so order the steps to get the stored tier (bodies, comments, terms)
passing first. Then stop, and give me a summary of the plan in about ten lines in the chat, for the audience.
Don't start building until I say so.

When we build, it is one step at a time. Each step is in `scripts/`, prints a count and can be rerun;
after each step, run the relevant tests, stop, summarize what was done and what it measured, explain the next
step, and ask before going on. Reproduce the site, don't repair it: anything you change on purpose gets declared,
narrowly, with a reason.

Don't look at this repository's `main` branch or its `s3-*` tags, or at `hobobiker-copy`'s `PART3-PLAN.md`: those
are from a rehearsal, and today is a fresh build from scratch.
