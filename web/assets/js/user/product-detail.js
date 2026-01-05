// 1. GLOBAL VARIABLES & INITIALIZATION
let currentPrice = 0;
let currentStock = 0;
let productId = null; 
let currentTotalPrice = 0; // Global for crypto conversion
let purchaseModal = null;
const qtyInput = document.getElementById('qty'); 
let cryptoRates = {
    'btc': 0.00000065, // Fallback (1 IDR = x BTC)
    'eth': 0.000018    // Fallback (1 IDR = x ETH)
};

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
    fetchCryptoRates(); // Initialize rates
});

// Fetch Live Crypto Rates (CoinGecko)
async function fetchCryptoRates() {
    try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=idr');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        
        if (data.bitcoin && data.bitcoin.idr) {
             cryptoRates.btc = 1 / data.bitcoin.idr;
        }
        if (data.ethereum && data.ethereum.idr) {
             cryptoRates.eth = 1 / data.ethereum.idr;
        }
        console.log('Live Crypto Rates fetched:', cryptoRates);
        
        // Update crypto modal if it's already open and a coin is selected
        const currentCoin = document.getElementById('cryptoSelect')?.value;
        if (currentCoin) {
            handleCryptoCoinSelect({ target: { value: currentCoin } });
        }

    } catch (error) {
        console.warn('Failed to fetch live crypto rates, using fallback:', error);
    }
}

// 2. EVENT LISTENERS SETUP
function setupEventListeners() {
    // Buy Now Button (Desktop)
    const buyBtn = document.querySelector('.btn-buy-now');
    if (buyBtn) {
        buyBtn.addEventListener('click', () => openPurchaseModal(2)); // Skip Choice Qty on Desktop
    }

    // Add to Cart Button (Desktop)
    const cartBtn = document.querySelector('.btn-add-cart');
    if (cartBtn) {
        cartBtn.addEventListener('click', handleAddToCart);
    }

    // Buy Now Button (Mobile)
    const btnBuyMobile = document.getElementById('btnBuyMobile');
    if (btnBuyMobile) {
        btnBuyMobile.addEventListener('click', () => openPurchaseModal(1)); // Start at Choice Qty on Mobile
    }

    // Add to Cart Button (Mobile)
    const btnCartMobile = document.getElementById('btnCartMobile');
    if (btnCartMobile) {
        btnCartMobile.addEventListener('click', handleAddToCart);
    }

    // Crypto Select Listener
    const cryptoSelect = document.getElementById('cryptoSelect');
    if (cryptoSelect) {
        cryptoSelect.addEventListener('change', handleCryptoCoinSelect);
    }

    // Crypto Modal Close
    const closeCryptoModal = document.getElementById('closeCryptoModal');
    if (closeCryptoModal) {
        closeCryptoModal.addEventListener('click', () => {
            document.getElementById('cryptoPaymentModal').style.display = 'none';
        });
    }

    // Step Navigation
    const btnNextStep = document.getElementById('btnNextStep');
    if (btnNextStep) {
        btnNextStep.addEventListener('click', () => showModalStep(2));
    }

    const btnPrevStep = document.getElementById('btnPrevStep');
    if (btnPrevStep) {
        btnPrevStep.addEventListener('click', () => showModalStep(1));
    }

    // Modal Qty Listeners
    const modalDecreaseQty = document.getElementById('modalDecreaseQty');
    if (modalDecreaseQty) {
        modalDecreaseQty.addEventListener('click', decreaseModalQty);
    }

    const modalIncreaseQty = document.getElementById('modalIncreaseQty');
    if (modalIncreaseQty) {
        modalIncreaseQty.addEventListener('click', increaseModalQty);
    }

    // Confirm Crypto Payment
    const confirmCryptoBtn = document.getElementById('confirmCryptoBtn');
    if (confirmCryptoBtn) {
        confirmCryptoBtn.addEventListener('click', processCryptoPayment);
    }

    // IDR Checkout Button (inside purchaseModal)
    const btnConfirmPurchase = document.getElementById('btnConfirmPurchase'); 
    if (btnConfirmPurchase) {
        btnConfirmPurchase.addEventListener('click', processMidtransCheckout);
    }

    // Crypto Checkout Button (inside purchaseModal)
    const btnConfirmCrypto = document.getElementById('btnConfirmCrypto'); 
    if (btnConfirmCrypto) {
        btnConfirmCrypto.addEventListener('click', openCryptoModal);
    }

    // Close Purchase Modal
    const closeModal = document.getElementById('closeModal');
    if (closeModal) {
        closeModal.addEventListener('click', closePurchaseModal);
    }

    // Overlay click to close
    const purchaseModalEl = document.getElementById('purchaseModal');
    if (purchaseModalEl) {
        purchaseModalEl.addEventListener('click', (e) => {
            if (e.target === purchaseModalEl) closePurchaseModal();
        });
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
    document.getElementById('product-stock').textContent = currentStock;

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
        const loc = data.seller.location ? data.seller.location.trim().toLowerCase() : '';
        const isPlaceholder = !loc || loc === 'gudang blibli' || loc === 'gudang crypmerce' || loc === 'indonesia';
        document.getElementById('seller-location').textContent = isPlaceholder ? 'Belum menentukan lokasi' : data.seller.location;
        
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
            // Filter out the current product and limit to 12 (2 rows on desktop)
            const filtered = result.data.filter(p => p.id != excludeProductId).slice(0, 12);
            
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

// 4. CHECKOUT LOGIC
function openCryptoModal() {
    const modal = document.getElementById('cryptoPaymentModal');
    modal.style.display = 'flex';
    
    // Reset state
    document.getElementById('cryptoSelect').value = "";
    document.getElementById('cryptoPaymentDetails').style.display = 'none';

    // Update currentTotalPrice based on current quantity
    const quantity = parseInt(qtyInput.value);
    currentTotalPrice = currentPrice * quantity;
}

function handleCryptoCoinSelect(e) {
    const coin = e.target.value;
    const details = document.getElementById('cryptoPaymentDetails');
    const qrImg = document.getElementById('cryptoQr');
    const walletText = document.getElementById('walletAddress');
    const amountText = document.getElementById('cryptoAmount');
    const currencyText = document.getElementById('cryptoCurrency');
    const fiatText = document.getElementById('fiatAmount');
    
    if (!coin) {
        details.style.display = 'none';
        return;
    }
    
    details.style.display = 'block';
    
    // Simulation Data
    const wallets = {
        'btc': '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        'eth': '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'
    };
    
    const address = wallets[coin];
    qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${address}`;
    
    walletText.textContent = address;
    currencyText.textContent = coin.toUpperCase();
    fiatText.textContent = formatRupiah(currentTotalPrice);
    
    const rate = cryptoRates[coin] || 0;
    const cryptoVal = currentTotalPrice * rate;
    amountText.textContent = cryptoVal.toFixed(8);
}

// Process Crypto Payment
async function processCryptoPayment() {
    const confirmBtn = document.getElementById('confirmCryptoBtn');
    const coinType = document.getElementById('cryptoSelect').value;
    const quantity = parseInt(qtyInput.value);
    const productName = document.getElementById('product-name').textContent;
    const selectedSize = document.querySelector('#size-options .variant-btn.active')?.textContent || null;
    const selectedColor = document.querySelector('#color-options .variant-btn.active')?.textContent || null;

    try {
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
        
        // Prepare Payload
        const payload = {
            total_price: currentPrice * quantity,
            items: [{
                id: productId,
                name: productName,
                price: currentPrice,
                quantity: quantity,
                size: selectedSize,
                color: selectedColor
            }],
            coin_type: coinType
        };
        
        // 1. Create Order
        const createRes = await fetch('../checkout/PlaceOrderCrypto.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const createData = await createRes.json();
        if (!createData.success) throw new Error(createData.message || 'Gagal membuat pesanan Crypto');
        
        const orderUuid = createData.order_uuid;
        
        // 2. Simulate Payment Confirmation (Wait for 2 seconds)
        await new Promise(r => setTimeout(r, 2000));
        
        const confirmRes = await fetch('../checkout/ConfirmCryptoPayment.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_uuid: orderUuid })
        });
        
        const confirmData = await confirmRes.json();
        if (!confirmData.success) throw new Error(confirmData.message || 'Gagal konfirmasi pembayaran');
        
        window.location.href = '../user/success.html';
        
    } catch (error) {
        console.error('Crypto payment error:', error);
        showToast(error.message, 'error');
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Selesai Pembayaran';
    }
}

// Process Midtrans Checkout
async function processMidtransCheckout() {
    const buyBtn = document.getElementById('btnConfirmPurchase');
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

    try {
        buyBtn.disabled = true;
        buyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

        const response = await fetch('../checkout/PlaceOrder.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(itemData)
        });

        const rawData = await response.text();
        let snapToken = "";

        if (rawData.trim().startsWith('{')) {
            const result = JSON.parse(rawData);
            if (!result.success) {
                showToast(result.message || 'Gagal memproses', 'error');
                resetConfirmBtn(buyBtn);
                return;
            }
            snapToken = result.token || result.snap_token;
        } else {
            snapToken = rawData.trim();
        }

        if (snapToken && snapToken.length > 10) {
            if (typeof window.snap !== 'undefined') {
                window.snap.pay(snapToken, {
                    onSuccess: function(result) {
                        window.location.href = `../user/success.html?order_id=${result.order_id}`;
                    },
                    onPending: () => alert('Selesaikan pembayaran Anda'),
                    onError: () => {
                        showToast('Pembayaran gagal', 'error');
                        resetConfirmBtn(buyBtn);
                    },
                    onClose: () => resetConfirmBtn(buyBtn)
                });
            } else {
                showToast('Library pembayaran belum siap, coba lagi', 'error');
                resetConfirmBtn(buyBtn);
            }
        } else {
            showToast('Token tidak valid', 'error');
            resetConfirmBtn(buyBtn);
        }

    } catch (error) {
        console.error('Checkout error:', error);
        showToast('Terjadi kesalahan sistem', 'error');
        resetConfirmBtn(buyBtn);
    }
}

function resetConfirmBtn(btn) {
    btn.disabled = false;
    const qty = parseInt(qtyInput.value);
    btn.innerHTML = `Checkout IDR ( <span class="item-count">${qty}</span> )`;
}

// Wrapper for Buy Now button (retains name but opens modal)
function handleBuyNow() {
    if (currentStock <= 0) return showToast('Stok habis!', 'error');
    openPurchaseModal();
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
        updateModalSummary(); // Sync modal if open
        if (productId) loadShippingCost(productId, val);
    }
}

function increaseQty() {
    let val = parseInt(qtyInput.value);
    if (val < currentStock) {
        val = val + 1;
        qtyInput.value = val;
        updateTotalPrice();
        updateModalSummary(); // Sync modal if open
        if (productId) loadShippingCost(productId, val);
    } else {
        showToast('Stok maksimum tercapai', 'error');
    }
}

function updateTotalPrice() {
    const qty = parseInt(qtyInput.value);
    const total = currentPrice * qty;
    document.getElementById('total-price').textContent = formatRupiah(total);
}

function closePurchaseModal() {
    if (purchaseModal) {
        purchaseModal.classList.remove('show');
        document.body.style.overflow = ''; // Restore scroll
    }
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

// ================= PURCHASE MODAL LOGIC =================

// Modal Elements - initialized after DOM loads
document.addEventListener('DOMContentLoaded', () => {
    purchaseModal = document.getElementById('purchaseModal');
});

// Open Purchase Modal
function openPurchaseModal(startStep = 1) {
    if (currentStock <= 0) {
        return showToast('Stok habis!', 'error');
    }

    // Sync quantity from main input to modal
    const currentQty = parseInt(qtyInput.value) || 1;
    document.getElementById('modalQty').value = currentQty;

    // Populate Step 1 (Preview)
    const productName = document.getElementById('product-name').textContent;
    const productImg = document.getElementById('main-img').src;
    
    document.getElementById('modal-prev-name').textContent = productName;
    document.getElementById('modal-prev-img').src = productImg;
    document.getElementById('modal-prev-price').textContent = formatRupiah(currentPrice);

    // Populate Step 2 (Summary)
    document.getElementById('modal-product-name-summary').textContent = productName;

    // Show requested step
    showModalStep(startStep, startStep === 2);

    // Show modal
    purchaseModal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function showModalStep(step, isDesktop = false) {
    const step1 = document.getElementById('modal-step-1');
    const step2 = document.getElementById('modal-step-2');
    const btnPrev = document.getElementById('btnPrevStep');

    if (step === 1) {
        step1.style.display = 'block';
        step2.style.display = 'none';
    } else {
        step1.style.display = 'none';
        step2.style.display = 'block';
        
        // Hide back button if opened from desktop (Step 2 direct)
        if (btnPrev) {
            btnPrev.style.display = isDesktop ? 'none' : 'block';
        }
        
        updateModalSummary();
    }
}

function increaseModalQty() {
    const input = document.getElementById('modalQty');
    let val = parseInt(input.value);
    if (val < currentStock) {
        input.value = val + 1;
        // Sync back to main input
        qtyInput.value = input.value;
        updateTotalPrice();
        if (productId) loadShippingCost(productId, parseInt(input.value));
    } else {
        showToast('Stok maksimum tercapai', 'error');
    }
}

function decreaseModalQty() {
    const input = document.getElementById('modalQty');
    let val = parseInt(input.value);
    if (val > 1) {
        input.value = val - 1;
        // Sync back to main input
        qtyInput.value = input.value;
        updateTotalPrice();
        if (productId) loadShippingCost(productId, parseInt(input.value));
    }
}

function updateModalSummary() {
    if (!purchaseModal || !qtyInput) return;
    
    const qty = parseInt(qtyInput.value);
    const total = currentPrice * qty;
    
    const countEl = document.getElementById('modal-product-count');
    const priceEl = document.getElementById('modal-total-price');
    const btnCounts = document.querySelectorAll('.btn-confirm-purchase .item-count');
    
    if (countEl) countEl.textContent = qty;
    if (priceEl) priceEl.textContent = formatRupiah(total);
    
    btnCounts.forEach(el => {
        el.textContent = qty;
    });
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