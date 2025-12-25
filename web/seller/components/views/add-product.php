<div id="add-product-view" class="view">
    <h1>Tambah Produk Baru</h1>
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
            <div class="form-group">
                <label for="category_id">Kategori <span class="required">*</span></label>
                <select id="category_id" name="category_id" required>
                    <option value="">Loading...</option>
                </select>
            </div>
            <div class="form-group">
                <label for="description">Deskripsi</label>
                <textarea id="description" name="description" rows="4"></textarea>
            </div>
            <div class="form-group">
                <label for="image">Gambar Produk</label>
                <input type="file" id="image" name="image" accept="image/*">
                <div id="image-preview" class="image-preview"></div>
            </div>
            <button type="submit" id="submit-btn" class="btn-primary" disabled>Simpan Produk</button>
        </form>
    </div>
</div>
