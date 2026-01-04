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

    // Tab Handler
    const tabAll = document.getElementById('tab-all');
    const tabBestseller = document.getElementById('tab-bestseller');
    if (tabAll) {
        tabAll.addEventListener('click', () => switchTab('all'));
    }
    if (tabBestseller) {
        tabBestseller.addEventListener('click', () => switchTab('bestseller'));
    }
});

let allProducts = [];
let currentTab = 'all';

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
            switchTab(currentTab);
        }
    } catch (error) {
        console.error('Error loading products:', error);
        grid.innerHTML = '<p style="text-align: center; color: red;">Gagal memuat produk</p>';
    }
}

function generateStars(rating) {
    let stars = '';
    const fullStars = Math.round(rating);
    for (let i = 1; i <= 5; i++) {
        if (i <= fullStars && rating > 0) {
            stars += `<i class="fas fa-star" style="color: #ffad33;"></i>`;
        } else {
            stars += `<i class="fas fa-star" style="color: #ccc;"></i>`;
        }
    }
    return stars;
}

function renderProducts(products) {
    const grid = document.getElementById('storeProductGrid');
    if (products.length === 0) {
        grid.innerHTML = '<p style="text-align: center; padding: 40px; color: #666; width: 100%;">Toko ini belum memiliki produk.</p>';
        return;
    }

    grid.innerHTML = products.map(p => {
        const imgSrc = p.image ? (p.image.startsWith('http') ? p.image : `../assets/images/products/${p.image}`) : '../assets/images/bag.png';
        const rating = parseFloat(p.avg_rating || 0);
        const stars = generateStars(rating);
        const ratingDisplay = rating > 0 ? rating.toFixed(1) : '-';
        
        return `
        <div class="product-card" onclick="window.location.href='product-detail.html?id=${p.id}'">
            <div class="product-image">
                <img src="${imgSrc}" alt="${p.name}">
            </div>
            <div class="product-info">
                <h3>${p.name}</h3>
                <p class="price">Rp ${parseInt(p.price).toLocaleString('id-ID')}</p>
                <div class="product-rating">
                    <div class="rating-stars">${stars}</div>
                    <span class="rating-value">${ratingDisplay}</span>
                </div>
                <div class="product-meta">
                    <span class="stock-tag">Stok: ${p.stock}</span>
                    <span class="category-tag">${p.category_name}</span>
                </div>
            </div>
        </div>`;
    }).join('');
}

function switchTab(tab) {
    currentTab = tab;
    const tabAll = document.getElementById('tab-all');
    const tabBestseller = document.getElementById('tab-bestseller');
    
    // Update active state
    if (tabAll && tabBestseller) {
        tabAll.classList.remove('active');
        tabBestseller.classList.remove('active');
        if (tab === 'all') {
            tabAll.classList.add('active');
        } else {
            tabBestseller.classList.add('active');
        }
    }
    
    // Get search query
    const searchQuery = document.getElementById('store-inner-search')?.value || '';
    let productsToShow = allProducts;
    
    // Apply search filter
    if (searchQuery) {
        productsToShow = productsToShow.filter(p => 
            p.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }
    
    // Sort products
    if (tab === 'bestseller') {
        productsToShow = [...productsToShow].sort((a, b) => {
            const soldA = parseInt(a.sold_count || 0);
            const soldB = parseInt(b.sold_count || 0);
            return soldB - soldA; // Sort descending (highest first)
        });
    }
    
    renderProducts(productsToShow);
}

function filterProducts(query) {
    switchTab(currentTab);
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
    // Note: This function is called from header.js for category filtering
    // The actual filtering should be done at the API level
    switchTab(currentTab);
};

// Removed: performSearch is now handled by header.js globally
// All pages should redirect to search-results.html
