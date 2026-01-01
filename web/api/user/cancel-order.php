<?php
header('Content-Type: application/json');
require_once '../config/config.php';
session_start();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$order_id = $data['order_id'] ?? null;
$user_id = $_SESSION['user_id'];

if (!$order_id) {
    echo json_encode(['success' => false, 'message' => 'Order ID required']);
    exit;
}

try {
    // 1. Cek apakah pesanan milik user ini DAN statusnya masih 'pending'
    $stmt = $pdo->prepare("SELECT status FROM orders WHERE id = ? AND buyer_id = ?");
    $stmt->execute([$order_id, $user_id]);
    $order = $stmt->fetch();

    if (!$order) {
        echo json_encode(['success' => false, 'message' => 'Pesanan tidak ditemukan']);
        exit;
    }

    if ($order['status'] !== 'pending') {
        echo json_encode(['success' => false, 'message' => 'Hanya pesanan pending yang bisa dibatalkan']);
        exit;
    }

    // 2. Batalkan pesanan
    // (Opsional: Kembalikan stok produk jika sistem mengharuskan)
    
    $pdo->beginTransaction();
    
    // Update status
    $stmtUpdate = $pdo->prepare("UPDATE orders SET status = 'cancelled' WHERE id = ?");
    $stmtUpdate->execute([$order_id]);
    
    // Kembalikan stok (Loop status item di order ini)
    $stmtItems = $pdo->prepare("SELECT product_id, quantity FROM order_items WHERE order_id = ?");
    $stmtItems->execute([$order_id]);
    $items = $stmtItems->fetchAll();
    
    $stmtRestock = $pdo->prepare("UPDATE products SET stock = stock + ? WHERE id = ?");
    foreach ($items as $item) {
        $stmtRestock->execute([$item['quantity'], $item['product_id']]);
    }
    
    $pdo->commit();
    
    echo json_encode(['success' => true, 'message' => 'Pesanan berhasil dibatalkan']);

} catch (PDOException $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>