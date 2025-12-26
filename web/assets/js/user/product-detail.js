// PINDAHKAN DEKLARASI KE ATAS AGAR JADI GLOBAL
let currentPrice = 0;
let currentStock = 0;
let productId = null; 
const qtyInput = document.getElementById('qty'); 

document.addEventListener('DOMContentLoaded', () => {
    // Get Product ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    productId = urlParams.get('id'); // Isi variabel global

    if (!productId) {
        alert('Produk tidak ditemukan!');
        window.location.href = 'dashboard.html';
        return;
    }

    loadProductDetail(productId);
});


document.querySelector('.btn-buy-now').addEventListener('click', async () => {
    if (currentStock <= 0) return showToast('Stok habis!', 'error');

    // Menggunakan qtyInput global dan productId global
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
        const buyBtn = document.querySelector('.btn-buy-now');
        buyBtn.disabled = true;
        buyBtn.textContent = 'Processing...';

        const response = await fetch('../checkout/PlaceOrder.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(itemData)
        });

        const snapToken = await response.text();

        window.snap.pay(snapToken, {
            onSuccess: () => window.location.href = 'orders.html',
            onPending: () => alert('Selesaikan pembayaran Anda'),
            onError: () => showToast('Pembayaran gagal', 'error'),
            onClose: () => {
                buyBtn.disabled = false;
                buyBtn.textContent = 'Beli Sekarang';
            }
        });
    } catch (error) {
        console.error('Checkout error:', error);
        showToast('Gagal memproses pembelian', 'error');
        document.querySelector('.btn-buy-now').disabled = false;
    }
});



async function loadProductDetail(id) {
    try {
        const response = await fetch(`../api/user/get-product-detail.php?id=${id}`);
        const result = await response.json();

        if (result.success) {
            renderProduct(result.data);
        } else {
            document.querySelector('.product-detail-grid').innerHTML = 
                `<p style="padding:40px; text-align:center;">${result.message}</p>`;
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Get Product ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
        alert('Produk tidak ditemukan!');
        window.location.href = 'dashboard.html';
        return;
    }

    loadProductDetail(productId);
});



async function loadProductDetail(id) {
    try {
        const response = await fetch(`../api/user/get-product-detail.php?id=${id}`);
        const result = await response.json();

        if (result.success) {
            renderProduct(result.data);
        } else {
            document.querySelector('.product-detail-grid').innerHTML = 
                `<p style="padding:40px; text-align:center;">${result.message}</p>`;
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function renderProduct(data) {
    // 1. Basic Info
    document.title = `${data.name} - CrypMerce`;
    document.getElementById('product-name').textContent = data.name;
    document.getElementById('footer-name').textContent = data.name;
    
    // Price formatting
    currentPrice = Number(data.price);
    const formattedPrice = formatRupiah(currentPrice);
    document.getElementById('product-price').textContent = formattedPrice;
    document.getElementById('footer-price').textContent = formattedPrice;
    updateTotalPrice();

    // Stock
    currentStock = Number(data.stock);

    // Image
    if (data.image) {
        const imgPath = `../assets/images/products/${data.image}`;
        document.getElementById('main-img').src = imgPath;
        document.getElementById('footer-img').src = imgPath;
    }

    // Description
    if (data.description) {
        // Convert newlines to <br> for simple HTML rendering
        document.getElementById('product-description').innerHTML = 
            data.description.replace(/\n/g, '<br>');
    } else {
        document.getElementById('product-description').textContent = 'Tidak ada deskripsi.';
    }

    // 2. Seller Info
    if (data.seller) {
        document.getElementById('seller-name').textContent = data.seller.store_name;
        document.getElementById('seller-location').textContent = data.seller.location || 'Indonesia';
        
        const sellerLink = document.getElementById('seller-link');
        if (sellerLink) {
            const shopUrl = `shop.html?id=${data.seller.id}`;
            sellerLink.href = shopUrl;
            sellerLink.onclick = (e) => {
                // Force navigation if necessary
                window.location.href = shopUrl;
            };
            console.log("Seller link set to:", shopUrl);
        }
        
        if (data.seller.photo) {
            document.getElementById('seller-photo').src = `../${data.seller.photo}`;
        }

        // Initialize Follow Status
        checkFollowStatus(data.seller.id);

        // Setup Follow Button Click
        const followBtn = document.querySelector('.btn-follow');
        if (followBtn) {
            followBtn.onclick = () => toggleFollow(data.seller.id);
        }
    }

    // 3. Variants (Mock logic if JSON is null, or parse JSON)
    // Assuming variants structure: { "sizes": ["S","M"], "colors": ["Red"] }
    // Or null.
    
    const variants = data.variants || {};
    
    renderVariants('size-options', variants.sizes || []); // If DB has sizes
    renderVariants('color-options', variants.colors || []); // If DB has colors

    // If stock is 0, disable buttons
    if (currentStock <= 0) {
        const buyBtn = document.querySelector('.btn-buy-now');
        const cartBtn = document.querySelector('.btn-add-cart');
        buyBtn.disabled = true;
        buyBtn.textContent = 'Stok Habis';
        cartBtn.disabled = true;
        
        // Add overlay visual
        document.getElementById('main-img').style.opacity = '0.5';
    }
}

function renderVariants(containerId, options) {
    const container = document.getElementById(containerId);
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
            // Remove active from siblings
            container.querySelectorAll('.variant-btn').forEach(b => b.classList.remove('active'));
            // Add active to self
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
        alert('Stok maksimum tercapai');
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

// Add to Cart Interaction
document.querySelector('.btn-add-cart').addEventListener('click', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    const quantity = parseInt(qtyInput.value);
    
    // Get selected variants if any
    const selectedSize = document.querySelector('#size-options .variant-btn.active')?.textContent || null;
    const selectedColor = document.querySelector('#color-options .variant-btn.active')?.textContent || null;
    
    // Validate stock
    if (currentStock <= 0) {
        showToast('Produk tidak tersedia', 'error');
        return;
    }
    
    if (quantity > currentStock) {
        showToast('Jumlah melebihi stok tersedia', 'error');
        return;
    }
    
    try {
        const formData = new FormData();
        formData.append('product_id', productId);
        formData.append('quantity', quantity);
        if (selectedSize) formData.append('selected_size', selectedSize);
        if (selectedColor) formData.append('selected_color', selectedColor);
        
        const response = await fetch('../api/user/add-to-cart.php', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('Berhasil ditambahkan ke keranjang');
        } else {
            showToast(result.message || 'Gagal menambahkan ke keranjang', 'error');
        }
    } catch (error) {
        console.error('Error adding to cart:', error);
        showToast('Terjadi kesalahan, silakan coba lagi', 'error');
    }
});

// Toast notification function
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast';
    if (type === 'error') {
        toast.style.background = '#ef4444';
    } else {
        toast.style.background = '#10b981';
    }
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ===== FOLLOW SYSTEM =====
async function checkFollowStatus(sellerId) {
    try {
        const response = await fetch(`../api/user/check-follow.php?seller_id=${sellerId}&v=1.1`);
        const result = await response.json();
        
        if (result.success) {
            updateFollowButton(result.following);
        }
    } catch (error) {
        console.error('Error checking follow status:', error);
    }
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
        
        if (result.success) {
            updateFollowButton(result.following);
            // Optional: show toast with result.message
        } else {
            alert(result.message || 'Gagal mengubah status mengikuti');
        }
    } catch (error) {
        console.error('Error toggling follow:', error);
        alert('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
        followBtn.disabled = false;
    }
}

function updateFollowButton(isFollowing) {
    const followBtn = document.querySelector('.btn-follow');
    if (!followBtn) return;
    
    if (isFollowing) {
        followBtn.textContent = 'Unfollow';
        followBtn.classList.add('following');
    } else {
        followBtn.textContent = 'Follow';
        followBtn.classList.remove('following');
    }
}


// Update global scope for onclick handlers
window.increaseQty = increaseQty;
window.decreaseQty = decreaseQty;
window.toggleFollow = toggleFollow;





