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
    // 1. Cek apakah pesanan milik user ini DAN statusnya 'shipped'
    $stmt = $pdo->prepare("SELECT status FROM orders WHERE id = ? AND buyer_id = ?");
    $stmt->execute([$order_id, $user_id]);
    $order = $stmt->fetch();

    if (!$order) {
        echo json_encode(['success' => false, 'message' => 'Pesanan tidak ditemukan']);
        exit;
    }

    if ($order['status'] !== 'shipped') {
        echo json_encode(['success' => false, 'message' => 'Hanya pesanan yang sedang dikirim yang bisa diselesaikan']);
        exit;
    }

    // 2. Update status ke 'completed'
    $stmtUpdate = $pdo->prepare("UPDATE orders SET status = 'completed' WHERE id = ?");
    $stmtUpdate->execute([$order_id]);

    echo json_encode(['success' => true, 'message' => 'Pesanan telah diterima']);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
