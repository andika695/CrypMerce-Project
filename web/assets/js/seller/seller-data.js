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
    
    // Add total revenue with currency formatting
    const revenueStat = document.getElementById('total-revenue');
    if (revenueStat) revenueStat.textContent = 'Rp ' + Number(stats.total_revenue || 0).toLocaleString('id-ID');
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

// ===== EDIT PRODUCT STATE =====
let editSelectedFiles = [];
let removedExistingImages = [];
let currentExistingImages = [];
const MAX_EDIT_IMAGES = 5;

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
            
            // Fill form fields
            document.getElementById('edit-product-id').value = p.id;
            document.getElementById('edit-name').value = p.name;
            document.getElementById('edit-price').value = p.price;
            document.getElementById('edit-stock').value = p.stock;
            document.getElementById('edit-weight').value = p.weight;
            document.getElementById('edit-category').value = p.category_id;
            document.getElementById('edit-description').value = p.description || '';
            
            // Reset state
            editSelectedFiles = [];
            removedExistingImages = [];
            // Parse images if API didn't (e.g. if specific endpoint version differs)
            currentExistingImages = Array.isArray(p.images) ? p.images : (p.image ? [p.image] : []);
            
            renderEditPreviews();

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

function renderEditPreviews() {
    const previewGrid = document.getElementById('edit-image-preview-grid');
    const imageCounter = document.getElementById('edit-image-count');
    
    if (!previewGrid) return;
    
    previewGrid.innerHTML = '';
    
    // 1. Render Existing Images (that are not removed)
    currentExistingImages.forEach((url, index) => {
        if (removedExistingImages.includes(url)) return;
        
        const imgSrc = url.startsWith('http') ? url : `../assets/images/products/${url}`;
        const item = document.createElement('div');
        item.className = 'image-preview-item';
        // Mark first non-removed image as primary (visually)
        item.innerHTML = `
            <img src="${imgSrc}" alt="Product Image" onerror="this.src='../assets/images/bag.png'">
            <button type="button" class="remove-btn existing" data-url="${url}">&times;</button>
        `;
        
        item.querySelector('.remove-btn').addEventListener('click', () => {
             removedExistingImages.push(url);
             renderEditPreviews();
        });
        
        previewGrid.appendChild(item);
    });
    
    // 2. Render New Selected Files
    editSelectedFiles.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (e) => {
             const item = document.createElement('div');
             item.className = 'image-preview-item new-file';
             item.innerHTML = `
                <img src="${e.target.result}" alt="New Image">
                <span class="primary-badge" style="background:#3498db; right:auto; left:6px;">Baru</span>
                <button type="button" class="remove-btn" data-index="${index}">&times;</button>
             `;
             
             item.querySelector('.remove-btn').addEventListener('click', () => {
                 editSelectedFiles.splice(index, 1);
                 renderEditPreviews();
                 updateEditFileInput();
             });
             
             // Append finding current position to ensure order (simple append works for small arrays)
             previewGrid.appendChild(item);
        };
        reader.readAsDataURL(file);
    });

    // Update Counter
    const totalImages = (currentExistingImages.length - removedExistingImages.length) + editSelectedFiles.length;
    if (imageCounter) imageCounter.textContent = `${totalImages}/${MAX_EDIT_IMAGES} Foto`;
}

function handleEditFiles(files) {
    const newFiles = Array.from(files);
    const existingCount = currentExistingImages.length - removedExistingImages.length;
    
    // Validate total count
    if (existingCount + editSelectedFiles.length + newFiles.length > MAX_EDIT_IMAGES) {
        alert(`Maksimal ${MAX_EDIT_IMAGES} foto. Saat ini ada ${existingCount + editSelectedFiles.length} foto.`);
        return;
    }

    newFiles.forEach(file => {
        // Validate file type
        const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        const fileExtension = file.name.split('.').pop().toLowerCase();
        
        // Check mime type (if available) OR extension
        const isImage = file.type.startsWith('image/') || validExtensions.includes(fileExtension);

        if (!isImage) {
            alert(`File "${file.name}" bukan gambar.`);
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            alert(`File "${file.name}" terlalu besar. Maksimal 2MB.`);
            return;
        }
        editSelectedFiles.push(file);
    });

    renderEditPreviews();
    updateEditFileInput();
}

function updateEditFileInput() {
    const editImagesInput = document.getElementById('edit-images');
    if (!editImagesInput) return;
    
    const dt = new DataTransfer();
    editSelectedFiles.forEach(file => dt.items.add(file));
    editImagesInput.files = dt.files;
}

// Close Modal Function
function closeEditProductModal() {
    document.getElementById('edit-product-modal').style.display = 'none';
}

// 3. Handle Edit Form Submit & Listeners
document.addEventListener('DOMContentLoaded', () => {
    const editForm = document.getElementById('edit-product-form');
    const editUploadArea = document.getElementById('edit-upload-area');
    const editImagesInput = document.getElementById('edit-images');

    // Init Upload Listeners for Edit Modal
    if (editUploadArea && editImagesInput) {
        editUploadArea.addEventListener('click', () => editImagesInput.click());
        
        editUploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            editUploadArea.classList.add('drag-over');
        });

        editUploadArea.addEventListener('dragleave', () => {
            editUploadArea.classList.remove('drag-over'); 
        });

        editUploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            editUploadArea.classList.remove('drag-over');
            handleEditFiles(e.dataTransfer.files);
        });

        editImagesInput.addEventListener('change', (e) => {
            handleEditFiles(e.target.files);
        });
    }

    if (editForm) {
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const btn = editForm.querySelector('.btn-save');
            btn.disabled = true;
            btn.textContent = 'Menyimpan...';
            
            try {
                const formData = new FormData(editForm);
                
                // Add removed images
                document.getElementById('edit-removed-images').value = JSON.stringify(removedExistingImages);
                formData.set('removed_images', JSON.stringify(removedExistingImages));
                
                // New images are already in 'images[]' input via DataTransfer, 
                // but if browser support is flaky, we can use this check:
                // formData keys for files might be empty if input is not updated properly.
                // updateEditFileInput() ensures input.files is sync.

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

        const profileRating = document.getElementById('profile-rating');
        const profileReviews = document.getElementById('profile-reviews');
        if (profileRating) {
            const rating = data.rating > 0 ? data.rating : '-';
            profileRating.textContent = `⭐ ${rating}`;
        }
        if (profileReviews) {
            profileReviews.textContent = data.total_reviews || 0;
        }
        
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
    // Update Desktop/Mobile Sidebar (Unified)
    const sidebarImg = document.getElementById('sidebar-img');
    const sidebarName = document.getElementById('sidebar-user-name');
    const sidebarRole = document.querySelector('.sidebar-user-role'); // Optional dynamic role

    if (sidebarImg && data.profile_photo) {
        const imgSrc = data.profile_photo.startsWith('http') ? data.profile_photo : `../${data.profile_photo}`;
        sidebarImg.src = imgSrc;
    }
    
    if (sidebarName) {
        sidebarName.textContent = data.store_name;
    }

    if (sidebarRole) {
        sidebarRole.textContent = data.username ? data.username : 'Seller'; // Show username or 'Seller'
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
            
            // Populate Rating Stats
            const ratingElem = document.getElementById('store-rating');
            const reviewsElem = document.getElementById('store-reviews');
            if (ratingElem) {
                const rating = data.rating > 0 ? data.rating : '-';
                ratingElem.textContent = `⭐ ${rating}`;
            }
            if (reviewsElem) {
                reviewsElem.textContent = data.total_reviews || '0';
            }
            
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

let currentProductReviews = [];

async function viewStoreProductDetail(productId) {
    const view = document.getElementById('product-detail-view');
    if (!view) return;

    // Store product ID globally for reviews page
    window.currentProductId = productId;

    // Show loading state
    document.getElementById('seller-product-name').textContent = 'Memuat...';
    document.getElementById('btn-see-all-reviews').style.display = 'none';

    // Update active view
    const views = document.querySelectorAll('.view');
    views.forEach(v => v.classList.remove('active'));
    view.classList.add('active');

    // Update mobile title if exists
    const mobileTitle = document.getElementById('mobile-page-title');
    if (mobileTitle) mobileTitle.textContent = 'Detail Produk';

    try {
        const response = await fetch(`../api/user/get-product-detail.php?id=${productId}`);
        const result = await response.json();

        if (result.success) {
            const data = result.data;
            
            // Basic Info
            document.getElementById('seller-product-name').textContent = data.name;
            document.getElementById('seller-product-price').textContent = 'Rp ' + Number(data.price).toLocaleString('id-ID');
            document.getElementById('seller-product-weight').textContent = data.weight + ' gram';
            document.getElementById('seller-product-stock').textContent = data.stock;
            document.getElementById('seller-product-description').innerHTML = data.description ? 
                data.description.replace(/\n/g, '<br>') : 'Tidak ada deskripsi.';

            // Images
            const imagesArray = data.images && data.images.length > 0 ? data.images : (data.image ? [data.image] : []);
            const mainImg = document.getElementById('seller-main-img');
            const thumbGallery = document.getElementById('seller-thumbnail-gallery');

            if (imagesArray.length > 0) {
                const firstImgPath = imagesArray[0].startsWith('http') ? imagesArray[0] : `../assets/images/products/${imagesArray[0]}`;
                mainImg.src = firstImgPath;
                
                if (thumbGallery) {
                    thumbGallery.innerHTML = '';
                    if (imagesArray.length > 1) {
                        imagesArray.forEach((img, index) => {
                            const imgPath = img.startsWith('http') ? img : `../assets/images/products/${img}`;
                            const thumb = document.createElement('div');
                            thumb.className = 'thumbnail-item' + (index === 0 ? ' active' : '');
                            thumb.innerHTML = `<img src="${imgPath}" alt="Thumb ${index}">`;
                            thumb.onclick = () => {
                                mainImg.src = imgPath;
                                thumbGallery.querySelectorAll('.thumbnail-item').forEach(t => t.classList.remove('active'));
                                thumb.classList.add('active');
                            };
                            thumbGallery.appendChild(thumb);
                        });
                    }
                }
            } else {
                mainImg.src = '../assets/images/no-image.png';
            }

            // Seller Info
            if (data.seller) {
                document.getElementById('seller-view-name').textContent = data.seller.store_name;
                document.getElementById('seller-view-location').textContent = data.seller.location || 'Indonesia';
                if (data.seller.photo) {
                    const photoSrc = data.seller.photo.startsWith('http') ? data.seller.photo : `../${data.seller.photo}`;
                    document.getElementById('seller-view-photo').src = photoSrc;
                }
            }

            // Load Reviews
            loadSellerViewReviews(productId);

        } else {
            alert('Gagal memuat detail produk: ' + result.message);
            backToStore();
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Terjadi kesalahan saat memuat data');
        backToStore();
    }
}

function backToStore() {
    const views = document.querySelectorAll('.view');
    views.forEach(v => v.classList.remove('active'));
    
    const myStoreView = document.getElementById('my-store-view');
    if (myStoreView) myStoreView.classList.add('active');

    const mobileTitle = document.getElementById('mobile-page-title');
    if (mobileTitle) mobileTitle.textContent = 'Toko Saya';
}

async function loadSellerViewReviews(id) {
    const container = document.getElementById('seller-product-reviews');
    const titleElem = document.getElementById('seller-review-title');
    const seeAllBtn = document.getElementById('btn-see-all-reviews');
    const seeAllCountText = document.getElementById('btn-review-count-text');
    
    try {
        const response = await fetch(`../api/user/get-product-reviews.php?id=${id}`);
        const result = await response.json();
        
        if (result.success && result.data.length > 0) {
            currentProductReviews = result.data;
            const total = result.data.length;
            if (titleElem) titleElem.textContent = `Ulasan (${total})`;
            
            // Show "See All" button centered if more than 3
            if (total > 3) {
                seeAllBtn.style.display = 'block';
                if (seeAllCountText) seeAllCountText.textContent = `(${total})`;
            } else {
                seeAllBtn.style.display = 'none';
            }

            container.innerHTML = result.data.slice(0, 3).map(review => renderReviewItem(review)).join('');
        } else {
            currentProductReviews = [];
            if (titleElem) titleElem.textContent = 'Ulasan (0)';
            seeAllBtn.style.display = 'none';
            container.innerHTML = `<div class="no-reviews">Belum ada ulasan untuk produk ini.</div>`;
        }
    } catch (error) {
        console.error('Error loading reviews:', error);
        container.innerHTML = `<p style="color:red; text-align:center;">Gagal memuat ulasan.</p>`;
    }
}

function renderReviewItem(review) {
    return `
        <div class="review-card">
            <img src="${review.profile_photo ? (review.profile_photo.startsWith('http') ? review.profile_photo : `../assets/images/profiles/${review.profile_photo}`) : '../assets/images/default-avatar.png'}" class="review-avatar">
            <div class="review-content">
                <div class="review-info-top" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span class="reviewer-name" style="font-weight: 700; color: #1f2937;">${review.username || 'Pengguna'}</span>
                    <span class="review-date" style="font-size: 13px; color: #9ca3af;">${review.created_at_formatted}</span>
                </div>
                <div class="review-stars" style="color: #f5c444; margin-bottom: 10px;">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</div>
                <div class="review-text" style="color: #4b5563; line-height: 1.6;">${review.review || '<i>Tidak ada komentar tertulis.</i>'}</div>
            </div>
        </div>
    `;
}

function viewAllReviews() {
    // Get product ID from stored global variable (set in viewStoreProductDetail)
    let productId = window.currentProductId;
    
    // Fallback: try to get from URL if available
    if (!productId) {
        const urlParams = new URLSearchParams(window.location.search);
        productId = urlParams.get('id');
    }
    
    if (productId) {
        window.location.href = `reviews.php?id=${productId}`;
    } else {
        alert('Produk tidak ditemukan!');
        console.error('Product ID not found for reviews page');
    }
}

window.loadDashboardData = loadDashboardData;
window.loadSellerProfile = loadSellerProfile;
window.loadCategories = loadCategories;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.closeEditProductModal = closeEditProductModal;
window.loadMyStoreData = loadMyStoreData;
window.filterStoreProducts = filterStoreProducts;
window.viewStoreProductDetail = viewStoreProductDetail;
window.backToStore = backToStore;
window.viewAllReviews = viewAllReviews;

// Check if we need to show product detail after returning from reviews page
document.addEventListener('DOMContentLoaded', () => {
    const viewProductId = sessionStorage.getItem('viewProductId');
    if (viewProductId) {
        sessionStorage.removeItem('viewProductId');
        // Wait a bit for views to be ready
        setTimeout(() => {
            if (typeof viewStoreProductDetail === 'function') {
                viewStoreProductDetail(viewProductId);
            }
        }, 300);
    }
});

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
                        <button class="btn-sm" style="background:#3498db; margin-right:5px;" onclick="viewOrderDetails(${order.id})">Detail</button>
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
                            <span style="color:#27ae60; font-weight:bold;">Barang Sudah Sampai ✅</span>
                        ` : order.status === 'return_requested' ? `
                            <button class="btn-sm btn-approve" style="background:#9b59b6" onclick="updateOrderStatus(${order.id}, 'return_approved')">Konfirmasi Return ✅</button>
                            <button class="btn-sm btn-cancel" onclick="updateOrderStatus(${order.id}, 'return_rejected')">Tolak Return ❌</button>
                        ` : order.status === 'return_approved' ? `
                            <span style="color:#3498db; font-style:italic;">Menunggu User Kirim Barang</span>
                        ` : order.status === 'return_shipped' ? `
                            <button class="btn-sm btn-approve" style="background:#27ae60" onclick="updateOrderStatus(${order.id}, 'return_completed')">Barang Kembalian Sampai 📦</button>
                        ` : order.status === 'return_completed' ? `
                            <span style="color:#27ae60; font-weight:bold;">Return Selesai ✅</span>
                        ` : order.status === 'return_rejected' ? `
                            <span style="color:#e74c3c; font-weight:bold;">Return Ditolak</span>
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

async function viewOrderDetails(orderId) {
    const modal = document.getElementById('order-details-modal');
    const content = document.getElementById('order-details-content');
    
    if (!modal || !content) return;
    
    // Show modal with loading state
    modal.style.display = 'block';
    content.innerHTML = '<p style="text-align: center; padding: 20px;">Memuat detail pesanan...</p>';
    
    try {
        const response = await fetch(`../api/seller/get-order-details.php?order_id=${orderId}`);
        const result = await response.json();
        
        if (result.success) {
            const { order, items } = result;
            
            // Build items table
            const itemsHTML = items.map(item => {
                const imgSrc = item.product_image 
                    ? (item.product_image.startsWith('http') ? item.product_image : `../assets/images/products/${item.product_image}`)
                    : '../assets/images/bag.png';
                
                return `
                    <tr>
                        <td>
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <img src="${imgSrc}" 
                                     onerror="this.src='../assets/images/bag.png'"
                                     style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;">
                                <span>${item.product_name}</span>
                            </div>
                        </td>
                        <td>Rp ${Number(item.price_at_purchase).toLocaleString('id-ID')}</td>
                        <td>${item.quantity}</td>
                        <td>Rp ${Number(item.subtotal).toLocaleString('id-ID')}</td>
                    </tr>
                `;
            }).join('');
            
            content.innerHTML = `
                <div style="margin-bottom: 20px;">
                    <p><strong>ID Pesanan:</strong> #ORD-${order.id}</p>
                    <p><strong>Waktu:</strong> ${new Date(order.created_at).toLocaleString('id-ID')}</p>
                    <p><strong>Status:</strong> <span class="status-badge ${order.status}">${order.status}</span></p>
                </div>
                <h3 style="margin-bottom: 10px;">Daftar Barang</h3>
                <table class="order-table" style="width: 100%;">
                    <thead>
                        <tr>
                            <th>Produk</th>
                            <th>Harga</th>
                            <th>Jumlah</th>
                            <th>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHTML}
                    </tbody>
                </table>
                <div style="margin-top: 20px; text-align: right; font-size: 18px;">
                    <strong>Total: Rp ${Number(order.total_amount).toLocaleString('id-ID')}</strong>
                </div>
            `;
        } else {
            content.innerHTML = `<p style="text-align: center; padding: 20px; color: #e74c3c;">${result.message}</p>`;
        }
    } catch (error) {
        console.error('Error loading order details:', error);
        content.innerHTML = '<p style="text-align: center; padding: 20px; color: #e74c3c;">Terjadi kesalahan saat memuat detail pesanan.</p>';
    }
}

function closeOrderDetailsModal() {
    const modal = document.getElementById('order-details-modal');
    if (modal) {
        modal.style.display = 'none';
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
window.viewOrderDetails = viewOrderDetails;
window.closeOrderDetailsModal = closeOrderDetailsModal;
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
