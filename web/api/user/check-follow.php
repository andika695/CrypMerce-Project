<?php
session_start();
require_once '../config/config.php';

header('Content-Type: application/json');

$seller_id = $_GET['seller_id'] ?? null;

$user_id = $_SESSION['user']['user_id'] ?? null;

if (!$seller_id) {
    echo json_encode(['success' => false, 'message' => 'Seller ID missing']);
    exit;
}

try {
    // Get follower count
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM follows WHERE seller_id = :seller_id");
    $stmt->execute(['seller_id' => $seller_id]);
    $count = $stmt->fetchColumn();

    $following = false;
    if ($user_id) {
        $stmt = $pdo->prepare("SELECT 1 FROM follows WHERE user_id = :user_id AND seller_id = :seller_id");
        $stmt->execute(['user_id' => $user_id, 'seller_id' => $seller_id]);
        $following = (bool)$stmt->fetchColumn();
    }

    echo json_encode([
        'success' => true,
        'following' => $following,
        'follower_count' => (int)$count
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error']);
}
