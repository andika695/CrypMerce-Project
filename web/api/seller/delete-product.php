<?php
session_start();
require '../config/config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method tidak diizinkan']);
    exit;
}

// Cek sesi login seller
if (!isset($_SESSION['seller']) || !isset($_SESSION['seller']['seller_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$productId = filter_var($data['id'] ?? null, FILTER_VALIDATE_INT);
$sellerId = $_SESSION['seller']['seller_id'];

if (!$productId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ID produk tidak valid']);
    exit;
}

try {
    // 1. Cek apakah produk milik seller ini DAN ambil nama file gambar
    $stmt = $pdo->prepare("SELECT image FROM products WHERE id = ? AND seller_id = ?");
    $stmt->execute([$productId, $sellerId]);
    $product = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$product) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Produk tidak ditemukan atau bukan milik Anda']);
        exit;
    }

    // 2. Hapus file gambar jika ada
    if ($product['image']) {
        $imagePath = __DIR__ . '/../../assets/images/products/' . $product['image'];
        if (file_exists($imagePath)) {
            unlink($imagePath);
        }
    }

    // 3. Hapus data dari database
    $stmt = $pdo->prepare("DELETE FROM products WHERE id = ?");
    $stmt->execute([$productId]);

    echo json_encode(['success' => true, 'message' => 'Produk berhasil dihapus']);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Gagal menghapus produk: ' . $e->getMessage()]);
}
