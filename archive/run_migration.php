<?php
// Auto Migration Script
// Access this file from browser to update database structure

// Enable error reporting
ini_set('display_errors', 1);
error_reporting(E_ALL);

echo "<h1>Database Migration Tool</h1>";

// 1. Load Config
$configPath = __DIR__ . '/api/config/config.php';
if (!file_exists($configPath)) {
    die("❌ Config Not Found at $configPath");
}
require $configPath;

echo "✅ Config loaded.<br>";

// 2. Load Migration File
$sqlPath = __DIR__ . '/database/migrations/001_add_location_shipping.sql';
if (!file_exists($sqlPath)) {
    die("❌ Migration File Not Found at $sqlPath");
}
$sql = file_get_contents($sqlPath);

echo "✅ Migration file found (" . strlen($sql) . " bytes).<br>";

// 3. Split and Execute
// Remove comments simplistic way
$lines = explode("\n", $sql);
$cleanSql = "";
foreach ($lines as $line) {
    $line = trim($line);
    if ($line && !str_starts_with($line, '--') && !str_starts_with($line, '/*')) {
        $cleanSql .= $line . "\n";
    }
}

$statements = explode(';', $cleanSql);
$success = 0;
$errors = 0;

echo "<h3>Executing...</h3>";
echo "<ul>";

foreach ($statements as $stmt) {
    $stmt = trim($stmt);
    if (empty($stmt)) continue;

    try {
        $pdo->exec($stmt);
        echo "<li style='color:green'>Success: " . substr($stmt, 0, 50) . "...</li>";
        $success++;
    } catch (PDOException $e) {
        // Ignore "Duplicate column" checks if pure SQL doesn't handle IF NOT EXISTS (but ours does)
        echo "<li style='color:red'>Error: " . $e->getMessage() . " <br><small>$stmt</small></li>";
        $errors++;
    }
}
echo "</ul>";

echo "<h2>Result: $success queries executed, $errors errors.</h2>";
if ($errors == 0) {
    echo "<h3 style='color:green'>🎉 MIGRATION SUCCESS! Structure Updated.</h3>";
} else {
    echo "<h3 style='color:orange'>⚠️ Completed with warnings (Normal if columns already exist).</h3>";
}
echo "<p>Sekarang silakan coba simpan alamat lagi.</p>";
?>
