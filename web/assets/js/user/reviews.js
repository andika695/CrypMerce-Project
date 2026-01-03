document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
        alert('Produk tidak ditemukan!');
        window.location.href = 'dashboard.html';
        return;
    }

    loadProductInfo(productId);
    loadAllReviews(productId);
});

async function loadProductInfo(id) {
    try {
        const response = await fetch(`../api/user/get-product-detail.php?id=${id}`);
        const result = await response.json();
        
        if (result.success) {
            const product = result.data;
            const imgSrc = product.image ? (product.image.startsWith('http') ? product.image : `../assets/images/products/${product.image}`) : '../assets/images/no-image.png';
            
            const html = `
                <img src="${imgSrc}" alt="${product.name}">
                <div>
                    <h2>${product.name}</h2>
                    <p style="margin:0; font-weight:bold; color:#3533cd;">Rp ${Number(product.price).toLocaleString('id-ID')}</p>
                </div>
            `;
            document.getElementById('product-brief').innerHTML = html;
        }
    } catch (e) {
        console.error("Error loading product basic info", e);
    }
}

async function loadAllReviews(id) {
    const container = document.getElementById('reviews-list');
    
    try {
        const response = await fetch(`../api/user/get-product-reviews.php?id=${id}`);
        const result = await response.json();
        
        if (result.success && result.data.length > 0) {
            const reviews = result.data;
            
            // Calculate Average Stats
            const totalRating = reviews.reduce((acc, r) => acc + parseInt(r.rating), 0);
            const avg = (totalRating / reviews.length).toFixed(1);
            document.getElementById('avg-rating').textContent = avg;
            document.getElementById('total-reviews-count').textContent = `(${reviews.length} ulasan)`;

            // Render All Reviews
            container.innerHTML = reviews.map(review => createFullReviewCard(review)).join('');
        } else {
            container.innerHTML = `
                <div class="no-reviews" style="text-align:center; padding:50px;">
                    <img src="../assets/images/stars.png" style="width:100px; opacity:0.5; margin-bottom:15px;">
                    <p style="color:#888;">Belum ada ulasan untuk produk ini.</p>
                </div>
            `;
            document.getElementById('avg-rating').textContent = "0.0";
            document.getElementById('total-reviews-count').textContent = "(0)";
        }
    } catch (error) {
        console.error('Error loading reviews:', error);
        container.innerHTML = `<p style="color:red; text-align:center;">Gagal memuat ulasan.</p>`;
    }
}

function createFullReviewCard(review) {
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
