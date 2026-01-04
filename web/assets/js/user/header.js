/**
 * Global Header Logic for CrypMerce
 * Handles Hamburger Menu, Categories, and Search across all user pages.
 */

// Search History Management
const SEARCH_HISTORY_KEY = 'crypmerce_search_history';
const MAX_HISTORY_ITEMS = 8;

function getSearchHistory() {
    try {
        const history = localStorage.getItem(SEARCH_HISTORY_KEY);
        return history ? JSON.parse(history) : [];
    } catch (e) {
        return [];
    }
}

function saveSearchHistory(query) {
    if (!query || query.trim() === '') return;
    
    try {
        let history = getSearchHistory();
        // Remove if already exists
        history = history.filter(item => item.toLowerCase() !== query.toLowerCase());
        // Add to beginning
        history.unshift(query.trim());
        // Keep only last 8 items
        history = history.slice(0, MAX_HISTORY_ITEMS);
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
    } catch (e) {
        console.error('Error saving search history:', e);
    }
}

function clearSearchHistory() {
    try {
        localStorage.removeItem(SEARCH_HISTORY_KEY);
    } catch (e) {
        console.error('Error clearing search history:', e);
    }
}

function deleteHistoryItem(itemToDelete) {
    try {
        let history = getSearchHistory();
        history = history.filter(item => item.toLowerCase() !== itemToDelete.toLowerCase());
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
    } catch (e) {
        console.error('Error deleting history item:', e);
    }
}

function renderSearchHistory() {
    const dropdown = document.getElementById('searchHistoryDropdown');
    if (!dropdown) return;
    
    const history = getSearchHistory();
    
    if (history.length === 0) {
        dropdown.innerHTML = `
            <div class="search-history-header">
                <span class="search-history-title">Riwayat Pencarian</span>
            </div>
            <div class="search-history-empty">Belum ada riwayat pencarian</div>
        `;
        return;
    }
    
    dropdown.innerHTML = `
        <div class="search-history-header">
            <span class="search-history-title">Riwayat Pencarian</span>
            <button class="clear-history-btn" id="clearHistoryBtn">Hapus Semua</button>
        </div>
        <ul class="search-history-list">
            ${history.map(item => {
                const escapedItem = item.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;');
                return `
                <li class="search-history-item" data-query="${escapedItem}">
                    <i class="fas fa-clock search-history-icon"></i>
                    <span class="search-history-text">${item}</span>
                    <button class="search-history-delete" data-item="${escapedItem}">
                        <i class="fas fa-times"></i>
                    </button>
                </li>
            `;
            }).join('')}
        </ul>
    `;
    
    // Add event listeners
    dropdown.querySelectorAll('.search-history-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (!e.target.closest('.search-history-delete')) {
                const query = item.dataset.query;
                document.getElementById('searchInput').value = query;
                performSearch(query);
            }
        });
    });
    
    // Delete button handlers
    dropdown.querySelectorAll('.search-history-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const itemToDelete = btn.dataset.item;
            deleteHistoryItem(itemToDelete);
            renderSearchHistory();
        });
    });
    
    const clearBtn = document.getElementById('clearHistoryBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            clearSearchHistory();
            renderSearchHistory();
            hideSearchHistory();
        });
    }
}

function showSearchHistory() {
    const dropdown = document.getElementById('searchHistoryDropdown');
    if (dropdown) {
        dropdown.classList.add('show');
    }
}

function hideSearchHistory() {
    const dropdown = document.getElementById('searchHistoryDropdown');
    if (dropdown) {
        dropdown.classList.remove('show');
    }
}

function performSearch(query) {
    if (!query || query.trim() === '') return;
    
    saveSearchHistory(query);
    hideSearchHistory();
    
    // Redirect to search results page
    window.location.href = `search-results.html?q=${encodeURIComponent(query.trim())}`;
}

document.addEventListener('DOMContentLoaded', () => {
    const menuBtn = document.getElementById("menuBtn");
    const mobileKategori = document.getElementById("mobileKategori");
    const searchInput = document.getElementById("searchInput");
    const searchBtn = document.getElementById("searchBtn");
    const searchWrapper = document.querySelector(".search-wrapper");

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

    // Create search history dropdown if it doesn't exist
    if (searchWrapper && !document.getElementById('searchHistoryDropdown')) {
        const dropdown = document.createElement('div');
        dropdown.id = 'searchHistoryDropdown';
        dropdown.className = 'search-history-dropdown';
        searchWrapper.appendChild(dropdown);
        renderSearchHistory();
    }

    // 3. Search Logic
    function handleSearch() {
        const query = searchInput.value.trim();
        performSearch(query);
    }

    if (searchBtn && searchInput) {
        searchBtn.addEventListener("click", handleSearch);
        searchInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                handleSearch();
            }
        });
        
        // Show history on focus
        searchInput.addEventListener("focus", () => {
            renderSearchHistory();
            showSearchHistory();
        });
        
        // Hide history on blur (with delay to allow click events)
        searchInput.addEventListener("blur", () => {
            setTimeout(() => {
                hideSearchHistory();
            }, 200);
        });
        
        // Show history when typing
        searchInput.addEventListener("input", () => {
            if (searchInput.value.trim() === '') {
                renderSearchHistory();
                showSearchHistory();
            } else {
                hideSearchHistory();
            }
        });
    }
    
    // Hide history when clicking outside
    document.addEventListener('click', (e) => {
        if (searchWrapper && !searchWrapper.contains(e.target)) {
            hideSearchHistory();
        }
    });
});

// Expose functions globally
window.performSearch = performSearch;
window.deleteHistoryItem = deleteHistoryItem;
window.renderSearchHistory = renderSearchHistory;
window.clearSearchHistory = clearSearchHistory;
