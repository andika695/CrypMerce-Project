<?php
session_start();
require __DIR__ . '/../config/config.php';

header('Content-Type: application/json');

// Check if user is logged in as seller
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'seller') {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'Unauthorized'
    ]);
    exit;
}

// Robust seller_id recovery
if (!isset($_SESSION['seller_id'])) {
    $recoveryStmt = $pdo->prepare("SELECT id FROM sellers WHERE user_id = :uid");
    $recoveryStmt->execute([':uid' => $_SESSION['user_id']]);
    $recoveredId = $recoveryStmt->fetchColumn();
    if ($recoveredId) {
        $_SESSION['seller_id'] = $recoveredId;
    } else {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Seller ID not found']);
        exit;
    }
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Metode tidak diizinkan'
    ]);
    exit;
}

$sellerId = $_SESSION['seller_id'];
$storeName = trim($_POST['storeName'] ?? '');

if (!$storeName) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Nama toko wajib diisi'
    ]);
    exit;
}

try {
    // Check if store name is already used by another seller
    $stmt = $pdo->prepare(
        "SELECT COUNT(*) FROM sellers 
         WHERE store_name = :store_name AND id != :seller_id"
    );
    $stmt->execute([
        ':store_name' => $storeName,
        ':seller_id' => $sellerId
    ]);
    
    if ($stmt->fetchColumn() > 0) {
        http_response_code(409);
        echo json_encode([
            'success' => false,
            'message' => 'Nama toko sudah digunakan'
        ]);
        exit;
    }
    
    // Handle profile photo upload if provided
    $profilePhoto = null;
    $updatePhoto = false;
    
    if (isset($_FILES['profilePhoto']) && $_FILES['profilePhoto']['error'] === UPLOAD_ERR_OK) {
        $uploadDir = __DIR__ . '/../../images/seller-profiles/';
        
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }
        
        $fileExtension = strtolower(pathinfo($_FILES['profilePhoto']['name'], PATHINFO_EXTENSION));
        $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif'];
        
        if (!in_array($fileExtension, $allowedExtensions)) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Format foto tidak didukung. Gunakan JPG, PNG, atau GIF'
            ]);
            exit;
        }
        
        if ($_FILES['profilePhoto']['size'] > 5 * 1024 * 1024) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Ukuran foto maksimal 5MB'
            ]);
            exit;
        }
        
        $fileName = uniqid('seller_') . '.' . $fileExtension;
        $uploadPath = $uploadDir . $fileName;
        
        if (!move_uploaded_file($_FILES['profilePhoto']['tmp_name'], $uploadPath)) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Gagal mengupload foto profil'
            ]);
            exit;
        }
        
        $profilePhoto = 'images/seller-profiles/' . $fileName;
        $updatePhoto = true;
        
        // Get old photo to delete
        $stmt = $pdo->prepare("SELECT profile_photo FROM sellers WHERE id = :seller_id");
        $stmt->execute([':seller_id' => $sellerId]);
        $oldPhoto = $stmt->fetchColumn();
    }
    
    // Update seller profile
    if ($updatePhoto) {
        $stmt = $pdo->prepare(
            "UPDATE sellers 
             SET store_name = :store_name, profile_photo = :profile_photo 
             WHERE id = :seller_id"
        );
        $stmt->execute([
            ':store_name' => $storeName,
            ':profile_photo' => $profilePhoto,
            ':seller_id' => $sellerId
        ]);
        
        // Delete old photo if exists
        if ($oldPhoto && file_exists(__DIR__ . '/../../' . $oldPhoto)) {
            unlink(__DIR__ . '/../../' . $oldPhoto);
        }
    } else {
        $stmt = $pdo->prepare(
            "UPDATE sellers 
             SET store_name = :store_name 
             WHERE id = :seller_id"
        );
        $stmt->execute([
            ':store_name' => $storeName,
            ':seller_id' => $sellerId
        ]);
    }
    
    // Update session
    $_SESSION['store_name'] = $storeName;
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Profil berhasil diperbarui',
        'data' => [
            'store_name' => $storeName,
            'profile_photo' => $updatePhoto ? $profilePhoto : null
        ]
    ]);
    
} catch (PDOException $e) {
    // Delete uploaded file if exists
    if (isset($profilePhoto) && file_exists(__DIR__ . '/../../' . $profilePhoto)) {
        unlink(__DIR__ . '/../../' . $profilePhoto);
    }
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Kesalahan server'
    ]);
}
?>
