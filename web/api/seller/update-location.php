<?php
// Fix JSON Error: Prevent HTML warnings
ob_start();
ini_set('display_errors', 0);
error_reporting(E_ALL);

session_start();
require __DIR__ . '/../config/config.php';
require __DIR__ . '/../services/geocoding-service.php';

header('Content-Type: application/json');

// Check if user is logged in as seller
if (!isset($_SESSION['seller']) || !isset($_SESSION['seller']['seller_id'])) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'Unauthorized'
    ]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed'
    ]);
    exit;
}

try {
    $sellerId = $_SESSION['seller']['seller_id'];
    $latitude = filter_var($_POST['latitude'] ?? null, FILTER_VALIDATE_FLOAT);
    $longitude = filter_var($_POST['longitude'] ?? null, FILTER_VALIDATE_FLOAT);
    $addressDetail = trim($_POST['address_detail'] ?? '');
    
    // Validate coordinates
    if ($latitude === false || $longitude === false) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Koordinat tidak valid'
        ]);
        exit;
    }
    
    // Validate coordinate ranges
    if (!GeocodingService::validateCoordinates($latitude, $longitude)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Koordinat di luar jangkauan yang valid'
        ]);
        exit;
    }
    
    // Reverse geocode to get address
    $geocoder = new GeocodingService(GEOAPIFY_API_KEY);
    $addressData = $geocoder->reverseGeocode($latitude, $longitude);
    
    if (!$addressData) {
        // Fallback if geocoding fails
        $addressData = [
            'formatted' => 'Alamat tidak dapat dimuat',
            'city' => '',
            'state' => ''
        ];
    }
    
    // Update seller location in database
    $stmt = $pdo->prepare("
        UPDATE sellers 
        SET latitude = :latitude,
            longitude = :longitude,
            address = :address,
            city = :city,
            province = :province,
            address_detail = :address_detail
        WHERE id = :seller_id
    ");
    
    $stmt->execute([
        ':latitude' => $latitude,
        ':longitude' => $longitude,
        ':address' => $addressData['formatted'],
        ':city' => $addressData['city'],
        ':province' => $addressData['state'],
        ':address_detail' => $addressDetail,
        ':seller_id' => $sellerId
    ]);
    
    // Also update the old 'location' column for backward compatibility
    $updateLocationStmt = $pdo->prepare("UPDATE sellers SET location = :location WHERE id = :seller_id");
    $updateLocationStmt->execute([
        ':location' => $addressData['city'] ?: $addressData['formatted'],
        ':seller_id' => $sellerId
    ]);
    
    ob_clean();
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Lokasi berhasil disimpan',
        'data' => [
            'latitude' => $latitude,
            'longitude' => $longitude,
            'address' => $addressData['formatted'],
            'city' => $addressData['city'],
            'province' => $addressData['state'],
            'address_detail' => $addressDetail
        ]
    ]);
    
} catch (PDOException $e) {
    ob_clean();
    http_response_code(500);
    error_log("Database error in update-location.php: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Kesalahan database'
    ]);
} catch (Exception $e) {
    ob_clean();
    http_response_code(500);
    error_log("Error in update-location.php: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Terjadi kesalahan server'
    ]);
}
ob_end_flush();
?>
