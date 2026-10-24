# Handoff: Part 2 cleanup and the maps (2026-10-24)

Where Part 2 (retiring hobobiker.com to static HTML) stands, what went wrong after it, and the next
steps in order. Read `AGENTS.md` first; results so far are in `DISCOVERIES.md` ("Part 2").

**Never write a secret value or any of the personal data into a file, commit, log or message.** Check
things by length, hash or count (see "How the checks were done").

## Where things stand

- **Part 2 works.** `retire/run.sh` restores `hobobiker-prep`, prepares it, crawls it into
  `hobobiker-static/public`, rewrites it, and runs every tier: **11,699 pass, 0 fail** (kit `cf31882`,
  2026-10-23). Pushed: this repo (`b2d483e` plus `retire/`), site-migration-kit `cf31882`.
- **After that, the owner pushed `hobobiker-static` to github.com/rfay/hobobiker-static (public).** GitHub
  flagged the Google Maps key. Looking into it found more:

| Exposure | Where it is public | Status |
|---|---|---|
| **Personal data**: `files/maps/WSLNHandVT.xml` (27 Warm Showers hosts), `NHWarmShowers.xml` (13 hosts), `NEFamily.xml` (10 family/friends): names, addresses, about 75 phone numbers, 3 emails | hobobiker.com itself; rfay/hobobiker-static; `files.tar.gz` in rfay/hobobiker-assets v1.0 and v1.1 | to remove everywhere |
| **Real credentials** in the `variable` table: `smtp_username`, `smtp_password`, `flickr_api_key`, `flickr_api_secret`, `flickr_auth_token`, `tag1quo_token`, `drupal_private_key` | `db.sql.gz` in hobobiker-assets v1.0 and v1.1 (the "sanitized" dump was only `drush sql-sanitize`, which scrubs users, not variables). Not in any git repo, not in the archive (checked) | rotate or delete |
| Visitor IPs and sessions (`accesslog`, `sessions`, `watchdog`) | `db.sql.gz` in hobobiker-assets v1.0 and v1.1 | truncate in the snapshot |
| Google Maps key `AIzaSyBwT3…` (`googlemap_api_key`) | every map page of hobobiker.com for years; 464 archive pages; 435 frozen baseline records in this repo | **dead**, see below |
| A second, Maps v1 key `ABQIAAAA…` | 4 pre-Drupal demo pages in `files/maps/` (`index.html`, `orig-index.html`, `warmshowers.html`, `newenglandcontacts.html`) | dead since Google switched off Maps v1; nothing to do |

## The maps: broken on the original, to be repaired with Leaflet (owner's decision: option C)

Every map on hobobiker.com is broken (owner confirmed on production, 2026-10-24: `/node/4010`,
`/tripinfo_item/2007-03-28/2007-03-21/2007-04-15`). Two independent causes:

- **29 route and blog maps** (`tripinfo_gen_gmap`, `[multisource:]` macros; e.g. node 4010): the KML URL is
  malformed, `https://hobobiker.com/http://www.hobobiker.com/files/regional_kml/ParralToGuanajuato.kmz`. A
  "local debugging" line left active in `sites/all/modules/tripinfo/tripinfo.module` (around line 255,
  `$kmlurl = "https://hobobiker.com/$kmlfile";`) prefixes a URL that is already absolute. 4 of them also
  have a space after the host.
- **434 `tripinfo_item` day maps** (`tripinfo_gmap`, around line 127): the KML URL is built from the
  request host, `<host>/sites/default/files/gps/YYYYMMDD.kml`. On production that URL is fine (the 818 KML
  files exist), so the failure is the key: almost certainly a Google project without billing (required since
  2018). The owner's Google account has no Cloud projects, so the key cannot be found, restricted or revoked;
  with no billing it cannot be abused either. **Close GitHub's secret-scanning alert as "revoked".**
- **In the archive**, the 434 day maps' `Drupal.settings.tripinfo.kmlurl` points at
  `https://hobobiker-prep.ddev.site/...`: a dependency on the prep copy, inside inline JSON
  (`https://hobobiker-prep...`). The static tier does not look inside scripts, so it passed.
  (The "Explore in Google Earth" link next to each map is a normal link and was already made relative.)

**Decision: repair the maps without Google** (option C): [Leaflet](https://leafletjs.com/) with
OpenStreetMap tiles, drawing the KML/KMZ files the archive already contains. No key, no billing, no Google.
It is a repair, so it is a deliberate, declared change.

## Next steps

### A. Owner (production and GitHub; never by an agent)

- [ ] **Production: remove the personal data.**
  ```bash
  ssh rfay@ddevprod.thefays.us
  cd ~/workspace/hobobiker.com/docroot/sites/default/files/maps
  rm -v WSLNHandVT.xml NHWarmShowers.xml NEFamily.xml
  # Open question 1: also the viewers (no personal data in them; Maps v1, shown nothing for years)
  # rm -v warmshowers.html warmshowers.xsl newenglandcontacts.html NEFamily.xsl
  ```
  Check from outside that `/sites/default/files/maps/NEFamily.xml` and `/files/maps/NEFamily.xml` (the
  `files` symlink) answer 404. Check older backups and files tarballs kept elsewhere.
- [ ] **Production: credentials.** Assume they were copied (public since 2026-10-15).

  | Variable(s) | Module | Action |
  |---|---|---|
  | `smtp_password`, `smtp_username` | `smtp` enabled | change the password at the mail provider; if the site sends no mail, `drush -y dis smtp` and `vdel` both |
  | `flickr_api_key`, `flickr_api_secret`, `flickr_auth_token` | `flickr` enabled, 0 `[flickr-photo]` macros left | revoke in Flickr's App Garden; `drush -y dis flickr`; `vdel` all three |
  | `tag1quo_token` | `tag1quo` disabled | revoke in the Tag1 account; `vdel` |
  | `drupal_private_key` | core | `vdel`; Drupal 6 makes a new one |
  | `googlemap_api_key` | `tripinfo` | dead (see above); after option C it is unused: `vdel` |

  Drush on production is `ddev exec drush ...`; finish with `ddev exec drush cc all`. **Tell the next session
  which were deleted and which rotated**, so the local sanitize matches.
- [ ] **GitHub: stop the exposure.**
  ```bash
  gh repo delete rfay/hobobiker-static --yes     # 0 forks; deleting also drops GitHub's cached views
  for v in v1.0 v1.1; do
    gh release delete-asset $v db.sql.gz    -R rfay/hobobiker-assets --yes
    gh release delete-asset $v files.tar.gz -R rfay/hobobiker-assets --yes
  done
  ```
  Later: re-create `rfay/hobobiker-static` from the cleaned archive (fresh history), publish hobobiker-assets
  **v1.2** from the cleaned snapshot (B1), and point `README.md` at v1.2.

### B. Agent, in this order (stop and report after each step, as in Part 2)

1. **A properly sanitized pristine snapshot.** New committed script `migration/sanitize-snapshot.sh`,
   printing counts: `vdel` the credential variables above (plus `googlemap_api_key` once C is in);
   truncate `watchdog`, `accesslog`, `sessions` and the `cache*` tables; remove the 3 XML files (and the
   viewers if production removes them). Rebuild `.tarballs/db.sql.zst`, `db.sql.gz`, `files.tar`,
   `files.tar.gz` in this checkout **and** in `hobobiker-prep/.tarballs/`; update
   `migration/pristine.fingerprint`. Restoring this checkout from the new snapshot is an owner-approved
   snapshot refresh, as on 2026-10-16. The same rules belong in the prep step (owner: `watchdog` and
   `sessions` should always have been truncated in prep).
2. **Declare what the baseline still expects.** The frozen baseline holds only size and hash for the 3 XML
   files (no personal data in this repo; checked). They will answer 404 on every target: declare each, all
   targets, `kind: "assets"`, exact `path`, `equals: "<url> (404)"`, reason "personal data removed from
   production 2026-10-24". Check whether semantic's "every baseline asset resolves" needs a matching entry.
3. **Kit: the static tier reads scripts.** Search each page's whole text, inline scripts included, for
   forbidden hosts, in plain, `\/`-escaped and `/`-escaped forms. It must fail today on the 434 prep
   URLs (that is the negative control). Kit change, commit there, vendor (`AGENTS.md`).
4. **Option C, the Leaflet maps** (prep step(s) in `retire/prep/`; prep is a checkout of this repo, so a
   script may patch prep's code and the restore puts it back):
   - Copy Leaflet (pin an exact version, e.g. 1.9.4) and a KML parser (for example
     `@tmcw/togeojson`, or `leaflet-kml`) into prep's code, served locally: no CDN, or the static tier
     flags a new external URL.
   - Replace the Google `<script>` from `drupal_set_html_head` (both functions in `tripinfo.module`) and
     `tripinfo_filtermap.js` with a Leaflet version: OSM tile layer with attribution
     ([tile usage policy](https://operations.osmfoundation.org/policies/tiles/)), KML layer, fit bounds.
   - Make the KML URL site-relative (`/sites/default/files/gps/YYYYMMDD.kml`) and fix the malformed
     `tripinfo_gen_gmap` URL. `.kmz` files (`files/regional_kml/`, `files/gps/*.kmz`) need unzipping: convert
     them to `.kml` in prep, or add a small unzip library.
   - Each script prints counts (maps patched, URLs fixed, KMZ converted).
   - Verify in a browser (Playwright, like the throwaway probe used on 2026-10-24): tiles load, the KML layer
     has features, on one day page and one route page. Then declare what the tiers report (likely layout on
     map pages; the Google script disappearing is allowed by the static tier).
   - With the maps no longer using it, the key leaves the archive entirely; `vdel googlemap_api_key` in B1.
5. **A secrets gate in the pipeline.** New stage after the rewrite (e.g. `retire/37-scan-secrets.sh`): fail
   if any of prep's sensitive `variable` values, any `AIza…`/`ABQIAAAA…` key, or any phone/email from the
   removed files appears in `hobobiker-static/public`. Print counts only.
6. **Delete local copies that still hold the old data:** `~/workspace/hobo/static-control-run-2026-10-23`,
   `hobobiker-prep/.tarballs/rehearsal*`, the old tarballs replaced in B1, and `hobobiker-static/.git`
   (re-initialise with clean history before the owner pushes).
7. **Re-run `retire/run.sh`**, then record everything in `DISCOVERIES.md`: the exposures, the dead key, why
   each map was broken, the Leaflet repair and its declarations, the new kit checks.

## Open questions for the owner

1. Remove the 4 viewer files (`warmshowers.html`, `warmshowers.xsl`, `newenglandcontacts.html`,
   `NEFamily.xsl`) too, or only the 3 XML files? Local follows production.
2. Which credentials were deleted on production, and which rotated?
3. Repair the 29 route/blog maps along with the 434 day maps (assumed yes with option C)?

## How the checks were done (2026-10-24)

- **Personal data:** the phone numbers (last 7 digits) and emails from the 3 XML files used as search
  needles over the files directory, the archive, the database dump and every tracked file; only file names
  and counts printed. Found only in those 3 files (and their copies in the archive and tarballs).
- **Credentials:** each variable's value pulled from the dump inside a script and searched for in the
  tracked files and the archive; printed as length, placeholder-or-not, and an 8-character hash. The
  published v1.0 and v1.1 dumps have the same values as `.tarballs/db.sql.zst`.
- **The key:** a Playwright page load of a route map on the local copy: Google served the script without
  error, but no map ever asked for tiles (the KML never loads), so the key is never checked locally.

Those throwaway scripts lived in the session scratchpad and are gone; B5 makes the check permanent.

## Notes

- The workspace restarted on 2026-10-24; start all three projects before running anything
  (`retire/run.sh` names any that is stopped).
- The tripwire hook (`.claude/hooks/deny-production.sh`) matches shell commands that put a fetch tool
  (curl, wget) and the production domain on one line, even inside a heredoc. Write such text with the
  Edit/Write tools; never request production.
