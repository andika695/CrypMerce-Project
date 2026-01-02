<?php
// Prevent any output before JSON
ob_start();
ini_set('display_errors', '0');
error_reporting(E_ALL);

session_start();
require '../config/config.php';

header('Content-Type: application/json');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

// Debug logging
error_log("=== ADD TO CART DEBUG ===");
error_log("Session data: " . json_encode($_SESSION));
error_log("POST data: " . json_encode($_POST));

// Check if user is logged in
if (!isset($_SESSION['user']) || !isset($_SESSION['user']['user_id'])) {
    ob_clean();
    echo json_encode(['success' => false, 'message' => 'User not logged in', 'debug' => 'no_session']);
    exit;
}

// Allow both user and seller for now (for testing)
$user_id = $_SESSION['user']['user_id'];
error_log("User ID: " . $user_id);

// Validate input
if (!isset($_POST['product_id']) || !isset($_POST['quantity'])) {
    ob_clean();
    echo json_encode(['success' => false, 'message' => 'Missing required fields: ' . (!isset($_POST['product_id']) ? 'product_id ' : '') . (!isset($_POST['quantity']) ? 'quantity' : '')]);
    exit;
}

$product_id = intval($_POST['product_id']);
$quantity = intval($_POST['quantity']);
$selected_size = isset($_POST['selected_size']) ? trim($_POST['selected_size']) : null;
$selected_color = isset($_POST['selected_color']) ? trim($_POST['selected_color']) : null;

error_log("Product ID: $product_id, Quantity: $quantity, Size: $selected_size, Color: $selected_color");

// Validate quantity
if ($quantity <= 0) {
    ob_clean();
    echo json_encode(['success' => false, 'message' => 'Invalid quantity: ' . $quantity]);
    exit;
}

try {
    // Check if product exists and has enough stock
    $stmt = $pdo->prepare("SELECT id, stock FROM products WHERE id = ?");
    $stmt->execute([$product_id]);
    $product = $stmt->fetch();
    
    error_log("Product query result: " . json_encode($product));
    
    if (!$product) {
        ob_clean();
        echo json_encode(['success' => false, 'message' => 'Product not found with ID: ' . $product_id]);
        exit;
    }
    
    if ($product['stock'] < $quantity) {
        ob_clean();
        echo json_encode(['success' => false, 'message' => 'Insufficient stock. Available: ' . $product['stock'] . ', Requested: ' . $quantity]);
        exit;
    }
    
    // Check if item already exists in cart
    $stmt = $pdo->prepare("
        SELECT id, quantity FROM cart 
        WHERE user_id = ? AND product_id = ? 
        AND (selected_size = ? OR (selected_size IS NULL AND ? IS NULL))
        AND (selected_color = ? OR (selected_color IS NULL AND ? IS NULL))
    ");
    $stmt->execute([$user_id, $product_id, $selected_size, $selected_size, $selected_color, $selected_color]);
    $cart_item = $stmt->fetch();
    
    error_log("Existing cart item: " . json_encode($cart_item));
    
    if ($cart_item) {
        // Update existing cart item
        $new_quantity = $cart_item['quantity'] + $quantity;
        
        // Check stock again for new quantity
        if ($product['stock'] < $new_quantity) {
            ob_clean();
            echo json_encode(['success' => false, 'message' => 'Insufficient stock for total quantity. Available: ' . $product['stock'] . ', Total requested: ' . $new_quantity]);
            exit;
        }
        
        $stmt = $pdo->prepare("UPDATE cart SET quantity = ?, updated_at = NOW() WHERE id = ?");
        $result = $stmt->execute([$new_quantity, $cart_item['id']]);
        
        error_log("Update result: " . ($result ? 'success' : 'failed'));
        
        ob_clean();
        echo json_encode([
            'success' => true, 
            'message' => 'Cart updated successfully',
            'cart_item_id' => $cart_item['id'],
            'action' => 'updated'
        ]);
    } else {
        // Insert new cart item
        $stmt = $pdo->prepare("
            INSERT INTO cart (user_id, product_id, quantity, selected_size, selected_color) 
            VALUES (?, ?, ?, ?, ?)
        ");
        $result = $stmt->execute([$user_id, $product_id, $quantity, $selected_size, $selected_color]);
        
        error_log("Insert result: " . ($result ? 'success' : 'failed'));
        error_log("Last insert ID: " . $pdo->lastInsertId());
        error_log("Rows affected: " . $stmt->rowCount());
        
        if ($result && $stmt->rowCount() > 0) {
            ob_clean();
            echo json_encode([
                'success' => true, 
                'message' => 'Item added to cart successfully',
                'cart_item_id' => $pdo->lastInsertId(),
                'action' => 'inserted'
            ]);
        } else {
            ob_clean();
            echo json_encode([
                'success' => false, 
                'message' => 'Failed to insert into cart. No rows affected.',
                'debug' => 'insert_failed'
            ]);
        }
    }
    
} catch (PDOException $e) {
    error_log("PDO Exception: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    ob_clean();
    echo json_encode([
        'success' => false, 
        'message' => 'Database error: ' . $e->getMessage(),
        'error_code' => $e->getCode()
    ]);
}
?>
