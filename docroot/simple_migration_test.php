<?php
// Simple test without Drupal bootstrap
echo "Simple Migration Test\n";
echo "====================\n";

// Test database connection first
$db_host = 'db';
$db_user = 'db';
$db_pass = 'db';
$db_name = 'db';

try {
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_name", $db_user, $db_pass);
    echo "✓ Database connection successful\n";
    
    // Test query
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM node_revisions WHERE body LIKE '%flickr-photo%'");
    $result = $stmt->fetch();
    echo "✓ Found {$result['count']} nodes with flickr-photo tags\n";
    
    // Get first few examples
    $stmt = $pdo->query("SELECT nid, title, body FROM node_revisions WHERE body LIKE '%flickr-photo%' LIMIT 3");
    while ($row = $stmt->fetch()) {
        preg_match_all('/\[flickr-photo:([^]]+)\]/', $row['body'], $matches);
        echo "  Node {$row['nid']}: {$row['title']}\n";
        foreach ($matches[0] as $tag) {
            echo "    Tag: $tag\n";
        }
    }
    
} catch (PDOException $e) {
    echo "✗ Database connection failed: " . $e->getMessage() . "\n";
}
?>