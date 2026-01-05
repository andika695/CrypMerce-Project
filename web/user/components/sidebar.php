<aside class="sidebar">
    <div class="user-profile-sidebar">
        <div class="sidebar-avatar">
             <img id="sidebar-img" src="<?php 
                if (!empty($userProfile['profile_photo'])) {
                    echo (strpos($userProfile['profile_photo'], 'http') === 0) ? $userProfile['profile_photo'] : '../assets/images/user/' . $userProfile['profile_photo'];
                } else {
                    echo '../assets/images/person.png';
                }
             ?>" alt="Profile">
        </div>
        <h3 id="sidebar-user-name" class="sidebar-user-name"><?php echo htmlspecialchars($userProfile['full_name'] ?? $userProfile['username'] ?? 'User'); ?></h3>
        <p class="sidebar-user-role">Pembeli (Verified)</p>
    </div>
    <ul>
        <li class="menu-item active" data-page="profile">
            <span>👤</span> Profil
        </li>
        <li class="menu-item" data-page="pesanan">
            <span>📦</span> Pesanan Saya
        </li>
        <!-- Notifikasi removed as requested -->
        <li class="menu-item" data-page="alamat">
            <span>📍</span> Alamat Pengiriman
        </li>
        <li class="menu-item" data-page="logout">
            <span>🚪</span> Logout
        </li>
        <li class="menu-item mobile-only" onclick="window.history.back()">
            <span>⬅️</span> Kembali
        </li>
        <!-- Tombol tutup sidebar untuk mobile -->
        <li class="menu-item close-sidebar-btn mobile-only" style="display: none;">
            <span>✕</span> Tutup Menu
        </li>
    </ul>
</aside>

<!-- Overlay untuk mobile -->
<div class="sidebar-overlay"></div>