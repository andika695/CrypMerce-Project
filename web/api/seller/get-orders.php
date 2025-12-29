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

$seller_id = $_SESSION['seller_id'];

try {
    // Fetch orders for this seller with buyer info
    $stmt = $pdo->prepare("
        SELECT 
            o.id, 
            o.total_amount, 
            o.status, 
            o.created_at, 
            u.username as buyer_name,
            (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as total_items
        FROM orders o
        JOIN users u ON o.buyer_id = u.id
        WHERE o.seller_id = :seller_id
        ORDER BY o.created_at DESC
    ");
    $stmt->execute(['seller_id' => $seller_id]);
    $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'data' => $orders]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
