document.addEventListener('DOMContentLoaded', () => {
    const productGrid = document.getElementById('productGrid');
    
    // Tampilkan loading
    productGrid.innerHTML = '<p style="text-align: center; padding: 40px; color: #666;">Memuat produk...</p>';

    fetch('../api/user/get-products.php')
        .then(res => {
            if (!res.ok) {
                throw new Error('Network response was not ok');
            }
            return res.json();
        })
        .then(data => {
            productGrid.innerHTML = '';

            // Cek apakah response berhasil
            if (!data.success) {
                productGrid.innerHTML = '<p style="text-align: center; padding: 40px; color: #e74c3c;">Gagal memuat produk</p>';
                return;
            }

            const products = data.data;

            if (!products || products.length === 0) {
                productGrid.innerHTML = '<p style="text-align: center; padding: 40px; color: #666;">Belum ada produk tersedia.</p>';
                return;
            }

            products.forEach(p => {
                const productCard = document.createElement('a'); // Change to <a>
                productCard.className = 'product-card';
                productCard.href = `product-detail.html?id=${p.id}`; // Add Link
                productCard.style.textDecoration = 'none'; // Remove underline
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
        })
        .catch(err => {
            console.error('Error:', err);
            productGrid.innerHTML = '<p style="text-align: center; padding: 40px; color: #e74c3c;">Gagal memuat produk. Silakan refresh halaman.</p>';
        });
});
