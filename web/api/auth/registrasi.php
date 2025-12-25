<?php
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
$phone    = trim($data['phone'] ?? '');
$email    = trim($data['email'] ?? '');
$password = $data['password'] ?? '';
$role     = $data['role'] ?? 'user';

if (!$username || !$phone || !$email || !$password || !$role) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Semua field wajib diisi'
    ]);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Format email tidak valid'
    ]);
    exit;
}

if (!in_array($role, ['user', 'seller'], true)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Role tidak valid. Hanya user atau seller yang diperbolehkan'
    ]);
    exit;
}

if (strlen($password) < 8) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Password minimal 8 karakter'
    ]);
    exit;
}

$hashedPassword = password_hash($password, PASSWORD_BCRYPT);

try {
    $stmt = $pdo->prepare(
        "SELECT COUNT(*) FROM users WHERE username = :username OR email = :email"
    );
    $stmt->execute([
        ':username' => $username,
        ':email'    => $email
    ]);

    if ($stmt->fetchColumn() > 0) {
        http_response_code(409);
        echo json_encode([
            'success' => false,
            'message' => 'Username atau email sudah terdaftar'
        ]);
        exit;
    }
    
    $stmt = $pdo->prepare(
        "INSERT INTO users (username, phone, email, password, role)
         VALUES (:username, :phone, :email, :password, :role)"
    );

    $stmt->execute([
        ':username' => $username,
        ':phone'    => $phone,
        ':email'    => $email,
        ':password' => $hashedPassword,
        ':role'     => $role
    ]);

    http_response_code(201);
    echo json_encode([
        'success' => true,
        'message' => 'Registrasi berhasil, silakan login'
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Kesalahan server: ' . $e->getMessage()
    ]);
}
