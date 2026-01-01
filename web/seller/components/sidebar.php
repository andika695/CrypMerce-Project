<aside class="sidebar">
    <!-- Tombol Hamburger untuk mobile (hanya muncul di mobile) -->
    <div class="mobile-header">
        <button class="hamburger-btn" id="hamburgerBtn">
            <span></span>
            <span></span>
            <span></span>
        </button>
        <div class="logo mobile-logo" style="display:flex; align-items:center; gap:10px; justify-content:center;">
             <span style="font-size:16px;">🏪</span>
             <span id="mobile-store-name">CrypMerce Seller</span>
        </div>
    </div>
    
    <!-- Overlay untuk menutup sidebar saat diklik di luar -->
    <div class="sidebar-overlay" id="sidebarOverlay"></div>
    
    <div class="sidebar-content">
        <div class="logo desktop-logo">
            <div class="sidebar-profile">
                 <div class="sidebar-avatar">
                     <span>👤</span>
                 </div>
                 <div class="sidebar-info">
                     <strong>Memuat...</strong>
                     <small>...</small>
                 </div>
            </div>
        </div>
            <button class="sidebar-close" id="sidebarClose">
        ✕
    </button>
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
                <span>🏪</span> Toko Saya
            </li>
            <li class="menu-item" data-page="orders">
                <span>🛒</span> Pesanan
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