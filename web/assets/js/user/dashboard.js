// ================= TOGGLE HAMBURGER =================
const menuBtn = document.getElementById("menuBtn");
const mobileKategori = document.getElementById("mobileKategori");

menuBtn.addEventListener("click", () => {
    mobileKategori.classList.toggle("active");
});

// ================= FUNGSI UTAMA =================
function pilihKategori(value) {
    if (!value) return;

    console.log("Kategori dipilih:", value);

    // Tutup menu mobile
    mobileKategori.classList.remove("active");

    // Filter produk menggunakan fungsi global dari products.js
    if (window.loadProducts) {
        window.loadProducts(value);
        
        // Update judul section
        const sectionTitle = document.querySelector('.product-section .section-title');
        if (sectionTitle) {
            const prettyName = value.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
            sectionTitle.textContent = `Produk: ${prettyName}`;
        }
        
        // Scroll ke grid produk agar user tahu sudah berubah
        document.querySelector('.product-section').scrollIntoView({ behavior: 'smooth' });
    }
}

document.querySelectorAll(".kategori-dropdown li").forEach(item => {
    item.addEventListener("click", () => {
        pilihKategori(item.dataset.value);
    });
});

document.querySelectorAll(".kategori-list li").forEach(item => {
    item.addEventListener("click", () => {
        pilihKategori(item.dataset.value);
    });
});

document.addEventListener("click", (e) => {
    if (
        !mobileKategori.contains(e.target) &&
        !menuBtn.contains(e.target)
    ) {
        mobileKategori.classList.remove("active");
    }
});

// ================= SEARCH FUNCTIONALITY =================
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");

function performSearch() {
    const searchQuery = searchInput.value.trim();
    
    console.log("Pencarian:", searchQuery || "Semua produk");
    
    // Load produk dengan query pencarian
    if (window.loadProducts) {
        window.loadProducts(null, searchQuery);
        
        // Update judul section
        const sectionTitle = document.querySelector('.product-section .section-title');
        if (sectionTitle) {
            if (searchQuery) {
                sectionTitle.textContent = `Hasil Pencarian: "${searchQuery}"`;
            } else {
                sectionTitle.textContent = 'Produk Terbaru';
            }
        }
        
        // Scroll ke grid produk
        document.querySelector('.product-section').scrollIntoView({ behavior: 'smooth' });
    }
}

// Event listener untuk tombol search
searchBtn.addEventListener("click", performSearch);

// Event listener untuk Enter key di input search
searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        e.preventDefault();
        performSearch();
    }
});