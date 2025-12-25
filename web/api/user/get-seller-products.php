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
            c.name as category_name
         FROM products p
         LEFT JOIN categories c ON p.category_id = c.id
         WHERE p.seller_id = :seller_id
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
