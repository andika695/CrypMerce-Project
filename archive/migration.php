<?php
// Fix path to config based on location in web/ dir
require_once __DIR__ . '/api/config/config.php';

echo "<h1>Database Migration Status</h1>";
echo "<pre>";

try {
    echo "Using DB Host: " . $host . "\n";
    echo "Adding midtrans_order_uuid column to orders table...\n";
    
    // Check if column exists
    $check = $pdo->query("SHOW COLUMNS FROM orders LIKE 'midtrans_order_uuid'");
    if ($check->rowCount() == 0) {
        $sql = "ALTER TABLE orders ADD COLUMN midtrans_order_uuid VARCHAR(255) AFTER id";
        $pdo->exec($sql);
        echo "<span style='color:green'>SUCCESS: Column 'midtrans_order_uuid' added.</span>\n";
    } else {
        echo "<span style='color:blue'>INFO: Column 'midtrans_order_uuid' already exists.</span>\n";
    }

    echo "\nUpdating status ENUM to include 'confirmed'...\n";
    try {
        $sqlEnum = "ALTER TABLE orders MODIFY COLUMN status ENUM('pending', 'processing', 'confirmed', 'shipped', 'completed', 'cancelled') DEFAULT 'pending'";
        $pdo->exec($sqlEnum);
        echo "<span style='color:green'>SUCCESS: Status ENUM updated.</span>\n";
    } catch (PDOException $e) {
         echo "<span style='color:orange'>WARNING (Enum Update): " . $e->getMessage() . "</span>\n";
    }

    echo "Migration completed successfully.\n";

} catch (PDOException $e) {
    echo "<span style='color:red'>ERROR: " . $e->getMessage() . "</span>\n";
}

echo "</pre>";
?>
