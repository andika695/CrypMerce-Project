<?php
header('Content-Type: application/json');
require_once '../config/config.php';
session_start();

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'seller') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

// Robust seller_id recovery
if (!isset($_SESSION['seller_id'])) {
    $recoveryStmt = $pdo->prepare("SELECT id FROM sellers WHERE user_id = :uid");
    $recoveryStmt->execute([':uid' => $_SESSION['user_id']]);
    $recoveredId = $recoveryStmt->fetchColumn();
    if ($recoveredId) {
        $_SESSION['seller_id'] = $recoveredId;
    } else {
        echo json_encode(['success' => false, 'message' => 'Seller ID not found']);
        exit;
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
    // Verify order belongs to seller
    $checkStmt = $pdo->prepare("SELECT id FROM orders WHERE id = :order_id AND seller_id = :seller_id");
    $checkStmt->execute(['order_id' => $order_id, 'seller_id' => $seller_id]);
    
    if (!$checkStmt->fetch()) {
        echo json_encode(['success' => false, 'message' => 'Order not found or access denied']);
        exit;
    }

    $stmt = $pdo->prepare("UPDATE orders SET status = :status WHERE id = :order_id");
    $stmt->execute(['status' => $status, 'order_id' => $order_id]);

    echo json_encode(['success' => true, 'message' => 'Order status updated successfully']);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
