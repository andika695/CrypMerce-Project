<?php
// Load .env file
function loadEnv($path) {
    if (!file_exists($path)) {
        return false;
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
            $_SERVER[$key] = $value; // Add to SERVER as well
        }
    }
    return true;
}

// Try to find .env in multiple possible locations
$possiblePaths = [
    __DIR__ . '/../../../.env',       // Project root (from api/config)
    __DIR__ . '/../../.env',          // Web root (from api/config)
    __DIR__ . '/../../../../.env',    // One level up
    $_SERVER['DOCUMENT_ROOT'] . '/.env',
    $_SERVER['DOCUMENT_ROOT'] . '/../.env' 
];

$envLoaded = false;
foreach ($possiblePaths as $path) {
    if (loadEnv(realpath($path))) {
        $envLoaded = true;
        break;
    }
}

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
$geoapifyKey = getenv('GEOAPIFY_API_KEY');
if (!$geoapifyKey && isset($_ENV['GEOAPIFY_API_KEY'])) {
    $geoapifyKey = $_ENV['GEOAPIFY_API_KEY'];
}

// Ensure the key exists
if (!$geoapifyKey) {
    // If you need to debug why env is not loading, uncomment below:
    // error_log("Warning: GEOAPIFY_API_KEY is not set in environment.");
}

define('GEOAPIFY_API_KEY', $geoapifyKey);

