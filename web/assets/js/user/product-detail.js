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

    // Image handling dengan fallback
    if (data.image) {
        const imgPath = data.image.startsWith('http') ? data.image : `../assets/images/products/${data.image}`;
        document.getElementById('main-img').src = imgPath;
        document.getElementById('footer-img').src = imgPath;
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

        checkFollowStatus(data.seller.id);
        const followBtn = document.querySelector('.btn-follow');
        if (followBtn) followBtn.onclick = () => toggleFollow(data.seller.id);
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
        qtyInput.value = val + 1;
        updateTotalPrice();
    } else {
        showToast('Stok maksimum tercapai', 'error');
    }
}

function decreaseQty() {
    let val = parseInt(qtyInput.value);
    if (val > 1) {
        qtyInput.value = val - 1;
        updateTotalPrice();
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
    try {
        const response = await fetch(`../api/user/check-follow.php?seller_id=${sellerId}`);
        const result = await response.json();
        if (result.success) updateFollowButton(result.following);
    } catch (error) { console.error(error); }
}

async function toggleFollow(sellerId) {
    const followBtn = document.querySelector('.btn-follow');
    if (followBtn.disabled) return;
    followBtn.disabled = true;
    
    try {
        const response = await fetch('../api/user/toggle-follow.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ seller_id: sellerId })
        });
        const result = await response.json();
        if (result.success) updateFollowButton(result.following);
    } catch (error) { console.error(error); } 
    finally { followBtn.disabled = false; }
}

function updateFollowButton(isFollowing) {
    const followBtn = document.querySelector('.btn-follow');
    if (!followBtn) return;
    followBtn.textContent = isFollowing ? 'Unfollow' : 'Follow';
    isFollowing ? followBtn.classList.add('following') : followBtn.classList.remove('following');
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