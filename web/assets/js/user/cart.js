let allCartItems = []; // Original data
let cartItems = [];    // Display data (filtered)
let selectedItems = new Set();
let currentSelectedItems = [];
let currentTotalPrice = 0;
let cryptoRates = {
    'btc': 0.00000065, // Fallback (1 IDR = x BTC)
    'eth': 0.000018    // Fallback (1 IDR = x ETH)
};

// Initialize page
document.addEventListener("DOMContentLoaded", async () => {
  await loadMidtransConfig();
  loadCart();
  setupEventListeners();
});

// Load Midtrans Configuration
async function loadMidtransConfig() {
  try {
    const response = await fetch("../api/config/midtrans-config.php");
    const data = await response.json();

    if (data.success) {
      console.log("Midtrans config loaded:", data);

      // Create script element
      const script = document.createElement("script");
      script.src = data.snap_url;
      script.setAttribute("data-client-key", data.client_key);
      script.type = "text/javascript";

      document.head.appendChild(script);
      console.log("Midtrans Snap JS loaded from:", data.snap_url);
    }
  } catch (error) {
    console.error("Error loading Midtrans config:", error);
  }
}

// Setup Event Listeners
function setupEventListeners() {
  // Select All checkbox
  const selectAllCheckbox = document.getElementById("selectAll");
  if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener("change", handleSelectAll);
  }

  // Checkout buttons
  const midtransBtn = document.getElementById("checkoutMidtransBtn");
  if (midtransBtn) midtransBtn.addEventListener("click", () => handleCheckoutClick('midtrans'));

  const cryptoBtn = document.getElementById("checkoutCryptoBtn");
  if (cryptoBtn) cryptoBtn.addEventListener("click", () => handleCheckoutClick('crypto'));
}

// Load Cart from API
async function loadCart() {
  try {
    const response = await fetch(
      `../api/user/get-cart.php?t=${new Date().getTime()}`
    );
    const data = await response.json();

    console.log("Cart API Response:", data); // Debug log

    if (data.success) {
      allCartItems = data.cart_items;
      cartItems = [...allCartItems]; // Initialize display with all items
      console.log("Cart items loaded:", allCartItems.length);

      if (allCartItems.length === 0) {
        showEmptyCart();
      } else {
        renderCartItems();
        updateSummary();
      }
    } else {
      console.error("Cart API Error:", data.message);
      showEmptyCart();
      if (data.message) {
        showToast(data.message, "error");
      }
    }
  } catch (error) {
    console.error("Error loading cart:", error);
    showEmptyCart();
    showToast("Gagal memuat keranjang", "error");
  }
}

// Render Cart Items
function renderCartItems() {
  const container = document.getElementById("cartItemsContainer");

  if (!cartItems || cartItems.length === 0) {
    if (allCartItems.length > 0) {
        container.innerHTML = `
            <div class="empty-state" style="text-align:center; padding: 40px;">
                <p>Tidak ada produk yang cocok dengan kategori/pencarian ini.</p>
                <button onclick="resetFilter()" class="btn-browse" style="margin-top:10px;">Lihat Semua</button>
            </div>
        `;
    } else {
        showEmptyCart();
    }
    return;
  }

  // Group items by seller
  const groupedBySeller = cartItems.reduce((acc, item) => {
    const sellerId = item.seller_id;
    if (!acc[sellerId]) {
      acc[sellerId] = {
        seller_name: item.seller_name,
        seller_location: item.seller_location,
        items: [],
      };
    }
    acc[sellerId].items.push(item);
    return acc;
  }, {});

  // Render HTML
  let html = "";
  for (const sellerId in groupedBySeller) {
    const group = groupedBySeller[sellerId];
    html += renderSellerGroup(sellerId, group);
  }

  container.innerHTML = html;
  attachItemEventListeners();
}

// Global Filter Handlers for header.js
window.loadProductsByCategory = function(category) {
    console.log("Filtering cart by category:", category);
    const normalizedCategory = category.toLowerCase().replace('-', ' ');
    
    cartItems = allCartItems.filter(item => {
        const productCategory = (item.category_name || '').toLowerCase();
        return productCategory.includes(normalizedCategory);
    });
    
    renderCartItems();
    
    // Update cart title if exists
    const title = document.querySelector('.cart-header .cart-title');
    if (title) title.innerHTML = `<i class="fas fa-shopping-cart"></i> Keranjang: ${category.replace('-', ' ')}`;
};

window.performSearch = function(query) {
    console.log("Searching cart for:", query);
    const q = query.toLowerCase().trim();
    
    cartItems = allCartItems.filter(item => 
        item.product_name.toLowerCase().includes(q) || 
        (item.category_name && item.category_name.toLowerCase().includes(q))
    );
    
    renderCartItems();
};

function resetFilter() {
    cartItems = [...allCartItems];
    renderCartItems();
    const title = document.querySelector('.cart-header .cart-title');
    if (title) title.innerHTML = `<i class="fas fa-shopping-cart"></i> Keranjang Belanja`;
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
                    <div class="seller-location">📍 ${
                      group.seller_location
                    }</div>
                </div>
            </div>
            ${group.items.map((item) => renderCartItem(item)).join("")}
        </div>
    `;
}

// Render Cart Item
function renderCartItem(item) {
  const imagePath = item.product_image
    ? (item.product_image.startsWith('http') ? item.product_image : `../assets/images/products/${item.product_image}`)
    : "../assets/images/no-image.png";
  const variant = [];
  if (item.selected_size) variant.push(`Ukuran: ${item.selected_size}`);
  if (item.selected_color) variant.push(`Warna: ${item.selected_color}`);
  const variantText = variant.length > 0 ? variant.join(", ") : "";

  return `
        <div class="cart-item" data-item-id="${item.cart_item_id}">
            <div class="item-checkbox">
                <label class="custom-checkbox">
                    <input type="checkbox" class="item-select" data-item-id="${
                      item.cart_item_id
                    }">
                    <span class="checkmark"></span>
                </label>
            </div>
            <img src="${imagePath}" alt="${
    item.product_name
  }" class="item-image" onerror="this.src='../assets/images/no-image.png'">
            <div class="item-details">
                <div class="item-name">${item.product_name}</div>
                ${
                  variantText
                    ? `<div class="item-variant">${variantText}</div>`
                    : ""
                }
                <div class="item-price">Rp ${formatPrice(
                  item.product_price
                )}</div>
            </div>
            <div class="item-actions">
                <button class="remove-btn" data-item-id="${item.cart_item_id}">
                    <i class="fas fa-trash"></i> Hapus
                </button>
                <div class="quantity-control">
                    <button onclick="decreaseQuantity(${
                      item.cart_item_id
                    })">-</button>
                    <input type="number" value="${
                      item.quantity
                    }" min="1" max="${item.product_stock}" readonly>
                    <button onclick="increaseQuantity(${item.cart_item_id}, ${
    item.product_stock
  })">+</button>
                </div>
            </div>
        </div>
    `;
}

// Attach Event Listeners to Cart Items
function attachItemEventListeners() {
  // Individual item checkboxes
  document.querySelectorAll(".item-select").forEach((checkbox) => {
    checkbox.addEventListener("change", handleItemSelect);
  });

  // Seller checkboxes
  document.querySelectorAll(".seller-select").forEach((checkbox) => {
    checkbox.addEventListener("change", handleSellerSelect);
  });

  // Remove buttons
  document.querySelectorAll(".remove-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const itemId = parseInt(e.currentTarget.dataset.itemId);
      removeItem(itemId);
    });
  });
}

// Handle Select All
function handleSelectAll(e) {
  const isChecked = e.target.checked;
  document.querySelectorAll(".item-select").forEach((checkbox) => {
    checkbox.checked = isChecked;
    const itemId = parseInt(checkbox.dataset.itemId);
    if (isChecked) {
      selectedItems.add(itemId);
    } else {
      selectedItems.delete(itemId);
    }
  });

  // Update seller checkboxes
  document.querySelectorAll(".seller-select").forEach((checkbox) => {
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
    document.getElementById("selectAll").checked = false;
  }

  updateSummary();
  updateSellerCheckbox(e.target);
}

// Handle Seller Select
function handleSellerSelect(e) {
  const sellerId = e.target.dataset.sellerId;
  const isChecked = e.target.checked;
  const sellerGroup = document.querySelector(
    `.seller-group[data-seller-id="${sellerId}"]`
  );

  sellerGroup.querySelectorAll(".item-select").forEach((checkbox) => {
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
  const sellerGroup = itemCheckbox.closest(".seller-group");
  const sellerCheckbox = sellerGroup.querySelector(".seller-select");
  const allItems = sellerGroup.querySelectorAll(".item-select");
  const checkedItems = sellerGroup.querySelectorAll(".item-select:checked");

  sellerCheckbox.checked = allItems.length === checkedItems.length;
}

// Decrease Quantity
async function decreaseQuantity(cartItemId) {
  const item = cartItems.find((i) => i.cart_item_id === cartItemId);
  if (!item || item.quantity <= 1) return;

  await updateQuantity(cartItemId, item.quantity - 1);
}

// Increase Quantity
async function increaseQuantity(cartItemId, maxStock) {
  const item = cartItems.find((i) => i.cart_item_id === cartItemId);
  if (!item || item.quantity >= maxStock) {
    showToast("Stok tidak mencukupi", "error");
    return;
  }

  await updateQuantity(cartItemId, item.quantity + 1);
}

// Update Quantity via API
async function updateQuantity(cartItemId, newQuantity) {
  console.log("Updating quantity:", { cartItemId, newQuantity }); // Debug

  try {
    const formData = new FormData();
    formData.append("cart_item_id", cartItemId);
    formData.append("quantity", newQuantity);

    const response = await fetch("../api/user/update-cart-item.php", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    console.log("Update response:", data); // Debug

    if (data.success) {
      // Update local data
      const item = cartItems.find((i) => i.cart_item_id === cartItemId);
      if (item) {
        item.quantity = newQuantity;
      }

      // Re-render
      renderCartItems();
      updateSummary();
      showToast("Jumlah berhasil diupdate");
    } else {
      console.error("Update failed:", data);
      showToast(data.message || "Gagal mengupdate quantity", "error");
    }
  } catch (error) {
    console.error("Error updating quantity:", error);
    showToast("Gagal mengupdate quantity", "error");
  }
}

// Remove Item from Cart
async function removeItem(cartItemId) {
  if (!confirm("Hapus produk dari keranjang?")) return;

  try {
    const formData = new FormData();
    formData.append("cart_item_id", cartItemId);

    const response = await fetch("../api/user/remove-cart-item.php", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    if (data.success) {
      showToast("Produk dihapus dari keranjang");
      selectedItems.delete(cartItemId);
      loadCart(); // Reload cart
    } else {
      showToast(data.message || "Gagal menghapus produk", "error");
    }
  } catch (error) {
    console.error("Error removing item:", error);
    showToast("Gagal menghapus produk", "error");
  }
}

// Update Summary
function updateSummary() {
  const selectedCount = selectedItems.size;
  let totalPrice = 0;

  selectedItems.forEach((itemId) => {
    const item = cartItems.find((i) => i.cart_item_id === itemId);
    if (item) {
      totalPrice += item.product_price * item.quantity;
    }
  });

  document.getElementById("summaryTotalItems").textContent = selectedCount;
  document.getElementById("summaryTotalPrice").textContent = `Rp ${formatPrice(totalPrice)}`;

  // Update Buttons
  const midtransBtn = document.getElementById("checkoutMidtransBtn");
  const cryptoBtn = document.getElementById("checkoutCryptoBtn");
  
  if (midtransBtn) {
      midtransBtn.disabled = selectedCount === 0;
      document.getElementById("checkoutCountMidtrans").textContent = selectedCount;
  }
  
  if (cryptoBtn) {
      cryptoBtn.disabled = selectedCount === 0;
      document.getElementById("checkoutCountCrypto").textContent = selectedCount;
  }
}

// Prepare Checkout Data (Helper)
function prepareCheckoutData() {
    if (selectedItems.size === 0) {
        showToast('Pilih produk terlebih dahulu', 'error');
        return false;
    }

    currentSelectedItems = cartItems
        .filter(item => selectedItems.has(item.cart_item_id))
        .map(item => ({
            id: item.product_id,
            name: item.product_name,
            price: item.product_price,
            quantity: item.quantity,
            seller_id: item.seller_id
        }));

    currentTotalPrice = currentSelectedItems.reduce(
        (sum, item) => sum + (item.price * item.quantity),
        0
    );
    return true;
}

// Handle Checkout Click Router
function handleCheckoutClick(method) {
    if (!prepareCheckoutData()) return;

    if (method === 'midtrans') {
        processMidtransCheckout();
    } else if (method === 'crypto') {
        openCryptoModal();
    }
}

function openCryptoModal() {
    const modal = document.getElementById('cryptoPaymentModal');
    modal.classList.add('show');
    
    // Reset state
    document.getElementById('cryptoSelect').value = "";
    document.getElementById('cryptoPaymentDetails').style.display = 'none';

    // Fetch live rates
    fetchCryptoRates();
    
    // Setup listeners
    const select = document.getElementById('cryptoSelect');
    select.onchange = handleCryptoCoinSelect;
    
    // Unbind previous onclick to prevent multiple listeners if any (simple approach)
    const confirmBtn = document.getElementById('confirmCryptoBtn');
    confirmBtn.onclick = processCryptoPayment;
    
    // Close modal listener
    modal.querySelector('.close-modal').onclick = () => {
        modal.classList.remove('show');
        resetCheckoutButtons();
    };
}

// Fetch Live Crypto Rates (CoinGecko)
async function fetchCryptoRates() {
    try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=idr');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        
        // Update rates: 1 IDR = 1 / Price_in_IDR
        if (data.bitcoin && data.bitcoin.idr) {
             cryptoRates.btc = 1 / data.bitcoin.idr;
        }
        if (data.ethereum && data.ethereum.idr) {
             cryptoRates.eth = 1 / data.ethereum.idr;
        }
        console.log('Live Crypto Rates fetched:', cryptoRates);
        
        // If a coin is already selected, update the display
        const currentCoin = document.getElementById('cryptoSelect').value;
        if (currentCoin) {
            handleCryptoCoinSelect({ target: { value: currentCoin } });
        }

    } catch (error) {
        console.warn('Failed to fetch live crypto rates, using fallback:', error);
    }
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
    
    // Generate QR (using google chart api for simplicity)
    const address = wallets[coin];
    qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${address}`;
    
    walletText.textContent = address;
    currencyText.textContent = coin.toUpperCase();
    fiatText.textContent = `Rp ${formatPrice(currentTotalPrice)}`;
    
    // Calculate amount using current rates (live or fallback)
    const rate = cryptoRates[coin] || 0;
    const cryptoVal = currentTotalPrice * rate;
    amountText.textContent = cryptoVal.toFixed(8); // 8 decimal places for crypto
}

// Process Crypto Payment (Step: Create Order -> Confirm)
async function processCryptoPayment() {
    const confirmBtn = document.getElementById('confirmCryptoBtn');
    const coinType = document.getElementById('cryptoSelect').value;
    
    try {
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
        
        // 1. Create Order
        const payload = {
            total_price: currentTotalPrice,
            items: currentSelectedItems,
            coin_type: coinType
        };
        
        const createRes = await fetch('../checkout/PlaceOrderCrypto.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const createData = await createRes.json();
        
        if (!createData.success) throw new Error(createData.message || 'Gagal membuat pesanan Crypto');
        
        const orderUuid = createData.order_uuid;
        
        // 2. Simulate Payment Confirmation (Delay for realism)
        await new Promise(r => setTimeout(r, 1500));
        
        const confirmRes = await fetch('../checkout/ConfirmCryptoPayment.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_uuid: orderUuid })
        });
        
        const confirmData = await confirmRes.json();
        
        if (!confirmData.success) throw new Error(confirmData.message || 'Gagal konfirmasi pembayaran');
        
        // Success
        window.location.href = '../user/success.html';
        
    } catch (error) {
        console.error('Crypto payment error:', error);
        showToast(error.message, 'error');
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Selesai Pembayaran';
    }
}

// Process Midtrans
async function processMidtransCheckout() {
    const checkoutBtn = document.getElementById('checkoutMidtransBtn');
    const payload = {
        total_price: currentTotalPrice,
        items: currentSelectedItems
    };

    try {
        checkoutBtn.disabled = true;
        checkoutBtn.textContent = 'Memproses...';

        const response = await fetch('../checkout/PlaceOrder.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error('Gagal menghubungi server');

        const snapToken = await response.text();

        // Check if window.snap is available
        if (typeof window.snap === 'undefined') {
             throw new Error("Sistem pembayaran belum siap. Mohon refresh halaman.");
        }

        window.snap.pay(snapToken, {
            onSuccess: function (result) {
                window.location.href = '../user/success.html';
            },
            onError: function (result) {
                showToast('Pembayaran gagal', 'error');
                resetCheckoutButtons();
            },
            onClose: function () {
                resetCheckoutButtons();
            }
        });

    } catch (error) {
        console.error('Checkout error:', error);
        showToast(error.message || 'Terjadi kesalahan saat memproses pesanan', 'error');
        resetCheckoutButtons();
    }
}

function resetCheckoutButtons() {
    const midtransBtn = document.getElementById("checkoutMidtransBtn");
    const cryptoBtn = document.getElementById("checkoutCryptoBtn");
    const count = selectedItems.size;
    
    if (midtransBtn) {
        midtransBtn.disabled = false;
        midtransBtn.innerHTML = `Checkout IDR (<span id="checkoutCountMidtrans">${count}</span>)`;
    }
    
    if (cryptoBtn) {
        cryptoBtn.disabled = false;
        cryptoBtn.innerHTML = `Checkout Crypto (<span id="checkoutCountCrypto">${count}</span>)`;
    }
}

// Show Empty Cart
function showEmptyCart() {
  const container = document.getElementById("cartItemsContainer");
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
function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  if (!toast) {
      alert(message);
      return;
  }
  toast.textContent = message;
  toast.className = `toast ${type} show`;

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

// Format Price
function formatPrice(price) {
  return new Intl.NumberFormat("id-ID").format(price);
}
