// Baseline sanity: does the frozen baseline actually hold what makes this Drupal 6 site hard? No HTTP;
// it reads baseline/ only. Each number comes from the audit (migration/audit.sh) or the manifest, so a
// partial or wrong export fails here before any target is tested against it.
//
//   ddev exec -d /var/www/html/test/playwright 'npx playwright test --grep "sanity:"'

import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (...p: string[]) => JSON.parse(readFileSync(path.join(root, ...p), 'utf8'));
const index = read('baseline', 'semantic', 'index.json');
const manifest = read('data', 'manifest.json');
const stored = read('baseline', 'stored.json');
const access = read('baseline', 'access.json');
const pageRec = (p: string) => {
  const entry = index.pages.find((x: any) => x.path === p);
  expect(entry, `baseline page ${p}`).toBeTruthy();
  return read('baseline', 'semantic', entry.file);
};
const nodesTagged = (tag: string) => manifest.nodes.filter((n: any) => n.published && n.tags.includes(tag));

test.describe('sanity: baseline holds the site @baseline', () => {
  test('every published node path is a baseline page (1,601 paths of 1,255 nodes)', () => {
    const have = new Set(index.pages.map((p: any) => p.path));
    const want = manifest.nodes.filter((n: any) => n.published).flatMap((n: any) => n.paths);
    expect(want.length).toBe(1601);
    expect(want.filter((p: string) => !have.has(p))).toEqual([]);
  });

  test('tripinfo tables rendered at request time are in the baseline (15 nodes)', () => {
    const nodes = nodesTagged('tripinfo');
    expect(nodes.length).toBe(15);
    for (const n of nodes) {
      const rec = pageRec(`node/${n.nid}`);
      expect(rec.lines.join('\n'), `node ${n.nid} keeps no PHP source`).not.toContain('tripinfo_table(');
    }
    // node 4196 renders a mileage table: the stored body is one PHP call, the page has rows.
    expect(pageRec('node/4196').lines.length).toBeGreaterThan(50);
  });

  test('the per-day tripinfo_item pages linked from the tables are captured, one hop', () => {
    expect(index.pages.filter((p: any) => p.path.startsWith('tripinfo_item/')).length).toBeGreaterThan(100);
  });

  test('[hobophoto:] macros are expanded into images (117 published nodes)', () => {
    const nodes = nodesTagged('hobophoto');
    expect(nodes.length).toBe(117);
    const without = nodes.filter((n: any) => pageRec(`node/${n.nid}`).images.length === 0).map((n: any) => n.nid);
    expect(without, 'hobophoto nodes whose page shows no image').toEqual([]);
    for (const p of index.pages) {
      const rec = read('baseline', 'semantic', p.file);
      expect(rec.lines.join('\n'), `${p.path} leaks a raw macro`).not.toMatch(/\[(hobophoto|flickr-photo):/);
    }
  });

  test('the 77 empty acidfree nodes and 8 imageless image nodes are kept as they render', () => {
    expect(index.pages.filter((p: any) => p.type === 'acidfree' && p.path.startsWith('node/')).length).toBe(77);
    expect(index.pages.filter((p: any) => p.type === 'image' && p.path.startsWith('node/')).length).toBe(8);
    expect(pageRec('node/227').images.length).toBe(0);
  });

  test('stored content holds every node and comment, rendered or not', () => {
    expect(stored.counts).toMatchObject({ nodes: 1296, publishedNodes: 1255, comments: 447, publishedComments: 169, terms: 82 });
  });

  test('unpublished content is held to 403 (41 nodes, node 206 in the primary menu among them)', () => {
    expect(new Set(access.unpublished.map((e: any) => e.nid)).size).toBe(41);
    expect(access.unpublished.find((e: any) => e.path === 'node/206')?.expectedAnonymousStatus).toBe(403);
  });

  test('the document.write e-mail address is a known hole (node 3804)', () => {
    expect(pageRec('node/3804').lines).toContain('Send us an email at .');
  });
});
