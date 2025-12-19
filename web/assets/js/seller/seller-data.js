// ===== SELLER DASHBOARD DATA =====
// File terpisah untuk handle data fetching agar tidak menumpuk di dashboard.js

async function loadDashboardData() {
    try {
        const response = await fetch('../api/seller/get-dashboard-data.php');
        const result = await response.json();
        
        console.log('Dashboard data:', result);
        
        if (result.success) {
            // Update stats
            updateStats(result.stats);
            
            // Update product table
            updateProductTable(result.products);
        } else {
            console.error('Failed to load dashboard data:', result.message);
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

function updateStats(stats) {
    document.getElementById('total-products').textContent = stats.total_products;
    document.getElementById('total-stock').textContent = stats.total_stock;
    document.getElementById('total-orders').textContent = stats.total_orders;
}

function updateProductTable(products) {
    const tbody = document.getElementById('product-list');
    
    if (!products || products.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; color: #9ca3af;">
                    Belum ada produk. Tambahkan produk pertama Anda!
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = '';
    
    products.forEach(product => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div style="display: flex; align-items: center; gap: 10px;">
                    ${product.image ? `<img src="../assets/images/products/${product.image}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;">` : ''}
                    ${product.name}
                </div>
            </td>
            <td>Rp ${Number(product.price).toLocaleString('id-ID')}</td>
            <td>${product.stock}</td>
            <td>${product.category_name || '-'}</td>
            <td>
                <button class="btn-edit" onclick="editProduct(${product.id})">Edit</button>
                <button class="btn-delete" onclick="deleteProduct(${product.id})">Hapus</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// ===== PRODUCT ACTIONS (DELETE & EDIT) =====

// 1. Delete Product
async function deleteProduct(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus produk ini?')) return;

    try {
        const response = await fetch('../api/seller/delete-product.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id })
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Produk berhasil dihapus');
            loadDashboardData(); // Refresh table
        } else {
            alert('Gagal menghapus: ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Terjadi kesalahan server');
    }
}

// 2. Edit Product - Open Modal
async function editProduct(id) {
    try {
        const response = await fetch(`../api/seller/get-product-details.php?id=${id}`);
        const result = await response.json();
        
        if (result.success) {
            const p = result.data;
            
            // Fill form
            document.getElementById('edit-product-id').value = p.id;
            document.getElementById('edit-name').value = p.name;
            document.getElementById('edit-price').value = p.price;
            document.getElementById('edit-stock').value = p.stock;
            document.getElementById('edit-category').value = p.category_id;
            document.getElementById('edit-description').value = p.description || '';
            
            // Show image preview if exists
            const preview = document.getElementById('edit-product-preview');
            if (p.image) {
                preview.innerHTML = `<img src="../assets/images/products/${p.image}" alt="Preview">`;
                preview.classList.add('show');
            } else {
                preview.innerHTML = '';
            }

            // Show modal
            const modal = document.getElementById('edit-product-modal');
            modal.style.display = 'block';
            
        } else {
            alert('Gagal mengambil data produk: ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Terjadi kesalahan saat memuat data produk');
    }
}

// Close Modal Function
function closeEditProductModal() {
    document.getElementById('edit-product-modal').style.display = 'none';
}

// 3. Handle Edit Form Submit
document.addEventListener('DOMContentLoaded', () => {
    const editForm = document.getElementById('edit-product-form');
    
    if (editForm) {
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const btn = editForm.querySelector('.btn-save');
            btn.disabled = true;
            btn.textContent = 'Menyimpan...';
            
            try {
                const formData = new FormData(editForm);
                
                const response = await fetch('../api/seller/edit-product.php', {
                    method: 'POST',
                    body: formData
                });
                
                const result = await response.json();
                
                if (result.success) {
                    alert('Produk berhasil diperbarui');
                    closeEditProductModal();
                    loadDashboardData(); // Refresh table
                } else {
                    alert('Gagal update: ' + result.message);
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Terjadi kesalahan server');
            } finally {
                btn.disabled = false;
                btn.textContent = 'Simpan Perubahan';
            }
        });
    }

    // Edit Image Preview Handler
    const editImageInput = document.getElementById('edit-image');
    if (editImageInput) {
        editImageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            const preview = document.getElementById('edit-product-preview');
            
            if (file) {
                 const reader = new FileReader();
                 reader.onload = (e) => {
                     preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
                     preview.classList.add('show');
                 };
                 reader.readAsDataURL(file);
            }
        });
    }
});

// ===== SELLER PROFILE =====
async function loadSellerProfile() {
    try {
        const response = await fetch('../api/seller/get-seller-profile.php');
        const result = await response.json();
        
        console.log('Profile data:', result);
        
        if (result.success) {
            console.log("DEBUG PROFILE DATA:", result.data); // Cek console untuk lihat nilai email!
            console.log("Email value:", result.data.email);
            updateProfileView(result.data);
            updateSidebarProfile(result.data);
        } else {
            console.error('Failed to load profile:', result.message);
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

function updateProfileView(data) {
    // Update profile view
    document.getElementById('seller-name').textContent = data.username;
    document.getElementById('seller-email').textContent = data.email || 'Email belum diatur';
    document.getElementById('store-name').textContent = data.store_name;
    document.getElementById('join-date').textContent = data.join_date;
    document.getElementById('profile-total-products').textContent = data.total_products;
    
    // Update profile avatar
    const avatarDiv = document.querySelector('.profile-avatar');
    if (data.profile_photo) {
        avatarDiv.innerHTML = `<img src="../${data.profile_photo}" alt="Profile Photo">`;
    } else {
        avatarDiv.innerHTML = '<span>👤</span>';
    }
}

function updateSidebarProfile(data) {
    // Update sidebar with store name
    const logo = document.querySelector('.logo');
    if (logo) {
        logo.innerHTML = `
            <div class="sidebar-profile">
                <div class="sidebar-avatar">
                    ${data.profile_photo ? `<img src="../${data.profile_photo}" alt="Profile">` : '👤'}
                </div>
                <div class="sidebar-info">
                    <strong>${data.store_name}</strong>
                    <small>${data.username}</small>
                </div>
            </div>
        `;
    }
}

// ===== EDIT PROFILE =====
function setupEditProfile() {
    const editBtn = document.querySelector('.btn-edit-profile');
    
    if (editBtn) {
        editBtn.addEventListener('click', () => {
            showEditProfileModal();
        });
    }
}

function showEditProfileModal() {
    // Create modal HTML
    const modalHTML = `
        <div id="edit-profile-modal" class="modal" style="display: block;">
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <h2>Edit Profil Seller</h2>
                
                <form id="edit-profile-form" enctype="multipart/form-data">
                    <div class="form-group">
                        <label for="edit-storeName">Nama Toko</label>
                        <input type="text" id="edit-storeName" name="storeName" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="edit-profilePhoto">Foto Profil Baru (Opsional)</label>
                        <input type="file" id="edit-profilePhoto" name="profilePhoto" accept="image/*">
                        <div id="edit-image-preview" class="image-preview"></div>
                    </div>
                    
                    <div class="modal-buttons">
                        <button type="submit" class="btn-save">Simpan</button>
                        <button type="button" class="btn-cancel">Batal</button>
                    </div>
                    
                    <div id="edit-message" class="message"></div>
                </form>
            </div>
        </div>
    `;
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Get current store name
    const currentStoreName = document.getElementById('store-name').textContent;
    document.getElementById('edit-storeName').value = currentStoreName;
    
    // Setup modal events
    const modal = document.getElementById('edit-profile-modal');
    const closeBtn = modal.querySelector('.close-modal');
    const cancelBtn = modal.querySelector('.btn-cancel');
    const form = document.getElementById('edit-profile-form');
    const photoInput = document.getElementById('edit-profilePhoto');
    const preview = document.getElementById('edit-image-preview');
    
    // Close modal events
    closeBtn.onclick = () => modal.remove();
    cancelBtn.onclick = () => modal.remove();
    window.onclick = (e) => { if (e.target === modal) modal.remove(); };
    
    // Image preview
    photoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
                preview.classList.add('show');
            };
            reader.readAsDataURL(file);
        } else {
            preview.innerHTML = '';
            preview.classList.remove('show');
        }
    });
    
    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = form.querySelector('.btn-save');
        const messageDiv = document.getElementById('edit-message');
        
        submitBtn.disabled = true;
        submitBtn.textContent = 'Menyimpan...';
        
        try {
            const formData = new FormData(form);
            
            const response = await fetch('../api/seller/update-seller-profile.php', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                messageDiv.textContent = result.message;
                messageDiv.className = 'message success';
                messageDiv.style.display = 'block';
                
                // Reload profile data
                setTimeout(() => {
                    loadSellerProfile();
                    modal.remove();
                }, 1500);
            } else {
                messageDiv.textContent = result.message;
                messageDiv.className = 'message error';
                messageDiv.style.display = 'block';
                submitBtn.disabled = false;
                submitBtn.textContent = 'Simpan';
            }
        } catch (error) {
            console.error('Error:', error);
            messageDiv.textContent = 'Terjadi kesalahan. Silakan coba lagi.';
            messageDiv.className = 'message error';
            messageDiv.style.display = 'block';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Simpan';
        }
    });
}

// ===== CATEGORIES =====
async function loadCategories() {
    try {
        const response = await fetch('../api/get-categories.php');
        const result = await response.json();
        
        if (result.success) {
            const categories = result.categories;
            const optionsHTML = '<option value="">Pilih Kategori</option>' + 
                categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');
            
            // Populate Add Product Dropdown
            const addSelect = document.getElementById('category_id');
            if (addSelect) addSelect.innerHTML = optionsHTML;

            // Populate Edit Product Dropdown
            const editSelect = document.getElementById('edit-category');
            if (editSelect) editSelect.innerHTML = optionsHTML;
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Export functions
window.loadDashboardData = loadDashboardData;
window.loadSellerProfile = loadSellerProfile;
window.loadCategories = loadCategories;
window.setupEditProfile = setupEditProfile;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.closeEditProductModal = closeEditProductModal;

// Initialize Categories on Load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadCategories);
} else {
    loadCategories();
}
