// Asset tier: every uploaded file must be served with the same bytes (size and SHA-256 from
// baseline/assets.json). The semantic tier checks that pages still link and show files; this checks the
// files themselves, including ones no page links to.
//
//   ddev exec -d /var/www/html/test/playwright 'npx playwright test --grep "asset:"'
//
// Files deliberately dropped by a target go in expected-differences.json, kind "assets" (match on the URL).

import { test, expect } from '@playwright/test';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import config from '../migration.config.mjs';
import { applyExpectedDifferences } from '../kit/lib/compare.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { assets } = JSON.parse(readFileSync(path.join(root, 'baseline', 'assets.json'), 'utf8'));
const allowFile = path.join(root, config.expectedDifferences ?? 'expected-differences.json');
const allow = existsSync(allowFile) ? JSON.parse(readFileSync(allowFile, 'utf8')).entries ?? [] : [];

const dir = (u) => decodeURIComponent(u.replace('/sites/default/files/', '')).split('/').slice(0, -1).join('/') || 'top';

for (const a of assets) {
  test(`asset: ${a.url} @assets @assets-${dir(a.url).split('/')[0]}`, async ({ request }) => {
    test.setTimeout(120_000);
    const res = await request.get(a.url);
    const diffs = [];
    if (res.status() !== 200) {
      diffs.push({ kind: 'assets', item: `${a.url} (${res.status()})` });
    } else {
      const buf = await res.body();
      const sha = createHash('sha256').update(buf).digest('hex');
      if (buf.length !== a.size || sha !== a.sha256) diffs.push({ kind: 'assets', item: `${a.url} (content differs: ${buf.length} bytes, expected ${a.size})` });
    }
    const { unexpected, allowed } = applyExpectedDifferences(a.url, diffs, allow);
    for (const x of allowed) test.info().annotations.push({ type: 'expected-difference', description: `${x.kind}: ${x.item} (${x.reason})` });
    expect(unexpected, `file differs from the original: ${a.url}`).toEqual([]);
  });
}
