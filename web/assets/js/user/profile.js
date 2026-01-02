document.addEventListener('DOMContentLoaded', function() {
    
    /* ----------------------------------------------------
       0. GLOBAL VARIABLES
    ----------------------------------------------------- */
    const menuItems = document.querySelectorAll('.menu-item');
    const views = document.querySelectorAll('.view');
    const pageTitle = document.getElementById('pageTitle');
    
    // Mapping judul halaman
    const pageTitles = {
        'profile': 'Profil Saya',
        'pesanan': 'Pesanan Saya',
        'alamat': 'Alamat Pengiriman',
        'logout': 'Logout'
    };

    /* ----------------------------------------------------
       1. UPDATE PAGE TITLE FUNCTION
    ----------------------------------------------------- */
    function updatePageTitle(pageName) {
        if (pageTitle && pageTitles[pageName]) {
            pageTitle.textContent = pageTitles[pageName];
            
            // Juga update judul h1 di konten untuk konsistensi
            const activeView = document.querySelector('.view.active h1');
            if (activeView && activeView.textContent !== pageTitles[pageName]) {
                activeView.textContent = pageTitles[pageName];
            }
        }
    }

    
/* ----------------------------------------------------
   1.5. UPDATE VIEW TITLE FUNCTION (NEW)
----------------------------------------------------- */
function updateViewTitle(pageName) {
    const titles = {
        'profile': 'Profil Saya',
        'pesanan': 'Pesanan Saya',
        'alamat': 'Alamat Pengiriman'
    };
    
    if (titles[pageName]) {
        // Update h1 di dalam view
        const targetView = document.getElementById(`${pageName}-view`);
        if (targetView) {
            const h1Element = targetView.querySelector('h1');
            if (h1Element) {
                h1Element.textContent = titles[pageName];
            }
        }
    }
}

    /* ----------------------------------------------------
       2. SIDEBAR NAVIGATION LOGIC (DIMODIFIKASI)
    ----------------------------------------------------- */
menuItems.forEach(item => {
    item.addEventListener("click", function() {
        const page = item.getAttribute('data-page');

        // Handle Logout
        if (page === "logout") {
            openLogoutModal();
            // Update judul untuk logout modal
            updatePageTitle('logout');
            return;
        }

        // Update Active Sidebar Item
        menuItems.forEach(i => i.classList.remove("active"));
        this.classList.add("active");

        // Update Page Title di header mobile
        updatePageTitle(page);
        
        // Update judul di dalam view (h1)
        updateViewTitle(page);

        // Hide All Views
        views.forEach(view => {
            view.classList.remove("active");
            view.style.display = "none";
        });

        // Show Target View
        const targetView = document.getElementById(`${page}-view`);
        if (targetView) {
            targetView.style.display = "block";
            setTimeout(() => targetView.classList.add("active"), 10);
            
            // Special handling untuk map di halaman alamat
            if (page === 'alamat' && typeof initUserLocationView === 'function') {
                setTimeout(() => {
                    initUserLocationView((msg) => {
                        console.log('Map init from navigation:', msg);
                    });
                }, 300);
            }
        }

        // Close sidebar on mobile after clicking menu item
        if (window.innerWidth <= 768) {
            closeSidebar();
        }
    });
});

    /* ----------------------------------------------------
       3. EDIT PROFILE FORM LOGIC (AJAX) - TIDAK BERUBAH
    ----------------------------------------------------- */
    const editForm = document.getElementById("edit-profile-form");
    if (editForm) {
        editForm.addEventListener("submit", function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerText;
            
            // Loading State
            submitBtn.innerText = "Menyimpan...";
            submitBtn.disabled = true;

            fetch('../api/user/update-profile.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert("Berhasil: " + data.message);
                    closeEditProfileModal();
                    
                    // Update UI immediately
                    if (data.new_name) {
                        updateProfileName(data.new_name);
                    }
                    if (data.new_photo) {
                        updateProfilePhoto(data.new_photo);
                    }
                } else {
                    alert("Gagal: " + data.message);
                }
            })
            .catch(err => {
                console.error(err);
                alert("Terjadi kesalahan koneksi.");
            })
            .finally(() => {
                submitBtn.innerText = originalText;
                submitBtn.disabled = false;
            });
        });
    }

    /* ----------------------------------------------------
       4. SIDEBAR TOGGLE FUNCTIONS (UNTUK MOBILE)
    ----------------------------------------------------- */
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const sidebar = document.querySelector('.sidebar');
    const sidebarOverlay = document.querySelector('.sidebar-overlay');
    const closeSidebarBtn = document.querySelector('.close-sidebar-btn');

    // Function to close sidebar
    function closeSidebar() {
        if (sidebar) sidebar.classList.remove('active');
        if (hamburgerBtn) hamburgerBtn.classList.remove('active'); // Reset hamburger animation via class
        if (sidebarOverlay) sidebarOverlay.classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    // Function to open sidebar
    function openSidebar() {
        if (sidebar) sidebar.classList.add('active');
        if (hamburgerBtn) hamburgerBtn.classList.add('active'); // Trigger hamburger animation via class
        if (sidebarOverlay) sidebarOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    // Event listeners for sidebar toggle
    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', function(e) {
            e.stopPropagation(); // Mencegah event bubbling
            if (sidebar.classList.contains('active')) {
                closeSidebar();
            } else {
                openSidebar();
            }
        });
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeSidebar);
    }

    if (closeSidebarBtn) {
        closeSidebarBtn.addEventListener('click', closeSidebar);
    }

    /* ----------------------------------------------------
       5. INITIALIZE PAGE TITLE
    ----------------------------------------------------- */
    // Set initial page title based on active menu item
    const activeMenuItem = document.querySelector('.menu-item.active');
    if (activeMenuItem && activeMenuItem.dataset.page) {
        const activePage = activeMenuItem.dataset.page;
        if (pageTitles[activePage] && pageTitles[activePage] !== 'Logout') {
            updatePageTitle(activePage);
        }
    }

    /* ----------------------------------------------------
       6. RESPONSIVE BEHAVIOR
    ----------------------------------------------------- */
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            // Di desktop, pastikan sidebar terlihat normal
            closeSidebar();
        }
    });

}); // End of DOMContentLoaded

/* ----------------------------------------------------
   7. HELPER FUNCTIONS (Global Scope) - TIDAK BERUBAH
----------------------------------------------------- */

function openEditProfileModal(){
    const modal = document.getElementById("edit-profile-modal");
    if (modal) modal.classList.add("active");
}

function closeEditProfileModal(){
    const modal = document.getElementById("edit-profile-modal");
    if (modal) modal.classList.remove("active");
}

function openLogoutModal(){
    const modal = document.getElementById("logout-modal");
    if (modal) modal.classList.add("active");
}

function closeLogoutModal(){
    const modal = document.getElementById("logout-modal");
    if (modal) modal.classList.remove("active");
}

function updateProfileName(newName) {
    const sidebarName = document.getElementById('sidebar-user-name');
    const viewName = document.getElementById('user-name');
    if (sidebarName) sidebarName.textContent = newName;
    if (viewName) viewName.textContent = newName;
}

function updateProfilePhoto(photo) {
    // Detect if the photo is a full URL (Cloudinary) or just a filename
    const isUrl = photo.startsWith('http');
    const fullPath = isUrl ? photo : '../assets/images/user/' + photo;
    
    // Add timestamp to bypass cache if it's not a Cloudinary URL
    const finalSrc = isUrl ? photo : fullPath + '?t=' + new Date().getTime();
    
    const sidebarImg = document.getElementById('sidebar-img');
    const viewImg = document.getElementById('profile-view-img');
    
    if (sidebarImg) sidebarImg.src = finalSrc;
    if (viewImg) viewImg.src = finalSrc;
}

// Close Modal when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('active');
    }
}