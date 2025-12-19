<?php
require '../config/config.php';

header('Content-Type: application/json');

try {
    $sql = "
        SELECT id, name, price, stock, image, created_at
        FROM products
        WHERE stock > 0
        ORDER BY created_at DESC
        LIMIT 8
    ";

    $stmt = $pdo->query($sql);
    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Format data produk
    foreach ($products as &$product) {
        // Handle path gambar
        if ($product['image']) {
            $filename = basename(str_replace('\\', '/', $product['image']));
            $product['image'] = '../assets/images/products/' . $filename;
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
