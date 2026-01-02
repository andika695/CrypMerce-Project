<?php
session_start();
require '../config/config.php';

header('Content-Type: application/json');

if (!isset($_SESSION['seller']) || !isset($_SESSION['seller']['seller_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$productId = filter_var($_GET['id'] ?? null, FILTER_VALIDATE_INT);
$sellerId = $_SESSION['seller']['seller_id'];

if (!$productId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ID produk diperlukan']);
    exit;
}

try {
    // Ambil detail produk
    $stmt = $pdo->prepare("SELECT * FROM products WHERE id = ? AND seller_id = ?");
    $stmt->execute([$productId, $sellerId]);
    $product = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$product) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Produk tidak ditemukan']);
        exit;
    }

    // Convert numeric types
    $product['price'] = (float) $product['price'];
    $product['stock'] = (int) $product['stock'];
    $product['category_id'] = (int) $product['category_id'];

    echo json_encode(['success' => true, 'data' => $product]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server Error: ' . $e->getMessage()]);
}
