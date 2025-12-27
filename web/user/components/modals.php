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
            
            <!-- Pilihan 2: Ganti ke Akun Seller -->
            <button onclick="window.location.href='../seller/dashboard.php'" class="btn-switch-user">
                💼 Ganti ke Akun Seller
            </button>
        </div>
        
        <button type="button" class="btn-cancel-logout" onclick="closeLogoutModal()">Batal</button>
    </div>
</div>