<div id="my-store-view" class="view">
    <div class="store-new-header">
        <div class="store-main-info">
            <div class="store-avatar-circle">
                <img id="store-profile-img" src="../assets/images/person.png" alt="Store Profile">
            </div>
            <div class="store-details">
                <div class="name-row">
                    <h1 id="store-page-name">Nama Toko</h1>
                    <span class="arrow-icon">›</span>
                </div>
                <div class="store-stats-mini">
                    <span class="followers-count">👥 <strong id="store-followers">0</strong> pengikut</span>
                </div>
                <div class="location-box editable-loc" onclick="alert('Fitur edit lokasi akan segera hadir!')">
                    <span class="loc-icon">📍</span> 
                    <span class="loc-text" id="store-location">Gudang Blibli</span>
                    <span class="edit-hint">✎</span>
                </div>
                <div class="action-buttons">
                    <button class="btn-share">
                        <svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92c0-1.61-1.31-2.92-2.92-2.92z"></path></svg>
                    </button>
                </div>
            </div>
        </div>
        <div class="store-stats-grid">
            <div class="stat-item">
                <span class="stat-label">Rating & ulasan</span>
                <span class="stat-value"><span id="store-rating">⭐ -</span> <small>(<span id="store-reviews">0</span> ulasan)</small></span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Pesanan berhasil</span>
                <span class="stat-value"><span id="store-success-rate">0%</span> <small>(dari 0 pesanan)</small></span>
            </div>
        </div>
    </div>

    <div class="store-info-bar">
        <div class="section-title">📦 Semua Produk</div>
        <div class="store-search-box">
            <span class="search-icon">🔍</span>
            <input type="text" id="store-inner-search" placeholder="Cari di toko ini..." onkeyup="filterStoreProducts(this.value)">
        </div>
    </div>

    <section class="product-section">
        <div class="product-grid" id="storeProductGrid">
            <p style="text-align: center; padding: 40px; color: #666;">Memuat produk...</p>
        </div>
    </section>
</div>
