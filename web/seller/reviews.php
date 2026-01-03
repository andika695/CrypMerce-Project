<?php
session_start();

// Check for seller session
$isSellerLoggedIn = isset($_SESSION['seller']) && isset($_SESSION['seller']['seller_id']);

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
    <title>Ulasan Produk - CrypMerce</title>
    <link rel="stylesheet" href="../assets/css/seller/dashboard.css?v=<?php echo time(); ?>">
    <link rel="stylesheet" href="../assets/css/user/product-detail.css?v=<?php echo time(); ?>">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap">
    <link rel="icon" type="image/png" href="../assets/images/logo.png">
    
    <style>
        body {
            background: #f8f9fa;
        }
        
        .reviews-container-full {
            width: 100%;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 16px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            min-height: 400px;
            border-left: 5px solid #3533cd;
        }
        
        .reviews-header-full {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 24px;
            padding-bottom: 16px;
            border-bottom: 1px solid #eee;
        }

        .product-brief {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 20px;
            padding-bottom: 20px;
            border-bottom: 1px dashed #eee;
        }

        .product-brief img {
            width: 50px;
            height: 50px;
            border-radius: 6px;
            object-fit: cover;
            border: 1px solid #eee;
        }

        .product-brief h2 {
            font-size: 16px;
            margin: 0;
            color: #333;
        }
        
        .breadcrumb {
            margin-bottom: 20px;
            font-size: 14px;
            color: #6b7280;
        }
        
        .breadcrumb a {
            text-decoration: none;
            color: #4b5563;
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 500;
        }
        
        .breadcrumb a:hover {
            color: #3533cd;
        }
    </style>
</head>
<body>
    <div class="seller-layout">
        <!-- SIDEBAR -->
        <?php include 'components/sidebar.php'; ?>

        <!-- MAIN CONTENT -->
        <main class="content">
            <div style="padding: 24px; width: 100%;">
                <div class="breadcrumb">
                    <a href="javascript:void(0)" onclick="goBackToProduct()" style="text-decoration: none; color: #4b5563; display: flex; align-items: center; gap: 8px; font-weight: 500;">
                        <i class="fas fa-arrow-left"></i> Kembali ke Produk
                    </a>
                </div>

                <div class="reviews-container-full">
                    <div id="product-brief" class="product-brief">
                        <!-- Product Image & Name will be injected here -->
                    </div>

                    <div class="reviews-header-full">
                        <h1 style="font-size:20px; margin:0;">Semua Ulasan</h1>
                        <div style="font-size:16px; color:#555;">
                            <span style="color:#f1c40f; font-size:18px;">★</span>
                            <span id="avg-rating">0.0</span>/5.0 
                            <span style="font-size:14px; color:#999;" id="total-reviews-count">(0)</span>
                        </div>
                    </div>
                    
                    <div id="reviews-list">
                        <div style="text-align:center; padding:50px; color:#888;">Memuat ulasan...</div>
                    </div>
                </div>
            </div>
        </main>
    </div>

    <script src="../assets/js/seller/reviews.js?v=<?php echo time(); ?>"></script>
</body>
</html>

