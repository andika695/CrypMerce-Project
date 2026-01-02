<?php
session_start();
require '../config/config.php';

header('Content-Type: application/json');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

// Check if user is logged in
if (!isset($_SESSION['user']) || !isset($_SESSION['user']['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'User not authenticated']);
    exit;
}

$user_id = $_SESSION['user']['user_id'];

// Validate input
if (!isset($_POST['cart_item_id'])) {
    echo json_encode(['success' => false, 'message' => 'Missing cart item ID']);
    exit;
}

$cart_item_id = intval($_POST['cart_item_id']);

try {
    // Check if cart item belongs to user
    $stmt = $pdo->prepare("SELECT id FROM cart WHERE id = ? AND user_id = ?");
    $stmt->execute([$cart_item_id, $user_id]);
    $cart_item = $stmt->fetch();
    
    if (!$cart_item) {
        echo json_encode(['success' => false, 'message' => 'Cart item not found']);
        exit;
    }
    
    // Delete cart item
    $stmt = $pdo->prepare("DELETE FROM cart WHERE id = ?");
    $stmt->execute([$cart_item_id]);
    
    echo json_encode(['success' => true, 'message' => 'Item removed from cart']);
    
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
