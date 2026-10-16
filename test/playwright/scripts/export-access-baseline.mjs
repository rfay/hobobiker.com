#!/usr/bin/env node
// Freezes the access and asset baselines from the ORIGINAL site, next to the kit's baselines:
//
//   baseline/access.json   every path of every unpublished node, with the status an anonymous visitor
//                          gets today (measured, not assumed: 403 on Drupal 6)
//   baseline/assets.json   every uploaded file (data/manifest.json), with size and SHA-256
//
// Run inside the web container, after scripts/generate-manifest.mjs:
//   ddev exec -d /var/www/html/test/playwright 'node scripts/export-access-baseline.mjs'

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import config from '../migration.config.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(readFileSync(path.join(root, 'data', 'manifest.json'), 'utf8'));
const base = config.source.baseUrl.replace(/\/$/, '');

const entries = [];
for (const n of manifest.nodes.filter((x) => !x.published)) {
  for (const p of n.paths) {
    const res = await fetch(`${base}/${p}`, { redirect: 'manual' });
    entries.push({ nid: n.nid, type: n.type, title: n.title, path: p, expectedAnonymousStatus: res.status });
  }
}
const byStatus = {};
for (const e of entries) byStatus[e.expectedAnonymousStatus] = (byStatus[e.expectedAnonymousStatus] ?? 0) + 1;

// The reference is what a visitor RECEIVES, not the bytes on disk: the 10 old *.php pages under
// files/Northwest/ are executed by the server, so their response differs from the file (flagged
// `servedDiffersFromDisk`). Files on disk that the original does not serve at all (nginx refuses
// WS_FTP.LOG, *.bak, .htaccess.*) are recorded apart: a target need not serve what the original never did.
const served = [];
const notServed = [];
for (const a of manifest.assets) {
  const res = await fetch(`${base}${a.url}`, { redirect: 'manual' });
  if (res.status !== 200) {
    notServed.push({ ...a, sourceStatus: res.status });
    continue;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  const sha256 = createHash('sha256').update(buf).digest('hex');
  served.push(sha256 === a.sha256 ? a : { url: a.url, size: buf.length, sha256, servedDiffersFromDisk: true, diskSize: a.size });
}

mkdirSync(path.join(root, 'baseline'), { recursive: true });
writeFileSync(
  path.join(root, 'baseline', 'access.json'),
  JSON.stringify({ generatedAt: new Date().toISOString(), baseUrl: base, byStatus, unpublished: entries }, null, 1) + '\n',
);
writeFileSync(
  path.join(root, 'baseline', 'assets.json'),
  JSON.stringify({
    generatedAt: new Date().toISOString(),
    count: served.length,
    bytes: served.reduce((s, a) => s + a.size, 0),
    assets: served,
    notServed,
  }, null, 1) + '\n',
);
console.log(`Access baseline: ${entries.length} path(s) of ${new Set(entries.map((e) => e.nid)).size} unpublished node(s), by status ${JSON.stringify(byStatus)}`);
console.log(`Asset baseline: ${served.length} file(s) served, ${served.reduce((s, a) => s + a.size, 0)} bytes (${served.filter((a) => a.servedDiffersFromDisk).length} served differently from disk); ${notServed.length} on disk but not served by the original`);
