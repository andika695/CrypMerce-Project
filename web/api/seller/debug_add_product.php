<?php
// Debug script untuk test add-product
session_start();
require '../config/config.php';

echo "<h2>Debug Add Product</h2>";

// 1. Check Session
echo "<h3>1. Session Check</h3>";
echo "User ID: " . ($_SESSION['user_id'] ?? 'NOT SET') . "<br>";
echo "Role: " . ($_SESSION['role'] ?? 'NOT SET') . "<br>";
echo "Seller ID: " . ($_SESSION['seller_id'] ?? 'NOT SET') . "<br>";

// 2. Check Database Connection
echo "<h3>2. Database Connection</h3>";
try {
    $pdo->query("SELECT 1");
    echo "✅ Database connected<br>";
} catch (Exception $e) {
    echo "❌ Database error: " . $e->getMessage() . "<br>";
}

// 3. Check Cloudinary Config
echo "<h3>3. Cloudinary Environment Variables</h3>";
$cloudName = $_ENV['CLOUDINARY_CLOUD_NAME'] ?? $_SERVER['CLOUDINARY_CLOUD_NAME'] ?? getenv('CLOUDINARY_CLOUD_NAME') ?? null;
$apiKey = $_ENV['CLOUDINARY_API_KEY'] ?? $_SERVER['CLOUDINARY_API_KEY'] ?? getenv('CLOUDINARY_API_KEY') ?? null;
$apiSecret = $_ENV['CLOUDINARY_API_SECRET'] ?? $_SERVER['CLOUDINARY_API_SECRET'] ?? getenv('CLOUDINARY_API_SECRET') ?? null;

echo "Cloud Name: " . ($cloudName ? "✅ SET (" . substr($cloudName, 0, 5) . "...)" : "❌ NOT SET") . "<br>";
echo "API Key: " . ($apiKey ? "✅ SET" : "❌ NOT SET") . "<br>";
echo "API Secret: " . ($apiSecret ? "✅ SET" : "❌ NOT SET") . "<br>";

// 4. Check Vendor Autoload
echo "<h3>4. Vendor/Autoload Check</h3>";
$autoloadPath = __DIR__ . '/../config/../../vendor/autoload.php';
if (file_exists($autoloadPath)) {
    echo "✅ Vendor autoload exists<br>";
    require_once $autoloadPath;
    
    if (class_exists('Cloudinary\Api\Upload\UploadApi')) {
        echo "✅ Cloudinary classes loaded<br>";
    } else {
        echo "❌ Cloudinary classes NOT loaded<br>";
    }
} else {
    echo "❌ Vendor autoload NOT found at: $autoloadPath<br>";
}

// 5. Test Cloudinary Function
echo "<h3>5. Test Cloudinary Function</h3>";
try {
    require_once __DIR__ . '/../config/cloudinary.php';
    echo "✅ cloudinary.php loaded<br>";
    
    // Test with fake file to see error
    $fakeFile = ['error' => UPLOAD_ERR_NO_FILE];
    $result = uploadToCloudinary($fakeFile, 'test');
    echo "Result: " . json_encode($result) . "<br>";
} catch (Exception $e) {
    echo "❌ Error loading cloudinary.php: " . $e->getMessage() . "<br>";
}

// 6. PHP ini settings
echo "<h3>6. PHP Settings</h3>";
echo "display_errors: " . ini_get('display_errors') . "<br>";
echo "error_reporting: " . ini_get('error_reporting') . "<br>";
echo "upload_max_filesize: " . ini_get('upload_max_filesize') . "<br>";
?>
