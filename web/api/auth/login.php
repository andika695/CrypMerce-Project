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

if (!$username || !$password) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Username dan password wajib diisi'
    ]);
    exit;
}

try {
    $stmt = $pdo->prepare(
        "SELECT id, username, password, role 
         FROM users 
         WHERE username = :username"
    );
    $stmt->execute([':username' => $username]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user && password_verify($password, $user['password'])) {
        // Use namespaced session for USER - separate from seller
        $_SESSION['user'] = [
            'user_id' => $user['id'],
            'username' => $user['username'],
            'role' => $user['role']
        ];

        // If seller, also populate seller namespace
        if ($user['role'] === 'seller') {
            $sellerStmt = $pdo->prepare("SELECT id, store_name FROM sellers WHERE user_id = :uid");
            $sellerStmt->execute([':uid' => $user['id']]);
            $sellerData = $sellerStmt->fetch(PDO::FETCH_ASSOC);
            if ($sellerData) {
                $_SESSION['seller'] = [
                    'user_id' => $user['id'],
                    'username' => $user['username'],
                    'role' => 'seller',
                    'seller_id' => $sellerData['id'],
                    'store_name' => $sellerData['store_name']
                ];
            }
        }

        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Login berhasil',
            'role'    => $user['role']
        ]);
        exit;
    }

    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'Username atau password salah'
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Kesalahan server'
    ]);
}
