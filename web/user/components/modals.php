<!-- MODAL EDIT PROFIL USER -->
<div id="edit-profile-modal" class="modal">
    <div class="modal-content">
        <span class="close-modal" onclick="closeEditProfileModal()">&times;</span>
        <h2>Edit Profil User</h2>
        <form id="edit-profile-form" method="POST" enctype="multipart/form-data">
            <div class="form-group">
                <label for="profile_name">Nama Lengkap</label>
                <!-- Mengambil data dummy atau session -->
                <input type="text" id="profile_name" name="name" value="<?php echo htmlspecialchars($userProfile['full_name'] ?? $userProfile['username'] ?? ''); ?>" required>
            </div>
            
            <div class="form-group">
                <label for="profile_photo">Foto Profil Baru</label>
                <input type="file" id="profile_photo" name="photo" accept="image/*">
            </div>

            <div class="modal-buttons">
                <!-- Tombol HANYA VISUAL (Belum ada backend simpan) -->
                <button type="submit" class="btn-save">Simpan Perubahan</button>
                <button type="button" class="btn-cancel" onclick="closeEditProfileModal()">Batal</button>
            </div>
        </form>
    </div>
</div>

<!-- MODAL LOGOUT -->
<div id="logout-modal" class="modal">
    <div class="modal-content logout-modal-content">
        <span class="close-modal" onclick="closeLogoutModal()">&times;</span>
        <h2>Keluar dari Akun User</h2>
        <p>Pilih aksi yang ingin Anda lakukan:</p>
        
        <div class="logout-options">
            <!-- Pilihan 1: Logout Total -->
            <button onclick="window.location.href='../pages/auth/login.html'" class="btn-logout-main">
                🚪 Logout
            </button>
            
            <!-- Pilihan 2: Ganti ke Akun Seller (harus login dulu) -->
            <button onclick="window.location.href='../pages/auth/loginSeller.html'" class="btn-switch-user">
                💼 Login ke Akun Seller
            </button>
        </div>
        
        <button type="button" class="btn-cancel-logout" onclick="closeLogoutModal()">Batal</button>
    </div>
</div>

<!-- RATING MODAL -->
<div id="rating-modal" class="modal">
    <div class="modal-content">
        <span class="close-modal" onclick="closeRatingModal()">&times;</span>
        <h2>Beri Penilaian Toko</h2>
        <form id="rating-form">
            <input type="hidden" id="rating-order-id" name="order_id">
            
            <div class="star-rating">
                <input type="radio" id="star5" name="rating" value="5" /><label for="star5" title="Sempurna">★</label>
                <input type="radio" id="star4" name="rating" value="4" /><label for="star4" title="Sangat Baik">★</label>
                <input type="radio" id="star3" name="rating" value="3" /><label for="star3" title="Baik">★</label>
                <input type="radio" id="star2" name="rating" value="2" /><label for="star2" title="Cukup">★</label>
                <input type="radio" id="star1" name="rating" value="1" /><label for="star1" title="Buruk">★</label>
            </div>

            <div class="form-group">
                <label for="rating-review">Ulasan Anda (Opsional)</label>
                <textarea id="rating-review" name="review" rows="3" placeholder="Bagaimana pengalaman belanja Anda?"></textarea>
            </div>
            
            <div class="modal-buttons">
                <button type="submit" class="btn-save">Kirim Penilaian</button>
                <button type="button" class="btn-cancel" onclick="closeRatingModal()">Nanti Saja</button>
            </div>
        </form>
    </div>
</div>