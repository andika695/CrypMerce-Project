document.addEventListener("DOMContentLoaded", () => {
    fetch("../../api/user/get_products.php")
        .then(res => res.json())
        .then(data => renderProducts(data))
        .catch(err => console.error(err));
});

function renderProducts(products) {
    const grid = document.getElementById("productGrid");

    if (products.length === 0) {
        grid.innerHTML = "<p>Produk belum tersedia</p>";
        return;
    }

    grid.innerHTML = products.map(p => `
        <div class="product-card">
            <img src="../../assets/images/products/${p.image}" alt="${p.name}">
            <h3>${p.name}</h3>
            <p class="price">Rp ${Number(p.price).toLocaleString("id-ID")}</p>
        </div>
    `).join("");
}
