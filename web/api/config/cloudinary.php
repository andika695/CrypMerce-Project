<?php
require_once __DIR__ . '/../../vendor/autoload.php';

use Cloudinary\Configuration\Configuration;
use Cloudinary\Api\Upload\UploadApi;

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Fungsi untuk membaca file .env sederhana
function loadEnv($path) {
    if (!file_exists($path)) return;
    
    $content = file_get_contents($path);
    if ($content === false) return;

    // Handle UTF-8 BOM
    if (substr($content, 0, 3) === "\xEF\xBB\xBF") {
        $content = substr($content, 3);
    }
    
    // Handle UTF-16 (NULL characters)
    $content = str_replace("\0", "", $content);

    $lines = preg_split('/\r\n|\r|\n/', $content);
    
    foreach ($lines as $line) {
        $line = trim($line);
        if (empty($line) || strpos($line, '#') === 0) continue;
        
        $parts = explode('=', $line, 2);
        if (count($parts) !== 2) continue;
        
        $name = trim($parts[0]);
        $value = trim($parts[1]);
        
        // Remove quotes and trailing comments
        $value = preg_replace('/\s#.*$/', '', $value);
        $value = trim($value, "\"' \t\n\r\0\x0B");
        
        if (!empty($name)) {
            $_SESSION[$name] = $value; // Simpan di session sebagai cadangan jika perlu
            $_ENV[$name] = $value;
            $_SERVER[$name] = $value;
            putenv("$name=$value");
        }
    }
}

// Panggil loadEnv
loadEnv(__DIR__ . '/../../.env');

/**
 * Upload file ke Cloudinary
 */
function uploadToCloudinary($file, $folder = 'crypmerce/products') {
    // Ambil dari berbagai sumber karena Windows/XAMPP terkadang aneh dalam hal env
    $cloudName = $_ENV['CLOUDINARY_CLOUD_NAME'] ?? $_SERVER['CLOUDINARY_CLOUD_NAME'] ?? getenv('CLOUDINARY_CLOUD_NAME') ?? null;
    $apiKey    = $_ENV['CLOUDINARY_API_KEY'] ?? $_SERVER['CLOUDINARY_API_KEY'] ?? getenv('CLOUDINARY_API_KEY') ?? null;
    $apiSecret = $_ENV['CLOUDINARY_API_SECRET'] ?? $_SERVER['CLOUDINARY_API_SECRET'] ?? getenv('CLOUDINARY_API_SECRET') ?? null;

    if (!$cloudName || !$apiKey || !$apiSecret) {
        return [
            'success' => false, 
            'message' => "Konfigurasi tidak ditemukan. Pastikan .env sudah terisi dengan benar (Tanpa spasi di sekitar =)."
        ];
    }

    // Inisialisasi Config secara eksplisit
    $config = [
        'cloud' => [
            'cloud_name' => $cloudName,
            'api_key'    => $apiKey,
            'api_secret' => $apiSecret
        ],
        'url' => ['secure' => true]
    ];
    
    // SSL Fix for Windows
    $cacert = __DIR__ . '/cacert.pem';
    if (file_exists($cacert)) {
        ini_set('curl.cainfo', $cacert);
        ini_set('openssl.cafile', $cacert);
    }

    if (!isset($file) || $file['error'] !== UPLOAD_ERR_OK) {
        return ['success' => false, 'message' => 'File tidak valid'];
    }

    try {
        // Berikan config langsung ke constructor UploadApi
        $uploadApi = new UploadApi($config);
        
        $result = $uploadApi->upload($file['tmp_name'], [
            'folder' => $folder,
            'resource_type' => 'image',
            'quality' => 'auto',
            'fetch_format' => 'auto'
        ]);

        return ['success' => true, 'url' => $result['secure_url']];
    } catch (Exception $e) {
        // Jika error "cloudName", tampilkan inisialnya untuk debugging (aman)
        $debugInfo = " (Hint: " . substr($cloudName, 0, 3) . "...)";
        return ['success' => false, 'message' => 'Cloudinary Error: ' . $e->getMessage() . $debugInfo];
    }
}
