<?php
session_start();

// Check for seller session - prioritize namespaced session
$isSellerLoggedIn = false;

// First check namespaced seller session
if (isset($_SESSION['seller']) && isset($_SESSION['seller']['seller_id'])) {
    $isSellerLoggedIn = true;
    // Sync legacy vars from namespaced session
    $_SESSION['user_id'] = $_SESSION['seller']['user_id'];
    $_SESSION['username'] = $_SESSION['seller']['username'];
    $_SESSION['role'] = $_SESSION['seller']['role'];
    $_SESSION['seller_id'] = $_SESSION['seller']['seller_id'];
    $_SESSION['store_name'] = $_SESSION['seller']['store_name'];
}
// Fallback: check legacy session vars
elseif (isset($_SESSION['user_id']) && isset($_SESSION['role']) && $_SESSION['role'] === 'seller') {
    $isSellerLoggedIn = true;
}

// Redirect if not logged in as seller
if (!$isSellerLoggedIn) {
    header("Location: ../pages/auth/loginSeller.html");
    exit;
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <!-- Tambahkan meta viewport untuk mobile -->
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
    
    <link rel="stylesheet" href="../assets/css/seller/dashboard.css?v=<?php echo time(); ?>">
    <link rel="stylesheet" href="../assets/css/seller/product.css?v=<?php echo time(); ?>">
    <link rel="icon" type="image/png" href="../assets/images/logo.png">
    <!-- Leaflet CSS -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin=""/>
    <link rel="stylesheet" href="../assets/css/components/location-picker.css?v=<?php echo time(); ?>">
    <title>Seller Dashboard - CrypMerce</title>
</head>
<body>
    <div class="seller-layout">
        <!-- SIDEBAR -->
        <?php include 'components/sidebar.php'; ?>

        <!-- MAIN CONTENT -->
        <main class="content">
            <!-- Load all dashboard views (Dashboard, Add, Store, etc) -->
            <?php include 'components/views.php'; ?>
            
            <!-- Load all dashboard modals (Preview, Edit, Logout) -->
            <?php include 'components/modals.php'; ?>
        </main>
    </div>

    <!-- Leaflet JS -->
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
    
    <script src="../assets/js/seller/seller-data.js?v=<?php echo time(); ?>"></script>
    <script src="../assets/js/components/location-picker.js?v=<?php echo time(); ?>"></script>
    <script src="../assets/js/seller/dashboard.js?v=<?php echo time(); ?>"></script>
    
    <script>
        // Debug helper
        console.log('Page loaded at:', new Date().toLocaleTimeString());
        console.log('Window width:', window.innerWidth);
    </script>
</body>
</html>