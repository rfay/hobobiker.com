// The visible tier, registered from the vendored kit (kit/tests/visible-suite.mjs; docs in kit/docs/).
// Tests are attributed to the kit file: select them by title, e.g. --grep "visible:".

import { test, expect } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import config from '../migration.config.mjs';
import { registerVisibleSuite } from '../kit/tests/visible-suite.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
registerVisibleSuite({ test, expect, config, root });
