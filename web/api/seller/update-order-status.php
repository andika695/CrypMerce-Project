<?php
header('Content-Type: application/json');
require_once '../config/config.php';
session_start();

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

// Robust seller_id recovery & Self-Healing
if (!isset($_SESSION['seller_id'])) {
    $userId = $_SESSION['user_id'];
    
    // Check if seller record exists
    $checkStmt = $pdo->prepare("SELECT id FROM sellers WHERE user_id = :uid");
    $checkStmt->execute([':uid' => $userId]);
    $recoveredId = $checkStmt->fetchColumn();

    if ($recoveredId) {
        $_SESSION['seller_id'] = $recoveredId;
        $_SESSION['role'] = 'seller';
    } else {
        // Auto-create if user has seller role but no record
        $roleStmt = $pdo->prepare("SELECT role, username FROM users WHERE id = :uid");
        $roleStmt->execute([':uid' => $userId]);
        $userData = $roleStmt->fetch(PDO::FETCH_ASSOC);

        if ($userData && $userData['role'] === 'seller') {
             $createStmt = $pdo->prepare("INSERT INTO sellers (user_id, store_name) VALUES (:uid, :store_name)");
             $defaultStoreName = $userData['username'] . "'s Store";
             $createStmt->execute([':uid' => $userId, ':store_name' => $defaultStoreName]);
             
             $_SESSION['seller_id'] = $pdo->lastInsertId();
             $_SESSION['role'] = 'seller';
        } else {
             echo json_encode(['success' => false, 'message' => 'Access denied: Not a seller']);
             exit;
        }
    }
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['order_id']) || !isset($data['status'])) {
    echo json_encode(['success' => false, 'message' => 'Missing required fields']);
    exit;
}

$order_id = $data['order_id'];
$status = $data['status'];
$seller_id = $_SESSION['seller_id'];

try {
    // Verify order belongs to seller AND fetch buyer_id for notification
    $checkStmt = $pdo->prepare("SELECT id, buyer_id FROM orders WHERE id = :order_id AND seller_id = :seller_id");
    $checkStmt->execute(['order_id' => $order_id, 'seller_id' => $seller_id]);
    
    $orderData = $checkStmt->fetch(PDO::FETCH_ASSOC);

    if (!$orderData) {
        echo json_encode(['success' => false, 'message' => 'Order not found or access denied']);
        exit;
    }

    $stmt = $pdo->prepare("UPDATE orders SET status = :status WHERE id = :order_id");
    $stmt->execute(['status' => $status, 'order_id' => $order_id]);

    // Send Notification
    require_once '../helpers/notification_helper.php';
    
    $title = "Update Pesanan";
    $message = "Status pesanan Anda telah diperbarui.";
    $type = "info";

    if ($status === 'processing') {
        $title = "Pesanan Diterima";
        $message = "Penjual telah menerima pesanan Anda.";
    } else if ($status === 'confirmed') {
        $title = "Pesanan Dikonfirmasi";
        $message = "Pesanan sedang dikemas oleh penjual.";
        $type = "success";
    } else if ($status === 'shipped') {
        $title = "Pesanan Dikirim";
        $message = "Pesanan Anda sedang dalam perjalanan.";
        $type = "success";
    } else if ($status === 'cancelled') {
        $title = "Pesanan Ditolak";
        $message = "Maaf, pesanan Anda ditolak oleh penjual.";
        $type = "error";
    }

    createNotification($pdo, $orderData['buyer_id'], $title, $message, $order_id, $type);

    echo json_encode(['success' => true, 'message' => 'Order status updated successfully']);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
