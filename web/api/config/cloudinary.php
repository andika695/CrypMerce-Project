<?php
require_once __DIR__ . '/../../vendor/autoload.php';

use Cloudinary\Configuration\Configuration;
use Cloudinary\Api\Upload\UploadApi;

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}


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
