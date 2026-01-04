<?php
require '../config/config.php';

header('Content-Type: application/json');

$category = $_GET['category'] ?? null;
$category_id = $_GET['category_id'] ?? null;
$search = $_GET['search'] ?? null;
$sort = $_GET['sort'] ?? null;
$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
$offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;

try {
    $sql = "
        SELECT 
            p.id, p.name, p.price, p.stock, p.image, p.created_at, c.name as category_name,
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
            ) as avg_rating,
            s.store_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN sellers s ON p.seller_id = s.id
        WHERE p.stock > 0
    ";
    
    $params = [];
    
    // Support both category slug and category_id
    if ($category_id) {
        $sql .= " AND p.category_id = :category_id";
        $params['category_id'] = (int)$category_id;
    } elseif ($category) {
        $sql .= " AND LOWER(REPLACE(c.name, ' ', '-')) = :category";
        $params['category'] = strtolower($category);
    }
    
    if ($search) {
        $sql .= " AND p.name LIKE :search";
        $params['search'] = '%' . $search . '%';
    }

    if ($sort === 'best_selling') {
        $sql .= " ORDER BY sold_count DESC";
    } else {
        $sql .= " ORDER BY p.created_at DESC";
    }

    $sql .= " LIMIT " . $limit . " OFFSET " . $offset;

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Format data produk
    foreach ($products as &$product) {
        // Handle path gambar
        if ($product['image']) {
            if (strpos($product['image'], 'http') !== 0) {
                // Gambar lokal lama
                $product['image'] = '../assets/images/products/' . $product['image'];
            }
        } else {
            // Default image jika tidak ada gambar
            $product['image'] = '../assets/images/no-image.png';
        }
        
        // Format harga
        $product['price'] = (float) $product['price'];
        $product['stock'] = (int) $product['stock'];
    }

    echo json_encode([
        'success' => true,
        'data' => $products
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Gagal mengambil data produk',
        'error' => $e->getMessage()
    ]);
}
