<?php
session_start();
require '../config/config.php';

header('Content-Type: application/json');

// Check if user is logged in as seller
if (!isset($_SESSION['seller_id'])) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'Unauthorized'
    ]);
    exit;
}

// Get seller_id from session
$seller_id = $_SESSION['seller_id'];

try {
    // Get stats
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
    
    // Get recent products
    $productsQuery = "
        SELECT 
            p.id,
            p.name,
            p.price,
            p.stock,
            c.name as category_name,
            p.created_at
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.seller_id = :seller_id
        ORDER BY p.created_at DESC
        LIMIT 10
    ";
    
    $stmt = $pdo->prepare($productsQuery);
    $stmt->execute(['seller_id' => $seller_id]);
    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Format data
    foreach ($products as &$product) {
        $product['price'] = (float) $product['price'];
        $product['stock'] = (int) $product['stock'];
    }
    
    echo json_encode([
        'success' => true,
        'stats' => [
            'total_products' => (int) $stats['total_products'],
            'total_stock' => (int) $stats['total_stock'],
            'total_orders' => 0 // Placeholder untuk pesanan
        ],
        'products' => $products
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Gagal mengambil data',
        'error' => $e->getMessage()
    ]);
}
