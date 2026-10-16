// The semantic tier, registered from the vendored kit (kit/tests/semantic-suite.mjs; docs in kit/docs/).
// Tests are attributed to the kit file: select them by title, e.g. --grep "semantic:".

import { test, expect } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import config from '../migration.config.mjs';
import { registerSemanticSuite } from '../kit/tests/semantic-suite.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
registerSemanticSuite({ test, expect, config, root });
