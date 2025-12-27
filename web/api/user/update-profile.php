<?php
session_start();
require_once __DIR__ . '/../../api/config/config.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'user') {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit();
}

$response = ['success' => false, 'message' => ''];
$userId = $_SESSION['user_id'];
$name = $_POST['name'] ?? '';

try {
    // 1. Update Name
    if (!empty($name)) {
        $stmt = $pdo->prepare("UPDATE users SET full_name = :name WHERE id = :id");
        $stmt->execute([':name' => $name, ':id' => $userId]);
    }

    // 2. Handle Photo Upload to Cloudinary
    if (isset($_FILES['photo']) && $_FILES['photo']['error'] === UPLOAD_ERR_OK) {
        require_once __DIR__ . '/../config/cloudinary.php';
        
        try {
            $upload = uploadToCloudinary($_FILES['photo'], 'crypmerce/user-profiles');
            if ($upload['success']) {
                $uploadedUrl = $upload['url'];
                // Ambil info foto lama untuk dihapus jika lokal
                $stmt = $pdo->prepare("SELECT profile_photo FROM users WHERE id = :id");
                $stmt->execute([':id' => $userId]);
                $old_photo = $stmt->fetchColumn();

                if ($old_photo && strpos($old_photo, 'http') === false) {
                    $absolute_old_path = __DIR__ . '/../../assets/images/user/' . $old_photo;
                    if (file_exists($absolute_old_path)) unlink($absolute_old_path);
                }

                // Update DB with new photo URL
                $stmt = $pdo->prepare("UPDATE users SET profile_photo = :photo WHERE id = :id");
                $stmt->execute([':photo' => $uploadedUrl, ':id' => $userId]);
                
                // Sync session
                $_SESSION['profile_photo'] = $uploadedUrl;
                $response['new_photo'] = $uploadedUrl;
            } else {
                throw new Exception("Upload Error: " . $upload['message']);
            }
        } catch (Exception $e) {
            throw new Exception($e->getMessage());
        }
    }

    // After updating name in DB
    if (!empty($name)) {
        $_SESSION['full_name'] = $name;
    }

    $response['success'] = true;
    $response['message'] = 'Profil berhasil diperbarui!';
    $response['new_name'] = $name;

} catch (Exception $e) {
    http_response_code(500);
    $response['message'] = 'Error: ' . $e->getMessage();
}

echo json_encode($response);
?>
