<!-- SELLER DASHBOARD MODALS -->

<!-- PRODUCT PREVIEW MODAL -->
<div id="product-preview-modal" class="modal">
    <div class="modal-content product-preview-content">
        <span class="close-modal" onclick="closeProductPreviewModal()">&times;</span>
        <div class="preview-layout">
            <div class="preview-left">
                <div class="preview-main-image">
                    <img id="preview-img" src="../assets/images/bag.png" alt="Product Image">
                </div>
            </div>
            <div class="preview-right">
                <h1 id="preview-name" class="preview-title">Nama Produk</h1>
                <div class="preview-price-box"><h2 id="preview-price">Rp 0</h2></div>
                <div class="preview-info-grid">
                    <div class="info-item"><span class="label">Kategori</span><span class="value" id="preview-category">-</span></div>
                    <div class="info-item"><span class="label">Stok</span><span class="value" id="preview-stock">0</span></div>
                    <div class="info-item"><span class="label">Terjual</span><span class="value">0</span></div>
                </div>
                <div class="preview-description-section">
                    <h3>Deskripsi Produk</h3>
                    <div id="preview-description" class="preview-description-content">No description available.</div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- EDIT PRODUCT MODAL -->
<div id="edit-product-modal" class="modal">
    <div class="modal-content">
        <span class="close-modal" onclick="closeEditProductModal()">&times;</span>
        <h2>Edit Produk</h2>
        <form id="edit-product-form" enctype="multipart/form-data">
            <input type="hidden" id="edit-product-id" name="product_id">
            <div class="form-group">
                <label for="edit-name">Nama Produk</label>
                <input type="text" id="edit-name" name="name" required>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="edit-price">Harga</label>
                    <input type="number" id="edit-price" name="price" min="0" required>
                </div>
                <div class="form-group">
                    <label for="edit-stock">Stok</label>
                    <input type="number" id="edit-stock" name="stock" min="0" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="edit-category">Kategori</label>
                    <select id="edit-category" name="category_id" required>
                        <option value="">Loading...</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="edit-weight">Berat Barang (gram)</label>
                    <input type="number" id="edit-weight" name="weight" min="0" required>
                </div>
            </div>
            <div class="form-group">
                <label for="edit-description">Deskripsi</label>
                <textarea id="edit-description" name="description" rows="3"></textarea>
            </div>
            <div class="form-group">
                <label>Foto Produk (Maks 5)</label>
                <input type="hidden" id="edit-removed-images" name="removed_images">
                
                <div class="upload-area" id="edit-upload-area">
                    <input type="file" id="edit-images" name="images[]" accept="image/*" multiple hidden>
                    <div class="upload-placeholder">
                        <i class="fas fa-cloud-upload-alt"></i>
                        <p>Klik atau Drag & Drop foto di sini</p>
                        <span>Format: JPG, PNG, GIF (Maks. 2MB)</span>
                    </div>
                </div>

                <div class="image-preview-grid" id="edit-image-preview-grid"></div>
                <div class="image-counter" id="edit-image-count">0/5 Foto</div>
            </div>
            <div class="modal-buttons">
                <button type="submit" class="btn-save">Simpan Perubahan</button>
                <button type="button" class="btn-cancel" onclick="closeEditProductModal()">Batal</button>
            </div>
        </form>
    </div>
</div>

<!-- LOGOUT MODAL -->
<div id="logout-modal" class="modal">
    <div class="modal-content logout-modal-content">
        <span class="close-modal" onclick="closeLogoutModal()">&times;</span>
        <h2>Keluar dari Seller Dashboard</h2>
        <p>Pilih aksi yang ingin Anda lakukan:</p>
        <div class="logout-options">
            <button onclick="processLogout('../pages/auth/loginSeller.html')" class="btn-logout-main">🚪 Logout Seller</button>
            <button onclick="processLogout('../pages/auth/login.html')" class="btn-switch-user">👤 Ganti Akun ke User</button>
        </div>
        <button type="button" class="btn-cancel-logout" onclick="closeLogoutModal()">Batal</button>
    </div>
</div>

<!-- EDIT PROFILE MODAL -->
<div id="edit-profile-modal" class="modal">
    <div class="modal-content">
        <span class="close-modal" onclick="closeEditProfileModal()">&times;</span>
        <h2>Edit Profil Seller</h2>
        <form id="edit-profile-form" enctype="multipart/form-data">
            <div class="form-group">
                <label for="profile_store_name">Nama Toko</label>
                <input type="text" id="profile_store_name" name="store_name" required>
            </div>
            <div class="form-group">
                <label for="profile_photo">Foto Profil Baru (Opsional)</label>
                <input type="file" id="profile_photo" name="profile_photo" accept="image/*">
            </div>
            <div class="modal-buttons">
                <button type="submit" class="btn-save">Simpan Perubahan</button>
                <button type="button" class="btn-cancel" onclick="closeEditProfileModal()">Batal</button>
            </div>
        </form>
    </div>
</div>

<!-- ORDER DETAILS MODAL -->
<div id="order-details-modal" class="modal">
    <div class="modal-content">
        <span class="close-modal" onclick="closeOrderDetailsModal()">&times;</span>
        <h2>Detail Pesanan</h2>
        <div id="order-details-content">
            <p style="text-align: center; padding: 20px;">Memuat detail pesanan...</p>
        </div>
    </div>
</div>
