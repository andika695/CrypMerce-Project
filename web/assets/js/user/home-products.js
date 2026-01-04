// State tracking
let bestSellingOffset = 0;
const bestSellingLimit = 6;
const bestSellingLoadStep = 12; // 2 rows of 6

let ourProductsOffset = 0;
const ourProductsLimit = 48;
const ourProductsLoadStep = 24; // 4 rows of 6
let currentCategory = null;

document.addEventListener('DOMContentLoaded', () => {
    loadBestSelling();
    loadOurProducts();

    // Event Listeners
    const btnBest = document.getElementById('btnLoadMoreBestSelling');
    if (btnBest) {
        btnBest.addEventListener('click', () => {
            loadBestSelling(true);
        });
    }

    const btnOur = document.getElementById('btnLoadMoreOurProducts');
    if (btnOur) {
        btnOur.addEventListener('click', () => {
            loadOurProducts(currentCategory, true);
        });
    }
});

// Expose filter function globally
window.filterProductsByCategory = function(categoryId) {
    console.log("Filtering by category:", categoryId);
    currentCategory = categoryId;
    ourProductsOffset = 0; // Reset offset
    
    // Hide Best Selling section
    const bestSellingSection = document.getElementById('bestSellingGrid').closest('section');
    if (bestSellingSection) {
        bestSellingSection.style.display = 'none';
    }

    // Update Our Products Title
    const ourProductsTitle = document.querySelector('#ourProductsGrid').closest('section').querySelector('.section-title');
    if (ourProductsTitle) {
        const nameMap = {
            'fashion-pria': 'Fashion Pria',
            'fashion-wanita': 'Fashion Wanita',
            'handphone': 'Handphone',
            'kecantikan': 'Kecantikan',
            'kesehatan': 'Kesehatan',
            'komputer': 'Komputer',
            'otomotif': 'Otomotif',
            'makanan': 'Makanan'
        };
        ourProductsTitle.textContent = nameMap[categoryId] || 'Products';
    }

    // Reset grid
    document.getElementById('ourProductsGrid').innerHTML = '';
    loadOurProducts(categoryId);
};

async function loadBestSelling(isLoadMore = false) {
    const container = document.getElementById('bestSellingGrid');
    if (!container) return;

    if (!isLoadMore) {
        // Initial load
        bestSellingOffset = 0;
        container.innerHTML = '';
    }

    const limit = isLoadMore ? bestSellingLoadStep : bestSellingLimit;
    // Use the tracked global offset
    const currentFetchOffset = bestSellingOffset;

    try {
        const url = `../api/user/get-products.php?sort=best_selling&limit=${limit}&offset=${currentFetchOffset}`;
        const res = await fetch(url);
        const data = await res.json();
        
        if (data.success && data.data.length > 0) {
            appendProductGrid(container, data.data);
            bestSellingOffset += limit; // Update global offset
        } else {
            if (isLoadMore) {
                alert("No more best selling products to load.");
            } else {
                container.innerHTML = '<p class="text-center w-full">No products found.</p>';
            }
        }
    } catch (err) {
        console.error('Error loading best selling:', err);
    }
}

async function loadOurProducts(category = null, isLoadMore = false) {
    const container = document.getElementById('ourProductsGrid');
    if (!container) return;

    if (!isLoadMore) {
        ourProductsOffset = 0;
        container.innerHTML = ''; // Clear only on initial load/filter
    }

    const limit = isLoadMore ? ourProductsLoadStep : ourProductsLimit;
    const currentFetchOffset = ourProductsOffset;

    try {
        let url = `../api/user/get-products.php?limit=${limit}&offset=${currentFetchOffset}`;
        if (category) {
            url += `&category=${encodeURIComponent(category)}`;
        }
        
        const res = await fetch(url);
        const data = await res.json();
        
        if (data.success && data.data.length > 0) {
            appendProductGrid(container, data.data);
            ourProductsOffset += limit;
        } else {
            if (isLoadMore) {
                alert("No more products to load.");
            } else {
                container.innerHTML = '<p class="text-center w-full" style="grid-column: 1/-1; padding: 20px;">No products found in this category.</p>';
            }
        }
    } catch (err) {
        console.error('Error loading our products:', err);
    }
}

function appendProductGrid(container, products) {
     const html = products.map(p => `
        <a href="product-detail.html?id=${p.id}" class="section-product-card">
            <div class="product-image-box">
                <img src="${p.image}" alt="${p.name}" onerror="this.src='../assets/images/no-image.png'">
                <div class="product-actions">
                    <button class="action-btn"><i class="far fa-eye"></i></button>
                </div>
            </div>
            <div class="product-details">
                <h3 class="product-name">${p.name}</h3>
                <div class="price-row">
                    <span class="current-price">Rp ${Number(p.price).toLocaleString('id-ID')}</span>
                </div>
                <div class="rating-row">
                    <div class="stars">
                        ${generateStars(Number(p.avg_rating || 0))} 
                    </div>
                    <span class="rating-count">(${p.sold_count})</span>
                </div>
                <div class="store-info" style="display: flex; align-items: center; gap: 5px; margin-top: 8px; font-size: 12px; color: #888;">
                    <i class="fas fa-store" style="color: var(--primary);"></i>
                    <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${p.store_name || 'Official Store'}</span>
                </div>
            </div>
        </a>
    `).join('');
    
    container.insertAdjacentHTML('beforeend', html);
}

function generateStars(rating) {
    let stars = '';
    const fullStars = Math.round(rating); 
    
    for (let i = 1; i <= 5; i++) {
        if (i <= fullStars) {
            stars += `<i class="fas fa-star" style="color: #ffad33;"></i>`; 
        } else {
            stars += `<i class="fas fa-star" style="color: #ccc;"></i>`; 
        }
    }
    return stars;
}
