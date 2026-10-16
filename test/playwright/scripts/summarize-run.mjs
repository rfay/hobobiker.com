#!/usr/bin/env node
// Summarize a Playwright JSON report: counts, and failures grouped by tier and difference kind, with one example each.
//   node scripts/summarize-run.mjs tmp/run.json [--all]
import { readFileSync } from 'node:fs';
const [file, flag] = process.argv.slice(2);
const r = JSON.parse(readFileSync(file, 'utf8'));
console.log(`passed ${r.stats.expected}, failed ${r.stats.unexpected}, skipped ${r.stats.skipped}`);
const groups = new Map();
const strip = (s) => s.replace(/\u001b\[[0-9;]*m/g, '');
(function walk(s) {
  for (const x of s.suites ?? []) walk(x);
  for (const sp of s.specs ?? []) for (const t of sp.tests) for (const res of t.results) {
    if (res.status === 'passed' || res.status === 'skipped') continue;
    const msg = strip(res.error?.message ?? '');
    const tier = sp.title.split(':')[0];
    const items = [...msg.matchAll(/^\s+\[(\w+)\] (.*)$/gm)].map((m) => [m[1], m[2]]);
    if (!items.length) items.push(['', (msg.match(/expected \d+, got \d+|content differs[^)]*|\(\d{3}\)/) ?? [msg.split('\n')[0]])[0]]);
    for (const [kind, item] of items) {
      const k = `${tier}${kind ? ` [${kind}]` : ''}`;
      const g = groups.get(k) ?? groups.set(k, []).get(k);
      g.push(`${sp.title.replace(/ @.*/, '')} :: ${item.slice(0, 140)}`);
    }
  }
})(r);
for (const [k, g] of groups) {
  console.log(`${k}: ${g.length}`);
  for (const e of flag === '--all' ? g : g.slice(0, 2)) console.log(`    ${e}`);
}
