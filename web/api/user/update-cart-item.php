<?php
session_start();
require '../config/config.php';

header('Content-Type: application/json');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

// Debug logging
error_log("=== UPDATE CART ITEM DEBUG ===");
error_log("Session: " . json_encode($_SESSION));
error_log("POST: " . json_encode($_POST));

// Check if user is logged in
if (!isset($_SESSION['user']) || !isset($_SESSION['user']['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'User not logged in']);
    exit;
}

$user_id = $_SESSION['user']['user_id'];

// Validate input
if (!isset($_POST['cart_item_id']) || !isset($_POST['quantity'])) {
    echo json_encode([
        'success' => false, 
        'message' => 'Missing required fields',
        'received' => [
            'cart_item_id' => $_POST['cart_item_id'] ?? 'missing',
            'quantity' => $_POST['quantity'] ?? 'missing'
        ]
    ]);
    exit;
}

$cart_item_id = intval($_POST['cart_item_id']);
$quantity = intval($_POST['quantity']);

error_log("Cart Item ID: $cart_item_id, New Quantity: $quantity, User ID: $user_id");

// Validate quantity
if ($quantity <= 0) {
    echo json_encode(['success' => false, 'message' => 'Invalid quantity: ' . $quantity]);
    exit;
}

try {
    // Check if cart item belongs to user and get product stock
    $stmt = $pdo->prepare("
        SELECT c.id, c.user_id, p.stock, p.name as product_name
        FROM cart c
        INNER JOIN products p ON c.product_id = p.id
        WHERE c.id = ?
    ");
    $stmt->execute([$cart_item_id]);
    $cart_item = $stmt->fetch();
    
    error_log("Cart item query result: " . json_encode($cart_item));
    
    if (!$cart_item) {
        echo json_encode([
            'success' => false, 
            'message' => 'Cart item not found',
            'debug' => [
                'cart_item_id' => $cart_item_id,
                'searched' => true,
                'found' => false
            ]
        ]);
        exit;
    }
    
    // Verify ownership
    if ($cart_item['user_id'] != $user_id) {
        echo json_encode([
            'success' => false, 
            'message' => 'Unauthorized access to cart item',
            'debug' => [
                'cart_user_id' => $cart_item['user_id'],
                'session_user_id' => $user_id
            ]
        ]);
        exit;
    }
    
    // Check stock
    if ($cart_item['stock'] < $quantity) {
        echo json_encode([
            'success' => false, 
            'message' => 'Insufficient stock. Available: ' . $cart_item['stock']
        ]);
        exit;
    }
    
    // Update quantity
    $stmt = $pdo->prepare("UPDATE cart SET quantity = ?, updated_at = NOW() WHERE id = ?");
    $result = $stmt->execute([$quantity, $cart_item_id]);
    
    error_log("Update executed: " . ($result ? 'success' : 'failed'));
    error_log("Rows affected: " . $stmt->rowCount());
    
    if ($result) {
        echo json_encode([
            'success' => true, 
            'message' => 'Cart updated successfully',
            'new_quantity' => $quantity
        ]);
    } else {
        echo json_encode([
            'success' => false, 
            'message' => 'Failed to update cart'
        ]);
    }
    
} catch (PDOException $e) {
    error_log("PDO Exception: " . $e->getMessage());
    echo json_encode([
        'success' => false, 
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>
