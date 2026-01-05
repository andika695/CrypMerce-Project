<div class="view active" id="profile-view">
    <h1 class="profile-title-new">Profil</h1>
    
    <div class="profile-unified-card-main">
        <div class="unified-content-flex">
            <!-- Left Side: Photo -->
            <div class="photo-column-new">
                <div class="profile-photo-wrapper">
                    <img id="profile-view-img" src="<?php 
                        if (!empty($userProfile['profile_photo'])) {
                            echo (strpos($userProfile['profile_photo'], 'http') === 0) ? $userProfile['profile_photo'] : '../assets/images/user/' . $userProfile['profile_photo'];
                        } else {
                            echo '../assets/images/person.png';
                        }
                    ?>" alt="Profile">
                </div>
                <div class="photo-action-wrapper">
                    <button class="btn-edit-profile-trigger" onclick="openEditProfileModal()">Edit Profile</button>
                </div>
            </div>

            <div class="vertical-divider"></div>

            <!-- Right Side: Info Groups -->
            <div class="info-column-new">
                <div class="info-section-wrapper">
                    <h3 class="section-heading-new">Biodata Diri</h3>
                    <div class="detail-row">
                        <span class="detail-label">Nama</span>
                        <span class="detail-value"><?php echo htmlspecialchars($userProfile['full_name'] ?? $userProfile['username'] ?? 'Guest'); ?></span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Status Akun</span>
                        <span class="detail-value">Pembeli (Verified)</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Bergabung Sejak</span>
                        <span class="detail-value">
                            <?php 
                            if (!empty($userProfile['created_at'])) {
                                $joinTime = strtotime($userProfile['created_at']);
                                $months = [
                                    1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April', 
                                    5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus', 
                                    9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember'
                                ];
                                echo date('d', $joinTime) . ' ' . $months[(int)date('m', $joinTime)] . ' ' . date('Y', $joinTime);
                            } else {
                                echo '-';
                            }
                            ?>
                        </span>
                    </div>
                </div>

                <div class="info-section-wrapper">
                    <h3 class="section-heading-new">Kontak</h3>
                    <div class="detail-row">
                        <span class="detail-label">Email</span>
                        <span class="detail-value"><?php echo htmlspecialchars($userProfile['email'] ?? 'Belum ada email'); ?></span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Nomor Telepon</span>
                        <span class="detail-value"><?php echo htmlspecialchars($userProfile['phone'] ?? 'Belum ada nomor'); ?></span>
                    </div>
                </div>

                <div class="info-section-wrapper">
                    <h3 class="section-heading-new">Lokasi Saya</h3>
                    <div class="detail-row clickable-row" onclick="document.querySelector('.menu-item[data-page=\'alamat\']').click()">
                        <span class="detail-label">Alamat</span>
                        <span class="detail-value">
                            <?php 
                            if (!empty($userProfile['address'])) {
                                echo "📍 " . htmlspecialchars($userProfile['address']);
                            } elseif (!empty($userProfile['city'])) {
                                echo "📍 " . htmlspecialchars($userProfile['city']);
                            } else {
                                echo '<span style="color: #888; font-style: italic;">Belum diatur</span>';
                            }
                            ?>
                        </span>
                        <span class="edit-hint-mini" style="margin-left:10px; color:#3533cd; font-size:0.8rem;">✎</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>