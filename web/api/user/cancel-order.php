<?php
header('Content-Type: application/json');
require_once '../config/config.php';
session_start();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$user_id = null;
if (isset($_SESSION['user']['user_id'])) {
    $user_id = $_SESSION['user']['user_id'];
}

if (!$user_id) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$order_id = $data['order_id'] ?? null;

if (!$order_id) {
    echo json_encode(['success' => false, 'message' => 'Order ID required']);
    exit;
}

try {
    $pdo->beginTransaction();

    // 1. Cek User & Order
    $stmt = $pdo->prepare("SELECT status FROM orders WHERE id = ? AND buyer_id = ?");
    $stmt->execute([$order_id, $user_id]);
    $order = $stmt->fetch();

    if (!$order) {
        throw new Exception("Pesanan tidak ditemukan");
    }

    if ($order['status'] !== 'pending' && $order['status'] !== 'processing') {
        throw new Exception("Pesanan tidak dapat dibatalkan pada tahap ini");
    }

    // 2. Logic Refund Stok (Hanya jika processing/paid)
    if ($order['status'] === 'processing') {
        $stmtItems = $pdo->prepare("SELECT product_id, quantity FROM order_items WHERE order_id = ?");
        $stmtItems->execute([$order_id]);
        $items = $stmtItems->fetchAll(); // ADDED: fetch items
        
        $stmtRestock = $pdo->prepare("UPDATE products SET stock = stock + ? WHERE id = ?");
        foreach ($items as $item) {
            $stmtRestock->execute([$item['quantity'], $item['product_id']]);
        }
    }

    // 3. Update Status Pesanan (ADDED: missing status update)
    $stmtUpdate = $pdo->prepare("UPDATE orders SET status = 'cancelled' WHERE id = ?");
    $stmtUpdate->execute([$order_id]);
    
    $pdo->commit();
    
    echo json_encode(['success' => true, 'message' => 'Pesanan berhasil dibatalkan']);

} catch (Exception $e) { // CHANGED: catch all exceptions
    if ($pdo->inTransaction()) $pdo->rollBack();
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
?>