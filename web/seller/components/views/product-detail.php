<div id="product-detail-view" class="view">
    <div class="breadcrumb">
        <a href="javascript:void(0)" onclick="backToStore()" style="text-decoration: none; color: #4b5563; display: flex; align-items: center; gap: 5px;">
            <i class="fas fa-arrow-left"></i> Kembali ke Toko
        </a>
    </div>

    <div class="product-detail-grid">
        <!-- Left Column: Images & Seller -->
        <div class="product-left-column">
            <div class="product-gallery">
                <div class="main-image">
                    <img id="seller-main-img" src="../assets/images/no-image.png" alt="Product Image">
                </div>
                <div class="thumbnail-gallery" id="seller-thumbnail-gallery">
                    <!-- Thumbnails will be rendered by JS -->
                </div>
            </div>

            <!-- Seller Info Widget -->
            <div class="seller-widget">
                <div class="seller-header">
                    <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
                        <img id="seller-view-photo" src="../assets/images/default-avatar.png" alt="Seller">
                        <div class="seller-details">
                            <h3 id="seller-view-name">Nama Toko</h3>
                            <p class="seller-location">📍 <span id="seller-view-location">Jakarta</span></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Right Column: Info & Variants -->
        <div class="product-info-section">
            <h1 id="seller-product-name" class="product-title">Memuat Nama Produk...</h1>
            
            <div class="price-section">
                <h2 id="seller-product-price">Rp 0</h2>
            </div>

            <div class="product-meta">
                <p>Berat: <span id="seller-product-weight" style="font-weight: 600;">-</span></p>
                <p>Stok: <span id="seller-product-stock" style="font-weight: 600;">-</span></p>
                <p>Kategori: <span id="seller-product-category" style="font-weight: 600;">-</span></p>
            </div>
        </div>
    </div>

    <!-- Bottom Section: Description & Reviews -->
    <div class="product-content-bottom">
        <div class="description-section">
            <h3>Deskripsi Produk</h3>
            <div id="seller-product-description" class="description-content">
                Memuat deskripsi...
            </div>
        </div>
        
        <div class="reviews-section">
            <h3>Ulasan <span id="seller-review-count"></span></h3>
            <div id="seller-product-reviews">
                 <p>Memuat ulasan...</p>
            </div>
        </div>
    </div>
</div>
