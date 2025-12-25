<?php
session_start();
require '../config/config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method tidak diizinkan']);
    exit;
}

if (!isset($_SESSION['seller_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$sellerId = $_SESSION['seller_id'];

// Ambil input
$productId   = filter_var($_POST['product_id'] ?? null, FILTER_VALIDATE_INT);
$categoryId  = filter_var($_POST['category_id'] ?? null, FILTER_VALIDATE_INT);
$name        = trim($_POST['name'] ?? '');
$price       = filter_var($_POST['price'] ?? null, FILTER_VALIDATE_FLOAT);
$stock       = filter_var($_POST['stock'] ?? null, FILTER_VALIDATE_INT);
$description = trim($_POST['description'] ?? '');

if (!$productId || !$categoryId || !$name || $price === false || $stock === false) {
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

    $imageName = $currentProduct['image']; // Default pakai gambar lama

    // 2. Handle Upload Gambar Baru (Jika ada)
    if (!empty($_FILES['image']['name'])) {
        $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        $maxSize = 5 * 1024 * 1024; // 5MB

        if (!in_array($_FILES['image']['type'], $allowedTypes)) {
            echo json_encode(['success' => false, 'message' => 'Format gambar salah (JPG/PNG/GIF Only)']);
            exit;
        }

        if ($_FILES['image']['size'] > $maxSize) {
            echo json_encode(['success' => false, 'message' => 'Ukuran gambar maksimal 5MB']);
            exit;
        }

        // Hapus gambar lama
        if ($currentProduct['image']) {
            $oldPath = __DIR__ . '/../../assets/images/products/' . $currentProduct['image'];
            if (file_exists($oldPath)) {
                unlink($oldPath);
            }
        }

        // Simpan gambar baru
        $uploadDir = __DIR__ . '/../../assets/images/products/';
        if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);

        $ext = pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION);
        $imageName = time() . '_' . uniqid() . '.' . $ext;
        
        move_uploaded_file($_FILES['image']['tmp_name'], $uploadDir . $imageName);
    }

    // 3. Update Database
    $sql = "UPDATE products SET 
            category_id = :cat, 
            name = :name, 
            price = :price, 
            stock = :stock, 
            description = :desc, 
            image = :img 
            WHERE id = :id AND seller_id = :sid";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':cat'   => $categoryId,
        ':name'  => $name,
        ':price' => $price,
        ':stock' => $stock,
        ':desc'  => $description,
        ':img'   => $imageName,
        ':id'    => $productId,
        ':sid'   => $sellerId
    ]);

    echo json_encode(['success' => true, 'message' => 'Produk berhasil diperbarui']);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database Error: ' . $e->getMessage()]);
}
