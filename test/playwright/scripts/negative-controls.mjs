#!/usr/bin/env node
// Negative controls: break a COPY of a static mirror on purpose, one known way per tier, and print what
// the suite must report. A suite that has never been seen to fail is not trustworthy.
//
//   node scripts/negative-controls.mjs --from /tmp/hobo-static --out /tmp/hobo-broken
//
// Run inside the web container. The copy is hard-linked (fast); every file that is changed is unlinked
// first, so the clean mirror is never modified. Each break is chosen from the baseline, so the expected
// failure is known before the run. Also writes tmp/stored-broken.json for the stored tier.

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync, unlinkSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';

const argv = process.argv.slice(2);
const get = (f, d) => (argv.includes(f) ? argv[argv.indexOf(f) + 1] : d);
const from = path.resolve(get('--from', '/tmp/hobo-static'));
const out = path.resolve(get('--out', '/tmp/hobo-broken'));
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const base = (p) => JSON.parse(readFileSync(path.join(root, 'baseline', 'semantic', 'pages', p), 'utf8'));

if (!out.startsWith('/tmp/')) throw new Error(`refusing to write outside /tmp: ${out}`);
rmSync(out, { recursive: true, force: true });
execFileSync('cp', ['-al', from, out]);

const html = (p) => path.join(out, `${p}.html`);
function edit(p, fn) {
  const f = html(p);
  const $ = cheerio.load(readFileSync(f, 'utf8'));
  fn($);
  unlinkSync(f); // break the hard link so the clean mirror keeps its copy
  writeFileSync(f, $.html());
}
const expected = [];

// 1. A paragraph deleted (semantic: lines).
{
  const line = base('node__4123.json').lines.find((l) => l.length > 80);
  edit('node/4123', ($) => $('#content p').filter((_, el) => $(el).text().replace(/\s+/g, ' ').includes(line.slice(0, 60))).first().remove());
  expected.push(`semantic node/4123: [lines] ${line.slice(0, 60)}...`);
}
// 2. An expanded [hobophoto:] image removed (semantic: images).
{
  const img = base('node__1152.json').images[0];
  edit('node/1152', ($) => $('#content img').remove());
  expected.push(`semantic node/1152: [images] ${img.name}`);
}
// 3. A row of the render-time tripinfo table removed (semantic: lines).
{
  let rowText = '';
  edit('node/4196', ($) => {
    const tr = $('table.tripinfo_table_table tr').eq(5);
    rowText = tr.find('td').first().text().trim();
    tr.remove();
  });
  expected.push(`semantic node/4196: [lines] a tripinfo row (${rowText})`);
}
// 4. A main-menu link removed on one page (semantic: menu).
{
  const item = base('node__2759.json').menus.main.find((m) => m.text === 'Podcasts') ?? base('node__2759.json').menus.main[5];
  edit('node/2759', ($) => $('#main-nav-menu a').filter((_, el) => $(el).text().trim() === item.text).closest('li').remove());
  expected.push(`semantic node/2759: [menu] main: ${item.text} -> /${item.key}`);
}
// 5. A paragraph hidden by CSS: still in the HTML (semantic passes), not visible (visible fails).
{
  const line = base('node__4.json').lines.find((l) => l.length > 60);
  edit('node/4', ($) => $('#content p').filter((_, el) => $(el).text().replace(/\s+/g, ' ').includes(line.slice(0, 40))).first().attr('style', 'display:none'));
  expected.push(`visible node/4: [visible] ${line.slice(0, 60)}... (semantic node/4 must still pass)`);
}
// 6. An uploaded file deleted (asset tier, and semantic's "every baseline asset resolves").
{
  const { assets } = JSON.parse(readFileSync(path.join(root, 'baseline', 'assets.json'), 'utf8'));
  const a = assets.find((x) => x.url.includes('/audio/') && x.url.endsWith('.mp3'));
  const f = path.join(out, decodeURIComponent(a.url));
  if (!existsSync(f)) throw new Error(`not in mirror: ${f}`);
  unlinkSync(f);
  expected.push(`asset ${a.url}: 404`);
}
// 7. An unpublished page made public (access: expected 403).
{
  mkdirSync(path.join(out, 'node'), { recursive: true });
  writeFileSync(html('node/206'), '<html><body><h2>Subscribe to the Hobobiker.com Email List</h2></body></html>');
  expected.push('access node/206: expected 403, got 200');
}
// 8. Stored content: one comment dropped, one node title changed (stored tier, enforced for drupal11).
{
  const s = JSON.parse(readFileSync(path.join(root, 'tmp', 'stored-now.json'), 'utf8'));
  const i = s.comments.findIndex((c) => String(c.sourceNid) === '4123');
  const [dropped] = s.comments.splice(i, 1);
  const n = s.nodes.find((x) => String(x.sourceNid) === '1152');
  const oldTitle = n.title;
  n.title = `${oldTitle} (edited)`;
  writeFileSync(path.join(root, 'tmp', 'stored-broken.json'), JSON.stringify(s));
  expected.push(`stored: comment ${dropped.sourceCid} on node 4123 missing; node 1152 title "${oldTitle}" changed`);
}

console.log(`Applied ${expected.length} breaks to ${out}. The suite must report:`);
for (const e of expected) console.log(`  - ${e}`);
