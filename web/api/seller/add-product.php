<?php
session_start();
require '../config/config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method tidak diizinkan']);
    exit;
}

// Cek apakah user login sebagai seller
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'seller') {
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
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Format data tidak valid']);
        exit;
    }

    // Validasi nilai
    if ($price < 0 || $stock < 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Harga dan stok tidak boleh negatif']);
        exit;
    }

    $imageName = null;

    // Handle upload gambar
    if (!empty($_FILES['image']['name'])) {
        // Validasi file
        $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        $maxSize = 5 * 1024 * 1024; // 5MB

        if (!in_array($_FILES['image']['type'], $allowedTypes)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Format gambar tidak didukung. Gunakan JPG, PNG, atau GIF']);
            exit;
        }

        if ($_FILES['image']['size'] > $maxSize) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Ukuran gambar maksimal 5MB']);
            exit;
        }

        // Buat folder jika belum ada
        $uploadDir = __DIR__ . '/../../assets/images/products/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        // Generate nama file unik
        $extension = pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION);
        $imageName = time() . '_' . uniqid() . '.' . $extension;
        $uploadPath = $uploadDir . $imageName;

        if (!move_uploaded_file($_FILES['image']['tmp_name'], $uploadPath)) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Gagal upload gambar']);
            exit;
        }
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
        'image'       => $imageName
    ]);

    echo json_encode([
        'success' => true,
        'message' => 'Produk berhasil ditambahkan',
        'product_id' => $pdo->lastInsertId()
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Gagal menyimpan produk: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Terjadi kesalahan: ' . $e->getMessage()]);
}
