<?php
header('Content-Type: application/json');
require_once '../config/config.php';
session_start();

// Validasi user login
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['order_id'])) {
    echo json_encode(['success' => false, 'message' => 'Missing order_id']);
    exit;
}

$order_id = $data['order_id'];
$user_id = $_SESSION['user_id'];

try {
    // 1. Validasi order milik user DAN status = 'shipped'
    $stmt = $pdo->prepare("SELECT o.id, o.status, o.seller_id FROM orders o WHERE o.id = ? AND o.buyer_id = ?");
    $stmt->execute([$order_id, $user_id]);
    $order = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$order) {
        echo json_encode(['success' => false, 'message' => 'Pesanan tidak ditemukan']);
        exit;
    }

    if ($order['status'] !== 'shipped') {
        echo json_encode(['success' => false, 'message' => 'Hanya pesanan yang sudah dikirim yang bisa di-return']);
        exit;
    }

    // 2. Update status ke 'return_requested'
    $updateStmt = $pdo->prepare("UPDATE orders SET status = 'return_requested' WHERE id = ?");
    $updateStmt->execute([$order_id]);

    // 3. Kirim notifikasi ke seller
    require_once '../helpers/notification_helper.php';
    
    // Get seller user_id for notification
    $sellerStmt = $pdo->prepare("SELECT user_id FROM sellers WHERE id = ?");
    $sellerStmt->execute([$order['seller_id']]);
    $sellerUserId = $sellerStmt->fetchColumn();

    if ($sellerUserId) {
        createNotification(
            $pdo, 
            $sellerUserId, 
            "Permintaan Return", 
            "Pembeli mengajukan return untuk pesanan #ORD-{$order_id}", 
            $order_id, 
            "warning"
        );
    }

    echo json_encode(['success' => true, 'message' => 'Permintaan return berhasil diajukan']);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
