<?php
header('Content-Type: application/json');
require_once '../config/config.php';

if (!isset($_GET['id'])) {
    echo json_encode(['success' => false, 'message' => 'Product ID is required']);
    exit;
}

$product_id = intval($_GET['id']);

try {
    // Join products with sellers to get store info
    // Also join sellers with users to get username if needed
    $stmt = $pdo->prepare("
        SELECT 
            p.*, 
            s.store_name, 
            s.profile_photo as seller_photo,
            s.city as seller_city,
            s.address as seller_address,
            u.username as seller_username
        FROM products p
        JOIN sellers s ON p.seller_id = s.id
        JOIN users u ON s.user_id = u.id
        WHERE p.id = ?
    ");
    
    $stmt->execute([$product_id]);
    $product = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($product) {
        // Decode variants json if exists
        $product['variants'] = $product['variants'] ? json_decode($product['variants'], true) : null;
        
        // Construct clean response
        $response = [
            'success' => true,
            'data' => [
                'id' => $product['id'],
                'name' => $product['name'],
                'price' => $product['price'],
                'stock' => $product['stock'],
                'weight' => $product['weight'],
                'description' => $product['description'],
                'image' => $product['image'],
                'category_id' => $product['category_id'],
                'variants' => $product['variants'],
                'seller' => [
                    'id' => $product['seller_id'],
                    'store_name' => $product['store_name'],
                    'username' => $product['seller_username'],
                    'photo' => $product['seller_photo'],
                    'location' => $product['seller_city'] ?? $product['seller_address'] ?? 'Indonesia'
                ]
            ]
        ];
        
        echo json_encode($response);
    } else {
        echo json_encode(['success' => false, 'message' => 'Product not found']);
    }

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
