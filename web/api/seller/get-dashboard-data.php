<?php
session_start();
require '../config/config.php';

header('Content-Type: application/json');

// Check if seller is logged in
if (!isset($_SESSION['seller']) || !isset($_SESSION['seller']['seller_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Sesi berakhir, silakan login kembali']);
    exit;
}

$seller_id = $_SESSION['seller']['seller_id'];

try {
    // 1. Get stats
    $statsQuery = "
        SELECT 
            COUNT(*) as total_products,
            COALESCE(SUM(stock), 0) as total_stock
        FROM products 
        WHERE seller_id = :seller_id
    ";
    
    $stmt = $pdo->prepare($statsQuery);
    $stmt->execute(['seller_id' => $seller_id]);
    $stats = $stmt->fetch(PDO::FETCH_ASSOC);

    // 2. Get order count (handle case where orders table might not exist yet)
    $total_orders = 0;
    try {
        $orderCountStmt = $pdo->prepare("SELECT COUNT(*) FROM orders WHERE seller_id = :seller_id");
        $orderCountStmt->execute(['seller_id' => $seller_id]);
        $total_orders = (int)$orderCountStmt->fetchColumn();
    } catch (PDOException $e) {
        $total_orders = 0;
    }

    // 3. Get follower count (handle case where follows table might not exist yet)
    $follower_count = 0;
    try {
        $followerCountStmt = $pdo->prepare("SELECT COUNT(*) FROM follows WHERE seller_id = :seller_id");
        $followerCountStmt->execute(['seller_id' => $seller_id]);
        $follower_count = (int)$followerCountStmt->fetchColumn();
    } catch (PDOException $e) {
        $follower_count = 0; // Silent fail if table doesn't exist
    }
    
    // 4. Get total revenue from completed orders
    $total_revenue = 0;
    try {
        $revenueStmt = $pdo->prepare("
            SELECT COALESCE(SUM(total_amount), 0) as revenue 
            FROM orders 
            WHERE seller_id = :seller_id AND status = 'completed'
        ");
        $revenueStmt->execute(['seller_id' => $seller_id]);
        $total_revenue = (float)$revenueStmt->fetchColumn();
    } catch (PDOException $e) {
        $total_revenue = 0;
    }
    
    // 5. Get recent products
    $productsQuery = "
        SELECT 
            p.id,
            p.name,
            p.price,
            p.stock,
            p.weight,
            p.image,
            c.name as category_name,
            p.created_at
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.seller_id = :seller_id
        ORDER BY p.created_at DESC
    ";
    
    $stmt = $pdo->prepare($productsQuery);
    $stmt->execute(['seller_id' => $seller_id]);
    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Format data
    foreach ($products as &$product) {
        $product['price'] = (float) $product['price'];
        $product['stock'] = (int) $product['stock'];
        $product['weight'] = (int) $product['weight'];
    }
    
    echo json_encode([
        'success' => true,
        'stats' => [
            'total_products' => (int) $stats['total_products'],
            'total_stock' => (int) $stats['total_stock'],
            'total_orders' => $total_orders,
            'follower_count' => $follower_count,
            'total_revenue' => $total_revenue
        ],
        'products' => $products
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}
