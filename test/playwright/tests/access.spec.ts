// Access tier: every path of every unpublished node must still be refused to an anonymous visitor, with
// the status the original gives today (baseline/access.json, measured by scripts/export-access-baseline.mjs).
// A private page turning public is an access regression that no content comparison would notice.
//
//   ddev exec -d /var/www/html/test/playwright 'npx playwright test --grep "access:"'
//
// A static archive has no unpublished pages and answers 404; that is a decision, declared in
// expected-differences.json for target "static", so a Drupal 11 target is still held to 403.

import { test, expect } from '@playwright/test';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import config from '../migration.config.mjs';
import { applyExpectedDifferences } from '../kit/lib/compare.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const access = JSON.parse(readFileSync(path.join(root, 'baseline', 'access.json'), 'utf8'));
const allowFile = path.join(root, config.expectedDifferences ?? 'expected-differences.json');
const allow = existsSync(allowFile) ? JSON.parse(readFileSync(allowFile, 'utf8')).entries ?? [] : [];

for (const e of access.unpublished) {
  test(`access: ${e.path} (nid ${e.nid}) stays ${e.expectedAnonymousStatus} @draft @${e.type}`, async ({ request }) => {
    const res = await request.get(e.path, { maxRedirects: 0 });
    const diffs = res.status() === e.expectedAnonymousStatus ? [] : [{ kind: 'access', item: `expected ${e.expectedAnonymousStatus}, got ${res.status()}` }];
    const { unexpected, allowed } = applyExpectedDifferences(e.path, diffs, allow);
    for (const a of allowed) test.info().annotations.push({ type: 'expected-difference', description: `${a.kind}: ${a.item} (${a.reason})` });
    expect(unexpected, `access differs from the original on ${e.path} ("${e.title}")`).toEqual([]);
  });
}
