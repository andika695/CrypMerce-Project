<?php
session_start();
require __DIR__ . '/../../config/config.php';
require __DIR__ . '/../../utils/distance-calculator.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

// Support both JSON input and POST form data
$sellerId = $input['seller_id'] ?? $_POST['seller_id'] ?? null;
$buyerId = $input['buyer_id'] ?? $_POST['buyer_id'] ?? ($_SESSION['user_id'] ?? null);

if (!$sellerId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Seller ID required']);
    exit;
}

try {
    // 1. Get Seller Location
    $stmtSeller = $pdo->prepare("SELECT city, latitude, longitude FROM sellers WHERE id = :id");
    $stmtSeller->execute([':id' => $sellerId]);
    $seller = $stmtSeller->fetch();

    if (!$seller || !$seller['latitude'] || !$seller['longitude']) {
        // Seller hasn't set location
        echo json_encode([
            'success' => false,
            'error_code' => 'SELLER_NO_LOCATION',
            'message' => 'Penjual belum mengatur lokasi toko'
        ]);
        exit;
    }

    // 2. Get Buyer Location
    // If coordinates passed directly (e.g. from picker preview), use them
    if (isset($input['latitude']) && isset($input['longitude'])) {
        $buyerLat = $input['latitude'];
        $buyerLon = $input['longitude'];
        $buyerCity = $input['city'] ?? 'Unknown';
    } else if ($buyerId) {
        // Fetch from DB
        $stmtBuyer = $pdo->prepare("SELECT city, latitude, longitude FROM users WHERE id = :id");
        $stmtBuyer->execute([':id' => $buyerId]);
        $buyer = $stmtBuyer->fetch();

        if (!$buyer || !$buyer['latitude'] || !$buyer['longitude']) {
            echo json_encode([
                'success' => false,
                'error_code' => 'BUYER_NO_LOCATION',
                'message' => 'Pembeli belum mengatur alamat pengiriman'
            ]);
            exit;
        }
        $buyerLat = $buyer['latitude'];
        $buyerLon = $buyer['longitude'];
        $buyerCity = $buyer['city'];
    } else {
        echo json_encode(['success' => false, 'message' => 'Buyer location required']);
        exit;
    }

    // 3. Calculate
    $distance = DistanceCalculator::calculateDistance(
        $seller['latitude'], $seller['longitude'],
        $buyerLat, $buyerLon
    );

    $shippingDetails = DistanceCalculator::calculateShippingCost(
        $seller['city'] ?? '', 
        $buyerCity ?? '', 
        $distance
    );

    echo json_encode([
        'success' => true,
        'data' => $shippingDetails
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error']);
}
?>
