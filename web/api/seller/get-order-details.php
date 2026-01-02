<?php
header('Content-Type: application/json');
require_once '../config/config.php';
session_start();

if (!isset($_SESSION['seller']) || !isset($_SESSION['seller']['seller_id'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$seller_id = $_SESSION['seller']['seller_id'];

// Get order_id from request
$order_id = isset($_GET['order_id']) ? intval($_GET['order_id']) : (isset($_POST['order_id']) ? intval($_POST['order_id']) : 0);

if (!$order_id) {
    echo json_encode(['success' => false, 'message' => 'Order ID is required']);
    exit;
}

try {
    // First, verify that the order belongs to this seller
    $checkStmt = $pdo->prepare("SELECT id, total_amount, status, created_at FROM orders WHERE id = :order_id AND seller_id = :seller_id");
    $checkStmt->execute([
        'order_id' => $order_id,
        'seller_id' => $seller_id
    ]);
    $order = $checkStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$order) {
        echo json_encode(['success' => false, 'message' => 'Order not found or does not belong to this seller']);
        exit;
    }
    
    // Fetch order items with product details
    $itemsStmt = $pdo->prepare("
        SELECT 
            p.name as product_name,
            p.image as product_image,
            oi.quantity,
            oi.price_at_purchase,
            (oi.quantity * oi.price_at_purchase) as subtotal
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = :order_id
        ORDER BY oi.id ASC
    ");
    $itemsStmt->execute(['order_id' => $order_id]);
    $items = $itemsStmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'order' => $order,
        'items' => $items
    ]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
