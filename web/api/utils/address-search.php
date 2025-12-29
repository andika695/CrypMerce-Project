<?php
// Start output buffering
ob_start();

// Turn off error display
ini_set('display_errors', 0);
error_reporting(E_ALL);

session_start();
require __DIR__ . '/../config/config.php';
require __DIR__ . '/../services/geocoding-service.php';

header('Content-Type: application/json');

// Allow access if logged in user or seller
if (!isset($_SESSION['user_id']) && !isset($_SESSION['seller_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$text = $_GET['text'] ?? '';

if (empty($text)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Query text is required']);
    exit;
}

try {
    if (!defined('GEOAPIFY_API_KEY') || empty(GEOAPIFY_API_KEY)) {
        throw new Exception('API Key configuration missing');
    }

    $geocoder = new GeocodingService(GEOAPIFY_API_KEY);
    $coords = $geocoder->geocode($text);

    ob_clean(); 

    if ($coords) {
        echo json_encode([
            'success' => true,
            'data' => $coords
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Alamat tidak ditemukan'
        ]);
    }

} catch (Exception $e) {
    ob_clean(); 
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
ob_end_flush();
?>
