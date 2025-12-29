<?php
// Prevent any output before JSON
ob_start();
ini_set('display_errors', '0');
error_reporting(E_ALL);

session_start();
require '../config/config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    ob_clean();
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method tidak diizinkan']);
    exit;
}

// Cek apakah user login sebagai seller
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'seller') {
    ob_clean();
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized: Hanya seller yang dapat menambah produk']);
    exit;
}

// Ambil seller_id dari session (asumsi login-seller.php sudah set ini)
// Jika belum ada di session, kita harus query ulang berdasarkan user_id
if (!isset($_SESSION['seller_id'])) {
    // Fallback: Ambil seller_id dari database berdasarkan user_id
    $stmt = $pdo->prepare("SELECT id FROM sellers WHERE user_id = ?");
    $stmt->execute([$_SESSION['user_id']]);
    $seller = $stmt->fetch();
    
    if (!$seller) {
        ob_clean();
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Profil seller tidak ditemukan']);
        exit;
    }
    $_SESSION['seller_id'] = $seller['id'];
}

try {
    // Validasi input
    if (empty($_POST['category_id']) || empty($_POST['name']) || 
        empty($_POST['price']) || empty($_POST['stock'])) {
        ob_clean();
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Data tidak lengkap']);
        exit;
    }

    $seller_id   = $_SESSION['seller_id'];
    $category_id = filter_var($_POST['category_id'], FILTER_VALIDATE_INT);
    $name        = trim($_POST['name']);
    $price       = filter_var($_POST['price'], FILTER_VALIDATE_FLOAT);
    $stock       = filter_var($_POST['stock'], FILTER_VALIDATE_INT);
    $description = isset($_POST['description']) ? trim($_POST['description']) : null;

    // Validasi tipe data
    if ($category_id === false || $price === false || $stock === false) {
        ob_clean();
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Format data tidak valid']);
        exit;
    }

    // Validasi nilai
    if ($price < 0 || $stock < 0) {
        ob_clean();
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Harga dan stok tidak boleh negatif']);
        exit;
    }

    $imagePath = null;

    // Handle upload gambar ke Cloudinary
    if (!empty($_FILES['image']['name'])) {
        require_once __DIR__ . '/../config/cloudinary.php';
        
        $upload = uploadToCloudinary($_FILES['image'], 'crypmerce/products');
        if (!$upload['success']) {
            ob_clean();
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $upload['message']]);
            exit;
        }
        $imagePath = $upload['url'];
    }

    // Insert ke database
    $sql = "INSERT INTO products
            (seller_id, category_id, name, price, stock, description, image)
            VALUES
            (:seller_id, :category_id, :name, :price, :stock, :description, :image)";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        'seller_id'   => $seller_id,
        'category_id' => $category_id,
        'name'        => $name,
        'price'       => $price,
        'stock'       => $stock,
        'description' => $description,
        'image'       => $imagePath
    ]);

    ob_clean(); // Clear any warnings/notices
    echo json_encode([
        'success' => true,
        'message' => 'Produk berhasil ditambahkan',
        'product_id' => $pdo->lastInsertId()
    ]);

} catch (PDOException $e) {
    error_log('Database error in add-product.php: ' . $e->getMessage());
    ob_clean();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database Error: ' . $e->getMessage()]);
} catch (Exception $e) {
    error_log('Error in add-product.php: ' . $e->getMessage());
    ob_clean();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
