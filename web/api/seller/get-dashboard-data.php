<?php
session_start();
require '../config/config.php';

header('Content-Type: application/json');

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Sesi berakhir, silakan login kembali']);
    exit;
}

// 1. Recover seller_id if missing
if (!isset($_SESSION['seller_id'])) {
    $stmt = $pdo->prepare("SELECT id FROM sellers WHERE user_id = :uid");
    $stmt->execute([':uid' => $_SESSION['user_id']]);
    $recoveredId = $stmt->fetchColumn();
    if ($recoveredId) {
        $_SESSION['seller_id'] = $recoveredId;
        $_SESSION['role'] = 'seller'; // Ensure role is synced
    } else {
        // Self-healing: Create seller record if user has seller role but no seller record
        // Verify user role first
        $roleStmt = $pdo->prepare("SELECT role, username FROM users WHERE id = :uid");
        $roleStmt->execute([':uid' => $_SESSION['user_id']]);
        $userData = $roleStmt->fetch(PDO::FETCH_ASSOC);

        if ($userData && $userData['role'] === 'seller') {
            // Auto-create seller profile
            $createStmt = $pdo->prepare("INSERT INTO sellers (user_id, store_name) VALUES (:uid, :store_name)");
            $defaultStoreName = $userData['username'] . "'s Store";
            $createStmt->execute([':uid' => $_SESSION['user_id'], ':store_name' => $defaultStoreName]);
            
            $_SESSION['seller_id'] = $pdo->lastInsertId();
            $_SESSION['role'] = 'seller';
        } else {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Anda belum terdaftar sebagai seller']);
            exit;
        }
    }
}

$seller_id = $_SESSION['seller_id'];

try {
    // 1. Get stats
    $statsQuery = "
        SELECT 
            COUNT(*) as total_products,
            COALESCE(SUM(stock), 0) as total_stock
        FROM products 
        WHERE seller_id = :seller_id
    ";
    
    $stmt = $pdo->prepare($statsQuery);
    $stmt->execute(['seller_id' => $seller_id]);
    $stats = $stmt->fetch(PDO::FETCH_ASSOC);

    // 2. Get order count (handle case where orders table might not exist yet)
    $total_orders = 0;
    try {
        $orderCountStmt = $pdo->prepare("SELECT COUNT(*) FROM orders WHERE seller_id = :seller_id");
        $orderCountStmt->execute(['seller_id' => $seller_id]);
        $total_orders = (int)$orderCountStmt->fetchColumn();
    } catch (PDOException $e) {
        $total_orders = 0;
    }

    // 3. Get follower count (handle case where follows table might not exist yet)
    $follower_count = 0;
    try {
        $followerCountStmt = $pdo->prepare("SELECT COUNT(*) FROM follows WHERE seller_id = :seller_id");
        $followerCountStmt->execute(['seller_id' => $seller_id]);
        $follower_count = (int)$followerCountStmt->fetchColumn();
    } catch (PDOException $e) {
        $follower_count = 0; // Silent fail if table doesn't exist
    }
    
    // 4. Get recent products
    $productsQuery = "
        SELECT 
            p.id,
            p.name,
            p.price,
            p.stock,
            p.weight,
            p.image,
            c.name as category_name,
            p.created_at
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.seller_id = :seller_id
        ORDER BY p.created_at DESC
    ";
    
    $stmt = $pdo->prepare($productsQuery);
    $stmt->execute(['seller_id' => $seller_id]);
    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Format data
    foreach ($products as &$product) {
        $product['price'] = (float) $product['price'];
        $product['stock'] = (int) $product['stock'];
        $product['weight'] = (int) $product['weight'];
    }
    
    echo json_encode([
        'success' => true,
        'stats' => [
            'total_products' => (int) $stats['total_products'],
            'total_stock' => (int) $stats['total_stock'],
            'total_orders' => $total_orders,
            'follower_count' => $follower_count
        ],
        'products' => $products
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}
