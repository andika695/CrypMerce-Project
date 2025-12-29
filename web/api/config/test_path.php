<?php
echo "Current File: " . __FILE__ . "\n";
echo "Current DIR: " . __DIR__ . "\n";
echo "Parent (1): " . dirname(__DIR__, 1) . "\n";
echo "Parent (2): " . dirname(__DIR__, 2) . "\n";
echo "Parent (3): " . dirname(__DIR__, 3) . "\n";

$envPath = dirname(__DIR__, 3) . DIRECTORY_SEPARATOR . '.env';
echo "Target .env: " . $envPath . "\n";
echo "Exists: " . (file_exists($envPath) ? 'YES' : 'NO') . "\n";
?>
