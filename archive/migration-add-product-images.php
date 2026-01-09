<?php
/**
 * Migration: Add 'images' column to products table
 * This column stores multiple product image URLs as JSON array
 * 
 * Run this file once to add the column and migrate existing data
 */

require_once __DIR__ . '/api/config/config.php';

echo "<h2>Migration: Add Product Images Column</h2>";

try {
    // Check if 'images' column already exists
    $stmt = $pdo->query("SHOW COLUMNS FROM products LIKE 'images'");
    $columnExists = $stmt->fetch();

    if ($columnExists) {
        echo "<p style='color: orange;'>⚠️ Column 'images' already exists. Skipping creation.</p>";
    } else {
        // Add 'images' column as JSON type
        $sql = "ALTER TABLE products ADD COLUMN images JSON DEFAULT NULL AFTER image";
        $pdo->exec($sql);
        echo "<p style='color: green;'>✅ Column 'images' added successfully!</p>";
    }

    // Migrate existing single image data to images array
    echo "<h3>Migrating existing image data...</h3>";
    
    $stmt = $pdo->query("SELECT id, image FROM products WHERE image IS NOT NULL AND image != '' AND (images IS NULL OR images = '[]')");
    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $migratedCount = 0;
    
    foreach ($products as $product) {
        // Convert single image to JSON array
        $imagesArray = json_encode([$product['image']]);
        
        $updateStmt = $pdo->prepare("UPDATE products SET images = ? WHERE id = ?");
        $updateStmt->execute([$imagesArray, $product['id']]);
        $migratedCount++;
    }
    
    echo "<p style='color: green;'>✅ Migrated {$migratedCount} products with existing images.</p>";
    
    echo "<h3>Migration Complete!</h3>";
    echo "<p>The 'images' column now stores an array of image URLs in JSON format.</p>";
    echo "<p><strong>Example:</strong> <code>[\"https://cloudinary.com/img1.jpg\", \"https://cloudinary.com/img2.jpg\"]</code></p>";

} catch (PDOException $e) {
    echo "<p style='color: red;'>❌ Database Error: " . htmlspecialchars($e->getMessage()) . "</p>";
} catch (Exception $e) {
    echo "<p style='color: red;'>❌ Error: " . htmlspecialchars($e->getMessage()) . "</p>";
}
?>
