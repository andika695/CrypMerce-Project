<?php
session_start();
require '../config/config.php';

header('Content-Type: application/json');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

// Debug: log session info
error_log("Cart API - User ID: " . ($_SESSION['user']['user_id'] ?? 'not set'));
error_log("Cart API - Role: " . ($_SESSION['user']['role'] ?? 'not set'));

// Check if user is logged in
if (!isset($_SESSION['user']) || !isset($_SESSION['user']['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'User not logged in', 'debug' => 'no_session']);
    exit;
}

$user_id = $_SESSION['user']['user_id'];

try {
    // First, check if cart has any items for this user
    $countStmt = $pdo->prepare("SELECT COUNT(*) as count FROM cart WHERE user_id = ?");
    $countStmt->execute([$user_id]);
    $countResult = $countStmt->fetch();
    
    error_log("Cart items count: " . $countResult['count']);
    
    // Get cart items with product details
    $stmt = $pdo->prepare("
        SELECT 
            c.id as cart_item_id,
            c.quantity,
            c.selected_size,
            c.selected_color,
            c.added_at,
            p.id as product_id,
            p.name as product_name,
            p.description as product_description,
            p.price as product_price,
            p.stock as product_stock,
            p.image as product_image,
            p.image as product_image,
            cat.name as category_name,
            s.id as seller_id,
            s.store_name as seller_name,
            s.location as seller_location,
            s.profile_photo as seller_photo
        FROM cart c
        INNER JOIN products p ON c.product_id = p.id
        LEFT JOIN categories cat ON p.category_id = cat.id
        INNER JOIN sellers s ON p.seller_id = s.id
        WHERE c.user_id = ?
        ORDER BY s.store_name, c.added_at DESC
    ");
    
    $stmt->execute([$user_id]);
    $cart_items = $stmt->fetchAll();
    
    error_log("Cart items fetched: " . count($cart_items));
    
    // Calculate subtotal for each item
    foreach ($cart_items as &$row) {
        $row['subtotal'] = floatval($row['product_price']) * intval($row['quantity']);
        // Convert to proper types
        $row['product_price'] = floatval($row['product_price']);
        $row['quantity'] = intval($row['quantity']);
        $row['product_stock'] = intval($row['product_stock']);
    }
    
    // Calculate totals
    $total_items = count($cart_items);
    $total_price = array_sum(array_column($cart_items, 'subtotal'));
    
    echo json_encode([
        'success' => true,
        'cart_items' => $cart_items,
        'total_items' => $total_items,
        'total_price' => $total_price,
        'debug' => [
            'user_id' => $user_id,
            'count_from_db' => $countResult['count']
        ]
    ]);
    
} catch (PDOException $e) {
    error_log("Cart API Error: " . $e->getMessage());
    echo json_encode([
        'success' => false, 
        'message' => 'Database error',
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ]);
}
?>
