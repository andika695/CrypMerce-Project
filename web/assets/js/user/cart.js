// Cart Page JavaScript
let cartItems = [];
let selectedItems = new Set();

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    loadCart();
    setupEventListeners();
});

// Setup Event Listeners
function setupEventListeners() {
    // Select All checkbox
    const selectAllCheckbox = document.getElementById('selectAll');
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', handleSelectAll);
    }

    // Checkout button
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', handleCheckout);
    }
}

// Load Cart from API
async function loadCart() {
    try {
        const response = await fetch(`../api/user/get-cart.php?t=${new Date().getTime()}`);
        const data = await response.json();

        console.log('Cart API Response:', data); // Debug log

        if (data.success) {
            cartItems = data.cart_items;
            console.log('Cart items loaded:', cartItems.length);
            
            if (cartItems.length === 0) {
                showEmptyCart();
            } else {
                renderCartItems();
                updateSummary();
            }
        } else {
            console.error('Cart API Error:', data.message);
            showEmptyCart();
            if (data.message) {
                showToast(data.message, 'error');
            }
        }
    } catch (error) {
        console.error('Error loading cart:', error);
        showEmptyCart();
        showToast('Gagal memuat keranjang', 'error');
    }
}

// Render Cart Items
function renderCartItems() {
    const container = document.getElementById('cartItemsContainer');
    
    if (!cartItems || cartItems.length === 0) {
        showEmptyCart();
        return;
    }

    // Group items by seller
    const groupedBySeller = cartItems.reduce((acc, item) => {
        const sellerId = item.seller_id;
        if (!acc[sellerId]) {
            acc[sellerId] = {
                seller_name: item.seller_name,
                seller_location: item.seller_location,
                items: []
            };
        }
        acc[sellerId].items.push(item);
        return acc;
    }, {});

    // Render HTML
    let html = '';
    for (const sellerId in groupedBySeller) {
        const group = groupedBySeller[sellerId];
        html += renderSellerGroup(sellerId, group);
    }

    container.innerHTML = html;
    attachItemEventListeners();
}

// Render Seller Group
function renderSellerGroup(sellerId, group) {
    return `
        <div class="seller-group" data-seller-id="${sellerId}">
            <div class="seller-header">
                <label class="custom-checkbox seller-checkbox">
                    <input type="checkbox" class="seller-select" data-seller-id="${sellerId}">
                    <span class="checkmark"></span>
                </label>
                <div>
                    <div class="seller-name">${group.seller_name}</div>
                    <div class="seller-location">📍 ${group.seller_location}</div>
                </div>
            </div>
            ${group.items.map(item => renderCartItem(item)).join('')}
        </div>
    `;
}

// Render Cart Item
function renderCartItem(item) {
    const imagePath = item.product_image ? `../assets/images/products/${item.product_image}` : '../assets/images/no-image.png';
    const variant = [];
    if (item.selected_size) variant.push(`Ukuran: ${item.selected_size}`);
    if (item.selected_color) variant.push(`Warna: ${item.selected_color}`);
    const variantText = variant.length > 0 ? variant.join(', ') : '';

    return `
        <div class="cart-item" data-item-id="${item.cart_item_id}">
            <div class="item-checkbox">
                <label class="custom-checkbox">
                    <input type="checkbox" class="item-select" data-item-id="${item.cart_item_id}">
                    <span class="checkmark"></span>
                </label>
            </div>
            <img src="${imagePath}" alt="${item.product_name}" class="item-image" onerror="this.src='../assets/images/no-image.png'">
            <div class="item-details">
                <div class="item-name">${item.product_name}</div>
                ${variantText ? `<div class="item-variant">${variantText}</div>` : ''}
                <div class="item-price">Rp ${formatPrice(item.product_price)}</div>
            </div>
            <div class="item-actions">
                <button class="remove-btn" data-item-id="${item.cart_item_id}">
                    <i class="fas fa-trash"></i> Hapus
                </button>
                <div class="quantity-control">
                    <button onclick="decreaseQuantity(${item.cart_item_id})">-</button>
                    <input type="number" value="${item.quantity}" min="1" max="${item.product_stock}" readonly>
                    <button onclick="increaseQuantity(${item.cart_item_id}, ${item.product_stock})">+</button>
                </div>
            </div>
        </div>
    `;
}

// Attach Event Listeners to Cart Items
function attachItemEventListeners() {
    // Individual item checkboxes
    document.querySelectorAll('.item-select').forEach(checkbox => {
        checkbox.addEventListener('change', handleItemSelect);
    });

    // Seller checkboxes
    document.querySelectorAll('.seller-select').forEach(checkbox => {
        checkbox.addEventListener('change', handleSellerSelect);
    });

    // Remove buttons
    document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const itemId = parseInt(e.currentTarget.dataset.itemId);
            removeItem(itemId);
        });
    });
}

// Handle Select All
function handleSelectAll(e) {
    const isChecked = e.target.checked;
    document.querySelectorAll('.item-select').forEach(checkbox => {
        checkbox.checked = isChecked;
        const itemId = parseInt(checkbox.dataset.itemId);
        if (isChecked) {
            selectedItems.add(itemId);
        } else {
            selectedItems.delete(itemId);
        }
    });
    
    // Update seller checkboxes
    document.querySelectorAll('.seller-select').forEach(checkbox => {
        checkbox.checked = isChecked;
    });
    
    updateSummary();
}

// Handle Individual Item Select
function handleItemSelect(e) {
    const itemId = parseInt(e.target.dataset.itemId);
    if (e.target.checked) {
        selectedItems.add(itemId);
    } else {
        selectedItems.delete(itemId);
        document.getElementById('selectAll').checked = false;
    }
    
    updateSummary();
    updateSellerCheckbox(e.target);
}

// Handle Seller Select
function handleSellerSelect(e) {
    const sellerId = e.target.dataset.sellerId;
    const isChecked = e.target.checked;
    const sellerGroup = document.querySelector(`.seller-group[data-seller-id="${sellerId}"]`);
    
    sellerGroup.querySelectorAll('.item-select').forEach(checkbox => {
        checkbox.checked = isChecked;
        const itemId = parseInt(checkbox.dataset.itemId);
        if (isChecked) {
            selectedItems.add(itemId);
        } else {
            selectedItems.delete(itemId);
        }
    });
    
    updateSummary();
}

// Update Seller Checkbox based on items
function updateSellerCheckbox(itemCheckbox) {
    const sellerGroup = itemCheckbox.closest('.seller-group');
    const sellerCheckbox = sellerGroup.querySelector('.seller-select');
    const allItems = sellerGroup.querySelectorAll('.item-select');
    const checkedItems = sellerGroup.querySelectorAll('.item-select:checked');
    
    sellerCheckbox.checked = allItems.length === checkedItems.length;
}

// Decrease Quantity
async function decreaseQuantity(cartItemId) {
    const item = cartItems.find(i => i.cart_item_id === cartItemId);
    if (!item || item.quantity <= 1) return;
    
    await updateQuantity(cartItemId, item.quantity - 1);
}

// Increase Quantity
async function increaseQuantity(cartItemId, maxStock) {
    const item = cartItems.find(i => i.cart_item_id === cartItemId);
    if (!item || item.quantity >= maxStock) {
        showToast('Stok tidak mencukupi', 'error');
        return;
    }
    
    await updateQuantity(cartItemId, item.quantity + 1);
}

// Update Quantity via API
async function updateQuantity(cartItemId, newQuantity) {
    console.log('Updating quantity:', { cartItemId, newQuantity }); // Debug
    
    try {
        const formData = new FormData();
        formData.append('cart_item_id', cartItemId);
        formData.append('quantity', newQuantity);

        const response = await fetch('../api/user/update-cart-item.php', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        console.log('Update response:', data); // Debug
        
        if (data.success) {
            // Update local data
            const item = cartItems.find(i => i.cart_item_id === cartItemId);
            if (item) {
                item.quantity = newQuantity;
            }
            
            // Re-render
            renderCartItems();
            updateSummary();
            showToast('Jumlah berhasil diupdate');
        } else {
            console.error('Update failed:', data);
            showToast(data.message || 'Gagal mengupdate quantity', 'error');
        }
    } catch (error) {
        console.error('Error updating quantity:', error);
        showToast('Gagal mengupdate quantity', 'error');
    }
}

// Remove Item from Cart
async function removeItem(cartItemId) {
    if (!confirm('Hapus produk dari keranjang?')) return;

    try {
        const formData = new FormData();
        formData.append('cart_item_id', cartItemId);

        const response = await fetch('../api/user/remove-cart-item.php', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        if (data.success) {
            showToast('Produk dihapus dari keranjang');
            selectedItems.delete(cartItemId);
            loadCart(); // Reload cart
        } else {
            showToast(data.message || 'Gagal menghapus produk', 'error');
        }
    } catch (error) {
        console.error('Error removing item:', error);
        showToast('Gagal menghapus produk', 'error');
    }
}

// Update Summary
function updateSummary() {
    const selectedCount = selectedItems.size;
    let totalPrice = 0;

    selectedItems.forEach(itemId => {
        const item = cartItems.find(i => i.cart_item_id === itemId);
        if (item) {
            totalPrice += item.product_price * item.quantity;
        }
    });

    document.getElementById('summaryTotalItems').textContent = selectedCount;
    document.getElementById('summaryTotalPrice').textContent = `Rp ${formatPrice(totalPrice)}`;
    document.getElementById('checkoutCount').textContent = selectedCount;

    // Enable/disable checkout button
    const checkoutBtn = document.getElementById('checkoutBtn');
    checkoutBtn.disabled = selectedCount === 0;
}

// Handle Checkout
async function handleCheckout() {
    if (selectedItems.size === 0) {
        showToast('Pilih produk terlebih dahulu', 'error');
        return;
    }

    // Ambil item yang dipilih
    const items = cartItems
        .filter(item => selectedItems.has(item.cart_item_id))
        .map(item => ({
            id: item.product_id,
            name: item.product_name,
            price: item.product_price,
            quantity: item.quantity
        }));

    // Hitung total harga
    const total_price = items.reduce(
        (sum, item) => sum + (item.price * item.quantity),
        0
    );

    const data = {
        total_price,
        items
    };

    try {
        const response = await fetch('../checkout/PlaceOrder.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const snapToken = await response.text();

        window.snap.pay(snapToken, {
            onSuccess: function (result) {
                console.log('Payment success:', result);
            },
            onPending: function (result) {
                console.log('Payment pending:', result);
            },
            onError: function (result) {
                console.log('Payment error:', result);
            }
        });

    } catch (error) {
        console.error('Checkout error:', error);
        showToast('Gagal memproses checkout', 'error');
    }
}

// Show Empty Cart
function showEmptyCart() {
    const container = document.getElementById('cartItemsContainer');
    container.innerHTML = `
        <div class="empty-cart">
            <i class="fas fa-shopping-cart"></i>
            <h3>Keranjang Belanja Kosong</h3>
            <p>Yuk, isi keranjang belanjamu dengan produk-produk pilihan!</p>
            <a href="dashboard.html" class="btn-browse">Mulai Belanja</a>
        </div>
    `;
}

// Show Toast Notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Format Price
function formatPrice(price) {
    return new Intl.NumberFormat('id-ID').format(price);
}
