<?php
header('Content-Type: application/json');
require_once '../config/config.php';

$seller_id = $_GET['id'] ?? null;

if (!$seller_id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Seller ID diperlukan']);
    exit;
}

try {
    $stmt = $pdo->prepare(
        "SELECT 
            p.id,
            p.name,
            p.price,
            p.stock,
            p.image,
            c.name as category_name,
            s.store_name,
            (
                SELECT COALESCE(SUM(oi.quantity), 0)
                FROM order_items oi
                JOIN orders o ON oi.order_id = o.id
                WHERE oi.product_id = p.id AND o.status = 'completed'
            ) as sold_count,
            (
                SELECT COALESCE(AVG(r.rating), 0)
                FROM store_ratings r
                JOIN orders o ON r.order_id = o.id
                JOIN order_items oi ON o.id = oi.order_id
                WHERE oi.product_id = p.id
            ) as avg_rating
         FROM products p
         LEFT JOIN categories c ON p.category_id = c.id
         LEFT JOIN sellers s ON p.seller_id = s.id
         WHERE p.seller_id = :seller_id AND p.stock > 0
         ORDER BY p.created_at DESC"
    );
    $stmt->execute(['seller_id' => $seller_id]);
    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'products' => $products
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}
?>
