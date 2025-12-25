// Shop Page Logic
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const sellerId = urlParams.get('id');

    if (!sellerId) {
        alert('ID Toko tidak ditemukan');
        window.location.href = '../index.php';
        return;
    }

    loadShopProfile(sellerId);
    loadShopProducts(sellerId);
    checkFollowStatus(sellerId);

    // Follow Button Handler
    const followBtn = document.getElementById('follow-btn');
    if (followBtn) {
        followBtn.addEventListener('click', () => toggleFollow(sellerId));
    }

    // Search Handler
    const searchInput = document.getElementById('store-inner-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => filterProducts(e.target.value));
    }
});

let allProducts = [];

async function loadShopProfile(id) {
    try {
        const response = await fetch(`../api/user/get-public-seller-profile.php?id=${id}&v=1.1`);
        const result = await response.json();

        if (result.success) {
            const data = result.data;
            document.getElementById('store-page-name').textContent = data.store_name;
            document.getElementById('store-location').textContent = data.location;
            document.getElementById('store-followers').textContent = data.follower_count;
            document.getElementById('store-total-products').textContent = data.total_products;
            
            if (data.profile_photo) {
                document.getElementById('store-profile-img').src = `../${data.profile_photo}`;
            }
        }
    } catch (error) {
        console.error('Error loading shop profile:', error);
    }
}

async function loadShopProducts(id) {
    const grid = document.getElementById('storeProductGrid');
    try {
        const response = await fetch(`../api/user/get-seller-products.php?id=${id}&v=1.1`);
        const result = await response.json();

        if (result.success) {
            allProducts = result.products;
            renderProducts(allProducts);
        }
    } catch (error) {
        console.error('Error loading products:', error);
        grid.innerHTML = '<p style="text-align: center; color: red;">Gagal memuat produk</p>';
    }
}

function renderProducts(products) {
    const grid = document.getElementById('storeProductGrid');
    if (products.length === 0) {
        grid.innerHTML = '<p style="text-align: center; padding: 40px; color: #666; width: 100%;">Toko ini belum memiliki produk.</p>';
        return;
    }

    grid.innerHTML = products.map(p => `
        <div class="product-card" onclick="window.location.href='product-detail.html?id=${p.id}'">
            <div class="product-image">
                <img src="${p.image ? `../assets/images/products/${p.image}` : '../assets/images/bag.png'}" alt="${p.name}">
            </div>
            <div class="product-info">
                <h3>${p.name}</h3>
                <p class="price">Rp ${parseInt(p.price).toLocaleString('id-ID')}</p>
                <div class="product-meta">
                    <span class="stock-tag">Stok: ${p.stock}</span>
                    <span class="category-tag">${p.category_name}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function filterProducts(query) {
    const filtered = allProducts.filter(p => 
        p.name.toLowerCase().includes(query.toLowerCase())
    );
    renderProducts(filtered);
}

async function checkFollowStatus(id) {
    try {
        const response = await fetch(`../api/user/check-follow.php?seller_id=${id}&v=1.1`);
        const result = await response.json();
        
        if (result.success) {
            updateFollowButton(result.following);
        }
    } catch (error) {
        console.error('Error checking follow status:', error);
    }
}

async function toggleFollow(id) {
    try {
        const response = await fetch('../api/user/toggle-follow.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ seller_id: id })
        });
        
        if (response.status === 401) {
            alert('Silakan login untuk mengikuti toko ini');
            return;
        }

        const result = await response.json();
        if (result.success) {
            updateFollowButton(result.following);
            document.getElementById('store-followers').textContent = result.follower_count;
        }
    } catch (error) {
        console.error('Error toggling follow:', error);
    }
}

function updateFollowButton(isFollowing) {
    const btn = document.getElementById('follow-btn');
    if (!btn) return;

    if (isFollowing) {
        btn.classList.add('following');
        btn.innerHTML = '<i class="fas fa-check"></i> Following';
    } else {
        btn.classList.remove('following');
        btn.innerHTML = '<i class="fas fa-plus"></i> Follow';
    }
}
