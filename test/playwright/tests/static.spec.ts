// The static tier, registered from the vendored kit (kit/tests/static-suite.mjs; docs in kit/docs/).
// Tests are attributed to the kit file: select them by title, e.g. --grep "static:".
// Only for a static archive (MIGRATION_TARGET=static): the original, and a CMS rebuild, refer to their own host.

import { test, expect } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import config from '../migration.config.mjs';
import { registerStaticSuite } from '../kit/tests/static-suite.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (process.env.MIGRATION_TARGET === 'static') registerStaticSuite({ test, expect, config, root });
