<?php
session_start();
require __DIR__ . '/../config/config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Metode tidak diizinkan'
    ]);
    exit;
}

// Get form data
$username = trim($_POST['username'] ?? '');
$password = $_POST['password'] ?? '';
$storeName = trim($_POST['nameToko'] ?? '');  // Changed from 'storeName' to 'nameToko'
$agree = $_POST['agree'] ?? '';

// Validate required fields
if (!$username || !$password || !$storeName) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Username, password, dan nama toko wajib diisi'
    ]);
    exit;
}

if (!$agree) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Anda harus menyetujui Syarat & Ketentuan'
    ]);
    exit;
}

// Validate password length
if (strlen($password) < 8) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Password minimal 8 karakter'
    ]);
    exit;
}

// Handle profile photo upload
// Handle profile photo upload
$profilePhoto = null;
if (isset($_FILES['profilePhoto']) && $_FILES['profilePhoto']['error'] === UPLOAD_ERR_OK) {
    require_once __DIR__ . '/../config/cloudinary.php';
    
    // Validate file extension (basic check before uploading)
    $fileExtension = strtolower(pathinfo($_FILES['profilePhoto']['name'], PATHINFO_EXTENSION));
    $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    
    if (!in_array($fileExtension, $allowedExtensions)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Format foto tidak didukung. Gunakan JPG, JPEG, PNG, atau GIF'
        ]);
        exit;
    }
    
    // Check file size (max 5MB)
    if ($_FILES['profilePhoto']['size'] > 5 * 1024 * 1024) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Ukuran foto maksimal 5MB'
        ]);
        exit;
    }
    
    // Upload to Cloudinary
    try {
        $upload = uploadToCloudinary($_FILES['profilePhoto'], 'crypmerce/seller-profiles');
        
        if ($upload['success']) {
            $profilePhoto = $upload['url'];
        } else {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Gagal mengupload foto profil: ' . $upload['message']
            ]);
            exit;
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Error upload: ' . $e->getMessage()
        ]);
        exit;
    }
}

try {
    // Check if username already exists
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE username = :username");
    $stmt->execute([':username' => $username]);
    
    if ($stmt->fetchColumn() > 0) {
        http_response_code(409);
        echo json_encode([
            'success' => false,
            'message' => 'Username sudah terdaftar'
        ]);
        exit;
    }
    
    // Check if store name already exists
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM sellers WHERE store_name = :store_name");
    $stmt->execute([':store_name' => $storeName]);
    
    if ($stmt->fetchColumn() > 0) {
        http_response_code(409);
        echo json_encode([
            'success' => false,
            'message' => 'Nama toko sudah digunakan'
        ]);
        exit;
    }
    
    // Start transaction
    $pdo->beginTransaction();
    
    // Create user account
    $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
    
    // Ambil phone dan email dari POST
    $phone = trim($_POST['phone'] ?? '');
    $email = trim($_POST['email'] ?? '');

    $stmt = $pdo->prepare(
        "INSERT INTO users (username, password, phone, email, role, created_at) 
         VALUES (:username, :password, :phone, :email, 'seller', NOW())"
    );
    $stmt->execute([
        ':username' => $username,
        ':password' => $hashedPassword,
        ':phone'    => $phone,
        ':email'    => $email
    ]);
    
    $userId = $pdo->lastInsertId();
    
    // Create seller profile
    $stmt = $pdo->prepare(
        "INSERT INTO sellers (user_id, store_name, profile_photo, created_at) 
         VALUES (:user_id, :store_name, :profile_photo, NOW())"
    );
    $stmt->execute([
        ':user_id' => $userId,
        ':store_name' => $storeName,
        ':profile_photo' => $profilePhoto
    ]);
    
    // Commit transaction
    $pdo->commit();
    
    http_response_code(201);
    echo json_encode([
        'success' => true,
        'message' => 'Registrasi berhasil! Silakan login'
    ]);
    
} catch (PDOException $e) {
    // Rollback on error
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    
    // Delete uploaded file if exists
    if ($profilePhoto && file_exists(__DIR__ . '/../../' . $profilePhoto)) {
        unlink(__DIR__ . '/../../' . $profilePhoto);
    }
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Kesalahan server: ' . $e->getMessage()
    ]);
}
?>
