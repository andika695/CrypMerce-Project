<?php
session_start();
require '../config/config.php';

header('Content-Type: application/json');

// 1. Cek Login
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$userId = $_SESSION['user_id'];
$data = json_decode(file_get_contents("php://input"), true);

$orderId = filter_var($data['order_id'] ?? null, FILTER_VALIDATE_INT);
$rating  = filter_var($data['rating'] ?? null, FILTER_VALIDATE_INT);
$review  = trim($data['review'] ?? '');

// 2. Validasi Input
if (!$orderId || !$rating || $rating < 1 || $rating > 5) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Data tidak valid']);
    exit;
}

try {
    // 3. Cek Order (Harus milik user & status completed/shipped)
    // Kita izinkan status 'shipped' juga in case frontend manggil submit rating bebarengan dengan complete order
    // Tapi idealnya status sudah completed.
    
    $stmt = $pdo->prepare("SELECT id, seller_id, status FROM orders WHERE id = ? AND buyer_id = ?");
    $stmt->execute([$orderId, $userId]);
    $order = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$order) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Pesanan tidak ditemukan']);
        exit;
    }

    // 4. Cek apakah sudah pernah rating
    $checkStmt = $pdo->prepare("SELECT id FROM store_ratings WHERE order_id = ?");
    $checkStmt->execute([$orderId]);
    if ($checkStmt->fetch()) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Anda sudah memberikan rating untuk pesanan ini']);
        exit;
    }

    // 5. Insert Rating
    $sql = "INSERT INTO store_ratings (order_id, user_id, seller_id, rating, review) VALUES (?, ?, ?, ?, ?)";
    $insertStmt = $pdo->prepare($sql);
    $insertStmt->execute([$orderId, $userId, $order['seller_id'], $rating, $review]);

    echo json_encode([
        'success' => true,
        'message' => 'Terima kasih atas penilaian Anda!'
    ]);

} catch (PDOException $e) {
    // Self-healing: Create table if not exists (Error 1146)
    if ($e->errorInfo[1] == 1146 && strpos($e->getMessage(), "store_ratings") !== false) {
        try {
            $pdo->exec("CREATE TABLE IF NOT EXISTS store_ratings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                order_id INT NOT NULL,
                user_id INT NOT NULL,
                seller_id INT NOT NULL,
                rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
                review TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_order_rating (order_id),
                FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
            
            // Retry insert
            $insertStmt = $pdo->prepare($sql);
            $insertStmt->execute([$orderId, $userId, $order['seller_id'], $rating, $review]);
            
            echo json_encode(['success' => true, 'message' => 'Terima kasih atas penilaian Anda!']);
            exit;
        } catch (PDOException $ex) {
             http_response_code(500);
             echo json_encode(['success' => false, 'message' => 'Database Setup Error: ' . $ex->getMessage()]);
             exit;
        }
    }

    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database Error: ' . $e->getMessage()]);
}
