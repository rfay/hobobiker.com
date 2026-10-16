// Baseline sanity: checks the FROZEN BASELINE itself, not a target. The tiers can only catch what the
// baseline recorded, so these assert that the Drupal 6 hazards (DISCOVERIES.md) actually made it into
// the baseline, with the right shape. A baseline export that silently lost the render-time content
// would otherwise make every target look good.
//
//   ddev playwright test --grep "baseline:"
//
// No requests are made; these read baseline/ and data/ only, so the result is the same for any target.

import { test, expect } from '@playwright/test';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'baseline', 'semantic');
const index = JSON.parse(readFileSync(path.join(dir, 'index.json'), 'utf8'));
const manifest = JSON.parse(readFileSync(path.join(root, 'data', 'manifest.json'), 'utf8'));
const recordOf = (p: string) => {
  const page = index.pages.find((x) => x.path === p);
  return page ? JSON.parse(readFileSync(path.join(dir, page.file), 'utf8')) : null;
};
const published = (tag: string) => manifest.nodes.filter((n) => n.published && n.tags.includes(tag));

test('baseline: tripinfo tables were rendered, not stored PHP @hazard', () => {
  // Every route page that calls tripinfo_table() must carry the generated table: links to per-day
  // pages, and never the PHP source.
  const problems = [];
  for (const n of published('tripinfo')) {
    const rec = recordOf(`node/${n.nid}`);
    if (!rec) { problems.push(`node/${n.nid}: not in baseline`); continue; }
    const items = rec.links.filter((l) => l.key.startsWith('tripinfo_item/')).length;
    if (items === 0) problems.push(`node/${n.nid}: no tripinfo_item links (table not rendered?)`);
    if (rec.lines.some((l) => /tripinfo_table\(|<\?php/.test(l))) problems.push(`node/${n.nid}: PHP source leaked into the page`);
  }
  expect(problems).toEqual([]);
});

test('baseline: node 4196 table has its 23 day rows @hazard', () => {
  const rec = recordOf('node/4196');
  expect(new Set(rec.links.filter((l) => l.key.startsWith('tripinfo_item/')).map((l) => l.key)).size).toBe(23);
});

test('baseline: every hobophoto page recorded images and no raw macro @hazard', () => {
  const problems = [];
  for (const n of published('hobophoto')) {
    const rec = recordOf(`node/${n.nid}`);
    if (!rec) { problems.push(`node/${n.nid}: not in baseline`); continue; }
    if (rec.images.length === 0) problems.push(`node/${n.nid}: no images recorded`);
    if (rec.lines.some((l) => l.includes('[hobophoto:'))) problems.push(`node/${n.nid}: raw [hobophoto: macro in the page`);
  }
  expect(problems).toEqual([]);
});

test('baseline: pages whose module is gone are recorded as (nearly) empty, not skipped @hazard', () => {
  // acidfree and image nodes render a title and the submitted/taxonomy chrome, and no body.
  const problems = [];
  for (const n of published('module-gone')) {
    const rec = recordOf(`node/${n.nid}`);
    if (!rec) problems.push(`node/${n.nid}: not in baseline`);
    else if (!rec.contentFound) problems.push(`node/${n.nid}: content region not found`);
  }
  expect(problems).toEqual([]);
});

test('baseline: no comment rendered anywhere (comment module disabled) @hazard', () => {
  // If this ever fails, the source changed: comments became visible and the baseline must be re-frozen.
  const withComments = published('has-comments').map((n) => recordOf(`node/${n.nid}`)).filter(Boolean);
  expect(withComments.length).toBeGreaterThan(0);
  const leaked = withComments.filter((rec) => rec.lines.some((l) => /^(Reply|delete|edit)$/.test(l) || /Submitted by .* on /.test(l)));
  expect(leaked.length).toBe(0);
});

test('baseline: the stored-content baseline holds every comment @hazard', () => {
  const stored = path.join(root, 'baseline', 'stored.json');
  expect(existsSync(stored)).toBe(true);
  const s = JSON.parse(readFileSync(stored, 'utf8'));
  expect(s.counts).toMatchObject({ nodes: manifest.nodes.length, comments: 447 });
});

test('baseline: unpublished pages are absent from the semantic baseline @hazard', () => {
  const have = new Set(index.pages.map((p) => p.path));
  const leaked = manifest.nodes.filter((n) => !n.published).flatMap((n) => n.aliases).filter((p) => have.has(p));
  expect(leaked).toEqual([]);
});
