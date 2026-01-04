// Search Results Page Logic
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('q') || urlParams.get('search') || '';
    
    if (searchQuery) {
        document.getElementById('searchQueryText').textContent = searchQuery;
        loadSearchResults(searchQuery);
    } else {
        document.getElementById('searchResultsGrid').innerHTML = `
            <div class="no-results">
                <div class="no-results-icon">🔍</div>
                <h2>Tidak ada kata kunci pencarian</h2>
                <p>Silakan masukkan kata kunci di kolom pencarian</p>
            </div>
        `;
    }
});

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

async function loadSearchResults(query) {
    const grid = document.getElementById('searchResultsGrid');
    grid.innerHTML = '<p style="text-align: center; padding: 40px; color: #666; grid-column: 1/-1;">Memuat hasil pencarian...</p>';
    
    try {
        const response = await fetch(`../api/user/get-products.php?search=${encodeURIComponent(query)}`);
        const result = await response.json();
        
        if (result.success && result.data && result.data.length > 0) {
            renderProducts(result.data);
        } else {
            grid.innerHTML = `
                <div class="no-results">
                    <div class="no-results-icon">🔍</div>
                    <h2>Tidak ada hasil ditemukan</h2>
                    <p>Tidak ada produk yang sesuai dengan kata kunci "${query}"</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading search results:', error);
        grid.innerHTML = '<p style="text-align: center; padding: 40px; color: #e74c3c; grid-column: 1/-1;">Gagal memuat hasil pencarian</p>';
    }
}

function renderProducts(products) {
    const grid = document.getElementById('searchResultsGrid');
    
    grid.innerHTML = products.map(p => {
        const imgSrc = p.image ? (p.image.startsWith('http') || p.image.startsWith('../') ? p.image : `../assets/images/products/${p.image}`) : '../assets/images/bag.png';
        const rating = parseFloat(p.avg_rating || 0);
        const stars = generateStars(rating);
        
        return `
        <a href="product-detail.html?id=${p.id}" class="section-product-card">
            <div class="product-image-box">
                <img src="${imgSrc}" alt="${p.name}" onerror="this.src='../assets/images/bag.png'">
                <div class="product-actions">
                    <button class="action-btn"><i class="far fa-eye"></i></button>
                </div>
            </div>
            <div class="product-details">
                <h3 class="product-name">${p.name}</h3>
                <div class="price-row">
                    <span class="current-price">Rp ${parseInt(p.price).toLocaleString('id-ID')}</span>
                </div>
                <div class="rating-row">
                    <div class="stars">${stars}</div>
                    <span class="rating-count">(${p.sold_count || 0})</span>
                </div>
                <div class="store-info" style="display: flex; align-items: center; gap: 5px; margin-top: 8px; font-size: 12px; color: #888;">
                    <i class="fas fa-store" style="color: var(--primary);"></i>
                    <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${p.store_name || 'Official Store'}</span>
                </div>
            </div>
        </a>`;
    }).join('');
}

