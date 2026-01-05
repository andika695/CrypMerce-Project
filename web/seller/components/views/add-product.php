<div id="add-product-view" class="view">
    <h1 class="profile-title-new">Tambah Produk Baru</h1>
    <div class="form-container">
        <form id="add-product-form" enctype="multipart/form-data">
            <div class="form-group">
                <label for="name">Nama Produk <span class="required">*</span></label>
                <input type="text" id="name" name="name" required>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="price">Harga <span class="required">*</span></label>
                    <input type="number" id="price" name="price" min="0" required>
                </div>
                <div class="form-group">
                    <label for="stock">Stok <span class="required">*</span></label>
                    <input type="number" id="stock" name="stock" min="0" required>
                </div>
            </div>
            <div class="form-row">
            <div class="form-group">
                <label for="category_id">Kategori <span class="required">*</span></label>
                <select id="category_id" name="category_id" required>
                    <option value="">Loading...</option>
                </select>
            </div>
            <div class="form-group">
                <label for="weight">Berat Barang (gram) <span class="required">*</span></label>
                <input type="number" id="weight" name="weight" min="0" required>
            </div>
            </div>
            <div class="form-group">
                <label for="description">Deskripsi</label>
                <textarea id="description" name="description" rows="4"></textarea>
            </div>
            <div class="form-group">
                <label>Foto Produk <span class="text-muted">(Maksimal 5 foto, foto pertama = utama)</span></label>
                <div class="multi-image-upload">
                    <input type="file" id="product-images" name="images[]" accept=".jpg, .jpeg, .png, image/png, image/jpeg, image/jpg" multiple hidden>
                    <div class="upload-area" id="upload-area">
                        <div class="upload-placeholder" id="upload-placeholder">
                            <i class="fas fa-cloud-upload-alt"></i>
                            <p>Klik atau drag & drop foto di sini</p>
                            <span>Format: JPG, JPEG, PNG (Maks. 2MB per foto)</span>
                        </div>
                    </div>
                    <div class="image-preview-grid" id="image-preview-grid"></div>
                    <p class="image-counter"><span id="image-count">0</span>/5 foto dipilih</p>
                </div>
            </div>
            <button type="submit" id="submit-btn" class="btn-primary" disabled>Simpan Produk</button>
        </form>
    </div>
</div>
