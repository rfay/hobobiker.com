
#!/bin/bash

echo "Testing Flickr Migration Process"
echo "================================"

# First, run a dry run to see what would be processed
echo "Step 1: Dry run with first 5 nodes"
ddev exec php migrate_flickr_photos.php --dry-run --limit=5

echo ""
echo "Step 2: Test actual migration on just 2 nodes"
echo "Creating backup of current database..."
ddev export-db --file=backup_before_migration.sql.gz

echo "Running limited migration..."
ddev exec php migrate_flickr_photos.php --limit=2

echo ""
echo "Step 3: Verify the changes"
echo "Checking updated content in database..."
ddev mysql -e "SELECT nid, title, SUBSTRING(body, 1, 200) as body_preview FROM node_revisions WHERE body LIKE '%hobophoto%' LIMIT 5;"

echo ""
echo "Checking downloaded files..."
ls -la docroot/sites/default/files/*.jpg 2>/dev/null | head -5

echo ""
echo "Test complete. Review results and run full migration if satisfied:"
echo "  ddev exec php migrate_flickr_photos.php"
echo ""
echo "To restore from backup if needed:"
echo "  ddev import-db --file=backup_before_migration.sql.gz"