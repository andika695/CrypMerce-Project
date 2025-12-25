<?php
session_start();
// Pastikan seller sudah login
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'seller') {
    header('Location: ../pages/auth/loginSeller.html');
    exit;
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="../assets/css/seller/dashboard.css?v=15">
    <link rel="stylesheet" href="../assets/css/seller/product.css?v=15">
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

    <script src="../assets/js/seller/seller-data.js?v=15"></script>
    <script src="../assets/js/seller/dashboard.js?v=15"></script>
</body>
</html>
