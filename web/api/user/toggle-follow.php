<?php
session_start();
require_once '../config/config.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Silakan login terlebih dahulu']);
    exit;
}

$user_id = $_SESSION['user_id'];
$data = json_decode(file_get_contents('php://input'), true);
$seller_id = $data['seller_id'] ?? null;

if (!$seller_id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Seller ID tidak valid']);
    exit;
}

try {
    // Check if following
    $stmt = $pdo->prepare("SELECT id FROM follows WHERE user_id = :user_id AND seller_id = :seller_id");
    $stmt->execute(['user_id' => $user_id, 'seller_id' => $seller_id]);
    $follow = $stmt->fetch();

    if ($follow) {
        // Unfollow
        $stmt = $pdo->prepare("DELETE FROM follows WHERE user_id = :user_id AND seller_id = :seller_id");
        $stmt->execute(['user_id' => $user_id, 'seller_id' => $seller_id]);
        $following = false;
        $message = 'Berhasil berhenti mengikuti';
    } else {
        // Follow
        $stmt = $pdo->prepare("INSERT INTO follows (user_id, seller_id) VALUES (:user_id, :seller_id)");
        $stmt->execute(['user_id' => $user_id, 'seller_id' => $seller_id]);
        $following = true;
        $message = 'Berhasil mengikuti toko';
    }

    // Get updated count
    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM follows WHERE seller_id = :seller_id");
    $stmt->execute(['seller_id' => $seller_id]);
    $count = $stmt->fetchColumn();

    echo json_encode([
        'success' => true,
        'message' => $message,
        'following' => $following,
        'follower_count' => (int)$count
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
