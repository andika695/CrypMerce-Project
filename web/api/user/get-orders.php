<?php
header('Content-Type: application/json');
require_once '../config/config.php';
session_start();

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit();
}

$user_id = $_SESSION['user_id']; // Ambil ID user dari session login

// Query untuk mengambil riwayat pesanan beserta satu contoh nama produk untuk ringkasan
try {
    $sql = "SELECT o.id, o.total_amount, o.status, o.created_at, 
            s.store_name
            FROM orders o
            JOIN sellers s ON o.seller_id = s.id
            WHERE o.buyer_id = ?
            ORDER BY o.created_at DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([$user_id]);
    $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($orders as &$order) { 
       $stmtItems = $pdo->prepare("
            SELECT p.name, p.image, oi.quantity, oi.price_at_purchase
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = ?
        ");
        $stmtItems->execute([$order['id']]);
        $order['items'] = $stmtItems->fetchAll(PDO::FETCH_ASSOC);
        
        // Format tanggal
        $order['created_at_formatted'] = date('d M Y H:i', strtotime($order['created_at']));
    }

    echo json_encode(['success' => true, 'data' => $orders]);
    
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>