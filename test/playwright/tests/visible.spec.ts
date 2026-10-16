// Visible-text tier (opt-in, slower: one browser page per baseline page). Checks that every line
// of baseline content is actually visible to a visitor, not just present in the HTML.
//
//   ddev playwright test --grep "visible:"
//   ddev playwright test --grep "visible:.*@smoke"
//
// Registered from the kit, so select by title (--grep), not by this file's path.

import { test, expect } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import config from '../migration.config.mjs';
import { registerVisibleSuite } from '../kit/tests/visible-suite.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
registerVisibleSuite({ test, expect, config, root });
