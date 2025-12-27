<div class="view active" id="profile-view">
    <h1>Profile User</h1>
    <div class="profile-container">
        <div class="profile-card">
            <div class="profile-header">
                <div class="profile-avatar" style="overflow: hidden;">
                    <img id="profile-view-img" src="<?php 
                        if (!empty($userProfile['profile_photo'])) {
                            echo (strpos($userProfile['profile_photo'], 'http') === 0) ? $userProfile['profile_photo'] : '../assets/images/user/' . $userProfile['profile_photo'];
                        } else {
                            echo '../assets/images/person.png';
                        }
                    ?>" alt="Profile" style="width: 100%; height: 100%; object-fit: cover;">
                </div>
            </div>
            <h2 id="user-name"><?php echo htmlspecialchars($userProfile['full_name'] ?? $userProfile['username'] ?? 'Guest'); ?></h2>
            <p id="user-email"><?php echo htmlspecialchars($userProfile['email'] ?? 'Belum ada email'); ?></p>
        </div>

        <div class="profile-info">
            <div class="info-item">
                <label>Status Akun</label>
                <p>Pembeli (Verified)</p>
            </div>
            <div class="info-item">
                <label>Bergabung Sejak</label>
                <p id="join-date">
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
                </p>
            </div>

            <div class="info-item">
                <label>Lokasi Saya</label>
                <p class="coming-soon">📍 Segera Hadir</p>
            </div>

            <button class="btn-edit-profile" onclick="openEditProfileModal()">
               Edit Profile
            </button>
        </div>
    </div>
</div>