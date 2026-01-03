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
if (!isset($_SESSION['seller']) || !isset($_SESSION['seller']['seller_id'])) {
    ob_clean();
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized: Hanya seller yang dapat menambah produk']);
    exit;
}

$seller_id = $_SESSION['seller']['seller_id'];

try {
    // Validasi input
    if (empty($_POST['category_id']) || empty($_POST['name']) || 
        empty($_POST['price']) || empty($_POST['stock']) || empty($_POST['weight'])) {
        ob_clean();
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Data tidak lengkap']);
        exit;
    }

    // $seller_id sudah didefinisikan di atas
    $category_id = filter_var($_POST['category_id'], FILTER_VALIDATE_INT);
    $name        = trim($_POST['name']);
    $price       = filter_var($_POST['price'], FILTER_VALIDATE_FLOAT);
    $stock       = filter_var($_POST['stock'], FILTER_VALIDATE_INT);
    $weight      = filter_var($_POST['weight'], FILTER_VALIDATE_INT);
    $description = isset($_POST['description']) ? trim($_POST['description']) : null;

    // Validasi tipe data
    if ($category_id === false || $price === false || $stock === false || $weight === false) {
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

    $imagesArray = [];
    $primaryImage = null;

    // Handle multiple image uploads to Cloudinary
    if (!empty($_FILES['images']['name'][0])) {
        require_once __DIR__ . '/../config/cloudinary.php';
        
        $fileCount = count($_FILES['images']['name']);
        $maxImages = 5;
        
        if ($fileCount > $maxImages) {
            ob_clean();
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => "Maksimal {$maxImages} foto yang diizinkan"]);
            exit;
        }
        
        for ($i = 0; $i < $fileCount; $i++) {
            if ($_FILES['images']['error'][$i] === UPLOAD_ERR_OK) {
                // Create temporary file array for Cloudinary upload
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
                    
                    // First image is the primary image
                    if ($primaryImage === null) {
                        $primaryImage = $upload['url'];
                    }
                } else {
                    error_log("Failed to upload image {$i}: " . $upload['message']);
                }
            }
        }
    }

    // Convert images array to JSON
    $imagesJson = !empty($imagesArray) ? json_encode($imagesArray) : null;

    // Insert ke database
    $sql = "INSERT INTO products
            (seller_id, category_id, name, price, stock, weight, description, image, images)
            VALUES
            (:seller_id, :category_id, :name, :price, :stock, :weight, :description, :image, :images)";

    $stmt = $pdo->prepare($sql);
    
    $params = [
        'seller_id'   => $seller_id,
        'category_id' => $category_id,
        'name'        => $name,
        'price'       => $price,
        'stock'       => $stock,
        'weight'      => $weight,
        'description' => $description,
        'image'       => $primaryImage,
        'images'      => $imagesJson
    ];

    try {
        $stmt->execute($params);
    } catch (PDOException $e) {
        // Self-healing: Jika kolom 'images' belum ada (Error 1054), tambahkan otomatis
        if ($e->errorInfo[1] == 1054 && strpos($e->getMessage(), "Unknown column 'images'") !== false) {
            $pdo->exec("ALTER TABLE products ADD COLUMN images JSON DEFAULT NULL AFTER image");
            // Retry execute
            $stmt->execute($params);
            
            // Juga jalankan migrasi data lama di background jika perlu, tapi untuk sekarang fokus ke insert sukses dulu
        } else {
            throw $e; // Lempar ulang jika bukan error kolom hilang
        }
    }

    ob_clean(); // Clear any warnings/notices
    echo json_encode([
        'success' => true,
        'message' => 'Produk berhasil ditambahkan',
        'product_id' => $pdo->lastInsertId(),
        'images_count' => count($imagesArray)
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
