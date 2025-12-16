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

    // === CONTOH AKSI LANJUTAN ===
    // 1. Redirect
    // window.location.href = `produk.html?kategori=${value}`;

    // 2. Filter produk (nanti)
    // filterProduk(value);
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