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
    $stmt = $pdo->prepare("SELECT image, images FROM products WHERE id = ? AND seller_id = ?");
    $stmt->execute([$productId, $sellerId]);
    $currentProduct = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$currentProduct) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Produk tidak ditemukan atau akses ditolak']);
        exit;
    }

    // Parse existing images
    $existingImages = [];
    if (!empty($currentProduct['images'])) {
        $existingImages = json_decode($currentProduct['images'], true) ?: [];
    } elseif (!empty($currentProduct['image'])) {
        $existingImages = [$currentProduct['image']];
    }

    $imagesArray = $existingImages; // Start with existing images
    $primaryImage = $currentProduct['image']; // Default to current primary

    // 2. Handle Upload Gambar Baru (Jika ada) ke Cloudinary
    if (!empty($_FILES['images']['name'][0])) {
        require_once __DIR__ . '/../config/cloudinary.php';
        
        $fileCount = count($_FILES['images']['name']);
        $maxImages = 5;
        
        // Check if adding new images would exceed limit
        $newTotal = count($existingImages) + $fileCount;
        if ($newTotal > $maxImages) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => "Maksimal {$maxImages} foto. Saat ini: " . count($existingImages)]);
            exit;
        }
        
        for ($i = 0; $i < $fileCount; $i++) {
            if ($_FILES['images']['error'][$i] === UPLOAD_ERR_OK) {
                $tempFile = [
                    'name' => $_FILES['images']['name'][$i],
                    'type' => $_FILES['images']['type'][$i],
                    'tmp_name' => $_FILES['images']['tmp_name'][$i],
                    'error' => $_FILES['images']['error'][$i],
                    'size' => $_FILES['images']['size'][$i]
                ];
                
                $upload = uploadToCloudinary($tempFile, 'crypmerce/products');
                
                if ($upload['success']) {
                    $imagesArray[] = $upload['url'];
                } else {
                    error_log("Failed to upload image {$i}: " . $upload['message']);
                }
            }
        }
    }

    // Handle removed images (if sent from frontend)
    if (!empty($_POST['removed_images'])) {
        $removedImages = json_decode($_POST['removed_images'], true) ?: [];
        $imagesArray = array_values(array_filter($imagesArray, function($img) use ($removedImages) {
            return !in_array($img, $removedImages);
        }));
    }

    // Set primary image to first in array
    $primaryImage = !empty($imagesArray) ? $imagesArray[0] : null;
    $imagesJson = !empty($imagesArray) ? json_encode(array_values($imagesArray)) : null;

    // 3. Update Database
    $sql = "UPDATE products SET 
            category_id = :cat, 
            name = :name, 
            price = :price, 
            stock = :stock,
            weight = :weight,
            description = :desc, 
            image = :img,
            images = :images
            WHERE id = :id AND seller_id = :sid";

    $stmt = $pdo->prepare($sql);
    try {
        $stmt->execute([
            ':cat'   => $categoryId,
            ':name'  => $name,
            ':price' => $price,
            ':stock' => $stock,
            ':weight'=> $weight,
            ':desc'  => $description,
            ':img'   => $primaryImage,
            ':images'=> $imagesJson,
            ':id'    => $productId,
            ':sid'   => $sellerId
        ]);
    } catch (PDOException $e) {
        // Self-healing: Jika kolom 'images' belum ada (Error 1054), tambahkan otomatis
        if ($e->errorInfo[1] == 1054 && strpos($e->getMessage(), "Unknown column 'images'") !== false) {
            $pdo->exec("ALTER TABLE products ADD COLUMN images JSON DEFAULT NULL AFTER image");
            // Retry execute
            $stmt->execute([
                ':cat'   => $categoryId,
                ':name'  => $name,
                ':price' => $price,
                ':stock' => $stock,
                ':weight'=> $weight,
                ':desc'  => $description,
                ':img'   => $primaryImage,
                ':images'=> $imagesJson,
                ':id'    => $productId,
                ':sid'   => $sellerId
            ]);
        } else {
            throw $e;
        }
    }

    echo json_encode([
        'success' => true, 
        'message' => 'Produk berhasil diperbarui',
        'images_count' => count($imagesArray)
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database Error: ' . $e->getMessage()]);
}
