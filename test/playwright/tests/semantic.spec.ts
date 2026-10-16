// Semantic tier: platform-independent check that nothing the original site showed is missing
// from the target. All logic lives in the kit; see kit/docs/semantic-tier.md.
//
// Tests are registered from the kit, so Playwright attributes them to the kit file: select
// them by title (--grep), not by this file's path.
//
//   ddev playwright test --grep "semantic:"                  # against the original (hobobiker-copy)
//   ddev playwright test --grep "semantic:.*@smoke"          # one page per type
//   ddev exec -d /var/www/html/test/playwright \
//     'TEST_BASE_URL=http://localhost:4173 npx playwright test --grep "semantic:"'   # a target
//     (set the variable INSIDE the container; a host-side env var is not forwarded)

import { test, expect } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import config from '../migration.config.mjs';
import { registerSemanticSuite } from '../kit/tests/semantic-suite.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
registerSemanticSuite({ test, expect, config, root });
