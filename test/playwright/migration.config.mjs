// Per-site configuration for site-migration-kit (vendored in kit/). This is the only file that should
// differ between sites; anything else that had to change for hobobiker.com is a gap in the kit and is
// recorded in DISCOVERIES.md.

import { readFileSync } from 'node:fs';
import path from 'node:path';

const manifestOf = (root) => JSON.parse(readFileSync(path.join(root, 'data', 'manifest.json'), 'utf8'));

export default {
  siteName: 'hobobiker.com',

  source: {
    // The original Drupal 6 site, served by this DDEV project. Used ONLY to freeze the baseline.
    baseUrl: process.env.BASELINE_BASE_URL ?? 'https://hobobiker-copy.ddev.site',
  },

  // The theme is the site's own: no <main>, no <h1>. Node, listing and taxonomy pages all put their
  // content in #content and their title in h2.pageTitle (the home page has none). No page has a sidebar:
  // #content is 96% wide everywhere. The header holds only the logo; the footer is an empty <p>.
  extract: {
    title: 'h2.pageTitle',
    content: ['#content'],
    // Listing, taxonomy and home pages use the same container. Discovery also reaches 12 pre-Drupal
    // pages linked from content (route maps under files/maps and files/Northwest/maps, a mexico photo
    // gallery), which have no #content: for those the whole body is their content.
    routeContent: ['#content', 'body'],
    // The breadcrumb is recorded as a menu; keeping it out of the content lines avoids counting it twice.
    ignore: ['.breadcrumb'],
    menus: {
      main: '#main-nav-menu',
      breadcrumb: '.breadcrumb',
    },
    regions: {
      header: '#header',
      footer: '#footer',
    },
  },

  // Every node, in any status, from the database (scripts/generate-manifest.mjs -> data/manifest.json).
  // Paths are each alias plus node/N. Unpublished nodes are listed so the access tier can hold them to 403.
  async listContent({ root }) {
    return manifestOf(root).nodes.map((n) => ({
      id: n.nid,
      type: n.type,
      title: n.title,
      published: n.published,
      paths: n.paths,
      tags: n.tags.filter((t) => t !== 'draft'),
    }));
  },

  discover: {
    exclude: [],
    queryParams: ['page'],
    // tripinfo_item/DAY/START/END pages link prev/next across every day of every trip, whatever range
    // they were opened from (thousands of pages). Capture the ones the route tables link to; stop there.
    noFollow: [{ from: '^tripinfo_item/', links: '^tripinfo_item/' }],
  },

  // Old content hardcodes the production domain: those links are links to this site.
  ownDomains: ['hobobiker.com'],

  static: {
    forbiddenHosts: ['hobobiker-copy.ddev.site', 'hobobiker-copy--remotework--rfay.coder.ddev.com'],
  },

  // Uploaded files on disk (see the manifest for what is left out and why).
  async listAssets({ root }) {
    return manifestOf(root).assets.map((a) => a.url);
  },

  stored: { enforceFor: ['drupal11'] },

  expectedDifferences: 'expected-differences.json',
};
