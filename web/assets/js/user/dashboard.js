// ================= DASHBOARD SPECIFIC LOGIC =================

document.addEventListener('DOMContentLoaded', () => {
    // Check for URL parameters (from header.js redirects)
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category');
    const search = urlParams.get('search');

    if (category || search) {
        setTimeout(() => {
            if (window.loadProducts) {
                window.loadProducts(category, search);
                
                // Update title if needed
                const sectionTitle = document.querySelector('.product-section .section-title');
                if (sectionTitle) {
                    if (category) {
                        const prettyName = category.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                        sectionTitle.textContent = `Produk: ${prettyName}`;
                    } else if (search) {
                        sectionTitle.textContent = `Hasil Pencarian: "${search}"`;
                    }
                }
            }
        }, 300); // Give a small delay for products.js to initialize
    }
});

window.performSearch = function(query) {
    if (window.loadProducts) {
        window.loadProducts(null, query);
    }
};

// Pilih Kategori remains for compatibility if needed elsewhere, 
// but header.js handles the primary header interactions now.
window.loadProductsByCategory = function(value) {
    if (!value) return;
    if (window.loadProducts) {
        window.loadProducts(value);
        const sectionTitle = document.querySelector('.product-section .section-title');
        if (sectionTitle) {
            const prettyName = value.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
            sectionTitle.textContent = `Produk: ${prettyName}`;
        }
        
        // Scroll to products
        const section = document.querySelector('.product-section');
        if (section) section.scrollIntoView({ behavior: 'smooth' });
    }
}

function pilihKategori(value) {
    window.loadProductsByCategory(value);
}
