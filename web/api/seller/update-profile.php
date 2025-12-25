<?php
header('Content-Type: application/json');
require_once '../config/config.php';
session_start();

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'seller') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$seller_id = $_SESSION['seller_id'];
$user_id = $_SESSION['user_id'];

// Handle profile photo upload if exists
$photo_path = null;
if (isset($_FILES['profile_photo']) && $_FILES['profile_photo']['error'] === 0) {
    $upload_dir = '../../assets/images/seller-profiles/';
    if (!is_dir($upload_dir)) {
        mkdir($upload_dir, 0777, true);
    }
    
    $file_ext = pathinfo($_FILES['profile_photo']['name'], PATHINFO_EXTENSION);
    $file_name = 'seller_' . $seller_id . '_' . time() . '.' . $file_ext;
    $photo_path = 'assets/images/seller-profiles/' . $file_name;
    
    move_uploaded_file($_FILES['profile_photo']['tmp_name'], $upload_dir . $file_name);
}

// Get other data
$store_name = $_POST['store_name'] ?? null;

try {
    $sql = "UPDATE sellers SET ";
    $params = [];
    $updates = [];

    if ($store_name) {
        $updates[] = "store_name = :store_name";
        $params['store_name'] = $store_name;
        $_SESSION['store_name'] = $store_name; // Update session
    }
    
    
    if ($photo_path) {
        $updates[] = "profile_photo = :photo";
        $params['photo'] = $photo_path;
    }

    if (empty($updates)) {
        echo json_encode(['success' => true, 'message' => 'No changes made']);
        exit;
    }

    $sql .= implode(", ", $updates) . " WHERE id = :id";
    $params['id'] = $seller_id;

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    echo json_encode(['success' => true, 'message' => 'Profile updated successfully']);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
