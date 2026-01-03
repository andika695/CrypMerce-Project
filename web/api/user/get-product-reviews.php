<?php
header('Content-Type: application/json');
require_once '../config/config.php';

$product_id = $_GET['id'] ?? null;

if (!$product_id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Product ID diperlukan']);
    exit;
}

try {
    // Query untuk mengambil ulasan yang terkait dengan produk ini
    // Logika: Rating Toko (store_ratings) -> terkait Order (orders) -> terkait Item (order_items) -> terkait Produk
    $sql = "SELECT 
                r.rating, 
                r.review, 
                r.created_at, 
                u.username, 
                u.profile_photo
            FROM store_ratings r
            JOIN orders o ON r.order_id = o.id
            JOIN order_items oi ON o.id = oi.order_id
            JOIN users u ON r.user_id = u.id
            WHERE oi.product_id = :product_id
            ORDER BY r.rating DESC, r.created_at DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([':product_id' => $product_id]);
    $reviews = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Format tanggal dan path foto
    foreach ($reviews as &$review) {
        $review['created_at_formatted'] = date('d M Y', strtotime($review['created_at']));
        // Handle profile photo path if needed (e.g. add ../ or full URL if missing)
        // Assuming profile_photo stored might be just filename or full URL
    }

    echo json_encode(['success' => true, 'data' => $reviews]);

} catch (PDOException $e) {
    // Handle table not found (soft fail)
    if ($e->errorInfo[1] == 1146 && strpos($e->getMessage(), "store_ratings") !== false) {
        echo json_encode(['success' => true, 'data' => []]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database Error: ' . $e->getMessage()]);
    }
}
?>
