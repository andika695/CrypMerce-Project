<?php
// Start output buffering IMMEDIATELY to catch any unexpected output/warnings
ob_start();

// Turn off error display to prevent HTML/text leaking into JSON
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

$lat = filter_input(INPUT_GET, 'lat', FILTER_VALIDATE_FLOAT);
$lon = filter_input(INPUT_GET, 'lon', FILTER_VALIDATE_FLOAT);

if (!$lat || !$lon) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid coordinates']);
    exit;
}

try {
    if (!defined('GEOAPIFY_API_KEY') || empty(GEOAPIFY_API_KEY)) {
        throw new Exception('API Key configuration missing');
    }

    $geocoder = new GeocodingService(GEOAPIFY_API_KEY);
    $addressData = $geocoder->reverseGeocode($lat, $lon);

    // Clear buffer before outputting JSON
    ob_clean(); 

    if ($addressData) {
        echo json_encode([
            'success' => true,
            'data' => $addressData
        ]);
    } else {
        // Check standard PHP error for last error
        $error = error_get_last();
        echo json_encode([
            'success' => false,
            'message' => 'Layanan geocoding gagal: ' . ($error['message'] ?? 'Unknown error')
        ]);
    }

} catch (Exception $e) {
    ob_clean(); // Clear buffer on error too
     http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
// End buffer
ob_end_flush();
?>
