#!/usr/bin/env node
// Lists every node of the source site from its database: data/manifest.json. This is the content
// listing that migration.config.mjs hands to the kit (listContent) and that the access tier reads.
//
//   node scripts/generate-manifest.mjs     # on the host (uses `ddev mysql`) or inside the web container (`mysql`)
//
// Every node is listed, in any status, at its current revision (Drupal 6: node.vid = node_revisions.vid).
// Paths are every alias of the node plus node/N: old content links to node/N heavily, and 924 published
// nodes have no alias at all, so node/N is a URL visitors really use. Tags select subsets in Playwright
// (@smoke is the lowest published nid of each type; the rest name what makes a page interesting).

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const inContainer = !!process.env.IS_DDEV_PROJECT;

const HEX = new Set(['title', 'type', 'dst', 'body']);
function query(sql) {
  const [cmd, args] = inContainer ? ['mysql', ['-e', sql]] : ['ddev', ['mysql', '-e', sql]];
  const raw = execFileSync(cmd, args, { encoding: 'utf8', maxBuffer: 1 << 30 }).trimEnd();
  if (!raw) return [];
  const [head, ...rows] = raw.split('\n');
  const headers = head.split('\t');
  return rows.map((line) =>
    Object.fromEntries(line.split('\t').map((c, i) => [headers[i], HEX.has(headers[i]) ? Buffer.from(c === 'NULL' ? '' : c, 'hex').toString('utf8') : c])),
  );
}

const nodes = query(`
  SELECT n.nid, HEX(n.type) AS type, n.status, HEX(r.title) AS title, r.format, HEX(r.body) AS body,
    (SELECT COUNT(*) FROM comments c WHERE c.nid = n.nid) AS comments
  FROM node n JOIN node_revisions r ON n.vid = r.vid ORDER BY n.nid`);
const aliases = query(`SELECT src, HEX(dst) AS dst FROM url_alias WHERE src REGEXP '^node/[0-9]+$' ORDER BY pid`);

const aliasesOf = new Map();
for (const a of aliases) {
  const nid = a.src.slice('node/'.length);
  (aliasesOf.get(nid) ?? aliasesOf.set(nid, []).get(nid)).push(a.dst);
}

// What makes a node's rendering interesting, from its stored body. Each becomes a Playwright tag.
function featureTags(n) {
  const b = n.body;
  const t = [];
  if (b.includes('<?php')) t.push('php');
  if (b.includes('tripinfo_table(')) t.push('tripinfo');
  if (b.includes('[hobophoto:')) t.push('hobophoto');
  if (b.includes('[multisource:')) t.push('multisource');
  if (/<script/i.test(b)) t.push('script');
  if (/<object|<embed|\.swf/i.test(b)) t.push('flash');
  if (/<iframe/i.test(b)) t.push('iframe');
  if (b.trim() === '') t.push('empty-body');
  if (n.comments !== '0') t.push('has-comments');
  return t;
}

const smokeSeen = new Set();
const out = nodes.map((n) => {
  const published = n.status === '1';
  const tags = featureTags(n);
  if (published && !smokeSeen.has(n.type)) {
    smokeSeen.add(n.type);
    tags.unshift('smoke');
  }
  if (!published) tags.push('draft');
  return {
    nid: Number(n.nid),
    type: n.type || '(none)',
    title: n.title,
    published,
    format: Number(n.format),
    comments: Number(n.comments),
    paths: [...new Set([...(aliasesOf.get(n.nid) ?? []), `node/${n.nid}`])],
    tags,
  };
});

// A few nodes whose pages carry the site's hardest render-time content are smoke-tested too.
for (const nid of [4196, 1152, 4123, 3804, 227, 243]) {
  const n = out.find((x) => x.nid === nid);
  if (n?.published && !n.tags.includes('smoke')) n.tags.unshift('smoke');
}

// Uploaded files, with size and SHA-256, for the asset tier. Read from disk, not from the `files` table
// (it lists 44 rows, 24 of them missing). Left out, with the reason recorded in DISCOVERIES.md:
// generated directories (CSS/JS aggregates, colour module output, imagecache derivatives, which the
// semantic tier checks through the pages that show them, temp files) and backup_migrate/, which holds
// database dumps that no target should ever be required to serve.
const filesRoot = path.resolve(root, '..', '..', 'docroot', 'sites', 'default', 'files');
const EXCLUDE = /^(css|js|color|ctools|imagecache|tmp|backup_migrate)\//;
function walk(dir, rel = '') {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const r = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) out.push(...walk(path.join(dir, e.name), r));
    else if (e.isFile() && !EXCLUDE.test(r) && e.name !== '.htaccess') out.push(r);
  }
  return out;
}
const assets = walk(filesRoot)
  .sort()
  .map((r) => {
    const buf = readFileSync(path.join(filesRoot, r));
    return {
      url: '/sites/default/files/' + r.split('/').map(encodeURIComponent).join('/'),
      size: buf.length,
      sha256: createHash('sha256').update(buf).digest('hex'),
    };
  });

const manifest = {
  generatedAt: new Date().toISOString(),
  source: 'database: node JOIN node_revisions ON node.vid = node_revisions.vid; url_alias src node/N; files: docroot/sites/default/files on disk',
  counts: {
    nodes: out.length,
    published: out.filter((n) => n.published).length,
    unpublished: out.filter((n) => !n.published).length,
    publishedPaths: out.filter((n) => n.published).reduce((s, n) => s + n.paths.length, 0),
    smoke: out.filter((n) => n.tags.includes('smoke')).length,
    assets: assets.length,
    assetBytes: assets.reduce((s, a) => s + a.size, 0),
  },
  nodes: out,
  assets,
};
mkdirSync(path.join(root, 'data'), { recursive: true });
writeFileSync(path.join(root, 'data', 'manifest.json'), JSON.stringify(manifest, null, 1) + '\n');
console.log(`Manifest: ${JSON.stringify(manifest.counts)}`);
