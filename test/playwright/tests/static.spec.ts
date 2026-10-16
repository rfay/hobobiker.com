// Static self-containment tier: a retired site must not link to anything that is not static.
// See kit/tests/static-suite.mjs for the rules. Registered from the kit, so select by title:
//
//   ddev playwright test --grep "static:"

import { test, expect } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import config from '../migration.config.mjs';
import { registerStaticSuite } from '../kit/tests/static-suite.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
registerStaticSuite({ test, expect, config, root });
