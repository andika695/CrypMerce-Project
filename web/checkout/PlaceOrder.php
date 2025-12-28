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

    $pdo->beginTransaction();

    $sqlOrder = "INSERT INTO orders (buyer_id, seller_id, total_amount, status) VALUES (?, ?, ?, 'pending')";
    $stmtOrder = $pdo->prepare($sqlOrder);
    $stmtOrder->execute([$user_id, $seller_id, $total_price]);

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

    $params = [
        'transaction_details' => [
            'order_id' => $order_id_string,
            'gross_amount' => (int)$total_price,
        ],
        'customer_details' => [
            'first_name' => $username,
            'email' => $user_email,
        ],
        'item_details' => array_map(function($item) {
            return [
                'id' => (string)$item['id'],
                'price' => (int)$item['price'],
                'quantity' => (int)$item['quantity'],
                'name' => substr($item['name'], 0, 50)
            ];
        }, $items)
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