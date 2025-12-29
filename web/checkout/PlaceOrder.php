<?php
header('Content-Type: application/json');
require_once '../api/config/config.php'; 
session_start();
require_once dirname(__FILE__) . '/midtrans-php-master/Midtrans.php';

// Konfigurasi Midtrans
\Midtrans\Config::$serverKey = getenv('MIDTRANS_SERVER_KEY'); 
\Midtrans\Config::$isProduction = false;
\Midtrans\Config::$isSanitized = true;
\Midtrans\Config::$is3ds = true;

try {
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);

    if (!$data || !isset($data['items'])) {
        throw new Exception('Data tidak ditemukan');
    }

    $user_id   = $_SESSION['user_id'] ?? null;
    $user_role = $_SESSION['role'] ?? null;

    if (!$user_id || $user_role !== 'user') {
        http_response_code(403);
        die(json_encode([
            'success' => false, 
            'message' => 'Penjual tidak diizinkan melakukan pembelian. Silakan login sebagai pelanggan.'
        ]));
    }

    $total_price = $data['total_price'] ?? 0;
    $items       = $data['items'] ?? [];
    
    $order_id_string = 'ORDER-' . time() . '-' . $user_id;

    $first_item_id = $items[0]['id'] ?? null;
    $stmtSeller = $pdo->prepare("SELECT seller_id FROM products WHERE id = ?");
    $stmtSeller->execute([$first_item_id]);
    $product = $stmtSeller->fetch();
    
    $seller_id = $product['seller_id'] ?? null;

    if (!$seller_id) {
        throw new Exception('Data penjual tidak ditemukan untuk produk ini');
    }

    require_once dirname(__FILE__) . '/../api/utils/distance-calculator.php';
    
    // --- SHIPPING CALCULATION ---
    $shipping_cost = 0;
    $distance = 0;
    $shipping_address = '';
    $seller_info = null;
    $buyer_info = null;

    if ($seller_id) {
        $stmtSellerLoc = $pdo->prepare("SELECT city, latitude, longitude, address FROM sellers WHERE id = ?");
        $stmtSellerLoc->execute([$seller_id]);
        $seller_info = $stmtSellerLoc->fetch();
        
        $stmtBuyerLoc = $pdo->prepare("SELECT city, latitude, longitude, address FROM users WHERE id = ?");
        $stmtBuyerLoc->execute([$user_id]);
        $buyer_info = $stmtBuyerLoc->fetch();
        
        if ($seller_info && $buyer_info && $seller_info['latitude'] && $buyer_info['latitude']) {
            $distance = DistanceCalculator::calculateDistance(
                $seller_info['latitude'], $seller_info['longitude'],
                $buyer_info['latitude'], $buyer_info['longitude']
            );
            
            $shipDetails = DistanceCalculator::calculateShippingCost(
                $seller_info['city'] ?? '',
                $buyer_info['city'] ?? '',
                $distance
            );
            
            $shipping_cost = $shipDetails['shipping_cost'];
            $shipping_address = $buyer_info['address'];
        }
    }
    
    // Recalculate Total
    $subtotal = 0;
    foreach ($items as $item) {
        $subtotal += ($item['price'] * $item['quantity']);
    }
    $total_price = $subtotal + $shipping_cost;
    // --- END SHIPPING CALCULATION ---

    $pdo->beginTransaction();

    $sqlOrder = "INSERT INTO orders (buyer_id, seller_id, total_amount, status, shipping_cost, distance_km, shipping_address, buyer_latitude, buyer_longitude, buyer_city, seller_city) VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?)";
    $stmtOrder = $pdo->prepare($sqlOrder);
    $stmtOrder->execute([
        $user_id, 
        $seller_id, 
        $total_price,
        $shipping_cost,
        $distance,
        $shipping_address,
        $buyer_info['latitude'] ?? null,
        $buyer_info['longitude'] ?? null,
        $buyer_info['city'] ?? null,
        $seller_info['city'] ?? null
    ]);

    $order_db_id = $pdo->lastInsertId();

    $sqlItem = "INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES (?, ?, ?, ?)";
    $stmtItem = $pdo->prepare($sqlItem);

    // --- PERUBAHAN DI SINI: Menghapus bagian 'terjual' ---
    $sqlUpdateProduct = "UPDATE `products` SET `stock` = `stock` - ? WHERE `id` = ? AND `stock` >= ?";
    $stmtUpdate = $pdo->prepare($sqlUpdateProduct);

    foreach ($items as $item) {
        $stmtItem->execute([
            $order_db_id, 
            $item['id'], 
            $item['quantity'], 
            $item['price']
        ]);

        // Eksekusi update stok saja
        $stmtUpdate->execute([
            (int)$item['quantity'], 
            (int)$item['id'],
            (int)$item['quantity']
        ]);

        if ($stmtUpdate->rowCount() === 0) {
            throw new Exception("Stok untuk produk " . $item['name'] . " tidak mencukupi.");
        }
    }

    $pdo->commit();

    $user_email = $_SESSION['email'] ?? null;
    $username   = $_SESSION['username'] ?? 'Pelanggan';

    if (!$user_email) {
        $stmtUser = $pdo->prepare("SELECT email FROM users WHERE id = ?");
        $stmtUser->execute([$user_id]);
        $userData = $stmtUser->fetch();
        $user_email = $userData['email'] ?? 'customer@example.com';
    }

    // Prepare Items for Midtrans
    $item_details = array_map(function($item) {
        return [
            'id' => (string)$item['id'],
            'price' => (int)$item['price'],
            'quantity' => (int)$item['quantity'],
            'name' => substr($item['name'], 0, 50)
        ];
    }, $items);

    if ($shipping_cost > 0) {
        $item_details[] = [
            'id' => 'SHIPPING',
            'price' => (int)$shipping_cost,
            'quantity' => 1,
            'name' => 'Ongkir (' . ($distance > 0 ? $distance . ' km' : 'Flat') . ')'
        ];
    }

    $params = [
        'transaction_details' => [
            'order_id' => $order_id_string,
            'gross_amount' => (int)$total_price,
        ],
        'customer_details' => [
            'first_name' => $username,
            'email' => $user_email,
            'shipping_address' => [
                'address' => $shipping_address,
                'city' => $buyer_info['city'] ?? ''
            ]
        ],
        'item_details' => $item_details
    ];


    
    $params = [
        'transaction_details' => [
            'order_id' => $order_id_string,
            'gross_amount' => (int)$total_price,
        ],
        'customer_details' => [
            'first_name' => $username,
            'email' => $user_email,
            'shipping_address' => [
                'address' => $shipping_address,
                'city' => $buyer_info['city'] ?? ''
            ]
        ],
        'item_details' => $item_details
    ];

    $snapToken = \Midtrans\Snap::getSnapToken($params);
    
    // Pastikan output hanya berupa token agar JSON.parse di frontend tidak error
    echo $snapToken;

} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    // Jika masih error, pesan ini akan muncul di console log cart.js
    echo "Error: " . $e->getMessage();
}