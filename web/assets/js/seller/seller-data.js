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
            // Only alert if it's a real failure, not just session timeout which redirects anyway
            if (response.status !== 401) {
                alert('Gagal memuat data dashboard: ' + result.message);
            }
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

function updateStats(stats) {
    document.getElementById('total-products').textContent = stats.total_products;
    document.getElementById('total-stock').textContent = stats.total_stock;
    document.getElementById('total-orders').textContent = stats.total_orders;
    
    // Add follower count to stats if element exists
    const followerStat = document.getElementById('follower-count');
    if (followerStat) followerStat.textContent = stats.follower_count;
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
        const imgSrc = product.image ? (product.image.startsWith('http') ? product.image : '../assets/images/products/' + product.image) : '../assets/images/bag.png';
        row.innerHTML = `
            <td>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <img src="${imgSrc}" 
                         onerror="this.src='../assets/images/bag.png'"
                         style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;">
                    ${product.name}
                </div>
            </td>
            <td>Rp ${Number(product.price).toLocaleString('id-ID')}</td>
            <td>${product.stock}</td>
            <td>${product.weight} (gram)</td>
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
            document.getElementById('edit-weight').value = p.weight;
            document.getElementById('edit-category').value = p.category_id;
            document.getElementById('edit-description').value = p.description || '';
            
            // Show image preview if exists
            const preview = document.getElementById('edit-product-preview');
            if (p.image) {
                const imgSrc = p.image.startsWith('http') ? p.image : `../assets/images/products/${p.image}`;
                preview.innerHTML = `<img src="${imgSrc}" alt="Preview" onerror="this.src='../assets/images/bag.png'">`;
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
            console.log("DEBUG PROFILE DATA:", result.data);
            updateProfileView(result.data);
            updateSidebarProfile(result.data);
        } else {
            console.error('Failed to load profile:', result.message);
            if (response.status !== 401) {
                alert('Gagal memuat profil seller: ' + result.message);
            }
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

function updateProfileView(data) {
    try {
        // Update profile view with safe checks
        const setEl = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
            else console.warn(`Element #${id} not found in DOM`);
        };

        setEl('seller-name', data.username);
        setEl('seller-email', data.email || 'Email belum diatur');
        setEl('store-name', data.store_name);
        setEl('join-date', data.join_date);
        setEl('profile-total-products', data.total_products);
        
        const profileFollowers = document.getElementById('profile-followers');
        if (profileFollowers) profileFollowers.textContent = data.follower_count || 0;
        
        const avatarDiv = document.querySelector('.profile-avatar');
        if (avatarDiv) {
            if (data.profile_photo) {
                const imgSrc = data.profile_photo.startsWith('http') ? data.profile_photo : `../${data.profile_photo}`;
                avatarDiv.innerHTML = `<img src="${imgSrc}" alt="Profile Photo">`;
            } else {
                avatarDiv.innerHTML = '<span>👤</span>';
            }
        }
    } catch (error) {
        console.error('Error in updateProfileView:', error);
    }
}

function updateSidebarProfile(data) {
    // Update Desktop Sidebar
    const desktopLogo = document.querySelector('.desktop-logo');
    if (desktopLogo) {
        const imgSrc = data.profile_photo ? (data.profile_photo.startsWith('http') ? data.profile_photo : `../${data.profile_photo}`) : null;
        desktopLogo.innerHTML = `
            <div class="sidebar-profile">
                <div class="sidebar-avatar">
                    ${imgSrc ? `<img src="${imgSrc}" style="width:100%; height:100%; object-fit:cover;" alt="Profile">` : '👤'}
                </div>
                <div class="sidebar-info">
                    <strong>${data.store_name}</strong>
                    <small>${data.username}</small>
                </div>
            </div>
        `;
    }

    // Update Mobile Header
    const mobileStoreName = document.getElementById('mobile-store-name');
    if (mobileStoreName) {
        mobileStoreName.textContent = data.store_name;
    }
}

// ===== EDIT PROFILE (MODAL LOGIC) =====
function openEditProfileModal() {
    const modal = document.getElementById('edit-profile-modal');
    if (!modal) return;

    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';

    // Fill current data
    const storeName = document.getElementById('store-name')?.textContent || '';
    
    const inputStoreName = document.getElementById('profile_store_name');
    
    if (inputStoreName) inputStoreName.value = storeName;
}

function closeEditProfileModal() {
    const modal = document.getElementById('edit-profile-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// This redundant showEditProfileModal was removed in favor of the static one in modals.php

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
// ===== MY STORE PAGE =====
let currentStoreProducts = [];

async function loadMyStoreData() {
    console.log("Loading My Store data...");
    const grid = document.getElementById('storeProductGrid');
    if (!grid) return;

    grid.innerHTML = '<p style="text-align: center; padding: 40px; color: #666;">Memuat produk...</p>';

    try {
        const profileResponse = await fetch('../api/seller/get-seller-profile.php');
        const profResult = await profileResponse.json();
        
        if (profResult.success) {
            const data = profResult.data;
            document.getElementById('store-page-name').textContent = data.store_name || 'Nama Toko';
            document.getElementById('store-location').textContent = data.location || 'Gudang Blibli';
            document.getElementById('store-followers').textContent = data.follower_count || '0';
            document.getElementById('store-rating').textContent = '⭐ -';
            document.getElementById('store-reviews').textContent = '0';
            
            const profileImg = document.getElementById('store-profile-img');
            if (data.profile_photo) {
                // Check if it's a URL (Cloudinary) or local path
                const imgSrc = data.profile_photo.startsWith('http') 
                    ? data.profile_photo 
                    : '../' + data.profile_photo;
                profileImg.src = imgSrc;
                profileImg.onerror = () => profileImg.src = '../assets/images/person.png';
            } else {
                profileImg.src = '../assets/images/person.png';
            }
        }

        const dashResponse = await fetch('../api/seller/get-dashboard-data.php');
        const dashResult = await dashResponse.json();

        if (dashResult.success) {
            currentStoreProducts = dashResult.products || [];
            updateStoreProductGrid(currentStoreProducts);
        } else {
            grid.innerHTML = `<p style="text-align: center; padding: 40px; color: #e74c3c;">Gagal memuat produk: ${dashResult.message}</p>`;
        }
    } catch (error) {
        console.error('Error loading store data:', error);
        grid.innerHTML = '<p style="text-align: center; padding: 40px; color: #e74c3c;">Terjadi kesalahan server</p>';
    }
}

function filterStoreProducts(query) {
    const filtered = currentStoreProducts.filter(p => 
        p.name.toLowerCase().includes(query.toLowerCase())
    );
    updateStoreProductGrid(filtered);
}

function updateStoreProductGrid(products) {
    const grid = document.getElementById('storeProductGrid');
    if (!grid) return;

    if (!products || products.length === 0) {
        grid.innerHTML = '<p style="text-align: center; padding: 40px; color: #666;">Belum ada produk untuk ditampilkan.</p>';
        return;
    }

    grid.innerHTML = '';

    products.forEach(p => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.onclick = () => viewStoreProductDetail(p.id);
        
        const imgSrc = p.image ? (p.image.startsWith('http') ? p.image : `../assets/images/products/${p.image}`) : `../assets/images/bag.png`;
        
        card.innerHTML = `
            <div class="image-wrapper">
                <img src="${imgSrc}" alt="${p.name}" onerror="this.src='../assets/images/bag.png'">
            </div>
            <div class="product-info">
                <h3>${p.name}</h3>
                <p class="price">Rp ${Number(p.price).toLocaleString('id-ID')}</p>
                <div class="product-stats">
                    <span>Stok: ${p.stock}</span>
                    <span>Terjual 0</span>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function viewStoreProductDetail(productId) {
    const product = currentStoreProducts.find(p => p.id == productId);
    if (!product) return;

    const modal = document.getElementById('product-preview-modal');
    
    // Set content
    document.getElementById('preview-name').textContent = product.name;
    document.getElementById('preview-price').textContent = `Rp ${Number(product.price).toLocaleString('id-ID')}`;
    document.getElementById('preview-category').textContent = product.category_name || '-';
    document.getElementById('preview-stock').textContent = product.stock;
    document.getElementById('preview-description').textContent = product.description || 'Tidak ada deskripsi.';
    
    const previewImg = document.getElementById('preview-img');
    const imgSrc = product.image ? (product.image.startsWith('http') ? product.image : `../assets/images/products/${product.image}`) : `../assets/images/bag.png`;
    previewImg.src = imgSrc;
    previewImg.onerror = () => previewImg.src = '../assets/images/bag.png';

    // Show modal
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden'; 
}

function closeProductPreviewModal() {
    const modal = document.getElementById('product-preview-modal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto'; // Restore scroll
}

window.loadDashboardData = loadDashboardData;
window.loadSellerProfile = loadSellerProfile;
window.loadCategories = loadCategories;
window.editProduct = editProduct;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.closeEditProductModal = closeEditProductModal;
window.loadMyStoreData = loadMyStoreData;
window.filterStoreProducts = filterStoreProducts;
window.closeProductPreviewModal = closeProductPreviewModal;
window.viewStoreProductDetail = viewStoreProductDetail;

// ===== ORDERS SYSTEM =====
async function loadOrders() {
    const list = document.getElementById('order-list');
    if (!list) return;

    try {
        const response = await fetch('../api/seller/get-orders.php');
        const result = await response.json();

        if (result.success) {
            if (result.data.length === 0) {
                list.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px;">Belum ada pesanan masuk.</td></tr>';
                return;
            }

            list.innerHTML = result.data.map(order => `
                <tr>
                    <td>#ORD-${order.id}</td>
                    <td>${order.buyer_name}</td>
                    <td>${new Date(order.created_at).toLocaleDateString('id-ID')}</td>
                    <td>Rp ${Number(order.total_amount).toLocaleString('id-ID')}</td>
                    <td><span class="status-badge ${order.status}">${order.status}</span></td>
                    <td>
                        ${order.status === 'pending' ? `
                            <button class="btn-sm btn-approve" onclick="updateOrderStatus(${order.id}, 'processing')">Terima</button>
                            <button class="btn-sm btn-cancel" onclick="updateOrderStatus(${order.id}, 'cancelled')">Tolak</button>
                        ` : order.status === 'processing' ? `
                            <button class="btn-sm btn-approve" style="background:#2ecc71" onclick="updateOrderStatus(${order.id}, 'confirmed')">Konfirmasi Pesanan ✅</button>
                        ` : order.status === 'confirmed' ? `
                            <button class="btn-sm btn-approve" style="background:#3498db" onclick="updateOrderStatus(${order.id}, 'shipped')">Antar Barang 🚚</button>
                        ` : order.status === 'shipped' ? `
                            <span style="color:#f39c12; font-style:italic;">Menunggu Konfirmasi User</span>
                        ` : order.status === 'completed' ? `
                            <span style="color:#27ae60; font-weight:bold;">Barang Sudah Sampai</span>
                        ` : '-'}
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading orders:', error);
    }
}

async function updateOrderStatus(orderId, status) {
    if (!confirm(`Yakin ingin mengubah status pesanan ke ${status}?`)) return;

    try {
        const response = await fetch('../api/seller/update-order-status.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_id: orderId, status: status })
        });
        const result = await response.json();
        if (result.success) {
            loadOrders();
            loadDashboardData(); // Refresh stats
        } else {
            alert(result.message);
        }
    } catch (error) {
        console.error('Error updating status:', error);
    }
}


// Handle Profile Update Form
document.getElementById('edit-profile-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const saveBtn = e.target.querySelector('.btn-save');
    
    saveBtn.disabled = true;
    saveBtn.textContent = 'Menyimpan...';

    try {
        const response = await fetch('../api/seller/update-profile.php', {
            method: 'POST',
            body: formData
        });
        const result = await response.json();
        
        if (result.success) {
            alert('Profil berhasil diperbaharui!');
            location.reload(); // Hard refresh to update everything
        } else {
            alert(result.message);
            saveBtn.disabled = false;
            saveBtn.textContent = 'Simpan Perubahan';
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        saveBtn.disabled = false;
        saveBtn.textContent = 'Simpan Perubahan';
    }
});

// Initialize orders on view switch
document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', () => {
        if (item.dataset.page === 'orders') {
            loadOrders();
        }
    });
});

window.updateOrderStatus = updateOrderStatus;
window.openEditProfileModal = openEditProfileModal;
window.closeEditProfileModal = closeEditProfileModal;

window.closeLogoutModal = function() {
    const modal = document.getElementById('logout-modal');
    if (modal) modal.style.display = 'none';
};

window.processLogout = async function(redirectUrl) {
    try {
        await fetch('../api/auth/logout.php');
        sessionStorage.clear();
        localStorage.clear();
        window.location.href = redirectUrl;
    } catch (err) {
        console.error('Logout failed:', err);
        window.location.href = redirectUrl;
    }
};

// Initialize Categories on Load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadCategories);
} else {
    loadCategories();
}
