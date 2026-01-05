<div id="profile-view" class="view">
    <h1 class="profile-title-new">Profil Seller</h1>
    
    <div class="profile-unified-card-main">
        <div class="unified-content-flex">
            <!-- Left Side: Photo -->
            <div class="photo-column-new">
                <div class="profile-photo-wrapper" id="seller-avatar-container">
                    <!-- JS will populate this -->
                    <div class="profile-avatar"><span>👤</span></div>
                </div>
                <div class="photo-action-wrapper">
                    <button class="btn-edit-profile-trigger" onclick="openEditProfileModal()">Edit Profil</button>
                </div>
            </div>

            <div class="vertical-divider"></div>

            <!-- Right Side: Info Groups -->
            <div class="info-column-new">
                <div class="info-section-wrapper">
                    <h3 class="section-heading-new">Biodata Seller</h3>
                    <div class="detail-row">
                        <span class="detail-label">Username</span>
                        <span class="detail-value" id="seller-name">Nama Seller</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Nama Toko</span>
                        <span class="detail-value" id="store-name">Nama Toko</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Bergabung Sejak</span>
                        <span class="detail-value" id="join-date">-</span>
                    </div>
                </div>

                <div class="info-section-wrapper">
                    <h3 class="section-heading-new">Statistik Toko</h3>
                    <div class="detail-row">
                        <span class="detail-label">Total Produk</span>
                        <span class="detail-value" id="profile-total-products">0</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Pengikut</span>
                        <span class="detail-value" id="profile-followers">0</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Rating & Ulasan</span>
                        <span class="detail-value">
                            <span id="profile-rating">⭐ -</span> (<span id="profile-reviews">0</span> ulasan)
                        </span>
                    </div>
                </div>

                <div class="info-section-wrapper">
                    <h3 class="section-heading-new">Kontak & Lokasi</h3>
                    <div class="detail-row">
                        <span class="detail-label">Email</span>
                        <span class="detail-value" id="seller-email">email@example.com</span>
                    </div>
                    <div class="detail-row clickable-row" onclick="document.querySelector('.menu-item[data-page=\'location-settings\']').click()">
                        <span class="detail-label">Lokasi Toko</span>
                        <span class="detail-value" id="seller-location"> Belum diatur</span>
                        <span class="edit-hint-mini" style="margin-left:8px; color:#3533cd; font-size:0.8rem;">✎</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
