<?php
// Prevent any HTML output
ob_start();
ini_set('display_errors', '0');
error_reporting(E_ALL);

header('Content-Type: application/json');
require_once '../api/config/config.php';
session_start();

try {
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);

    if (!$data || !isset($data['items'])) {
        throw new Exception('Data tidak ditemukan');
    }

    $user_id   = $_SESSION['user']['user_id'] ?? null;
    $user_role = $_SESSION['user']['role'] ?? null;

    if (!$user_id || $user_role !== 'user') {
        http_response_code(403);
        die(json_encode([
            'success' => false,
            'message' => 'Silakan login sebagai pelanggan.'
        ]));
    }

    $items = $data['items'] ?? [];
    $coin_type = $data['coin_type'] ?? 'BTC'; // BTC or ETH
    
    // Generate UUID
    $uuid = 'CRYPTO-' . strtoupper($coin_type) . '-' . time() . '-' . $user_id . '-' . bin2hex(random_bytes(3));
    
    $first_item_id = $items[0]['id'] ?? null;
    $stmtSeller = $pdo->prepare("SELECT seller_id FROM products WHERE id = ?");
    $stmtSeller->execute([$first_item_id]);
    $product = $stmtSeller->fetch();
    
    $seller_id = $product['seller_id'] ?? null;
    if (!$seller_id) throw new Exception('Seller not found');

    // Calculate Shipping (Resued logic simplified)
    $total_weight_gram = 0;
    $stmtweight = $pdo->prepare("SELECT weight FROM products WHERE id = ?");
    foreach ($items as $item) {
        $stmtweight->execute([$item['id']]);
        $prod = $stmtweight->fetch();
        if ($prod) $total_weight_gram += ((int)$prod['weight'] * $item['quantity']);
    }

    $shipping_cost = 7000;
    if ($total_weight_gram > 0) {
        $kg_count = floor($total_weight_gram / 1000);
        $remainder = $total_weight_gram % 1000;
        $shipping_cost = $kg_count * 10000;
        if ($remainder) $shipping_cost += 7000;
    }

    // Buyer Address
    $stmtBuyerAddr = $pdo->prepare("SELECT address, city FROM users WHERE id = ?");
    $stmtBuyerAddr->execute([$user_id]);
    $buyerData = $stmtBuyerAddr->fetch();
    $shipping_address = $buyerData['address'] ?? '-';
    $buyer_city = $buyerData['city'] ?? '';

    // Calculate Total
    $subtotal = 0;
    foreach ($items as $item) {
        $subtotal += ($item['price'] * $item['quantity']);
    }
    $total_price = $subtotal + $shipping_cost;

    $pdo->beginTransaction();

    // Insert Order (Pending)
    $sqlOrder = "INSERT INTO orders (buyer_id, seller_id, total_amount, status, shipping_cost, distance_km, shipping_address, buyer_city, midtrans_order_uuid) VALUES (?, ?, ?, 'pending', ?, 0, ?, ?, ?)";
    $stmtOrder = $pdo->prepare($sqlOrder);
    $stmtOrder->execute([
        $user_id,
        $seller_id,
        $total_price,
        $shipping_cost,
        $shipping_address,
        $buyer_city,
        $uuid
    ]);

    $order_db_id = $pdo->lastInsertId();

    // Insert Items
    $sqlItem = "INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES (?, ?, ?, ?)";
    $stmtItem = $pdo->prepare($sqlItem);

    foreach ($items as $item) {
        $stmtItem->execute([
            $order_db_id,
            $item['id'],
            $item['quantity'],
            $item['price']
        ]);
    }

    $pdo->commit();

    ob_clean();
    echo json_encode([
        'success' => true,
        'order_uuid' => $uuid,
        'order_id' => $order_db_id,
        'total_amount' => $total_price,
        'coin_type' => $coin_type
    ]);

} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    ob_clean();
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
