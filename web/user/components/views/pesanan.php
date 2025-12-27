<div id="pesanan-view" class="view">
    <h1>Pesanan Saya</h1>
    
    <div class="orders-container">
        
        <!-- Contoh Pesanan 1: Menunggu Konfirmasi (Bisa Cancel) -->
        <div class="cart-item order-card">
            <div class="item-checkbox">
                <!-- Icon Status sebagai ganti checkbox -->
                <span style="font-size: 1.5rem;">⏳</span>
            </div>
            
            <div class="item-image">
                <img src="../assets/images/bag.png" alt="Produk" onerror="this.src='../assets/images/bag.png'">
            </div>
            
            <div class="item-details">
                <h3 class="item-name">Akun Premium 1 Bulan</h3>
                <p class="item-price">Rp 50.000</p>
                <p class="item-variant">Status: <span style="color: #f39c12; font-weight: bold;">Menunggu Konfirmasi</span></p>
            </div>
            
            <div class="item-actions order-actions-custom">
                <!-- Tombol Rincian -->
                <button class="btn-detail" onclick="window.location.href='order-detail.html'">
                    Rincian Pesanan 
                </button>
                
                <!-- Tombol Cancel (Hanya muncul jika belum dikirim) -->
                <button class="btn-cancel" onclick="alert('Pesanan dibatalkan!')">
                    Batalkan
                </button>
            </div>
        </div>

        <!-- Contoh Pesanan 2: Barang Sampai (Bisa Selesai) -->
        <div class="cart-item order-card">
            <div class="item-checkbox">
                <span style="font-size: 1.5rem;">✅</span>
            </div>
            
            <div class="item-image">
                <img src="../assets/images/bag.png" alt="Produk" onerror="this.src='../assets/images/bag.png'">
            </div>
            
            <div class="item-details">
                <h3 class="item-name">Item Game Rare (Weapon)</h3>
                <p class="item-price">Rp 150.000</p>
                <p class="item-variant">Status: <span style="color: #27ae60; font-weight: bold;">Tiba di Tujuan</span></p>
            </div>
            
            <div class="item-actions order-actions-custom">
                <!-- Tombol Rincian -->
                <button class="btn-detail" onclick="alert('Fitur Tracking Akan Segera Hadir!')">
                    Rincian Pesanan
                </button>
                
                <!-- Tombol Selesai (Muncul jika barang sudah sampai) -->
                <button class="btn-done" onclick="alert('Pesanan Selesai! Terima kasih.')">
                    Selesai
                </button>
            </div>
        </div>

    </div>
</div>