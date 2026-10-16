// Access tier: unpublished nodes must still be denied to anonymous visitors after migration.
// This is deliberately separate from the semantic tier, not a variant of it: it verifies that
// access control survived, which a content comparison alone would never catch (a private page
// becoming public is an access-control regression, not a content regression).
//
//   ddev playwright test --grep "access:"   (paths and statuses: baseline/manifest.json "unpublished")
//
// The status each page returns today (403) is the baseline. A migration target may legitimately
// differ: a static archive has no unpublished pages at all, so it answers 404. That is a decision,
// recorded in expected-differences.json with "target": "static" and applied only when the run sets
// MIGRATION_TARGET=static, so a Drupal 11 target is still held to 403.

import { test, expect } from '@playwright/test';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import config from '../migration.config.mjs';
import { applyExpectedDifferences } from '../kit/lib/compare.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const baseline = JSON.parse(readFileSync(path.join(root, 'baseline', 'manifest.json'), 'utf8'));
const allowFile = path.join(root, config.expectedDifferences ?? 'expected-differences.json');
const allow = existsSync(allowFile) ? JSON.parse(readFileSync(allowFile, 'utf8')).entries ?? [] : [];

for (const entry of baseline.unpublished) {
  test(`access: ${entry.path} (nid ${entry.nid}) stays ${entry.expectedAnonymousStatus} @draft`, async ({ request }) => {
    const res = await request.get(entry.path);
    const diffs =
      res.status() === entry.expectedAnonymousStatus
        ? []
        : [{ kind: 'access', item: `expected ${entry.expectedAnonymousStatus}, got ${res.status()}` }];
    const { unexpected, allowed } = applyExpectedDifferences(entry.path, diffs, allow);
    for (const a of allowed) {
      test.info().annotations.push({ type: 'expected-difference', description: `${a.kind}: ${a.item} (${a.reason})` });
    }
    expect(unexpected, `access differs from baseline on ${entry.path}`).toEqual([]);
  });
}
