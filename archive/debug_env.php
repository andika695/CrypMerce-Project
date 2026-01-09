<?php
// Define get_env_var fallback in case config.php fails to load
if (!function_exists('get_env_var')) {
    function get_env_var($key, $default = null) {
        $val = $_ENV[$key] ?? $_SERVER[$key] ?? getenv($key);
        if ($val === false || $val === null || $val === "") {
            return $default;
        }
        return $val;
    }
}

require_once 'api/config/config.php';
header('Content-Type: application/json');

$rootPath = dirname(__DIR__); // Assuming this script is in root or web/
$envPath = dirname(__DIR__, 1) . DIRECTORY_SEPARATOR . '.env';

$debug = [
    'env_path_attempted' => $envPath,
    'env_exists' => file_exists($envPath),
    'CLOUDINARY_CLOUD_NAME' => get_env_var('CLOUDINARY_CLOUD_NAME', 'NOT_SET'),
    'CLOUDINARY_API_KEY' => get_env_var('CLOUDINARY_API_KEY', 'NOT_SET'),
    'GEOAPIFY_API_KEY' => get_env_var('GEOAPIFY_API_KEY', 'NOT_SET'),
    'DB_HOST' => get_env_var('DB_HOST', 'NOT_SET'),
    'SERVER_SOFTWARE' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
    'PHP_SAPI' => php_sapi_name()
];

echo json_encode($debug, JSON_PRETTY_PRINT);
?>
