#!/usr/bin/env node
// Freezes the parts of the baseline that are not page content, into baseline/manifest.json:
//
//   unpublished  every path of every unpublished node, with the status an anonymous visitor gets
//                today (403). The access tier holds every target to it.
//   assets       size and SHA-256 of every asset the semantic baseline knows about (files it found,
//                plus every internal image on a baseline page). The bytes are NOT copied: the files
//                directory is 1.2 GB and is restorable from .tarballs/files.tar.
//
//   node scripts/export-baseline.mjs     (from test/playwright, after kit/scripts/export-semantic-baseline.mjs)
//
// Run on demand, never at test time. Requesting an imagecache derivative generates it on the
// source if it does not exist yet (compare migration/fingerprint.sh before and after).

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import crypto from 'node:crypto';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const config = (await import(path.join(root, 'migration.config.mjs'))).default;
const BASE_URL = config.source.baseUrl.replace(/\/$/, '');
const manifest = JSON.parse(readFileSync(path.join(root, 'data', 'manifest.json'), 'utf8'));
const semanticDir = path.join(root, 'baseline', 'semantic');
const index = JSON.parse(readFileSync(path.join(semanticDir, 'index.json'), 'utf8'));

const unpublished = [];
for (const node of manifest.nodes) {
  if (node.published) continue;
  for (const p of node.aliases) {
    const status = (await fetch(`${BASE_URL}/${p}`, { redirect: 'manual' })).status;
    if (status !== 403) console.warn(`  NOTE: unpublished ${p} (nid ${node.nid}) answers ${status}, not 403. Recorded as is.`);
    unpublished.push({ path: p, nid: node.nid, expectedAnonymousStatus: status });
  }
}
console.log(`Unpublished paths: ${unpublished.length} (${manifest.nodes.filter((n) => !n.published).length} nodes).`);

// Every internal image the baseline pages show, plus the assets the exporter found.
const origin = new URL(BASE_URL).origin;
const urls = new Set(index.assets);
for (const p of index.pages) {
  const rec = JSON.parse(readFileSync(path.join(semanticDir, p.file), 'utf8'));
  for (const img of rec.images) {
    const u = new URL(img.src, `${origin}/${p.path}`);
    if (u.origin === origin) urls.add(u.pathname + u.search);
  }
}

const assets = [];
const broken = [];
for (const url of [...urls].sort()) {
  const res = await fetch(`${origin}${url}`);
  if (res.status !== 200) {
    broken.push({ url, status: res.status });
    continue;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  assets.push({ url, size: buf.length, sha256: crypto.createHash('sha256').update(buf).digest('hex') });
}
console.log(`Assets hashed: ${assets.length}; not 200 on the source (recorded, not asserted): ${broken.length}.`);

writeFileSync(
  path.join(root, 'baseline', 'manifest.json'),
  JSON.stringify({ generatedAt: new Date().toISOString(), baseUrl: BASE_URL, unpublished, assets, brokenAssets: broken }, null, 1) + '\n',
);
console.log(`Wrote ${path.join(root, 'baseline', 'manifest.json')}`);
