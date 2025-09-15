# Flickr to Local Photo Migration

## Prerequisites

Before running the migration, ensure the hobobiker_filter is properly configured:

1. **Enable hobobiker_filter in Input Formats**
   - Navigate to: `admin/settings/filters` (Admin → Site configuration → Input formats)
   - For each input format that will display migrated content (especially "Flickr with full html and linebreaker"):
     - Edit the input format
     - Enable the "hobobiker_filter" module
     - Save the configuration

2. **Verify Input Format Usage**
   - Check which input format your nodes use: `ddev mysql -e "SELECT nid, format FROM node_revisions WHERE nid IN (1152, 1179);"`
   - Ensure those formats have hobobiker_filter enabled
   - The migration converts `[flickr-photo:...]` to `[hobophoto:...]` tags, which require hobobiker_filter to render properly

3. **Test hobobiker_filter Functionality**
   - Create a test node with: `[hobophoto:path=sites/default/files/test.jpg,orientation=landscape,caption=Test Image]`
   - Verify it renders correctly before running full migration

## Original Problem Statement

This is hobobiker.com, a very old Drupal 6 website about a bike tour. It's mostly driven by a database.

One of the key problems with it is that it used to use the flickr_filter submodule of the flickr module, https://www.drupal.org/docs/extending-drupal/contributed-modules/contributed-modules/contributed-modules-documentation/flickr-module-documentation/flickr-filter

The flickr_filter module was used a number of places to inject code to show a nice version of a flickr.com picture. But in the years since, flickr became a paid site, and this old site shouldn't be dependent on something external.

I wrote a replacement for flickr_filter called hobobiker_filter. Its comment says "An input filter to insert images like [hobophoto:path=sites/default/files/somepic.jpg,orientation=portrait,caption=some caption]"

So we seem to have blog content (in database) scattered around that uses the format `[flickr-photo:id=3496907285,size=m]` pointing to the flickr photo of that id, apparently https://www.flickr.com/photos/hobobiker/3496907285/

So I guess the challenge here is to develop a technique to:
* Download the photo needed from flickr (they're public, it's easy)
* Put the photo in docroot/sites/default/files as <flickrid>.jpg
* Update the node content in the database to use the hobobiker_filter module instead of flickr_photo

We can experiment with this on a local database copy, and do it on a few nodes before applying everywhere. 
There is no code to change, but we have to detect the needed flickr photos and download them (can be done in a single step perhaps) and then we have to update the database via sql commands.

## Solution Implemented

### Analysis Results
- **276 nodes** contain `[flickr-photo:id=XXXXXXX,size=m]` tags in the database
- Content is stored in `node_revisions.body` field (Drupal 6)
- Target format: `[hobophoto:path=sites/default/files/somepic.jpg,orientation=landscape,caption=some caption]`
- Photos are publicly accessible on Flickr at: `https://www.flickr.com/photos/hobobiker/{id}/`

### Key Features Developed

1. **Original Quality Downloads**: Downloads original size images from Flickr's `/sizes/o/` page instead of medium size
2. **Descriptive Filenames**: Creates meaningful filenames using Flickr photo titles
3. **Smart Title Cleaning**: 
   - Removes common camera prefixes (DSC, IMG, etc.)
   - Sanitizes special characters for filesystem compatibility
   - Limits length while preserving word boundaries
4. **Database Migration**: Updates node content from flickr_filter to hobobiker_filter format
5. **Safety Features**: Dry-run mode, database backups, progress tracking

### Files Created

#### Core Migration Scripts
- **`docroot/flickr_migration.php`** - Main migration script for `[flickr-photo:...]` tags
  - Downloads original quality images with descriptive filenames
  - Updates database content to use hobobiker_filter format
  - Includes error handling and progress reporting
  - Supports `--dry-run` and `--limit=N` options

- **`docroot/migrate_flickr_images.php`** - Direct image migration script for `<img src="static.flickr.com">` links
  - Downloads images from direct Flickr URLs in HTML content
  - Removes Flickr wrapper links and updates img src attributes to local files
  - Uses Drupal node_save() for proper cache clearing
  - Supports `--dry-run`, `--limit=N`, and `--exclude-content-types=type1,type2` options
  - Provides post-processing node list for manual cache clearing if needed

#### Test and Support Files
- **`test_migration.sh`** - Safe testing workflow script
  - Creates database backup before migration
  - Runs limited test migration (2 nodes)
  - Includes verification steps and rollback instructions
- **`docroot/simple_migration_test.php`** - Basic database connectivity test
- **`docroot/test_single_photo.php`** - Single photo download test

### Example Transformations

#### Database Content
**Before:**
```
[flickr-photo:id=2454026865,size=m]
```

**After:**
```
[hobophoto:path=sites/default/files/2454026865_STOP_military_checkpoint.jpg,orientation=landscape,caption=]
```

#### Downloaded Files
**Examples of descriptive filenames created:**
- `489196796_Randys_bike_and_gear.jpg` (from "Randy's bike and gear")
- `2207548009_Coffee_farmer_raking_the_drying_beans.jpg` (DSC02312 prefix removed)
- `2332140696_View_of_the_Miraflores_locks_on_the_Panama_Canal_at_Panama_City.jpg`
- `2190957816_100_3192_Scot_riding_around_Lake_Amatitlan_with_his_Bike_Friday_Pocket_Llama.jpg`

### Usage Instructions

#### Safe Testing Process
```bash
# Run the complete test workflow
./test_migration.sh

# Manual testing steps
ddev exec php flickr_migration.php --dry-run --limit=5  # Preview changes
ddev export-db --file=backup_before_migration.sql.gz   # Create backup
ddev exec php flickr_migration.php --limit=2           # Test on 2 nodes
```

#### Full Migration Process

**Step 1: Filter Tag Migration**
```bash
# Create backup
ddev export-db --file=backup_full_migration.sql.gz

# Run complete migration (all 276 nodes with [flickr-photo:...] tags)
ddev exec php flickr_migration.php

# Restore if needed
ddev import-db --file=backup_full_migration.sql.gz
```

**Step 2: Direct Image Migration**
```bash
# Test direct image migration
ddev exec php migrate_flickr_images.php --dry-run --limit=5

# Run limited test
ddev exec php migrate_flickr_images.php --limit=2

# Run full direct image migration (for <img src="static.flickr.com"> links)
ddev exec php migrate_flickr_images.php

# Exclude specific content types if needed (e.g., audio/podcast nodes)
ddev exec php migrate_flickr_images.php --exclude-content-types=audio
```

**Step 3: Post-Processing (if needed)**

If images don't display correctly after migration, the script provides edit URLs for manual cache clearing:
```bash
# The migration script outputs something like:
# Node URLs to manually edit/save if images don't display:
#   https://hobobiker.ddev.site/node/223/edit - Made it to Manchester
#   https://hobobiker.ddev.site/node/330/edit - Biking from Quebec, Canada to Vermont, USA

# For each URL, simply:
# 1. Open the edit URL in your browser
# 2. Click "Save" without making changes
# 3. This triggers Drupal's cache clearing for that node
```

**Step 4: Verify Complete Migration**
```bash
# Check for any remaining Flickr references
ddev mysql -e "SELECT COUNT(*) as remaining_flickr_tags FROM node_revisions WHERE body LIKE '%flickr-photo%' OR body LIKE '%static.flickr.com%';"

# Should return 0 when migration is complete
```

### Technical Implementation Details

#### Photo Download Process
1. Extract Flickr photo IDs from `node_revisions.body` using regex
2. Fetch photo page from `https://www.flickr.com/photos/hobobiker/{id}/` to get title
3. Access sizes page at `https://www.flickr.com/photos/hobobiker/{id}/sizes/o/` for original image
4. Extract direct image URL (ends with `_o.jpg`)
5. Download and save with descriptive filename
6. Include fallback to main photo page if original size unavailable

#### Database Update Process
1. Parse existing `[flickr-photo:id=X,size=Y]` tags
2. Map to downloaded filenames (descriptive or fallback)
3. Generate new `[hobophoto:path=sites/default/files/filename.jpg,orientation=landscape,caption=]` tags
4. Update `node_revisions.body` content using prepared statements

#### Filename Generation Algorithm
```php
// Start with Flickr ID
$filename = $flickr_id;

// Clean title: remove camera prefixes, sanitize characters, limit length
$clean_title = preg_replace('/^(DSC|IMG|P|DSCN|_MG_)\d+\s*[-_]?\s*/', '', $title);
$clean_title = preg_replace('/[^a-zA-Z0-9\s\-_.,!()]/', '', $clean_title);
$clean_title = preg_replace('/[\s\-.,!()]+/', '_', $clean_title);

// Combine: flickrid_descriptive_title.jpg
return $filename . '_' . $clean_title . '.jpg';
```

### Migration Results

#### Test Migrations Completed
- Successfully tested on multiple small batches (2-10 nodes)
- Downloaded original quality images (1-2.5MB vs 200-300KB medium size)
- Created descriptive filenames for better file management
- Updated database content to use hobobiker_filter format
- Verified images display correctly on website

#### Current Status
- **Ready for full migration** of all 276 nodes
- All safety measures and testing procedures validated
- Backup and rollback procedures established
- Expected full migration time: ~6-8 minutes (1 second delay between downloads)

### Benefits Achieved

1. **Independence from External Services**: No longer dependent on Flickr's availability or API changes
2. **Improved Performance**: Local images load faster than external Flickr embeds
3. **Better File Management**: Descriptive filenames make photo archive more useful
4. **Higher Quality**: Original resolution images instead of medium size
5. **Future-Proof**: Local files won't break if Flickr changes policies or goes offline
6. **SEO Benefits**: Local images with descriptive filenames improve search indexing

### Dependencies and Requirements

- PHP with file_get_contents() and curl support for external requests
- MySQL/MariaDB database access via PDO
- Sufficient disk space for ~380 original quality photos (estimated 500MB-1GB)
- ddev development environment for safe testing
- Internet access to download from Flickr

### Error Handling

- Graceful handling of deleted or private Flickr photos
- Fallback to available image sizes if original unavailable
- Detailed logging of download failures with debug information
- Database transaction safety with prepared statements
- Rate limiting (1 second delay) to be respectful to Flickr servers

This migration successfully transforms the hobobiker.com site from external Flickr dependency to a fully self-contained photo archive while improving file organization and image quality.