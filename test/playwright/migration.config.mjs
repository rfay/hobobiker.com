// Per-site configuration for site-migration-kit (vendored in ./kit). This is the only
// hobobiker-specific file the kit's tiers read. Evidence for each choice: DISCOVERIES.md.

import { readFileSync } from 'node:fs';
import path from 'node:path';

const manifestOf = (root) => JSON.parse(readFileSync(path.join(root, 'data', 'manifest.json'), 'utf8'));

export default {
  siteName: 'hobobiker.com',

  source: {
    baseUrl: process.env.BASELINE_BASE_URL ?? 'https://hobobiker-copy.ddev.site',
  },

  // hobo_golden theme (Drupal 6), sites/all/themes/hobo_golden/page.tpl.php.
  extract: {
    // The theme prints the page title as <h2 class="pageTitle">; there is no <h1>.
    title: 'h2.pageTitle',
    // Everything the theme prints in #content: node body, submitted line, taxonomy, node links,
    // content_top/content_bottom blocks, the tripinfo tables. The breadcrumb is a menu (below) and
    // the title is recorded separately, so both are left out of the lines.
    content: ['#content'],
    routeContent: ['#content'],
    // .book-navigation (‹ prev | Up | next › on tripinfo_item pages) is three adjacent <a> with no
    // whitespace: as text it glues into one line no browser shows. It is navigation, so it is
    // recorded as a menu (every link, same path and text) instead of as content lines.
    ignore: ['.breadcrumb', 'h2.pageTitle', '.tabs', '.messages', '.book-navigation'],
    // The visible main navigation is built from menu-menu (not primary-links) by nav.js markup.
    menus: { main: '#main-nav-menu', breadcrumb: '#content > .breadcrumb', bookNav: '#content .book-navigation' },
    // Everything outside #content: the logo header, the footer message, and the sidebar (printed only
    // when it has blocks; its only blocks belong to the disabled boost module, so it is normally absent).
    regions: { header: '#header', sidebar: '#sidebar', footer: '#footer' },
  },

  // Discovery follows links and menus from captured pages (taxonomy, listings, pagination). The per-day
  // tripinfo_item/DAY/START/END pages' prev/next links walk every triplog day regardless of the route's
  // range; followed transitively they reach ~9,700 near-duplicate pages. Decision 2026-10-15: capture the
  // item pages linked from route tables (one hop) and do not follow item-to-item links from there.
  discover: {
    exclude: ['^comment/', '^user(/|$)', '^logout$', '^node/add', '^admin'],
    queryParams: ['page'],
    noFollow: [{ from: '^tripinfo_item/', links: '^tripinfo_item/' }],
  },

  // Old content hardcodes http://hobobiker.com/... and http://www.hobobiker.com/... (40 bodies). That
  // domain IS this site: those are internal links, resolved against whatever target is being tested.
  // A test run never requests hobobiker.com.
  ownDomains: ['hobobiker.com'],

  // Hosts a static copy must never refer to. The prepared copy that will be crawled in Part 2.
  static: { forbiddenHosts: ['hobobiker-prep.ddev.site'] },

  // The database is the truth about what exists: data/manifest.json, from scripts/generate-manifest.mjs.
  // Unpublished nodes are listed too: the access tier holds them to 403.
  async listContent({ root }) {
    return manifestOf(root).nodes.map((n) => ({
      id: n.nid,
      type: n.type || '(none)',
      title: n.title,
      published: n.published,
      paths: n.aliases,
      tags: n.tags,
    }));
  },

  // Rows of the Drupal 6 `files` table. 24 of 44 are missing on disk; the exporter records those as
  // already broken instead of asserting them.
  async listAssets({ root }) {
    return manifestOf(root).files.map((f) => f.url);
  },

  // Beyond "nothing is missing": lines keep their order and images keep their alt text.
  strict: { order: true, alt: true },

  // Stored-content tier (kit/docs/stored-tier.md): a Drupal 11 rebuild must keep everything the D6
  // database held, including the 447 comments that never render. A static archive only gets a report.
  stored: { enforceFor: ['drupal11'] },

  expectedDifferences: 'expected-differences.json',
};
