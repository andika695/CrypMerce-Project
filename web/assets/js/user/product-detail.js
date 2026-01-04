// 1. GLOBAL VARIABLES & INITIALIZATION
let currentPrice = 0;
let currentStock = 0;
let productId = null; 
const qtyInput = document.getElementById('qty'); 

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    productId = urlParams.get('id');

    if (!productId) {
        alert('Produk tidak ditemukan!');
        window.location.href = 'dashboard.html';
        return;
    }

    loadProductDetail(productId);
    setupEventListeners();
});

// 2. EVENT LISTENERS SETUP
function setupEventListeners() {
    // Buy Now Button
    const buyBtn = document.querySelector('.btn-buy-now');
    if (buyBtn) {
        buyBtn.addEventListener('click', handleBuyNow);
    }

    // Add to Cart Button
    const cartBtn = document.querySelector('.btn-add-cart');
    if (cartBtn) {
        cartBtn.addEventListener('click', handleAddToCart);
    }
}

// 3. CORE FUNCTIONS (LOAD & RENDER)
async function loadProductDetail(id) {
    try {
        const response = await fetch(`../api/user/get-product-detail.php?id=${id}&t=${new Date().getTime()}`);
        const result = await response.json();

        if (result.success) {
            renderProduct(result.data);
        } else {
            document.querySelector('.product-detail-grid').innerHTML = 
                `<div style="grid-column: 1/-1; padding:100px; text-align:center;">
                    <h3>Oops!</h3>
                    <p>${result.message}</p>
                    <a href="dashboard.html" class="variant-btn" style="display:inline-block; margin-top:20px;">Kembali Belanja</a>
                </div>`;
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Gagal memuat detail produk', 'error');
    }
}

function renderProduct(data) {
    document.title = `${data.name} - CrypMerce`;
    document.getElementById('product-name').textContent = data.name;
    document.getElementById('footer-name').textContent = data.name;
    
    currentPrice = Number(data.price);
    const formattedPrice = formatRupiah(currentPrice);
    document.getElementById('product-price').textContent = formattedPrice;
    document.getElementById('footer-price').textContent = formattedPrice;
    updateTotalPrice();

    currentStock = Number(data.stock);

    // Handle images array (new multi-image feature)
    const imagesArray = data.images && data.images.length > 0 ? data.images : (data.image ? [data.image] : []);
    
    if (imagesArray.length > 0) {
        // Set main image to first image
        const mainImgPath = imagesArray[0].startsWith('http') ? imagesArray[0] : `../assets/images/products/${imagesArray[0]}`;
        document.getElementById('main-img').src = mainImgPath;
        document.getElementById('footer-img').src = mainImgPath;
        
        // Render thumbnail gallery if more than 1 image
        const thumbnailGallery = document.getElementById('thumbnail-gallery');
        if (thumbnailGallery && imagesArray.length > 1) {
            thumbnailGallery.innerHTML = '';
            imagesArray.forEach((img, index) => {
                const imgPath = img.startsWith('http') ? img : `../assets/images/products/${img}`;
                const thumbnail = document.createElement('div');
                thumbnail.className = 'thumbnail-item' + (index === 0 ? ' active' : '');
                thumbnail.innerHTML = `<img src="${imgPath}" alt="Product ${index + 1}">`;
                thumbnail.addEventListener('click', () => {
                    // Update main image
                    document.getElementById('main-img').src = imgPath;
                    document.getElementById('footer-img').src = imgPath;
                    // Update active state
                    thumbnailGallery.querySelectorAll('.thumbnail-item').forEach(t => t.classList.remove('active'));
                    thumbnail.classList.add('active');
                });
                thumbnailGallery.appendChild(thumbnail);
            });
        } else if (thumbnailGallery) {
            thumbnailGallery.innerHTML = ''; // Hide gallery for single image
        }
    }

    document.getElementById('product-description').innerHTML = data.description ? 
        data.description.replace(/\n/g, '<br>') : 'Tidak ada deskripsi.';

    // Seller Info
    if (data.seller) {
        document.getElementById('seller-name').textContent = data.seller.store_name;
        document.getElementById('seller-location').textContent = data.seller.location || 'Indonesia';
        
        const sellerLink = document.getElementById('seller-link');
        if (sellerLink) sellerLink.href = `shop.html?id=${data.seller.id}`;
        
        if (data.seller.photo) {
            const imgSrc = data.seller.photo.startsWith('http') ? data.seller.photo : `../${data.seller.photo}`;
            document.getElementById('seller-photo').src = imgSrc;
        }

        if (data.seller && data.seller.id) {
            checkFollowStatus(data.seller.id);
            const followBtn = document.querySelector('.btn-follow');
            if (followBtn) {
                followBtn.onclick = () => toggleFollow(data.seller.id);
            }
        }
    }

    if (data.weight) {
        let weightDisplay = '';
        const weight = parseInt(data.weight);
        
        if (weight >= 1000) {
            const weightInKg = weight / 1000;
            weightDisplay = parseFloat(weightInKg.toFixed(2)) + ' kg';
        } else {
            weightDisplay = weight + ' gr';
        }

        const weightEl = document.getElementById('product-weight');
        if (weightEl) weightEl.textContent = weightDisplay;
    }

    // Load Shipping Cost
    const pid = productId || data.id;
    if (pid) {
        loadShippingCost(pid, 1);
    }

    // Variants
    const variants = data.variants || {};
    renderVariants('size-options', variants.sizes || []);
    renderVariants('color-options', variants.colors || []);

    // Stock Validation UI
    if (currentStock <= 0) {
        const buyBtn = document.querySelector('.btn-buy-now');
        const cartBtn = document.querySelector('.btn-add-cart');
        if (buyBtn) {
            buyBtn.disabled = true;
            buyBtn.textContent = 'Stok Habis';
        }
        if (cartBtn) cartBtn.disabled = true;
        document.getElementById('main-img').style.opacity = '0.5';
    }

    // Load Reviews
    loadProductReviews(data.id);

    // Load Other Products from Store
    if (data.seller && data.seller.id) {
        loadStoreProducts(data.seller.id, data.id);
    }

    // Load Similar Products (same category, 12 max)
    if (data.category_id) {
        loadSimilarProducts(data.category_id, data.id);
    }
}

async function loadShippingCost(prodId, qty) {
    const container = document.getElementById('shipping-cost-container');
    const costEl = document.getElementById('shipping-cost');
    const estEl = document.getElementById('shipping-estimation');

    if (!container || !costEl) return;

    container.style.display = 'block';
    
    // Simple Debounce/Throttle check if needed, or just show loading
    // Prevent UI flicker if rapid clicking: only show "Memuat..." if it takes time? 
    // For now, simple textual update
    // costEl.textContent = '...'; 

    try {
        const response = await fetch(`../api/user/get-shipping-cost.php?product_id=${prodId}&qty=${qty}`);
        const result = await response.json();

        if (result.success) {
            costEl.textContent = result.data.formatted_cost;
            estEl.textContent = `Estimasi: ${result.data.estimation} (${result.data.weight_total_kg}kg, ${result.data.origin} ➔ ${result.data.destination})`;
        } else {
            if (result.code === 'LOGIN_REQUIRED') {
                costEl.innerHTML = '<a href="../pages/auth/login.html" style="color:#3533cd; text-decoration:underline;">Login untuk lihat ongkir</a>';
            } else if (result.code === 'ADDRESS_REQUIRED') {
                costEl.innerHTML = '<a href="profile.html" style="color:#3533cd; text-decoration:underline;">Lengkapi alamat di profil</a>';
            } else {
                costEl.textContent = result.message || 'Gagal memuat ongkir';
                costEl.style.color = '#e74c3c';
            }
        }
    } catch (error) {
        console.error('Error loading shipping:', error);
        costEl.textContent = 'Gagal memuat info ongkir';
        costEl.style.color = '#e74c3c';
    }
}

// STORE PRODUCTS LOGIC
async function loadStoreProducts(sellerId, excludeProductId) {
    const container = document.getElementById('store-products-grid');
    if (!container) return;

    try {
        const response = await fetch(`../api/user/get-seller-products.php?id=${sellerId}`);
        const result = await response.json();

        if (result.success && result.products && result.products.length > 0) {
            // Filter out the current product and limit to 6
            const filtered = result.products.filter(p => p.id != excludeProductId).slice(0, 6);
            
            if (filtered.length > 0) {
                container.innerHTML = filtered.map(product => createProductCard(product)).join('');
            } else {
                container.innerHTML = '<p style="text-align:center; color:#888;">Tidak ada produk lain dari toko ini.</p>';
            }
        } else {
            container.innerHTML = '<p style="text-align:center; color:#888;">Tidak ada produk lain dari toko ini.</p>';
        }
    } catch (error) {
        console.error('Error loading store products:', error);
        container.innerHTML = '<p style="text-align:center; color:red;">Gagal memuat produk.</p>';
    }
}

// SIMILAR PRODUCTS LOGIC
async function loadSimilarProducts(categoryId, excludeProductId) {
    const container = document.getElementById('similar-products-grid');
    if (!container) return;

    try {
        const response = await fetch(`../api/user/get-products.php?category_id=${categoryId}&limit=12`);
        const result = await response.json();

        if (result.success && result.data.length > 0) {
            // Filter out the current product and limit to 6
            const filtered = result.data.filter(p => p.id != excludeProductId).slice(0, 6);
            
            if (filtered.length > 0) {
                container.innerHTML = filtered.map(product => createProductCard(product)).join('');
            } else {
                container.innerHTML = '<p style="text-align:center; color:#888;">Tidak ada produk serupa.</p>';
            }
        } else {
            container.innerHTML = '<p style="text-align:center; color:#888;">Tidak ada produk serupa.</p>';
        }
    } catch (error) {
        console.error('Error loading similar products:', error);
        container.innerHTML = '<p style="text-align:center; color:red;">Gagal memuat produk serupa.</p>';
    }
}

function createProductCard(product) {
    // Handle image path
    let imgSrc = '../assets/images/no-image.png';
    if (product.image) {
        if (product.image.startsWith('http')) {
            imgSrc = product.image;
        } else {
            imgSrc = `../assets/images/products/${product.image}`;
        }
    }
    
    const price = 'Rp ' + Number(product.price).toLocaleString('id-ID');
    const rating = Number(product.avg_rating || 0);
    const soldCount = product.sold_count || 0;
    const reviewCount = product.review_count || soldCount; // Use sold_count as fallback for review count
    const storeName = product.store_name || 'Official Store';
    
    // Generate stars
    let stars = '';
    const fullStars = Math.round(rating);
    for (let i = 1; i <= 5; i++) {
        if (i <= fullStars && rating > 0) {
            stars += `<i class="fas fa-star" style="color: #ffad33;"></i>`;
        } else {
            stars += `<i class="fas fa-star" style="color: #ccc;"></i>`;
        }
    }
    
    return `
        <a href="product-detail.html?id=${product.id}" class="section-product-card">
            <div class="product-image-box">
                <img src="${imgSrc}" alt="${product.name}" onerror="this.src='../assets/images/no-image.png'">
                <div class="product-actions">
                    <button class="action-btn"><i class="far fa-eye"></i></button>
                </div>
            </div>
            <div class="product-details">
                <h3 class="product-name">${product.name}</h3>
                <div class="price-row">
                    <span class="current-price">${price}</span>
                </div>
                <div class="rating-row">
                    <div class="stars">
                        ${stars} 
                    </div>
                    <span class="rating-count">(${reviewCount})</span>
                </div>
                <div class="store-info" style="display: flex; align-items: center; gap: 5px; margin-top: 8px; font-size: 12px; color: #888;">
                    <i class="fas fa-store" style="color: var(--primary);"></i>
                    <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${storeName}</span>
                </div>
            </div>
        </a>
    `;
}

// 4. CHECKOUT LOGIC (FIXED)
async function handleBuyNow() {
    if (currentStock <= 0) return showToast('Stok habis!', 'error');

    const quantity = parseInt(qtyInput.value); 
    const productName = document.getElementById('product-name').textContent;
    const selectedSize = document.querySelector('#size-options .variant-btn.active')?.textContent || null;
    const selectedColor = document.querySelector('#color-options .variant-btn.active')?.textContent || null;

    const itemData = {
        total_price: currentPrice * quantity,
        items: [{
            id: productId, 
            name: productName,
            price: currentPrice,
            quantity: quantity,
            size: selectedSize,
            color: selectedColor
        }]
    };

    const buyBtn = document.querySelector('.btn-buy-now');
    
    try {
        buyBtn.disabled = true;
        buyBtn.textContent = 'Processing...';

        const response = await fetch('../checkout/PlaceOrder.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(itemData)
        });

        const rawData = await response.text();
        let snapToken = "";

        // PROTEKSI PARSING: Cek apakah response JSON atau String
        if (rawData.trim().startsWith('{')) {
            const result = JSON.parse(rawData);
            if (!result.success) {
                showToast(result.message || 'Gagal memproses', 'error');
                resetBuyBtn(buyBtn);
                return;
            }
            snapToken = result.token || result.snap_token;
        } else {
            snapToken = rawData.trim();
        }

        // VALIDASI SNAP OBJECT
        if (snapToken && snapToken.length > 10) {
            if (typeof window.snap !== 'undefined') {
                window.snap.pay(snapToken, {
                    onSuccess: function(result) {
                        // Pass order_id to success page for verification
                        window.location.href = `../user/success.html?order_id=${result.order_id}`;
                    },
                    onPending: () => alert('Selesaikan pembayaran Anda'),
                    onError: () => {
                        showToast('Pembayaran gagal', 'error');
                        resetBuyBtn(buyBtn);
                    },
                    onClose: () => resetBuyBtn(buyBtn)
                });
            } else {
                showToast('Library pembayaran belum siap, coba lagi', 'error');
                resetBuyBtn(buyBtn);
            }
        } else {
            showToast('Token tidak valid', 'error');
            resetBuyBtn(buyBtn);
        }

    } catch (error) {
        console.error('Checkout error:', error);
        showToast('Terjadi kesalahan sistem', 'error');
        resetBuyBtn(buyBtn);
    }
}

// 5. HELPER FUNCTIONS
function resetBuyBtn(btn) {
    btn.disabled = false;
    btn.textContent = 'Beli Sekarang';
}

function renderVariants(containerId, options) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    if (!options || options.length === 0) {
        container.innerHTML = '<span class="no-variant">-</span>';
        return;
    }

    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'variant-btn';
        btn.textContent = opt;
        btn.onclick = () => {
            container.querySelectorAll('.variant-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        };
        container.appendChild(btn);
    });
}

function formatRupiah(amount) {
    return 'Rp ' + Number(amount).toLocaleString('id-ID');
}

function increaseQty() {
    let val = parseInt(qtyInput.value);
    if (val < currentStock) {
        val = val + 1;
        qtyInput.value = val;
        updateTotalPrice();
        if (productId) loadShippingCost(productId, val);
    } else {
        showToast('Stok maksimum tercapai', 'error');
    }
}

function decreaseQty() {
    let val = parseInt(qtyInput.value);
    if (val > 1) {
        val = val - 1;
        qtyInput.value = val;
        updateTotalPrice();
        if (productId) loadShippingCost(productId, val);
    }
}

function updateTotalPrice() {
    const qty = parseInt(qtyInput.value);
    const total = currentPrice * qty;
    document.getElementById('total-price').textContent = formatRupiah(total);
}

// Fungsi Toast yang diperbaiki
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return alert(message);

    toast.textContent = message;
    toast.style.background = (type === 'error') ? '#ef4444' : '#10b981';
    toast.className = 'toast show';
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// FOLLOW SYSTEM
async function checkFollowStatus(sellerId) {
    if (!sellerId) return;
    try {
        const response = await fetch(`../api/user/check-follow.php?seller_id=${sellerId}`);
        const result = await response.json();
        if (result.success) {
            updateFollowButton(result.following);
        } else {
            console.error('Check follow failed:', result.message);
        }
    } catch (error) { 
        console.error('Error checking follow status:', error); 
    }
}

async function toggleFollow(sellerId) {
    if (!sellerId) {
        console.error('Seller ID is required');
        return;
    }
    
    const followBtn = document.querySelector('.btn-follow');
    if (!followBtn) {
        console.error('Follow button not found');
        return;
    }
    
    if (followBtn.disabled) return;
    followBtn.disabled = true;
    
    try {
        const response = await fetch('../api/user/toggle-follow.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ seller_id: sellerId })
        });
        
        if (response.status === 401) {
            alert('Silakan login untuk mengikuti toko ini');
            followBtn.disabled = false;
            return;
        }
        
        const result = await response.json();
        if (result.success) {
            updateFollowButton(result.following);
            showToast(result.message, 'success');
        } else {
            showToast(result.message || 'Gagal mengikuti toko', 'error');
        }
    } catch (error) { 
        console.error('Error toggling follow:', error);
        showToast('Terjadi kesalahan saat mengikuti toko', 'error');
    } 
    finally { 
        followBtn.disabled = false; 
    }
}

function updateFollowButton(isFollowing) {
    const followBtn = document.querySelector('.btn-follow');
    if (!followBtn) {
        console.warn('Follow button not found for update');
        return;
    }
    
    if (isFollowing) {
        followBtn.classList.add('following');
        followBtn.innerHTML = '<i class="fas fa-check"></i> Following';
    } else {
        followBtn.classList.remove('following');
        followBtn.innerHTML = '<i class="fas fa-plus"></i> Follow';
    }
}

async function handleAddToCart(e) {
    if (currentStock <= 0) return showToast('Stok habis!', 'error');

    const quantity = parseInt(qtyInput.value); 
    const selectedSize = document.querySelector('#size-options .variant-btn.active')?.textContent || null;
    const selectedColor = document.querySelector('#color-options .variant-btn.active')?.textContent || null;

    if (!productId) {
        return showToast('Produk tidak valid', 'error');
    }

    // Determine which button was clicked
    const clickedBtn = e.currentTarget;
    const originalContent = clickedBtn.innerHTML; // Use innerHTML to preserve icons if any

    try {
        clickedBtn.disabled = true;
        // Check if it's the mobile button (icon based) or desktop (text based) to set appropriate loading state
        if (clickedBtn.id === 'btnCartMobile') {
             clickedBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        } else {
             clickedBtn.textContent = 'Adding...';
        }

        const formData = new FormData();
        formData.append('product_id', productId);
        formData.append('quantity', quantity);
        if (selectedSize) formData.append('selected_size', selectedSize);
        if (selectedColor) formData.append('selected_color', selectedColor);

        const response = await fetch('../api/user/add-to-cart.php', {
            method: 'POST',
            body: formData
        });

        // Debugging raw response
        const rawText = await response.text();
        console.log('Cart Response:', rawText);

        let result;
        try {
            result = JSON.parse(rawText);
        } catch (e) {
            console.error('JSON Parse Error:', e);
            showToast('Terjadi kesalahan server', 'error');
            return;
        }

        if (result.success) {
            showToast('Berhasil masuk keranjang!', 'success');
            // Optional: Update cart badge if needed
        } else {
            showToast(result.message || 'Gagal menambahkan ke keranjang', 'error');
        }

    } catch (error) {
        console.error('Cart Error:', error);
        showToast('Gagal terhubung ke server', 'error');
    } finally {
        clickedBtn.disabled = false;
        clickedBtn.innerHTML = originalContent;
    }
}

// Global scope expose
window.increaseQty = increaseQty;
window.decreaseQty = decreaseQty;

// ================= MOBILE PURCHASE MODAL =================

// Modal Elements - initialized after DOM loads
let purchaseModal = null;
let modalQtyInput = null;
let modalTotalPrice = null;

// Mobile Button Handlers
document.addEventListener('DOMContentLoaded', () => {
    // Initialize modal elements
    purchaseModal = document.getElementById('purchaseModal');
    modalQtyInput = document.getElementById('modalQty');
    modalTotalPrice = document.getElementById('modal-total-price');

    // Open Modal: Buy Button (Mobile)
    const btnBuyMobile = document.getElementById('btnBuyMobile');
    if (btnBuyMobile) {
        btnBuyMobile.addEventListener('click', openPurchaseModal);
        console.log('Buy mobile button attached');
    } else {
        console.log('Buy mobile button NOT found');
    }

    // Add to Cart: Mobile
    const btnCartMobile = document.getElementById('btnCartMobile');
    if (btnCartMobile) {
        btnCartMobile.addEventListener('click', handleAddToCart);
        console.log('Cart mobile button attached');
    } else {
        console.log('Cart mobile button NOT found');
    }

    // Close Modal
    const closeModal = document.getElementById('closeModal');
    if (closeModal) {
        closeModal.addEventListener('click', closePurchaseModal);
    }

    // Close on overlay click
    if (purchaseModal) {
        purchaseModal.addEventListener('click', (e) => {
            if (e.target === purchaseModal) {
                closePurchaseModal();
            }
        });
    }

    // Modal Quantity Controls
    const modalDecreaseQty = document.getElementById('modalDecreaseQty');
    const modalIncreaseQty = document.getElementById('modalIncreaseQty');
    
    if (modalDecreaseQty) {
        modalDecreaseQty.addEventListener('click', decreaseModalQty);
    }
    if (modalIncreaseQty) {
        modalIncreaseQty.addEventListener('click', increaseModalQty);
    }

    // Confirm Purchase Button
    const btnConfirmPurchase = document.getElementById('btnConfirmPurchase');
    if (btnConfirmPurchase) {
        btnConfirmPurchase.addEventListener('click', handleModalBuyNow);
    }
});

// Open Purchase Modal
function openPurchaseModal() {
    if (currentStock <= 0) {
        return showToast('Stok habis!', 'error');
    }

    // Populate modal with product info
    const productName = document.getElementById('product-name').textContent;
    const productImg = document.getElementById('main-img').src;
    
    document.getElementById('modal-product-name').textContent = productName;
    document.getElementById('modal-product-img').src = productImg;
    document.getElementById('modal-product-price').textContent = formatRupiah(currentPrice);
    
    // Reset quantity
    if (modalQtyInput) modalQtyInput.value = 1;
    updateModalTotalPrice();

    // Show modal
    purchaseModal.classList.add('show');
    document.body.style.overflow = 'hidden'; // Prevent background scroll
}

// Close Purchase Modal
function closePurchaseModal() {
    purchaseModal.classList.remove('show');
    document.body.style.overflow = ''; // Restore scroll
}

// Modal Quantity Controls
function increaseModalQty() {
    let val = parseInt(modalQtyInput.value);
    if (val < currentStock) {
        modalQtyInput.value = val + 1;
        updateModalTotalPrice();
    } else {
        showToast('Stok maksimum tercapai', 'error');
    }
}

// Modal Quantity Controls
function decreaseModalQty() {
    let val = parseInt(modalQtyInput.value);
    if (val > 1) {
        modalQtyInput.value = val - 1;
        updateModalTotalPrice();
    }
}

function updateModalTotalPrice() {
    if (!modalQtyInput || !modalTotalPrice) return;
    const qty = parseInt(modalQtyInput.value);
    const total = currentPrice * qty;
    modalTotalPrice.textContent = formatRupiah(total);
}

// Handle Buy Now from Modal
async function handleModalBuyNow() {
    if (currentStock <= 0) return showToast('Stok habis!', 'error');

    const quantity = parseInt(modalQtyInput.value);
    const productName = document.getElementById('product-name').textContent;
    const selectedSize = document.querySelector('#size-options .variant-btn.active')?.textContent || null;
    const selectedColor = document.querySelector('#color-options .variant-btn.active')?.textContent || null;

    const itemData = {
        total_price: currentPrice * quantity,
        items: [{
            id: productId,
            name: productName,
            price: currentPrice,
            quantity: quantity,
            size: selectedSize,
            color: selectedColor
        }]
    };

    const confirmBtn = document.getElementById('btnConfirmPurchase');

    try {
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';

        const response = await fetch('../checkout/PlaceOrder.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(itemData)
        });

        const rawData = await response.text();
        let snapToken = "";

        // Parse response
        if (rawData.trim().startsWith('{')) {
            const result = JSON.parse(rawData);
            if (!result.success) {
                showToast(result.message || 'Gagal memproses', 'error');
                resetConfirmBtn(confirmBtn);
                return;
            }
            snapToken = result.token || result.snap_token;
        } else {
            snapToken = rawData.trim();
        }

        // Validate and open Snap
        if (snapToken && snapToken.length > 10) {
            if (typeof window.snap !== 'undefined') {
                closePurchaseModal(); // Close modal before payment
                window.snap.pay(snapToken, {
                    onSuccess: function(result) {
                         // Pass order_id to success page for verification
                         window.location.href = `../user/success.html?order_id=${result.order_id}`;
                    },
                    onPending: () => alert('Selesaikan pembayaran Anda'),
                    onError: () => {
                        showToast('Pembayaran gagal', 'error');
                        resetConfirmBtn(confirmBtn);
                    },
                    onClose: () => resetConfirmBtn(confirmBtn)
                });
            } else {
                showToast('Library pembayaran belum siap, coba lagi', 'error');
                resetConfirmBtn(confirmBtn);
            }
        } else {
            showToast('Token tidak valid', 'error');
            resetConfirmBtn(confirmBtn);
        }

    } catch (error) {
        console.error('Checkout error:', error);
        showToast('Terjadi kesalahan sistem', 'error');
        resetConfirmBtn(confirmBtn);
    }
}

function resetConfirmBtn(btn) {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-check-circle"></i> Beli Sekarang';
}

// 6. REVIEWS LOGIC
// 6. REVIEWS LOGIC
let allReviewsData = [];

async function loadProductReviews(id) {
    const container = document.getElementById('product-reviews');
    const countElem = document.getElementById('review-count');
    
    try {
        const response = await fetch(`../api/user/get-product-reviews.php?id=${id}`);
        const result = await response.json();
        
        if (result.success && result.data.length > 0) {
            allReviewsData = result.data; // Store globally
            countElem.textContent = `(${allReviewsData.length})`;
            
            // Initial render: Top 3 (Sorted by rating DESC from API)
            renderReviewsList(3);
        } else {
            countElem.textContent = '(0)';
            container.innerHTML = `<div class="no-reviews">Belum ada ulasan untuk produk ini.</div>`;
        }
    } catch (error) {
        console.error('Error loading reviews:', error);
        container.innerHTML = `<p style="color:red; text-align:center;">Gagal memuat ulasan.</p>`;
    }
}

function renderReviewsList(limit) {
    const container = document.getElementById('product-reviews');
    const reviewsToShow = allReviewsData.slice(0, limit);
    
    let html = reviewsToShow.map(review => createReviewCard(review)).join('');
    
    // Add "Load More" button if there are more reviews
    if (allReviewsData.length > limit) {
        html += `
            <div class="load-more-container" style="text-align:center; margin-top:15px;">
                <button onclick="window.location.href='reviews.html?id=${productId}'" class="btn-load-more">
                    Lihat Semua Ulasan (${allReviewsData.length}) ➔
                </button>
            </div>
        `;
    }
    
    container.innerHTML = html;
}

function createReviewCard(review) {
    // Generate stars
    let starsHtml = '';
    for(let i=1; i<=5; i++) {
        starsHtml += i <= review.rating ? '★' : '☆';
    }

    // Default avatar
    const avatar = review.profile_photo ? 
        (review.profile_photo.startsWith('http') ? review.profile_photo : `../assets/images/profiles/${review.profile_photo}`) 
        : '../assets/images/default-avatar.png';

    return `
        <div class="review-card">
            <img src="${avatar}" alt="${review.username}" class="review-avatar" onerror="this.src='../assets/images/default-avatar.png'">
            <div class="review-content">
                <div class="review-header">
                    <span class="reviewer-name">${review.username || 'Pengguna'}</span>
                    <span class="review-date">${review.created_at_formatted}</span>
                </div>
                <div class="review-stars">${starsHtml}</div>
                <div class="review-text">${review.review || '<i>Tidak ada komentar tertulis.</i>'}</div>
            </div>
        </div>
    `;
}
// Reviews are loaded directly inside renderProduct