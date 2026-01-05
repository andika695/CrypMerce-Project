<?php
require 'api/config/config.php';
try {
    $pdo->exec("ALTER TABLE sellers ADD COLUMN IF NOT EXISTS location VARCHAR(255) DEFAULT 'Belum menentukan lokasi'");
    echo "Success: Location column added or already exists.";
} catch (Exception $e) {
    if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
        echo "Success: Location column already exists.";
    } else {
        echo "Error: " . $e->getMessage();
    }
}
?>
