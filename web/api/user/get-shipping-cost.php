<?php
header('Content-Type: application/json');
require_once '../config/config.php';
require_once '../utils/distance-calculator.php';

session_start();

// 1. Check Authentication
if (!isset($_SESSION['user']) || !isset($_SESSION['user']['user_id'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Silakan login untuk melihat ongkir',
        'code' => 'LOGIN_REQUIRED'
    ]);
    exit;
}

$user_id = $_SESSION['user']['user_id'];
    // 2. Validate Inputs
    $product_id = isset($_GET['product_id']) ? intval($_GET['product_id']) : 0;
    $quantity = isset($_GET['qty']) ? intval($_GET['qty']) : 1;
    if ($quantity < 1) $quantity = 1;

    if (!$product_id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Product ID required']);
        exit;
    }

    // 3. Get Product Weight & Seller Location
    // We need seller location only for estimation time, not cost anymore (based on user request)
    // But we keep city info for context "Origin -> Destination"
    $stmtProduct = $pdo->prepare("
        SELECT p.weight, s.city as seller_city, s.latitude, s.longitude
        FROM products p
        JOIN sellers s ON p.seller_id = s.id
        WHERE p.id = ?
    ");
    $stmtProduct->execute([$product_id]);
    $product = $stmtProduct->fetch(PDO::FETCH_ASSOC);

    if (!$product) {
        echo json_encode(['success' => false, 'message' => 'Produk tidak ditemukan']);
        exit;
    }

    // 4. Get User Location (For Estimation & Destination Name)
    $stmtUser = $pdo->prepare("SELECT city, latitude, longitude FROM users WHERE id = ?");
    $stmtUser->execute([$user_id]);
    $user = $stmtUser->fetch(PDO::FETCH_ASSOC);

    if (!$user || empty($user['city'])) {
        echo json_encode([
            'success' => false, 
            'message' => 'Lengkapi alamat di profil',
            'code' => 'ADDRESS_REQUIRED'
        ]);
        exit;
    }

    // 5. Calculate Weight-Based Shipping Cost
    $weightPerItemGrams = floatval($product['weight']);
    $totalWeightGrams = $weightPerItemGrams * $quantity;
    $totalWeightKg = $totalWeightGrams / 1000;

    // Logic: 
    // < 1kg (Remainder > 0, Floor 0) -> 7k
    // = 1kg (Remainder 0, Floor 1) -> 10k
    // > 1kg -> Follows multiples (Full Kg * 10k + Remainder * 7k)
    
    $fullKg = floor($totalWeightKg);
    $remainder = $totalWeightKg - $fullKg;
    
    $cost = ($fullKg * 10000) + ($remainder > 0 ? 7000 : 0);

    // 6. Estimation (Keep Distance Logic for Time only)
    $estimation = "2-3 hari"; // Default
    $distance = 0;
    
    if ($user['latitude'] && $product['latitude']) {
        $distance = DistanceCalculator::calculateDistance(
            $user['latitude'], $user['longitude'], 
            $product['latitude'], $product['longitude']
        );
        
        // Basic estimation logic from calculator, reused here or roughly approximated
        // Same city logic check
        if (strtolower(trim($user['city'])) === strtolower(trim($product['seller_city']))) {
             $estimation = "1-2 hari";
        } else {
             if ($distance < 100) $estimation = "2-3 hari";
             else $estimation = "3-5 hari";
        }
    }

    echo json_encode([
        'success' => true,
        'data' => [
            'cost' => $cost,
            'formatted_cost' => 'Rp ' . number_format($cost, 0, ',', '.'),
            'weight_total_kg' => round($totalWeightKg, 2),
            'estimation' => $estimation,
            'origin' => $product['seller_city'],
            'destination' => $user['city']
        ]
    ]);
?>
