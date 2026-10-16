// The stored tier, registered from the vendored kit (kit/tests/stored-suite.mjs; docs in kit/docs/).
// Tests are attributed to the kit file: select them by title, e.g. --grep "stored:".

import { test, expect } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import config from '../migration.config.mjs';
import { registerStoredSuite } from '../kit/tests/stored-suite.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
registerStoredSuite({ test, expect, config, root });
