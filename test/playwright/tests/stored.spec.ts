// Stored-content tier: the target's database must keep what the original's held, including content
// that never rendered (447 comments, 85 nodes of removed modules, 18 unpublished book pages).
// All logic lives in the kit; see kit/docs/stored-tier.md. Enforced for MIGRATION_TARGET=drupal11.
//
//   node kit/scripts/stored-exporters/drupal6.mjs --out tmp/stored-now.json      # host side
//   ddev exec -d /var/www/html/test/playwright \
//     'STORED_TARGET_EXPORT=tmp/stored-now.json MIGRATION_TARGET=drupal11 npx playwright test --grep "stored:"'

import { test, expect } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import config from '../migration.config.mjs';
import { registerStoredSuite } from '../kit/tests/stored-suite.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
registerStoredSuite({ test, expect, config, root });
