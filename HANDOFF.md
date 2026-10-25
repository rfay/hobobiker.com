# Handoff: Part 2 cleanup before the re-crawl (updated 2026-10-25)

Where Part 2 (retiring hobobiker.com to static HTML) stands after the exposure found on 2026-10-24, what
has been fixed on production since, and the steps left before `retire/run.sh` runs again. Read `AGENTS.md`
first; earlier results are in `DISCOVERIES.md` ("Part 2").

**Never write a secret value or any of the personal data into a file, commit, log or message.** Check
things by length, hash or count (see "How the checks were done").

## Where things stand

- **Part 2 worked** before the exposure: 11,699 pass, 0 fail (kit `cf31882`, 2026-10-23). The archive it
  produced is no longer acceptable: it holds the personal data, the dead Google key, and 434 references
  to `hobobiker-prep.ddev.site` inside inline JSON. It has to be produced again.
- **Production has changed on purpose** (2026-10-24 and 25). That makes production, not the old pristine
  snapshot, the reference for the next run:
  - The personal data is gone: `files/maps/` no longer has `WSLNHandVT.xml`, `NHWarmShowers.xml`,
    `NEFamily.xml`, nor the viewers `warmshowers.html`, `warmshowers.xsl`, `newenglandcontacts.html`,
    `NEFamily.xsl` (confirmed in a `ddev pull` on 2026-10-25).
  - Credentials deleted: `smtp_username`, `smtp_password`, `tag1quo_token`, `drupal_private_key`.
  - **The maps are repaired** (commit `72fcbc2`, deployed): Leaflet 1.9.4 with OpenStreetMap tiles,
    togeojson and JSZip, all served from `sites/all/modules/tripinfo/lib/`. No Google script, no key.
    `googlemap_api_key` deleted with `vdel`. Details below.

### The exposure (for the record)

| Exposure | Where it was public | Status |
|---|---|---|
| Personal data in 3 XML files in `files/maps/` (Warm Showers hosts, family and friends: names, addresses, about 75 phone numbers, 3 emails) | hobobiker.com; rfay/hobobiker-static; `files.tar.gz` in rfay/hobobiker-assets v1.0 and v1.1 | removed from production; GitHub: see A |
| Credentials in the `variable` table | `db.sql.gz` in hobobiker-assets v1.0 and v1.1 (`drush sql-sanitize` scrubs users, not variables) | all deleted on production (Flickr app deleted too, 2026-10-25) |
| **AWS access key and secret** (`AKIA…`) in `backup_migrate_destinations.location` (`s3://KEY:SECRET@s3.amazonaws.com/rfay-backups-ddevprod.thefays.us/hobobiker.com`), used by an enabled 28-day Backup and Migrate schedule. Found 2026-10-25; the 2026-10-24 check only looked at `variable` | `db.sql.gz` in hobobiker-assets v1.0 and v1.1 (same hash as `.tarballs/db.sql.zst`); every local dump in `.tarballs/` | rotated 2026-10-25 (A) |
| Visitor IPs and sessions (`accesslog`, `sessions`, `watchdog`) | `db.sql.gz` in hobobiker-assets v1.0 and v1.1 | truncate in the snapshot (B1) |
| Google Maps key `AIzaSyBwT3…` | every map page for years; the archive; 435 frozen baseline records in this repo | dead (Google project without billing); no longer used anywhere on production |
| Maps v1 key `ABQIAAAA…` | `files/maps/index.html`, `orig-index.html` (pre-Drupal demos) | dead since Google switched off Maps v1; the whole `files/maps/` directory deleted on production (2026-10-25) |

### The maps: what was wrong, and the repair

- **434 day maps** (`tripinfo_item/DAY/TRIPSTART/TRIPEND`; the URL shape is intentional, the trip dates
  drive the previous/next links): the KML URL was fine, the Google key was dead.
- **13 `[multisource:]` route maps** (input format 9, e.g. node 4010): a "local debugging" line prefixed an
  absolute URL with `https://hobobiker.com/`, so the KML never loaded. Node 4129's macro is inside an HTML
  comment; that page shows a Google My Maps iframe and has no Leaflet map.
- **The repair:** `tripinfo_map_div()` writes each map as a `div.tripinfo-map` with its own site-relative
  `data-kml` URL (`/sites/default/files/gps/YYYYMMDD.kml`, `/files/regional_kml/X.kmz`). The cache-busting
  query is dropped. `tripinfo_filtermap.js` fetches the file, unzips a KMZ, and draws it with the KML's line
  colors. The "Explore in Google Earth" links are site-relative too. There is no `Drupal.settings.tripinfo`
  any more, so the prep host can no longer leak into inline JSON.
- Checked locally in Chrome (Playwright, `channel: 'chrome'`): tiles load and routes draw, with no
  console errors, on a day page and on nodes 4010, 4223 and 4003 (19 lines, 4 markers).

## Next steps

### A. Owner (production and GitHub; never by an agent)

- [x] **Flickr credentials:** app deleted on flickr.com, variables deleted on production (2026-10-25).
- [x] **GitHub:** rfay/hobobiker-static and rfay/hobobiker-assets deleted (2026-10-25). (The Maps key alert
      went with the repository.)
- [x] Leftover variables (`tag1quo_*`, `smtp_*`, `flickr_*`) deleted on production (2026-10-25).
- [x] **AWS key in Backup and Migrate rotated** (2026-10-25) with the `aws` CLI: new access key on the
      destination (key ID differs from the exposed one, compared by hash), two backups written to the
      bucket with it. CloudTrail not checked (owner's decision). Whatever production does, the snapshot
      never carries the key (B1).
- [ ] Delete the old, now inactive, access key in IAM (`aws iam delete-access-key`) if not done yet.
- [x] **Google Analytics disabled and uninstalled on production** (2026-10-25). Also done in this macOS
      checkout: 0 analytics references on 5 sample pages. The module was the only source; no theme, block or
      node has a hardcoded snippet.
- [ ] Check older backups and files tarballs kept elsewhere for the 3 XML files.
- [ ] **Decide on the baseline** (open question 1) before B2.
- [ ] **Refresh the Coder workspace** once A's production changes are done: `git pull` in `hobobiker-copy`
      and `hobobiker-prep`; `ddev pull` production into `hobobiker-copy`. That pull is the source of the new
      pristine snapshot (B1). **The pull's files step is `rsync -avz` without `--delete`**: it never removes
      files that production removed, so `files/maps/` (deleted on production) stays in `hobobiker-copy` after a pull.
      Delete them there (or pull into an emptied files directory); B1's gate fails if they are present.
- [ ] Later: re-create `rfay/hobobiker-static` from the new archive (fresh history), publish hobobiker-assets
      **v1.2** from the sanitized snapshot, point `README.md` at v1.2.

### B. Agent, in this order (stop and report after each step, as in Part 2)

1. **A sanitized pristine snapshot from the fresh pull: `migration/sanitize-snapshot.sh`** (written and
   tested on macOS, 2026-10-25). It copies the live database into a separate `sanitize` database (the
   live one is never changed), and there:
   - deletes the credential variables, empties `backup_migrate_destinations` (the S3 key lives in its
     URL) and disables the schedules;
   - sets every user's password to "password" and email to `user+UID@localhost` (as `sql-sanitize` does);
   - blanks commenters' emails and IPs (423 emails, 447 IPs) and `poll_votes` IPs;
   - truncates `watchdog`, `accesslog`, `sessions`, `flood`, `batch`, `captcha_sessions`, `cache*`.

   Then a **gate that does not trust that list**: AWS, Google and Maps v1 keys, private keys, and
   passwords inside URLs, searched in every table (the dump's text) and every file; credential-named
   variables must be empty; the 7 removed `files/maps/` files and any `*.sql*`/`*.mysql*` must be absent;
   optional `--needles FILE` (one string per line) for the phone numbers and emails. Any failure (or a
   grep error) writes nothing. Only names and counts are printed.

   Tested: negative controls (planted keys and a needle) all fail it; on a raw dump its patterns find the
   AWS key and the Maps key, on the sanitized one nothing; the write step produces the 4 tarballs with
   no macOS `._` entries. Production deleted all of `files/maps/` on 2026-10-25, but `ddev pull` never
   deletes local files, so every copy still has it (the gate fails on `maps/index.html` and
   `orig-index.html`, the dead Maps v1 key) until `files/maps/` is deleted by hand.

   On Coder: before deleting `files/maps/` in `hobobiker-copy`, build a needles file from the 3 XML files (phone numbers'
   last 7 digits, emails) **outside every repo**, and pass `--needles`. Run it in `hobobiker-copy`, copy
   the 4 tarballs to `hobobiker-prep/.tarballs/`, restore both (`restore-pristine.sh`, from each checkout),
   then `migration/fingerprint.sh > migration/pristine.fingerprint`. The prep step should truncate
   `watchdog` and `sessions` too (owner: they always should have been). Publishing a hobobiker-assets v1.2
   uses these tarballs and nothing else.
2. **The baseline, per the owner's decision** (open question 1):
   - *Re-freeze* (recommended): export a new baseline from the refreshed `hobobiker-copy`. It then
     describes the site as it now is: Leaflet maps, no personal-data files, no Google key in 435 records.
     The old one stays in git history. Record the re-freeze and its reason in `DISCOVERIES.md`.
   - *Keep the frozen baseline*: declare in `expected-differences.json` every `files/maps/` path in the
     baseline (404 on every target, exact paths, reason "personal data and dead demos removed from
     production, 2026-10-24 and 25"), and the map change on
     447 pages (Google script gone, new `lib/` assets, `data-kml` markup, layout on map pages). Check whether
     semantic's "every baseline asset resolves" needs matching entries.
3. **Kit: the static tier reads scripts.** Search each page's whole text, inline scripts included, for
   forbidden hosts, in plain, `\/`-escaped and `/`-escaped forms. The 434 prep URLs that would have been the
   negative control no longer exist, so the control is a planted page in a test fixture. Kit change, commit
   there, vendor (`AGENTS.md`).
4. **Google Analytics is off on production**, so `retire/prep/20-disable-google-analytics.sh` changes
   nothing now (its line will say `0 -> 0`, not `1 -> 0`). Keep it as a guard with the expectation
   updated, or remove it; its `expected-differences.json` entry goes away with a re-frozen baseline.
5. **The maps in the archive.** No prep patch is needed any more. After a crawl, check that the archive
   has: the `lib/` files (from `<script>`/`<link>` and `url()` in `leaflet.css`); `marker-icon-2x.png`
   and `marker-shadow.png`, which Leaflet builds paths for in JavaScript, so wget may miss them
   (seed them as assets if so); every file a `data-kml` names (the day `.kml` files under `gps/` and
   the `.kmz` route files; until now only the "Explore in Google Earth" link brought them in). Then open one day page and node
   4010 from `hobobiker-static` in a browser: tiles load, the KML layer has features.
6. **A secrets gate in the pipeline.** New stage after the rewrite (e.g. `retire/37-scan-secrets.sh`): fail
   if any of the copy's sensitive `variable` values, any `AIza…`/`ABQIAAAA…`/`AKIA…` key, or any phone/email from
   the removed files appears in `hobobiker-static/public`. Print counts only. The needles must come from a
   source that is not itself published (the old snapshot, kept only locally until this gate exists).
7. **Delete local copies that still hold the old data:**
   - Coder workspace: `~/workspace/hobo/static-control-run-2026-10-23`, `hobobiker-prep/.tarballs/rehearsal*`,
     the tarballs replaced in B1, `hobobiker-static/.git` (re-initialise before the owner pushes).
   - In every Coder project (`hobobiker-copy`, `hobobiker-prep`): everything in `.tarballs/` older than
     B1's snapshot and everything in `.ddev/db_snapshots/`. They hold the credentials, the AWS key and the
     personal data. List them first; the owner confirms.
   - Done on this macOS checkout (owner, 2026-10-25): `.tarballs/` and `.ddev/db_snapshots/` emptied.
8. **Re-run `retire/run.sh`**, then record everything in `DISCOVERIES.md`: the exposures, the dead key, why
   each map was broken, the Leaflet repair, the baseline decision, the new kit checks.

## Open questions for the owner

1. Re-freeze the baseline from the refreshed copy, or keep it and declare the differences (B2)?

## How the checks were done (2026-10-24 and 25)

- **Personal data:** the phone numbers (last 7 digits) and emails from the 3 XML files used as search
  needles over the files directory, the archive, the database dump and every tracked file; only file names
  and counts printed. Found only in those 3 files (and their copies in the archive and tarballs). The
  2026-10-25 pull was checked by listing `files/maps/`.
- **Credentials:** each variable's value pulled from the dump inside a script and searched for in the
  tracked files and the archive; printed as length, placeholder-or-not, and an 8-character hash. The
  2026-10-25 pull was checked by variable name and value length, plus a regex over all values for long
  token-like strings (names printed only), plus every non-cache column named like
  `pass|secret|token|key|location|auth`. That found the AWS key in `backup_migrate_destinations`; it was
  compared with the snapshot by 8-character hash only.
- **The maps:** Playwright with the installed Chrome (`channel: 'chrome'`, no browser download) against the
  local site: counted OSM tile responses, `path.leaflet-interactive` and markers per map, console errors.

## Notes

- This macOS checkout (DDEV project `hobobiker.com`, `https://hobobiker.com.ddev.site`) is the original
  only, used for the map repair. The Part 2 projects live in the Coder workspace (`~/workspace/hobo/`).
- Start all projects before running anything there (`retire/run.sh` names any that is stopped).
- The tripwire hook (`.claude/hooks/deny-production.sh`) matches shell commands that put a fetch tool
  (curl, wget) and the production domain on one line, even inside a heredoc. Write such text with the
  Edit/Write tools; never request production.
