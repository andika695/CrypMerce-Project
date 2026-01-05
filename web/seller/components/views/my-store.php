<div id="my-store-view" class="view">
    <div class="store-new-header">
        <div class="store-main-info">
            <div class="store-avatar-circle">
                <img id="store-profile-img" src="../assets/images/person.png" alt="Store Profile">
            </div>
            <div class="store-details">
                <div class="name-row">
                    <h1 id="store-page-name">Memuat Toko...</h1>
                    <span class="arrow-icon">›</span>
                </div>
                <div class="store-stats-mini">
                    <span class="followers-count">👥 <strong id="store-followers">0</strong> pengikut</span>
                </div>
                <div class="location-box editable-loc" onclick="document.querySelector('.menu-item[data-page=\'location-settings\']').click()">
                    <span class="loc-icon">📍</span> 
                    <span id="store-location" class="loc-text">Memuat lokasi...</span>
                    <span class="edit-hint">✎</span>
                </div>
            </div>
        </div>

        <div class="action-buttons-wrap">
            <button class="btn-share-shop">
                <i class="fas fa-share-alt"></i>
            </button>
        </div>

        <div class="store-stats-grid">
            <div class="stat-item">
                <span class="stat-label">Rating & ulasan</span>
                <span class="stat-value" id="store-rating-wrap">⭐ <span id="store-rating">-</span> <small>(<span id="store-reviews">0</span> ulasan)</small></span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Pesanan berhasil</span>
                <span id="store-success-rate-wrap" class="stat-value">0% <small>(dari 0 pesanan)</small></span>
            </div>
        </div>
    </div>

    <div class="store-info-bar">
        <div class="product-tabs">
            <button class="product-tab active" id="tab-all" onclick="switchStoreTab('all')">
                <span class="tab-icon">📦</span> Semua Produk
            </button>
            <button class="product-tab" id="tab-bestseller" onclick="switchStoreTab('bestseller')">
                <span class="tab-icon">🔥</span> Produk Terlaris
            </button>
        </div>
        <div class="store-search-box-wrap">
            <div class="store-search-box">
                <span class="search-icon">🔍</span>
                <input type="text" id="store-inner-search" placeholder="Cari di toko ini..." onkeyup="filterStoreProducts(this.value)">
            </div>
        </div>
    </div>

    <section class="product-section">
        <div class="product-grid" id="storeProductGrid">
            <p style="text-align: center; padding: 40px; color: #666;">Memuat produk...</p>
        </div>
    </section>
</div>
