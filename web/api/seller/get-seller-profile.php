<?php
session_start();
require __DIR__ . '/../config/config.php';

header('Content-Type: application/json');

// Check if user is logged in as seller
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'seller') {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'Unauthorized'
    ]);
    exit;
}

try {
    $userId = $_SESSION['user_id'];
    
    // Get seller profile with product count
    $stmt = $pdo->prepare(
        "SELECT 
            u.username,
            s.id as seller_id,
            s.store_name,
            s.profile_photo,
            s.created_at,
            u.email,
            COUNT(p.id) as total_products
         FROM users u
         INNER JOIN sellers s ON u.id = s.user_id
         LEFT JOIN products p ON s.id = p.seller_id
         WHERE u.id = :user_id
         GROUP BY u.id, u.username, u.email, s.id, s.store_name, s.profile_photo, s.created_at"
    );
    $stmt->execute([':user_id' => $userId]);
    $profile = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$profile) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Profil tidak ditemukan'
        ]);
        exit;
    }
    
    // Format join date
    $joinDate = date('d F Y', strtotime($profile['created_at']));
    
    // Translate month to Indonesian
    $months = [
        'January' => 'Januari', 'February' => 'Februari', 'March' => 'Maret',
        'April' => 'April', 'May' => 'Mei', 'June' => 'Juni',
        'July' => 'Juli', 'August' => 'Agustus', 'September' => 'September',
        'October' => 'Oktober', 'November' => 'November', 'December' => 'Desember'
    ];
    
    foreach ($months as $en => $id) {
        $joinDate = str_replace($en, $id, $joinDate);
    }
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => [
            'username' => $profile['username'],
            'email' => $profile['email'],
            'seller_id' => $profile['seller_id'],
            'store_name' => $profile['store_name'],
            'profile_photo' => $profile['profile_photo'],
            'join_date' => $joinDate,
            'total_products' => (int)$profile['total_products']
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
