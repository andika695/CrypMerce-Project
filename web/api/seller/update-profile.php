<?php
session_start();
header('Content-Type: application/json');
require_once '../config/config.php';

// Check authentication
if (!isset($_SESSION['seller']) || !isset($_SESSION['seller']['seller_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$seller_id = $_SESSION['seller']['seller_id'];
$user_id = $_SESSION['seller']['user_id'];

// Handle profile photo upload if exists to Cloudinary
$photo_path = null;
if (isset($_FILES['profile_photo']) && $_FILES['profile_photo']['error'] === 0) {
    require_once __DIR__ . '/../config/cloudinary.php';
    
    try {
        $upload = uploadToCloudinary($_FILES['profile_photo'], 'crypmerce/seller-profiles');
        if ($upload['success']) {
            $uploadedUrl = $upload['url'];
            // Ambil info foto lama untuk dihapus jika lokal
            $stmt = $pdo->prepare("SELECT profile_photo FROM sellers WHERE id = ?");
            $stmt->execute([$seller_id]);
            $old_photo = $stmt->fetchColumn();

            if ($old_photo && strpos($old_photo, 'http') === false) {
                $absolute_old_path = __DIR__ . '/../../' . $old_photo;
                if (file_exists($absolute_old_path)) unlink($absolute_old_path);
            }

            $photo_path = $uploadedUrl;
        } else {
            echo json_encode(['success' => false, 'message' => 'Upload Error: ' . $upload['message']]);
            exit;
        }
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
        exit;
    }
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
        // Update session (namespaced)
        $_SESSION['seller']['store_name'] = $store_name;
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
