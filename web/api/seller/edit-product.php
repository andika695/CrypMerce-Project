<?php
session_start();
require '../config/config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method tidak diizinkan']);
    exit;
}

if (!isset($_SESSION['seller']) || !isset($_SESSION['seller']['seller_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$sellerId = $_SESSION['seller']['seller_id'];

// Ambil input
$productId   = filter_var($_POST['product_id'] ?? null, FILTER_VALIDATE_INT);
$categoryId  = filter_var($_POST['category_id'] ?? null, FILTER_VALIDATE_INT);
$name        = trim($_POST['name'] ?? '');
$price       = filter_var($_POST['price'] ?? null, FILTER_VALIDATE_FLOAT);
$stock       = filter_var($_POST['stock'] ?? null, FILTER_VALIDATE_INT);
$weight      = filter_var($_POST['weight'] ?? null, FILTER_VALIDATE_INT);
$description = trim($_POST['description'] ?? '');

if (!$productId || !$categoryId || !$name || $price === false || $stock === false || $weight === false) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Data tidak lengkap atau format salah']);
    exit;
}

try {
    // 1. Cek kepemilikan produk
    $stmt = $pdo->prepare("SELECT image FROM products WHERE id = ? AND seller_id = ?");
    $stmt->execute([$productId, $sellerId]);
    $currentProduct = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$currentProduct) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Produk tidak ditemukan atau akses ditolak']);
        exit;
    }

    $imagePath = $currentProduct['image']; // Default pakai gambar lama

    // 2. Handle Upload Gambar Baru (Jika ada) ke Cloudinary
    if (!empty($_FILES['image']['name'])) {
        require_once __DIR__ . '/../config/cloudinary.php';
        
        try {
            $upload = uploadToCloudinary($_FILES['image'], 'crypmerce/products');
            if (!$upload['success']) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => $upload['message']]);
                exit;
            }

            // Hapus gambar lama JIKA itu adalah file lokal
            if ($currentProduct['image'] && strpos($currentProduct['image'], 'http') === false) {
                $oldPath = __DIR__ . '/../../assets/images/products/' . $currentProduct['image'];
                if (file_exists($oldPath)) {
                    unlink($oldPath);
                }
            }

            $imagePath = $upload['url'];
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Upload Error: ' . $e->getMessage()]);
            exit;
        }
    }

    // 3. Update Database
    $sql = "UPDATE products SET 
            category_id = :cat, 
            name = :name, 
            price = :price, 
            stock = :stock,
            weight = :weight,
            description = :desc, 
            image = :img 
            WHERE id = :id AND seller_id = :sid";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':cat'   => $categoryId,
        ':name'  => $name,
        ':price' => $price,
        ':stock' => $stock,
        ':weight'=> $weight,
        ':desc'  => $description,
        ':img'   => $imagePath,
        ':id'    => $productId,
        ':sid'   => $sellerId
    ]);

    echo json_encode(['success' => true, 'message' => 'Produk berhasil diperbarui']);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database Error: ' . $e->getMessage()]);
}
