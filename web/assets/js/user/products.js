async function loadProducts(category = null, search = null) {
    console.log("DEBUG: Memuat produk untuk kategori ->", category || "Semua", "| Search:", search || "Tidak ada");
    const productGrid = document.getElementById('productGrid');
    
    // Tampilkan loading
    productGrid.innerHTML = '<p style="text-align: center; padding: 40px; color: #666;">Memuat produk...</p>';

    try {
        let url = '../api/user/get-products.php';
        const params = [];
        
        if (category) {
            params.push(`category=${encodeURIComponent(category)}`);
        }
        
        if (search) {
            params.push(`search=${encodeURIComponent(search)}`);
        }
        
        if (params.length > 0) {
            url += '?' + params.join('&');
        }

        const res = await fetch(url);
        if (!res.ok) throw new Error('Network response was not ok');
        
        const data = await res.json();
        productGrid.innerHTML = '';

        if (!data.success) {
            productGrid.innerHTML = '<p style="text-align: center; padding: 40px; color: #e74c3c;">Gagal memuat produk</p>';
            return;
        }

        const products = data.data;

        if (!products || products.length === 0) {
            productGrid.innerHTML = '<p style="text-align: center; padding: 40px; color: #666;">Belum ada produk tersedia untuk kategori ini.</p>';
            return;
        }

        products.forEach(p => {
            const productCard = document.createElement('a');
            productCard.className = 'product-card';
            productCard.href = `product-detail.html?id=${p.id}`;
            productCard.style.textDecoration = 'none';
            productCard.style.color = 'inherit';

            productCard.innerHTML = `
                <div class="image-wrapper">
                    <img src="${p.image}" alt="${p.name}" onerror="this.src='../assets/images/no-image.png'">
                </div>
                <div class="product-info">
                    <h3>${p.name}</h3>
                    <p class="price">
                        Rp ${Number(p.price).toLocaleString('id-ID')}
                    </p>
                    <div class="product-stats">
                         <span>Stok: ${p.stock}</span>
                         <span>•</span>
                         <span>Terjual 0</span>
                    </div>
                </div>
            `;
            
            productGrid.appendChild(productCard);
        });
    } catch (err) {
        console.error('Error:', err);
        productGrid.innerHTML = '<p style="text-align: center; padding: 40px; color: #e74c3c;">Gagal memuat produk. Silakan refresh halaman.</p>';
    }
}

// Expose to window so dashboard.js can call it
window.loadProducts = loadProducts;

document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
});
