// Asset tier: every asset the original served (files it links, every internal image on a baseline
// page) is served by the target with the same bytes. Size and SHA-256 are frozen in
// baseline/manifest.json by scripts/export-baseline.mjs; the bytes themselves are not copied.
//
//   ddev playwright test --grep "asset:"

import { test, expect } from '@playwright/test';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import config from '../migration.config.mjs';
import { applyExpectedDifferences } from '../kit/lib/compare.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const baseline = JSON.parse(readFileSync(path.join(root, 'baseline', 'manifest.json'), 'utf8'));
const allowFile = path.join(root, config.expectedDifferences ?? 'expected-differences.json');
const allow = existsSync(allowFile) ? JSON.parse(readFileSync(allowFile, 'utf8')).entries ?? [] : [];

for (const asset of baseline.assets) {
  test(`asset: ${asset.url} @assets`, async ({ request }) => {
    const res = await request.get(asset.url);
    const diffs = [];
    if (res.status() !== 200) {
      diffs.push({ kind: 'asset', item: `expected 200, got ${res.status()}` });
    } else {
      const buf = await res.body();
      const sha256 = crypto.createHash('sha256').update(buf).digest('hex');
      if (buf.length !== asset.size || sha256 !== asset.sha256) {
        diffs.push({ kind: 'asset', item: `content differs: ${buf.length} bytes, sha256 ${sha256.slice(0, 12)}; expected ${asset.size} bytes, ${asset.sha256.slice(0, 12)}` });
      }
    }
    const { unexpected, allowed } = applyExpectedDifferences(asset.url, diffs, allow);
    for (const a of allowed) test.info().annotations.push({ type: 'expected-difference', description: `${a.kind}: ${a.item} (${a.reason})` });
    expect(unexpected, `asset differs from baseline: ${asset.url}`).toEqual([]);
  });
}
