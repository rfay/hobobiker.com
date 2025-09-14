<?php
/**
 * Streamlined Flickr to Local Photo Migration Script
 * Usage: php flickr_migration.php [--dry-run] [--limit=N]
 */

// Parse command line arguments
$dry_run = in_array('--dry-run', $argv);
$limit = null;
foreach ($argv as $arg) {
    if (strpos($arg, '--limit=') === 0) {
        $limit = (int)substr($arg, 8);
    }
}

echo "Flickr to Local Photo Migration Script\n";
echo "=====================================\n";
if ($dry_run) echo "DRY RUN MODE - No changes will be made\n\n";

// Database connection
try {
    $pdo = new PDO("mysql:host=db;dbname=db", 'db', 'db');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die("Database connection failed: " . $e->getMessage() . "\n");
}

/**
 * Extract all unique Flickr photo IDs from the database
 */
function get_flickr_photo_ids($pdo, $limit = null) {
    $sql = "SELECT nid, vid, title, body FROM node_revisions WHERE body LIKE '%flickr-photo%'";
    if ($limit) {
        $sql .= " LIMIT $limit";
    }
    
    $stmt = $pdo->query($sql);
    $flickr_ids = array();
    
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        // Extract all flickr-photo tags from this node's body
        preg_match_all('/\[flickr-photo:([^]]+)\]/', $row['body'], $matches);
        
        foreach ($matches[1] as $index => $tag_content) {
            // Parse the tag content (e.g., "id=441185766,size=m")
            $config = parse_flickr_tag($tag_content);
            if (isset($config['id'])) {
                $flickr_id = $config['id'];
                $size = isset($config['size']) ? $config['size'] : 'm';
                
                if (!isset($flickr_ids[$flickr_id])) {
                    $flickr_ids[$flickr_id] = array();
                }
                $flickr_ids[$flickr_id][] = array(
                    'nid' => $row['nid'],
                    'vid' => $row['vid'],
                    'title' => $row['title'],
                    'size' => $size,
                    'original_tag' => $matches[0][$index]
                );
            }
        }
    }
    
    return $flickr_ids;
}

/**
 * Parse flickr tag parameters
 */
function parse_flickr_tag($tag_content) {
    $config = array();
    $parts = explode(',', $tag_content);
    foreach ($parts as $part) {
        if (strpos($part, '=') !== false) {
            list($key, $value) = explode('=', trim($part), 2);
            $config[trim($key)] = trim($value);
        }
    }
    return $config;
}

/**
 * Extract photo title from Flickr page
 */
function get_flickr_photo_title($flickr_id) {
    $photo_url = "https://www.flickr.com/photos/hobobiker/{$flickr_id}/";
    $context = stream_context_create([
        'http' => [
            'user_agent' => 'Mozilla/5.0 (compatible; HobobikerMigration/1.0)'
        ]
    ]);
    
    $page = file_get_contents($photo_url, false, $context);
    if ($page) {
        // Try to extract title from meta tag
        if (preg_match('/<meta property="og:title" content="([^"]+)"/', $page, $matches)) {
            return trim($matches[1]);
        }
        // Fallback: try to extract from page title
        if (preg_match('/<title>([^<]+)<\/title>/', $page, $matches)) {
            $title = trim($matches[1]);
            // Remove " | Flickr" suffix if present
            $title = preg_replace('/ \| Flickr$/', '', $title);
            return $title;
        }
    }
    return '';
}

/**
 * Create a descriptive filename from Flickr ID and title
 */
function create_descriptive_filename($flickr_id, $title) {
    // Start with the Flickr ID
    $filename = $flickr_id;
    
    if (!empty($title)) {
        // Clean up the title for filename use
        $clean_title = $title;
        
        // Remove common photo prefixes
        $clean_title = preg_replace('/^(DSC|IMG|P|DSCN|_MG_)\d+\s*[-_]?\s*/', '', $clean_title);
        
        // Keep only letters, numbers, spaces, and basic punctuation
        $clean_title = preg_replace('/[^a-zA-Z0-9\s\-_.,!()]/', '', $clean_title);
        
        // Replace multiple spaces with single space
        $clean_title = preg_replace('/\s+/', ' ', $clean_title);
        
        // Trim and limit length
        $clean_title = trim($clean_title);
        if (strlen($clean_title) > 80) {
            $clean_title = substr($clean_title, 0, 80);
            // Try to cut at a word boundary
            if (($pos = strrpos($clean_title, ' ')) !== false) {
                $clean_title = substr($clean_title, 0, $pos);
            }
        }
        
        if (!empty($clean_title)) {
            // Replace spaces and punctuation with underscores for filename
            $clean_title = preg_replace('/[\s\-.,!()]+/', '_', $clean_title);
            $clean_title = trim($clean_title, '_');
            
            if (!empty($clean_title)) {
                $filename .= '_' . $clean_title;
            }
        }
    }
    
    return $filename . '.jpg';
}

/**
 * Download photo from Flickr (original size)
 */
function download_flickr_photo($flickr_id, $target_path) {
    echo "Downloading Flickr photo ID: $flickr_id (original size)\n";
    
    // Get photo title for descriptive filename
    $title = get_flickr_photo_title($flickr_id);
    if (!empty($title)) {
        echo "  Photo title: $title\n";
        
        // Update target path with descriptive filename
        $descriptive_filename = create_descriptive_filename($flickr_id, $title);
        $target_path = dirname($target_path) . '/' . $descriptive_filename;
        echo "  Descriptive filename: $descriptive_filename\n";
    }
    
    // Get the Flickr sizes page to extract the original image URL
    $flickr_sizes_url = "https://www.flickr.com/photos/hobobiker/{$flickr_id}/sizes/o/";
    $context = stream_context_create([
        'http' => [
            'user_agent' => 'Mozilla/5.0 (compatible; HobobikerMigration/1.0)'
        ]
    ]);
    
    $sizes_page = file_get_contents($flickr_sizes_url, false, $context);
    if ($sizes_page) {
        // Extract the original image URL (look for _o.jpg)
        if (preg_match('/"(https:\/\/live\.staticflickr\.com\/[^"]+_o\.jpg)"/', $sizes_page, $matches)) {
            $image_url = $matches[1];
            echo "  Found original image URL: $image_url\n";
            
            // Download the image
            $image_data = file_get_contents($image_url, false, $context);
            if ($image_data) {
                // Ensure target directory exists
                $dir = dirname($target_path);
                if (!is_dir($dir)) {
                    mkdir($dir, 0755, true);
                }
                
                if (file_put_contents($target_path, $image_data)) {
                    echo "  ✓ Downloaded: $target_path (" . number_format(strlen($image_data)) . " bytes)\n";
                    return basename($target_path); // Return the actual filename used
                } else {
                    echo "  ✗ Failed to write file: $target_path\n";
                }
            } else {
                echo "  ✗ Failed to download image from: $image_url\n";
            }
        } else {
            echo "  ✗ Could not find original image URL in sizes page for ID: $flickr_id\n";
            
            // Fallback: try to get any available size from the main page
            echo "  Trying fallback to main photo page...\n";
            $photo_page = file_get_contents("https://www.flickr.com/photos/hobobiker/{$flickr_id}/", false, $context);
            if ($photo_page && preg_match('/"(https:\/\/live\.staticflickr\.com\/[^"]+\.jpg)"/', $photo_page, $fallback_matches)) {
                $image_url = $fallback_matches[1];
                echo "  Found fallback image URL: $image_url\n";
                
                $image_data = file_get_contents($image_url, false, $context);
                if ($image_data && file_put_contents($target_path, $image_data)) {
                    echo "  ✓ Downloaded (fallback): $target_path (" . number_format(strlen($image_data)) . " bytes)\n";
                    return true;
                }
            }
            
            // Debug: save a snippet of the page
            file_put_contents("/tmp/flickr_debug_{$flickr_id}.html", substr($sizes_page, 0, 5000));
            echo "  (Saved debug HTML to /tmp/flickr_debug_{$flickr_id}.html)\n";
        }
    } else {
        echo "  ✗ Could not fetch Flickr sizes page: $flickr_sizes_url\n";
    }
    
    return false;
}

/**
 * Update node content to use hobobiker_filter instead of flickr_filter
 */
function update_node_content($pdo, $nid, $vid, $old_body, $flickr_mappings, $actual_filenames, $dry_run = false) {
    $new_body = $old_body;
    $changes_made = false;
    
    foreach ($flickr_mappings as $flickr_id => $usages) {
        // Use actual filename if available, otherwise fallback to basic filename
        $local_filename = isset($actual_filenames[$flickr_id]) ? $actual_filenames[$flickr_id] : "{$flickr_id}.jpg";
        $local_path = "sites/default/files/{$local_filename}";
        
        foreach ($usages as $usage) {
            if ($usage['nid'] == $nid && $usage['vid'] == $vid) {
                $old_tag = $usage['original_tag'];
                // Convert to hobobiker format
                // [flickr-photo:id=441185766,size=m] -> [hobophoto:path=sites/default/files/441185766_descriptive_name.jpg,orientation=landscape,caption=]
                $new_tag = "[hobophoto:path={$local_path},orientation=landscape,caption=]";
                
                $new_body = str_replace($old_tag, $new_tag, $new_body);
                $changes_made = true;
                echo "    Converting: $old_tag -> $new_tag\n";
            }
        }
    }
    
    if ($changes_made && !$dry_run) {
        $stmt = $pdo->prepare("UPDATE node_revisions SET body = ? WHERE nid = ? AND vid = ?");
        $stmt->execute([$new_body, $nid, $vid]);
        echo "    ✓ Updated node $nid (vid $vid) in database\n";
    }
    
    return $changes_made;
}

// Main execution
echo "Step 1: Extracting Flickr photo IDs from database...\n";
$flickr_mappings = get_flickr_photo_ids($pdo, $limit);
echo "Found " . count($flickr_mappings) . " unique Flickr photos\n\n";

if ($dry_run) {
    echo "DRY RUN: Would process the following photos:\n";
    foreach ($flickr_mappings as $flickr_id => $usages) {
        echo "  Flickr ID: $flickr_id (used in " . count($usages) . " places)\n";
        foreach ($usages as $usage) {
            echo "    - Node {$usage['nid']}: {$usage['title']}\n";
        }
    }
    exit(0);
}

echo "Step 2: Downloading photos...\n";
$target_dir = 'sites/default/files';
$download_count = 0;
$actual_filenames = array(); // Track actual filenames used

foreach ($flickr_mappings as $flickr_id => $usages) {
    $target_file = "{$target_dir}/{$flickr_id}.jpg";
    
    // Check if we already have a descriptive filename for this photo
    $existing_files = glob("{$target_dir}/{$flickr_id}*.jpg");
    if (!empty($existing_files)) {
        $actual_filename = basename($existing_files[0]);
        $actual_filenames[$flickr_id] = $actual_filename;
        echo "File already exists: {$existing_files[0]}\n";
    } else {
        $result = download_flickr_photo($flickr_id, $target_file);
        if ($result) {
            $download_count++;
            $actual_filenames[$flickr_id] = $result;
        }
        // Add a small delay to be respectful to Flickr
        sleep(1);
    }
}

echo "\nStep 3: Updating database content...\n";
$update_count = 0;

// Get all nodes that need updating
$sql = "SELECT DISTINCT nid, vid, body FROM node_revisions WHERE body LIKE '%flickr-photo%'";
if ($limit) {
    $sql .= " LIMIT $limit";
}

$stmt = $pdo->query($sql);
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo "Processing node {$row['nid']} (vid {$row['vid']})...\n";
    if (update_node_content($pdo, $row['nid'], $row['vid'], $row['body'], $flickr_mappings, $actual_filenames, $dry_run)) {
        $update_count++;
    }
}

echo "\n=== Migration Complete ===\n";
echo "Downloaded: $download_count photos\n";
echo "Updated: $update_count nodes\n";
?>