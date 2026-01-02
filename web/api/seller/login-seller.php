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

$data = json_decode(file_get_contents("php://input"), true);

$username = trim($data['username'] ?? '');
$password = $data['password'] ?? '';
$storeName = trim($data['storeName'] ?? '');

if (!$username || !$password || !$storeName) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Username, password, dan nama toko wajib diisi'
    ]);
    exit;
}

try {
    // Get user data
    $stmt = $pdo->prepare(
        "SELECT u.id, u.username, u.password, u.role, s.id as seller_id, s.store_name, s.profile_photo
         FROM users u
         INNER JOIN sellers s ON u.id = s.user_id
         WHERE u.username = :username AND u.role = 'seller'"
    );
    $stmt->execute([':username' => $username]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Verify user exists and password is correct
    if (!$user || !password_verify($password, $user['password'])) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'Username atau password salah'
        ]);
        exit;
    }

    // Verify store name matches
    if ($user['store_name'] !== $storeName) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'Nama toko tidak sesuai'
        ]);
        exit;
    }
    
    // Use namespaced session for SELLER - separate from user
    $_SESSION['seller'] = [
        'user_id' => $user['id'],
        'username' => $user['username'],
        'role' => $user['role'],
        'seller_id' => $user['seller_id'],
        'store_name' => $user['store_name']
    ];
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Login berhasil',
        'data' => [
            'username' => $user['username'],
            'store_name' => $user['store_name'],
            'profile_photo' => $user['profile_photo']
        ]
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Kesalahan server'
    ]);
}
?>
