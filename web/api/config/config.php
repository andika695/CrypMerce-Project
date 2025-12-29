<?php
// Load .env file
function loadEnv($path) {
    if (!file_exists($path)) {
        return;
    }
    
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        // Skip comments
        if (strpos(trim($line), '#') === 0) {
            continue;
        }
        
        // Parse KEY=VALUE
        if (strpos($line, '=') !== false) {
            list($key, $value) = explode('=', $line, 2);
            $key = trim($key);
            $value = trim($value);
            
            // Remove quotes if present
            $value = trim($value, '"\'');
            
            // Set as environment variable
            putenv("$key=$value");
            $_ENV[$key] = $value;
        }
    }
}

// Load .env from project root
$envPath = __DIR__ . '/../../../.env';
loadEnv($envPath);

// Database configuration
$host = 'crypmerce_db';
$db = 'crypmerce_database';
$user = 'root';
$pass = 'rootpass123';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";

$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (PDOException $e) {
    die(json_encode(['success' => false, 'message' => 'Koneksi gagal: ' . $e->getMessage()]));
}

// API Keys
// API Keys
$apiKey = getenv('GEOAPIFY_API_KEY');
if (!$apiKey && isset($_ENV['GEOAPIFY_API_KEY'])) {
    $apiKey = $_ENV['GEOAPIFY_API_KEY'];
}
// Fallback if env not loaded
if (!$apiKey) {
    $apiKey = '601773d95319404183f23f39e6a6544d'; // Hardcoded fallback from user
}

define('GEOAPIFY_API_KEY', $apiKey);

