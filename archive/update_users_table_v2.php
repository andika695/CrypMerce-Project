<?php
// Try to include config from relative path
$configPath = __DIR__ . '/config/config.php';

if (!file_exists($configPath)) {
    die("Config file not found at: " . $configPath);
}

require $configPath;

try {
    echo "Connected to database.<br>";
    
    // Add full_name column
    $pdo->exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(255) NULL AFTER username");
    echo "Added full_name column.<br>";

    // Add profile_photo column
    $pdo->exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_photo VARCHAR(500) NULL AFTER email");
    echo "Added profile_photo column.<br>";

    echo "Database updated successfully!";
} catch (PDOException $e) {
    echo "Error updating database: " . $e->getMessage();
}
?>
