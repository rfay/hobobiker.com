<?php
// Test single photo download with descriptive naming

// Include the functions from our main script
require_once 'flickr_migration.php';

// Test with the example photo you mentioned
$test_flickr_id = '2454026865';
$target_path = "sites/default/files/{$test_flickr_id}.jpg";

echo "Testing descriptive filename download for Flickr ID: $test_flickr_id\n";
echo "Expected title: 'DSC00258 STOP - Military checkpoint...'\n\n";

$result = download_flickr_photo($test_flickr_id, $target_path);

if ($result) {
    echo "\n✅ Success! Downloaded as: $result\n";
    
    // Check if file exists and show its size
    $full_path = "sites/default/files/$result";
    if (file_exists($full_path)) {
        $size = filesize($full_path);
        echo "File size: " . number_format($size) . " bytes\n";
    }
} else {
    echo "\n❌ Download failed\n";
}
?>