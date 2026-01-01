<?php 
session_start();
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'user') {
    header('Location: ../pages/auth/login.html');
    exit();
}

require_once __DIR__ . '/../api/config/config.php';

try {
    $stmt = $pdo->prepare("SELECT full_name, username, email, profile_photo, created_at, address, city, latitude, longitude, address_detail FROM users WHERE id = :id");
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
    <!-- Leaflet & Location CSS -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin=""/>
    <link rel="stylesheet" href="../assets/css/components/location-picker.css?v=1">
    <link rel="icon" type="image/png" href="../../../assets/images/logo.png">
    <!-- Tambahkan Font Awesome untuk ikon -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body>
    <!-- Mobile Header -->
    <div class="mobile-header">
        <button class="hamburger-btn" id="hamburgerBtn">
            <i class="fas fa-bars"></i>
        </button>
        <div class="page-title" id="pageTitle">Profil Saya</div>
    </div>
    
    <div class="seller-layout">
        <?php include 'components/sidebar.php'; ?>
        <main class="content">
            <?php include 'components/views.php'; ?>
            <?php include 'components/modals.php'; ?>
        </main>
    </div>

    <script src="../assets/js/user/profile.js?v=<?php echo time(); ?>"></script>
    <script src="../assets/js/user/pesanan.js?v=<?php echo time(); ?>"></script>
    <!-- Leaflet & Location Logic -->
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
    <script src="../assets/js/components/location-picker.js?v=1"></script>
</body>
</html>