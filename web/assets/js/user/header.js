/**
 * Global Header Logic for CrypMerce
 * Handles Hamburger Menu, Categories, and Search across all user pages.
 */

document.addEventListener('DOMContentLoaded', () => {
    const menuBtn = document.getElementById("menuBtn");
    const mobileKategori = document.getElementById("mobileKategori");
    const searchInput = document.getElementById("searchInput");
    const searchBtn = document.getElementById("searchBtn");

    // 1. Toggle Hamburger Menu
    if (menuBtn && mobileKategori) {
        menuBtn.addEventListener("click", () => {
            mobileKategori.classList.toggle("active");
        });

        // Close when clicking outside
        document.addEventListener("click", (e) => {
            if (!mobileKategori.contains(e.target) && !menuBtn.contains(e.target)) {
                mobileKategori.classList.remove("active");
            }
        });
    }

    // 2. Category Selection Logic
    function handleCategorySelection(value) {
        if (!value) return;

        // Try local filter first (Dashboard or Shop)
        if (typeof window.loadProductsByCategory === 'function') {
            window.loadProductsByCategory(value);
            if (mobileKategori) mobileKategori.classList.remove("active");
        } else {
            // Redirect to dashboard with query param
            // Use absolute-style path to be safe
            window.location.href = `dashboard.html?category=${encodeURIComponent(value)}`;
        }
    }

    // Category Dropdown (Desktop)
    document.querySelectorAll(".kategori-dropdown li").forEach(item => {
        item.addEventListener("click", () => handleCategorySelection(item.dataset.value));
    });

    // Category List (Mobile Sidebar)
    document.querySelectorAll(".kategori-list li").forEach(item => {
        item.addEventListener("click", () => handleCategorySelection(item.dataset.value));
    });

    // 3. Search Logic
    function handleSearch() {
        const query = searchInput.value.trim();
        
        if (typeof window.performSearch === 'function') {
             window.performSearch(query);
        } else {
            window.location.href = `dashboard.html?search=${encodeURIComponent(query)}`;
        }
    }

    if (searchBtn && searchInput) {
        searchBtn.addEventListener("click", handleSearch);
        searchInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                handleSearch();
            }
        });
    }
});
