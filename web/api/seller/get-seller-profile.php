<?php
session_start();
require __DIR__ . '/../config/config.php';

header('Content-Type: application/json');

// Check if seller is logged in
if (!isset($_SESSION['seller']) || !isset($_SESSION['seller']['seller_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

try {
    $userId = $_SESSION['seller']['user_id'];
    
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
        $checkStmt = $pdo->prepare("SELECT id FROM sellers WHERE user_id = :uid");
        $checkStmt->execute([':uid' => $userId]);
        $exists = $checkStmt->fetchColumn();

        if (!$exists) {
            $roleStmt = $pdo->prepare("SELECT role, username FROM users WHERE id = :uid");
            $roleStmt->execute([':uid' => $userId]);
            $userData = $roleStmt->fetch(PDO::FETCH_ASSOC);

            if (!$userData) {
                 throw new Exception('User data not found for ID: ' . $userId);
            }
            if ($userData['role'] !== 'seller') {
                 // Do NOT auto-upgrade. Return specific error so frontend can redirect.
                 throw new Exception('User role is not seller');
            }

            try {
                $createStmt = $pdo->prepare("INSERT INTO sellers (user_id, store_name) VALUES (:uid, :store_name)");
                $defaultStoreName = $userData['username'] . "'s Store";
                $createStmt->execute([':uid' => $userId, ':store_name' => $defaultStoreName]);
                $_SESSION['seller_id'] = $pdo->lastInsertId();
            } catch (PDOException $e) {
                throw new Exception('Failed to auto-create seller profile: ' . $e->getMessage());
            }

            // Retry fetch
            $stmt->execute([':user_id' => $userId]);
            $profile = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$profile) {
                 throw new Exception('Profile still null after creation. DB Insert ID: ' . $_SESSION['seller_id']);
            }
        } else {
             // Record exists but JOIN failed. Likely user_id mismatch in JOIN or mismatched columns?
             // Fetch just from sellers to verify
             $sStmt = $pdo->prepare("SELECT * FROM sellers WHERE user_id = :uid");
             $sStmt->execute([':uid' => $userId]);
             $sellerRaw = $sStmt->fetch(PDO::FETCH_ASSOC);
             
             if ($sellerRaw) {
                 throw new Exception('Seller record exists (ID: ' . $sellerRaw['id'] . ') but JOIN failed. Check foreign keys.');
             } else {
                 throw new Exception('Ghost record? Check logic error.');
             }
        }
    }

    if (!$profile) {
        throw new Exception('Profil tidak ditemukan (Final Check) - User ID: ' . $userId);
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

    // 4. Get Rating Stats (with Self-Healing)
    $ratingStats = ['avg_rating' => 0, 'total_reviews' => 0];
    try {
        $rateStmt = $pdo->prepare("SELECT AVG(rating) as avg_rating, COUNT(*) as total_reviews FROM store_ratings WHERE seller_id = :seller_id");
        $rateStmt->execute(['seller_id' => $profile['seller_id']]);
        $stats = $rateStmt->fetch(PDO::FETCH_ASSOC);
        
        $ratingStats['avg_rating'] = $stats['avg_rating'] ? round($stats['avg_rating'], 1) : 0;
        $ratingStats['total_reviews'] = (int)$stats['total_reviews'];
    } catch (PDOException $e) {
        // Table missing fallback
        $ratingStats = ['avg_rating' => 0, 'total_reviews' => 0];
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
            'address_detail' => $profile['address_detail'],
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
