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
            
            // Update Rating Stats
            const ratingElem = document.getElementById('store-rating');
            if (ratingElem) {
                const rating = data.rating > 0 ? data.rating : '-';
                ratingElem.innerHTML = `⭐ ${rating} <small>(${data.total_reviews} ulasan)</small>`;
            }
            if (data.profile_photo) {
                const imgSrc = data.profile_photo.startsWith('http') ? data.profile_photo : `../${data.profile_photo}`;
                document.getElementById('store-profile-img').src = imgSrc;
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

    grid.innerHTML = products.map(p => {
        const imgSrc = p.image ? (p.image.startsWith('http') ? p.image : `../assets/images/products/${p.image}`) : '../assets/images/bag.png';
        return `
        <div class="product-card" onclick="window.location.href='product-detail.html?id=${p.id}'">
            <div class="product-image">
                <img src="${imgSrc}" alt="${p.name}">
            </div>
            <div class="product-info">
                <h3>${p.name}</h3>
                <p class="price">Rp ${parseInt(p.price).toLocaleString('id-ID')}</p>
                <div class="product-meta">
                    <span class="stock-tag">Stok: ${p.stock}</span>
                    <span class="category-tag">${p.category_name}</span>
                </div>
            </div>
        </div>`;
    }).join('');
}

function filterProducts(query) {
    const filtered = allProducts.filter(p => 
        p.name.toLowerCase().includes(query.toLowerCase())
    );
    renderProducts(filtered);
}

async function checkFollowStatus(id) {
    if (!id) {
        console.error('Seller ID is required');
        return;
    }
    
    try {
        const response = await fetch(`../api/user/check-follow.php?seller_id=${id}`);
        const result = await response.json();
        
        if (result.success) {
            updateFollowButton(result.following);
            // Update follower count if element exists
            const followerCountEl = document.getElementById('store-followers');
            if (followerCountEl) {
                followerCountEl.textContent = result.follower_count;
            }
        } else {
            console.error('Check follow failed:', result.message);
        }
    } catch (error) {
        console.error('Error checking follow status:', error);
    }
}

async function toggleFollow(id) {
    if (!id) {
        console.error('Seller ID is required');
        return;
    }
    
    const btn = document.getElementById('follow-btn');
    if (!btn) {
        console.error('Follow button not found');
        return;
    }
    
    if (btn.disabled) return;
    btn.disabled = true;
    
    try {
        const response = await fetch('../api/user/toggle-follow.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ seller_id: id })
        });
        
        if (response.status === 401) {
            alert('Silakan login untuk mengikuti toko ini');
            btn.disabled = false;
            return;
        }

        const result = await response.json();
        if (result.success) {
            updateFollowButton(result.following);
            const followerCountEl = document.getElementById('store-followers');
            if (followerCountEl) {
                followerCountEl.textContent = result.follower_count;
            }
        } else {
            alert(result.message || 'Gagal mengikuti toko');
        }
    } catch (error) {
        console.error('Error toggling follow:', error);
        alert('Terjadi kesalahan saat mengikuti toko');
    } finally {
        btn.disabled = false;
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

// Global Handlers for header.js
window.loadProductsByCategory = function(category) {
    console.log("Filtering store products by category:", category);
    const filtered = allProducts.filter(p => 
        p.category_name.toLowerCase().includes(category.toLowerCase().replace('-', ' '))
    );
    renderProducts(filtered);
    
    // Update store section title if exists
    const title = document.querySelector('.shop-container .section-title');
    if (title) title.textContent = `📦 Produk: ${category.replace('-', ' ')}`;
};

window.performSearch = function(query) {
    filterProducts(query);
};
