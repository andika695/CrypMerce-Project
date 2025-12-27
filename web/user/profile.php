<?php 
session_start();
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'user') {
    header('Location: ../pages/auth/login.html');
    exit();
}

require_once __DIR__ . '/../api/config/config.php';

try {
    $stmt = $pdo->prepare("SELECT full_name, username, email, profile_photo, created_at FROM users WHERE id = :id");
    $stmt->execute([':id' => $_SESSION['user_id']]);
    $userProfile = $stmt->fetch(PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    $userProfile = [];
}

?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Profile User - CrypMerce</title>
    <link rel="stylesheet" href="../assets/css/user/profile.css?v=<?php echo time(); ?>">
</head>
<body>
    <div class="seller-layout">
        <?php include 'components/sidebar.php'; ?>
        <main class="content">
            <?php include 'components/views.php'; ?>
            <?php include 'components/modals.php'; ?>
        </main>
    </div>

    <script src="../assets/js/user/profile.js?v=<?php echo time(); ?>"></script>
</body>
</html>