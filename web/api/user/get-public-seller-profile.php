<?php
header('Content-Type: application/json');
require_once '../config/config.php';

$seller_id = $_GET['id'] ?? null;

if (!$seller_id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Seller ID diperlukan']);
    exit;
}

try {
    // 1. Get seller profile
    $stmt = $pdo->prepare(
        "SELECT 
            u.username,
            s.id as seller_id,
            s.store_name,
            s.profile_photo,
            s.location,
            s.created_at,
            (SELECT COUNT(*) FROM products WHERE seller_id = s.id) as total_products
         FROM sellers s
         INNER JOIN users u ON s.user_id = u.id
         WHERE s.id = :seller_id"
    );
    $stmt->execute([':seller_id' => $seller_id]);
    $profile = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$profile) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Toko tidak ditemukan']);
        exit;
    }

    // 2. Get follower count
    $follower_count = 0;
    try {
        $followStmt = $pdo->prepare("SELECT COUNT(*) FROM follows WHERE seller_id = :seller_id");
        $followStmt->execute(['seller_id' => $seller_id]);
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
    
    // 4. Get Rating Stats (with Self-Healing)
    $ratingStats = ['avg_rating' => 0, 'total_reviews' => 0];
    try {
        $rateStmt = $pdo->prepare("SELECT AVG(rating) as avg_rating, COUNT(*) as total_reviews FROM store_ratings WHERE seller_id = :seller_id");
        $rateStmt->execute(['seller_id' => $seller_id]);
        $stats = $rateStmt->fetch(PDO::FETCH_ASSOC);
        
        $ratingStats['avg_rating'] = $stats['avg_rating'] ? round($stats['avg_rating'], 1) : 0;
        $ratingStats['total_reviews'] = (int)$stats['total_reviews'];
    } catch (PDOException $e) {
        // Self-healing: Table doesn't exist
        if ($e->errorInfo[1] == 1146 && strpos($e->getMessage(), "store_ratings") !== false) {
             // Just return 0 stats, table will be created on first rating submission
             $ratingStats = ['avg_rating' => 0, 'total_reviews' => 0];
        }
    }

    echo json_encode([
        'success' => true,
        'data' => [
            'store_name' => $profile['store_name'],
            'profile_photo' => $profile['profile_photo'],
            'location' => $profile['location'] ?? 'Gudang Blibli',
            'join_date' => $joinDate,
            'total_products' => (int)$profile['total_products'],
            'follower_count' => $follower_count,
            'rating' => $ratingStats['avg_rating'],
            'total_reviews' => $ratingStats['total_reviews']
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
