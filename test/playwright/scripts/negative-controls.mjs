#!/usr/bin/env node
// Negative controls: copy a static target and break it on purpose, one break per tier, so a run
// against the copy proves each tier can see a problem. A suite never seen to fail is not trusted.
//
//   node scripts/negative-controls.mjs --from /tmp/hobo-static --out /tmp/hobo-neg
//
// Run inside the container. Prints each break and what should catch it; exits 1 if a break could not
// be applied (the page or element it targets is gone), so a control can never silently do nothing.

import { cpSync, rmSync, readFileSync, writeFileSync, unlinkSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import * as cheerio from 'cheerio';

const argv = process.argv.slice(2);
const get = (f, d) => (argv.includes(f) ? argv[argv.indexOf(f) + 1] : d);
const from = path.resolve(get('--from', '/tmp/hobo-static'));
const out = path.resolve(get('--out', '/tmp/hobo-neg'));
if (!out.startsWith('/tmp/')) throw new Error(`refusing to write outside /tmp: ${out}`);

rmSync(out, { recursive: true, force: true });
cpSync(from, out, { recursive: true });

const breaks = [];
let failed = 0;
function edit(rel, label, catches, fn) {
  const file = path.join(out, rel);
  if (!existsSync(file)) { console.error(`  CANNOT APPLY ${label}: ${rel} missing`); failed++; return; }
  const $ = cheerio.load(readFileSync(file, 'utf8'));
  const n = fn($);
  if (!n) { console.error(`  CANNOT APPLY ${label}: nothing matched in ${rel}`); failed++; return; }
  writeFileSync(file, $.html());
  breaks.push({ label, rel, n, catches });
}
// The element whose own text holds the given line: the deepest match, so only that block goes.
const holder = ($, text) => $('#content *').filter((_, el) => $(el).text().includes(text) && !$(el).children().toArray().some((c) => $(c).text().includes(text))).first();

// 1. A paragraph of body text disappears.
edit('node/4123.html', 'remove a paragraph', 'semantic (lines), visible', ($) => {
  const el = holder($, 'Stahlratte'); const n = el.length; el.remove(); return n;
});
// 2. An expanded [hobophoto:] image disappears from the page.
edit('node/1152.html', 'remove an image', 'semantic (images)', ($) => {
  const img = $('#content img').first(); const n = img.length; img.remove(); return n;
});
// 3. A tripinfo table loses its rows (render-time content).
edit('node/4196.html', 'remove tripinfo table rows', 'semantic (lines, links), visible', ($) => {
  const rows = $('#content tr').slice(1); const n = rows.length; rows.remove(); return n;
});
// 4. Text stays in the HTML but is hidden by CSS.
edit('node/3830.html', 'hide a paragraph with CSS', 'visible only (semantic reads HTML and passes)', ($) => {
  const el = holder($, 'Copper Canyon overlook'); el.attr('style', 'display:none'); return el.length;
});
// 5. A leftover macro leaks into a page (an addition, not a loss).
edit('node/4123.html', 'leak a raw [hobophoto:] macro', 'additions report only (extra text is never a failure)', ($) => {
  $('#content').append('<p>[hobophoto:path=sites/default/files/leaked.jpg,orientation=landscape,caption=Leaked]</p>'); return 1;
});
// 6. A linked file is deleted.
{
  const rel = 'files/audio/Hobobiker.comPodcast1-TimMalloch.mp3';
  if (existsSync(path.join(out, rel))) { unlinkSync(path.join(out, rel)); breaks.push({ label: 'delete a linked file', rel, n: 1, catches: 'asset, semantic (every baseline asset resolves)' }); }
  else { console.error(`  CANNOT APPLY delete a linked file: ${rel} missing`); failed++; }
}
// 7. An unpublished page becomes public.
{
  const rel = 'node/206.html';
  mkdirSync(path.join(out, 'node'), { recursive: true });
  writeFileSync(path.join(out, rel), '<html><body><h2>Subscribe to the Hobobiker.com Email List</h2><p>Leaked draft.</p></body></html>');
  breaks.push({ label: 'publish an unpublished page', rel, n: 1, catches: 'access ("expected 403, got 200")' });
}

for (const b of breaks) console.log(`  ${b.label}: ${b.rel} (${b.n} element(s)); should be caught by ${b.catches}`);
console.log(`Negative controls: ${breaks.length} break(s) applied in ${out}${failed ? `, ${failed} could not be applied` : ''}.`);
process.exit(failed ? 1 : 0);
