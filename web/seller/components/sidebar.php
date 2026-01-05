<aside class="sidebar">
    <!-- Tombol Hamburger untuk mobile (hanya muncul di mobile) -->
    <div class="mobile-header">
        <button class="hamburger-btn" id="hamburgerBtn" aria-label="Toggle Menu">
            <span></span>
            <span></span>
            <span></span>
        </button>
        <div class="logo mobile-logo" style="display:flex; align-items:center; gap:10px; justify-content:center;">
             <span id="mobile-page-title">Dashboard</span>
        </div>
    </div>
    
    <!-- Overlay untuk menutup sidebar saat diklik di luar -->
    <div class="sidebar-overlay" id="sidebarOverlay"></div>
    
    <div class="sidebar-content">
        <div class="sidebar-header-section">
            <div class="user-profile-sidebar"> <!-- Layout mirip User -->
                 <div class="sidebar-avatar">
                     <img id="sidebar-img" src="../assets/images/person.png" alt="Profile" style="width:100%; height:100%; object-fit:cover;">
                 </div>
                 <h3 id="sidebar-user-name" class="sidebar-user-name">Memuat...</h3>
                 <p class="sidebar-user-role">Seller</p>
            </div>
        </div>

        <ul>
            <li class="menu-item" data-page="profile">
                <span>👤</span> Profil
            </li>
            <li class="menu-item active" data-page="dashboard">
                <span>📊</span> Dashboard
            </li>
            <li class="menu-item" data-page="add-product">
                <span>➕</span> Tambah Produk
            </li>
            <li class="menu-item" data-page="my-store">
                <span>🏠</span> Toko Saya
            </li>
            <li class="menu-item" data-page="orders">
                <span>📦</span> Pesanan
            </li>
            <li class="menu-item" data-page="location-settings">
                <span>📍</span> Lokasi Toko
            </li>
            <li class="menu-item" data-page="logout">
                <span>🚪</span> Logout
            </li>
        </ul>
    </div>
</aside>