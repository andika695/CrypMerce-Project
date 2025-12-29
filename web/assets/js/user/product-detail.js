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
                    onSuccess: () => window.location.href = '../user/success.html',
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

async function handleAddToCart() {
    if (currentStock <= 0) return showToast('Stok habis!', 'error');

    const quantity = parseInt(qtyInput.value); 
    const selectedSize = document.querySelector('#size-options .variant-btn.active')?.textContent || null;
    const selectedColor = document.querySelector('#color-options .variant-btn.active')?.textContent || null;

    if (!productId) {
        return showToast('Produk tidak valid', 'error');
    }

    const cartBtn = document.querySelector('.btn-add-cart');
    const originalText = cartBtn.textContent;

    try {
        cartBtn.disabled = true;
        cartBtn.textContent = 'Adding...';

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
        } else {
            showToast(result.message || 'Gagal menambahkan ke keranjang', 'error');
        }

    } catch (error) {
        console.error('Cart Error:', error);
        showToast('Gagal terhubung ke server', 'error');
    } finally {
        cartBtn.disabled = false;
        cartBtn.textContent = originalText;
    }
}

// Global scope expose
window.increaseQty = increaseQty;
window.decreaseQty = decreaseQty;