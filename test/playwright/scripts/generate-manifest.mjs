#!/usr/bin/env node
// Generates data/manifest.json: every node (published or not) with its paths and hazard tags, and
// every row of the Drupal 6 `files` table. The suite's content list is built from it.
//
//   node test/playwright/scripts/generate-manifest.mjs     (from anywhere; uses `ddev mysql`)
//
// Run on demand, never at test time. The manifest is a frozen snapshot of "what content exists",
// committed alongside the baseline it drives.
//
// Drupal 6 schema: node.vid joins node_revisions.vid (current revision); url_alias is src/dst;
// files.filepath is relative to the docroot.

import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../..');
const OUTPUT = path.resolve(__dirname, '../data/manifest.json');

// `ddev mysql -e` with tab-separated output, parsed into objects. Bodies are never selected as text
// (they contain tabs and newlines); everything derived from a body is computed in SQL.
function query(sql) {
  const raw = execFileSync('ddev', ['mysql', '-e', sql], { cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 1 << 28 }).trimEnd();
  if (!raw) return [];
  const [head, ...rows] = raw.split('\n');
  const headers = head.split('\t');
  return rows.map((line) => Object.fromEntries(line.split('\t').map((c, i) => [headers[i], c === 'NULL' ? null : c])));
}

// Hazards: render-time behaviour or stored-but-invisible content that a migration can lose. Each
// becomes a test tag (@php, @hobophoto, ...) so a subset can be run, and so a reviewer can see at a
// glance which pages carry which risk. Evidence for each is in DISCOVERIES.md.
const nodeRows = query(`
  SELECT n.nid, n.type, n.status, r.title, r.format,
         n.created, n.changed,
         (r.format IN (2, 9)) AS php,
         (r.body LIKE '%tripinfo_table(%') AS tripinfo,
         (r.body LIKE '%[hobophoto:%') AS hobophoto,
         (r.body LIKE '%[multisource:%') AS multisource,
         (r.body LIKE '%<object%' OR r.body LIKE '%<embed%') AS flash,
         (r.body LIKE '%<script%') AS script,
         (r.body LIKE '%<iframe%') AS iframe,
         (TRIM(r.body) = '') AS empty_body,
         (SELECT COUNT(*) FROM comments c WHERE c.nid = n.nid) AS comments
  FROM node n JOIN node_revisions r ON n.vid = r.vid
  ORDER BY n.nid`);
console.log(`${nodeRows.length} nodes.`);

const aliasRows = query(`SELECT src, dst FROM url_alias WHERE src LIKE 'node/%' ORDER BY pid`);
const aliasesByNid = new Map();
for (const { src, dst } of aliasRows) {
  const nid = src.replace(/^node\//, '');
  if (!/^\d+$/.test(nid)) continue; // node/N/feed and similar are not the node page
  if (!aliasesByNid.has(nid)) aliasesByNid.set(nid, []);
  aliasesByNid.get(nid).push(dst);
}
console.log(`${aliasRows.length} node aliases covering ${aliasesByNid.size} nodes.`);

// Content types whose module is disabled or gone: their nodes render a title and nothing else.
const STORED_ONLY_TYPES = new Set(['acidfree', 'image']);

const flag = (v) => v === '1';
const firstOfType = new Set();
const nodes = nodeRows.map((n) => {
  const published = n.status === '1';
  const tags = [];
  if (published && !firstOfType.has(n.type)) {
    firstOfType.add(n.type);
    tags.push('smoke');
  }
  for (const t of ['php', 'tripinfo', 'hobophoto', 'multisource', 'flash', 'script', 'iframe']) if (flag(n[t])) tags.push(t);
  if (flag(n.empty_body)) tags.push('empty-body');
  if (STORED_ONLY_TYPES.has(n.type)) tags.push('module-gone');
  if (Number(n.comments) > 0) tags.push('has-comments');
  const canonical = `node/${n.nid}`;
  return {
    nid: n.nid,
    type: n.type,
    title: n.title,
    published,
    format: n.format,
    created: Number(n.created),
    // Both node/N and every alias must keep working after migration.
    aliases: [...new Set([canonical, ...(aliasesByNid.get(n.nid) ?? [])])],
    comments: Number(n.comments),
    tags,
  };
});

const files = query(`SELECT fid, filename, filepath, filemime, filesize FROM files ORDER BY fid`).map((f) => ({
  fid: f.fid,
  filename: f.filename,
  // filepath is docroot-relative (sites/default/files/...). Spaces are percent-encoded in the URL.
  url: '/' + f.filepath.split('/').map(encodeURIComponent).join('/'),
  mime: f.filemime,
}));

writeFileSync(OUTPUT, JSON.stringify({ generatedAt: new Date().toISOString(), nodes, files }, null, 2) + '\n');

const count = (pred) => nodes.filter(pred).length;
const published = count((n) => n.published);
const tagCounts = {};
for (const n of nodes) if (n.published) for (const t of n.tags) tagCounts[t] = (tagCounts[t] ?? 0) + 1;
console.log(`Wrote ${OUTPUT}`);
console.log(`  ${nodes.length} nodes (${published} published, ${nodes.length - published} unpublished), ${files.length} files rows.`);
console.log(`  ${nodes.filter((n) => n.published).reduce((s, n) => s + n.aliases.length, 0)} published paths (node/N plus aliases).`);
console.log(`  Tags on published nodes: ${JSON.stringify(tagCounts)}`);
