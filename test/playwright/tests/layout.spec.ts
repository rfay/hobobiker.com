// Layout tier: is each page laid out like the original? Content column, sidebar (present, which side),
// header band and text colours, fonts, measured in a real browser and compared with wide tolerances.
//
//   ddev exec -d /var/www/html/test/playwright 'npx playwright test --grep "layout:"'
//
// Registered from the kit, so select by title (--grep), not by this file's path.

import { test, expect } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import config from '../migration.config.mjs';
import { registerLayoutSuite } from '../kit/tests/layout-suite.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
registerLayoutSuite({ test, expect, config, root });
