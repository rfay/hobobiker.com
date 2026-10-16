// The layout tier, registered from the vendored kit (kit/tests/layout-suite.mjs; docs in kit/docs/).
// Tests are attributed to the kit file: select them by title, e.g. --grep "layout:".

import { test, expect } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import config from '../migration.config.mjs';
import { registerLayoutSuite } from '../kit/tests/layout-suite.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
registerLayoutSuite({ test, expect, config, root });
