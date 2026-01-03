<div id="product-detail-view" class="view">
    <div class="product-detail-container">
        <!-- Breadcrumb / Back Navigation -->
        <div class="breadcrumb">
            <a href="javascript:void(0)" onclick="backToStore()" style="text-decoration: none; color: #4b5563; display: flex; align-items: center; gap: 8px; font-weight: 500;">
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
                    <p>Berat: <span id="seller-product-weight">-</span></p>
                    <p>Stok: <span id="seller-product-stock">-</span></p>
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
                <h3 id="seller-review-title">Ulasan (0)</h3>
                <div id="seller-product-reviews" class="reviews-list">
                     <p>Memuat ulasan...</p>
                </div>
                <!-- Centered See More Button -->
                <div class="see-more-container" style="display: flex; justify-content: center; margin-top: 32px; padding-top: 20px; border-top: 1px solid #f1f3f7;">
                    <button id="btn-see-all-reviews" class="btn-see-all-centered" style="display: none;" onclick="viewAllReviews()">
                        Lihat Semua Ulasan <span id="btn-review-count-text"></span> &rarr;
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>
