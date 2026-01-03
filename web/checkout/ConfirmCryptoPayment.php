<?php
// Prevent any HTML output
ob_start();
ini_set('display_errors', '0');
error_reporting(E_ALL);

header('Content-Type: application/json');
require_once '../api/config/config.php';
require_once '../api/helpers/notification_helper.php';

try {
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);

    if (!$data || !isset($data['order_uuid'])) {
        throw new Exception('Order UUID required');
    }

    $uuid = $data['order_uuid'];

    $pdo->beginTransaction();

    // Get Order
    $stmt = $pdo->prepare("SELECT id, status, buyer_id FROM orders WHERE midtrans_order_uuid = ?");
    $stmt->execute([$uuid]);
    $order = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$order) throw new Exception('Order not found');
    if ($order['status'] !== 'pending') {
        throw new Exception('Order is not in pending state');
    }

    $order_id = $order['id'];

    // Update Status to processing (Paid)
    $stmtUpdate = $pdo->prepare("UPDATE orders SET status = 'processing' WHERE id = ?");
    $stmtUpdate->execute([$order_id]);

    // Reduce Stock
    $stmtItems = $pdo->prepare("SELECT product_id, quantity FROM order_items WHERE order_id = ?");
    $stmtItems->execute([$order_id]);
    $items = $stmtItems->fetchAll(PDO::FETCH_ASSOC);

    $updateStock = $pdo->prepare("UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?");
    
    foreach ($items as $item) {
        $qty = (int)$item['quantity'];
        $prodId = (int)$item['product_id'];
        $updateStock->execute([$qty, $prodId, $qty]);
    }

    // Notification
    createNotification($pdo, $order['buyer_id'], "Pembayaran Crypto Berhasil", "Pembayaran Crypto Anda telah dikonfirmasi.", $order_id, "success");

    $pdo->commit();
    ob_clean();
    echo json_encode(['success' => true]);

} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    ob_clean();
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
