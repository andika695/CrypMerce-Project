<?php
require 'config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Metode tidak diizinkan.']);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

$username = $data['username'] ?? '';
$phone    = $data['phone'] ?? '';
$email    = $data['email'] ?? '';
$password = $data['password'] ?? '';
$role     = $data['role'] ?? 'user';
$agree    = $data['agree'] ?? false;

if (empty($username) || empty($email) || empty($password)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Semua field wajib diisi.']);
    exit();
}

if ($role === 'pilih') {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Role belum dipilih.']);
    exit();
}

if (!$agree) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Harus menyetujui S&K.']);
    exit();
}

$hashed_password = password_hash($password, PASSWORD_BCRYPT);

try {
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE username = ? OR email = ?");
    $stmt->execute([$username, $email]);

    if ($stmt->fetchColumn() > 0) {
        http_response_code(409);
        echo json_encode(['success' => false, 'message' => 'Username atau Email sudah terdaftar.']);
        exit();
    }

    $stmt = $pdo->prepare("INSERT INTO users (username, phone, email, password, role) VALUES (?, ?, ?, ?, ?)");
    $stmt->execute([$username, $phone, $email, $hashed_password, $role]);

    http_response_code(201);
    echo json_encode(['success' => true, 'message' => 'Registrasi berhasil. Silakan login.']);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Kesalahan server.']);
}
?>
