<?php
// Fix JSON Error: Prevent HTML warnings
ob_start();
ini_set('display_errors', 0);
error_reporting(E_ALL);

session_start();
require __DIR__ . '/../config/config.php';

header('Content-Type: application/json');

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

try {
    $userId = $_SESSION['user_id'];
    
    $stmt = $pdo->prepare("
        SELECT id, username, email, full_name, phone_number, profile_photo,
               latitude, longitude, address, city, province, address_detail
        FROM users 
        WHERE id = :id
    ");
    
    $stmt->execute([':id' => $userId]);
    $user = $stmt->fetch();
    
    if (!$user) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'User not found']);
        exit;
    }
    
    // Clear any previous output
    ob_clean();
    
    // Return relevant data
    echo json_encode([
        'success' => true,
        'data' => $user
    ]);
    
} catch (PDOException $e) {
    ob_clean();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error']);
}
ob_end_flush();
?>
