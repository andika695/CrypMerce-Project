<?php
session_start();
require __DIR__ . '/../config/config.php';

header('Content-Type: application/json');

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

// Robust seller_id recovery
if (!isset($_SESSION['seller_id'])) {
    $recoveryStmt = $pdo->prepare("SELECT id FROM sellers WHERE user_id = :uid");
    $recoveryStmt->execute([':uid' => $_SESSION['user_id']]);
    $recoveredId = $recoveryStmt->fetchColumn();
    if ($recoveredId) {
        $_SESSION['seller_id'] = $recoveredId;
        $_SESSION['role'] = 'seller';
    } else {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Profil seller tidak ditemukan']);
        exit;
    }
}

try {
    $userId = $_SESSION['user_id'];
    
    // 1. Get seller profile (with fallback for missing location column)
    // 1. Get seller profile
    $stmt = $pdo->prepare(
        "SELECT 
            u.username, s.id as seller_id, s.store_name, s.profile_photo, 
            s.location, s.created_at, u.email,
            s.latitude, s.longitude, s.address, s.city, s.province, s.address_detail,
            (SELECT COUNT(*) FROM products WHERE seller_id = s.id) as total_products
         FROM users u
         INNER JOIN sellers s ON u.id = s.user_id
         WHERE u.id = :user_id"
    );
    $stmt->execute([':user_id' => $userId]);
    $profile = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$profile) {
        throw new Exception('Profil tidak ditemukan');
    }

    // 2. Get follower count (handle case where follows table might not exist yet)
    $follower_count = 0;
    try {
        $followStmt = $pdo->prepare("SELECT COUNT(*) FROM follows WHERE seller_id = :seller_id");
        $followStmt->execute(['seller_id' => $profile['seller_id']]);
        $follower_count = (int)$followStmt->fetchColumn();
    } catch (PDOException $e) {
        $follower_count = 0;
    }
    
    // 3. Format join date
    $joinDate = date('d F Y', strtotime($profile['created_at']));
    $months = [
        'January' => 'Januari', 'February' => 'Februari', 'March' => 'Maret',
        'April' => 'April', 'May' => 'Mei', 'June' => 'Juni',
        'July' => 'Juli', 'August' => 'Agustus', 'September' => 'September',
        'October' => 'Oktober', 'November' => 'November', 'December' => 'Desember'
    ];
    foreach ($months as $en => $id) {
        $joinDate = str_replace($en, $id, $joinDate);
    }
    
    echo json_encode([
        'success' => true,
        'data' => [
            'username' => $profile['username'],
            'email' => $profile['email'],
            'seller_id' => $profile['seller_id'],
            'store_name' => $profile['store_name'],
            'profile_photo' => $profile['profile_photo'],
            'location' => $profile['location'] ?? $profile['city'] ?? 'Belum diatur',
            'join_date' => $joinDate,
            'total_products' => (int)$profile['total_products'],
            'follower_count' => $follower_count,
            // New Location Fields
            'latitude' => $profile['latitude'],
            'longitude' => $profile['longitude'],
            'address' => $profile['address'],
            'city' => $profile['city'],
            'province' => $profile['province'],
            'address_detail' => $profile['address_detail']
        ]
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}
?>
