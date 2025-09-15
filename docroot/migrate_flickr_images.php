<?php
/**
 * Direct Flickr Image Migration Script
 * Migrates <img src="static.flickr.com"> links to local copies
 * Usage: php migrate_flickr_images.php [--dry-run] [--limit=N] [--exclude-content-types=type1,type2]
 */

// Parse command line arguments
$dry_run = in_array('--dry-run', $argv);
$limit = null;
$exclude_types = array();
foreach ($argv as $arg) {
    if (strpos($arg, '--limit=') === 0) {
        $limit = (int)substr($arg, 8);
    }
    if (strpos($arg, '--exclude-content-types=') === 0) {
        $types_string = substr($arg, 24);
        $exclude_types = array_map('trim', explode(',', $types_string));
    }
}

echo "Direct Flickr Image Migration Script\n";
echo "====================================\n";
if ($dry_run) echo "DRY RUN MODE - No changes will be made\n\n";

// Bootstrap Drupal
define('DRUPAL_ROOT', getcwd());
require_once DRUPAL_ROOT . '/includes/bootstrap.inc';
drupal_bootstrap(DRUPAL_BOOTSTRAP_FULL);

// Database connection
try {
    $pdo = new PDO("mysql:host=db;dbname=db", 'db', 'db');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die("Database connection failed: " . $e->getMessage() . "\n");
}

/**
 * Extract Flickr image URLs from the database (latest revisions only)
 */
function get_flickr_images($pdo, $limit = null, $exclude_types = array()) {
    $sql = "SELECT nr.nid, nr.vid, nr.title, nr.body, nr.teaser FROM node_revisions nr JOIN node n ON nr.nid = n.nid AND nr.vid = n.vid WHERE (nr.body LIKE '%static.flickr.com%' OR nr.teaser LIKE '%static.flickr.com%')";
    
    // Add content type exclusions
    if (!empty($exclude_types)) {
        $placeholders = str_repeat('?,', count($exclude_types) - 1) . '?';
        $sql .= " AND n.type NOT IN ($placeholders)";
    }
    
    if ($limit) {
        $sql .= " LIMIT $limit";
    }
    
    if (!empty($exclude_types)) {
        $stmt = $pdo->prepare($sql);
        $stmt->execute($exclude_types);
    } else {
        $stmt = $pdo->query($sql);
    }
    
    $flickr_images = array();
    
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        // Extract Flickr image URLs from both body and teaser fields
        $content_to_search = $row['body'] . ' ' . $row['teaser'];
        
        // Match Flickr image URLs
        preg_match_all('/https?:\/\/static\.flickr\.com\/[^"\'>\s]+\.jpg/i', $content_to_search, $matches);
        
        foreach ($matches[0] as $image_url) {
            if (!isset($flickr_images[$image_url])) {
                $flickr_images[$image_url] = array();
            }
            $flickr_images[$image_url][] = array(
                'nid' => $row['nid'],
                'vid' => $row['vid'],
                'title' => $row['title']
            );
        }
    }
    
    return $flickr_images;
}

/**
 * Download image from Flickr URL
 */
function download_flickr_image($image_url, $target_path) {
    echo "Downloading: $image_url\n";
    
    $context = stream_context_create([
        'http' => [
            'user_agent' => 'Mozilla/5.0 (compatible; HobobikerMigration/1.0)'
        ]
    ]);
    
    $image_data = file_get_contents($image_url, false, $context);
    if ($image_data) {
        // Ensure target directory exists
        $dir = dirname($target_path);
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
        
        if (file_put_contents($target_path, $image_data)) {
            echo "  ✓ Downloaded: $target_path (" . number_format(strlen($image_data)) . " bytes)\n";
            return true;
        } else {
            echo "  ✗ Failed to write file: $target_path\n";
        }
    } else {
        echo "  ✗ Failed to download from: $image_url\n";
    }
    
    return false;
}

/**
 * Update node content to use local images and remove Flickr links
 */
function update_node_content($pdo, $nid, $vid, $old_body, $old_teaser, $flickr_images, $dry_run = false) {
    $new_body = $old_body;
    $new_teaser = $old_teaser;
    $changes_made = false;
    
    foreach ($flickr_images as $image_url => $usages) {
        // Extract filename from URL
        $filename = basename($image_url);
        $local_path = "sites/default/files/$filename";
        
        // Check if this node uses this image
        $node_uses_image = false;
        foreach ($usages as $usage) {
            if ($usage['nid'] == $nid && $usage['vid'] == $vid) {
                $node_uses_image = true;
                break;
            }
        }
        
        if ($node_uses_image) {
            // Pattern 1: Remove wrapper links and update img src
            // <a href="http://www.flickr.com/photos/..."><img src="https://static.flickr.com/..."></a>
            $pattern1 = '/<a[^>]*href=["\']https?:\/\/(?:www\.)?flickr\.com\/photos\/[^"\']*["\'][^>]*>\s*<img[^>]*src=["\']' . preg_quote($image_url, '/') . '["\'][^>]*>\s*<\/a>/i';
            
            if (preg_match($pattern1, $new_body, $matches)) {
                // Extract img attributes but update src
                if (preg_match('/<img([^>]*)>/i', $matches[0], $img_matches)) {
                    $img_attributes = $img_matches[1];
                    // Replace src attribute
                    $img_attributes = preg_replace('/src=["\'][^"\']*["\']/', 'src="' . $local_path . '"', $img_attributes);
                    $new_img_tag = '<img' . $img_attributes . '>';
                    
                    $new_body = str_replace($matches[0], $new_img_tag, $new_body);
                    $changes_made = true;
                    echo "    Removed Flickr link wrapper and updated img src for: $filename\n";
                }
            }
            
            // Pattern 2: Update standalone img tags
            // <img src="https://static.flickr.com/...">
            $pattern2 = '/<img([^>]*)src=["\']' . preg_quote($image_url, '/') . '["\']([^>]*)>/i';
            if (preg_match($pattern2, $new_body) && !preg_match($pattern1, $old_body)) {
                $new_body = preg_replace($pattern2, '<img$1src="' . $local_path . '"$2>', $new_body);
                $changes_made = true;
                echo "    Updated standalone img src for: $filename\n";
            }
            
            // Apply same patterns to teaser
            if (preg_match($pattern1, $new_teaser, $matches)) {
                if (preg_match('/<img([^>]*)>/i', $matches[0], $img_matches)) {
                    $img_attributes = $img_matches[1];
                    $img_attributes = preg_replace('/src=["\'][^"\']*["\']/', 'src="' . $local_path . '"', $img_attributes);
                    $new_img_tag = '<img' . $img_attributes . '>';
                    
                    $new_teaser = str_replace($matches[0], $new_img_tag, $new_teaser);
                    $changes_made = true;
                    echo "    Removed Flickr link wrapper in teaser for: $filename\n";
                }
            }
            
            if (preg_match($pattern2, $new_teaser) && !preg_match($pattern1, $old_teaser)) {
                $new_teaser = preg_replace($pattern2, '<img$1src="' . $local_path . '"$2>', $new_teaser);
                $changes_made = true;
                echo "    Updated teaser img src for: $filename\n";
            }
        }
    }
    
    if ($changes_made && !$dry_run) {
        // Use Drupal's node_load() and node_save() to properly update and clear caches
        $node = node_load($nid);
        if ($node) {
            $node->body = $new_body;
            $node->teaser = $new_teaser;
            node_save($node);
            echo "    ✓ Updated and saved node $nid using node_save()\n";
        } else {
            echo "    ✗ Failed to load node $nid\n";
        }
    }
    
    return $changes_made;
}

// Main execution
if (!empty($exclude_types)) {
    echo "Excluding content types: " . implode(', ', $exclude_types) . "\n";
}

echo "Step 1: Extracting Flickr image URLs from database...\n";
$flickr_images = get_flickr_images($pdo, $limit, $exclude_types);
echo "Found " . count($flickr_images) . " unique Flickr images\n\n";

if ($dry_run) {
    echo "DRY RUN: Would process the following images:\n";
    foreach ($flickr_images as $image_url => $usages) {
        echo "  Image: $image_url (used in " . count($usages) . " places)\n";
        foreach ($usages as $usage) {
            echo "    - Node {$usage['nid']}: {$usage['title']}\n";
        }
    }
    exit(0);
}

echo "Step 2: Downloading images...\n";
$target_dir = 'sites/default/files';
$download_count = 0;

foreach ($flickr_images as $image_url => $usages) {
    $filename = basename($image_url);
    $target_file = "$target_dir/$filename";
    
    if (file_exists($target_file)) {
        echo "File already exists: $target_file\n";
    } else {
        if (download_flickr_image($image_url, $target_file)) {
            $download_count++;
        }
        // Add a small delay to be respectful to Flickr
        sleep(1);
    }
}

echo "\nStep 3: Updating database content...\n";
$update_count = 0;
$changed_nodes = array();

// Get all nodes that need updating (latest revision only)
$sql = "SELECT nr.nid, nr.vid, nr.body, nr.teaser FROM node_revisions nr JOIN node n ON nr.nid = n.nid AND nr.vid = n.vid WHERE (nr.body LIKE '%static.flickr.com%' OR nr.teaser LIKE '%static.flickr.com%')";

// Add content type exclusions
if (!empty($exclude_types)) {
    $placeholders = str_repeat('?,', count($exclude_types) - 1) . '?';
    $sql .= " AND n.type NOT IN ($placeholders)";
}

if ($limit) {
    $sql .= " LIMIT $limit";
}

if (!empty($exclude_types)) {
    $stmt = $pdo->prepare($sql);
    $stmt->execute($exclude_types);
} else {
    $stmt = $pdo->query($sql);
}

while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo "Processing node {$row['nid']} (vid {$row['vid']})...\n";
    if (update_node_content($pdo, $row['nid'], $row['vid'], $row['body'], $row['teaser'], $flickr_images, $dry_run)) {
        $update_count++;
        $changed_nodes[] = $row['nid'];
    }
}

echo "\n=== Migration Complete ===\n";
echo "Downloaded: $download_count images\n";
echo "Updated: $update_count nodes\n";

// Output list of changed nodes for manual post-processing if needed
if ($update_count > 0) {
    echo "\nChanged nodes (for manual cache clearing if needed):\n";
    
    // Re-query to get the updated nodes
    $sql = "SELECT nr.nid, nr.title FROM node_revisions nr JOIN node n ON nr.nid = n.nid AND nr.vid = n.vid WHERE (nr.body LIKE '%sites/default/files/%' AND (nr.body LIKE '%sites/default/files/%.jpg%' OR nr.teaser LIKE '%sites/default/files/%.jpg%'))";
    
    if (!empty($exclude_types)) {
        $placeholders = str_repeat('?,', count($exclude_types) - 1) . '?';
        $sql .= " AND n.type NOT IN ($placeholders)";
    }
    
    if ($limit) {
        $sql .= " LIMIT $limit";
    }
    
    if (!empty($exclude_types)) {
        $stmt = $pdo->prepare($sql);
        $stmt->execute($exclude_types);
    } else {
        $stmt = $pdo->query($sql);
    }
    
    echo "Node URLs to manually edit/save if images don't display:\n";
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo "  https://hobobiker.ddev.site/node/{$row['nid']}/edit - {$row['title']}\n";
    }
}
?>