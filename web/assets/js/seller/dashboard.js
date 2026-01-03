// ===== NAVIGATION SYSTEM =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('Dashboard JS loaded');
    
    const menuItems = document.querySelectorAll('.menu-item');
    const views = document.querySelectorAll('.view');
    const mobilePageTitle = document.getElementById('mobile-page-title');
    
    // Page Title Mapping
    const pageTitles = {
        'dashboard': 'Dashboard',
        'profile': 'Profil Seller',
        'add-product': 'Tambah Produk',
        'my-store': 'Toko Saya',
        'orders': 'Pesanan Masuk',
        'location-settings': 'Lokasi Toko',
        'logout': 'Logout'
    };

    function updateMobileTitle(page) {
        if (mobilePageTitle && pageTitles[page]) {
            mobilePageTitle.textContent = pageTitles[page];
        } else if (mobilePageTitle) {
            mobilePageTitle.textContent = 'Dashboard';
        }
    }
    
    // Initialize title on load
    const initialActive = document.querySelector('.menu-item.active');
    if (initialActive) {
        updateMobileTitle(initialActive.dataset.page);
    }
    
    console.log('Found menu items:', menuItems.length);
    console.log('Found views:', views.length);

    // Handle menu navigation
    menuItems.forEach((item, index) => {
        console.log(`Menu item ${index}:`, item.dataset.page);
        
        item.addEventListener('click', () => {
            const page = item.dataset.page;
            console.log('Clicked menu:', page);
            
            if (page === 'logout') {
                const modal = document.getElementById('logout-modal');
                if (modal) modal.style.display = 'block';
                return;
            }

            // Update active menu
            menuItems.forEach(mi => mi.classList.remove('active'));
            item.classList.add('active');

            // Update Mobile Header Title
            updateMobileTitle(page);

            // Show corresponding view
            views.forEach(view => {
                view.classList.remove('active');
                console.log('Hiding view:', view.id);
            });
            
            const targetView = document.getElementById(`${page}-view`);
            console.log('Target view:', targetView);
            
            if (targetView) {
                targetView.classList.add('active');
                console.log('Showing view:', targetView.id);
                
                // Load dashboard data when dashboard view is shown
                if (page === 'dashboard' && typeof loadDashboardData === 'function') {
                    loadDashboardData();
                }

                if (page === 'my-store' && typeof loadMyStoreData === 'function') {
                    loadMyStoreData();
                }
            } else {
                console.error('View not found:', `${page}-view`);
            }
        });
    });

    // Initial load dashboard data and profile on page load
    if (typeof loadDashboardData === 'function') {
        console.log('Loading initial dashboard data...');
        loadDashboardData();
    }
    
    if (typeof loadSellerProfile === 'function') {
        console.log('Loading seller profile...');
        loadSellerProfile();
    }
    
    if (typeof setupEditProfile === 'function') {
        setupEditProfile();
    }

    // ===== FORM VALIDATION =====
    const form = document.getElementById('add-product-form');
    
    if (!form) {
        console.error('Form not found!');
        return;
    }
    
    const submitBtn = document.getElementById('submit-btn');
    const requiredFields = form.querySelectorAll('[required]');
    
    // Multi-image upload elements
    const uploadArea = document.getElementById('upload-area');
    const imageInput = document.getElementById('product-images');
    const previewGrid = document.getElementById('image-preview-grid');
    const imageCounter = document.getElementById('image-count');
    
    // Store selected files
    let selectedFiles = [];
    const MAX_IMAGES = 5;

    console.log('Form elements found:', {
        form: !!form,
        submitBtn: !!submitBtn,
        requiredFields: requiredFields.length,
        uploadArea: !!uploadArea,
        imageInput: !!imageInput
    });

    // Check form validity
    function checkFormValidity() {
        let isValid = true;
        
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                isValid = false;
            }
        });

        submitBtn.disabled = !isValid;
        console.log('Form valid:', isValid);
    }

    // Add event listeners to all required fields
    requiredFields.forEach(field => {
        field.addEventListener('input', checkFormValidity);
        field.addEventListener('change', checkFormValidity);
    });

    // Initial check
    checkFormValidity();

    // ===== MULTI-IMAGE UPLOAD =====
    if (uploadArea && imageInput) {
        // Click to upload
        uploadArea.addEventListener('click', () => {
            imageInput.click();
        });

        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('drag-over');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('drag-over');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');
            handleFiles(e.dataTransfer.files);
        });

        // File input change
        imageInput.addEventListener('change', (e) => {
            handleFiles(e.target.files);
        });
    }

    function handleFiles(files) {
        const newFiles = Array.from(files);
        
        // Validate total count
        if (selectedFiles.length + newFiles.length > MAX_IMAGES) {
            alert(`Maksimal ${MAX_IMAGES} foto. Anda sudah memilih ${selectedFiles.length} foto.`);
            return;
        }

        newFiles.forEach(file => {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                alert(`File "${file.name}" bukan gambar.`);
                return;
            }

            // Validate file size (2MB)
            if (file.size > 2 * 1024 * 1024) {
                alert(`File "${file.name}" terlalu besar. Maksimal 2MB.`);
                return;
            }

            selectedFiles.push(file);
        });

        updateImagePreviews();
        updateImageInput();
    }

    function updateImagePreviews() {
        if (!previewGrid) return;
        
        previewGrid.innerHTML = '';
        
        selectedFiles.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const item = document.createElement('div');
                item.className = 'image-preview-item' + (index === 0 ? ' primary' : '');
                item.innerHTML = `
                    <img src="${e.target.result}" alt="Preview ${index + 1}">
                    ${index === 0 ? '<span class="primary-badge">Utama</span>' : ''}
                    <button type="button" class="remove-btn" data-index="${index}">&times;</button>
                `;
                previewGrid.appendChild(item);

                // Add remove handler
                item.querySelector('.remove-btn').addEventListener('click', (e) => {
                    e.stopPropagation();
                    removeImage(index);
                });
            };
            reader.readAsDataURL(file);
        });

        if (imageCounter) {
            imageCounter.textContent = selectedFiles.length;
        }
    }

    function removeImage(index) {
        selectedFiles.splice(index, 1);
        updateImagePreviews();
        updateImageInput();
    }

    function updateImageInput() {
        // Create new DataTransfer and add files
        const dt = new DataTransfer();
        selectedFiles.forEach(file => dt.items.add(file));
        imageInput.files = dt.files;
    }

    // ===== FORM SUBMISSION =====
    // Create message div if not exists
    let messageDiv = document.getElementById('message');
    if (!messageDiv) {
        messageDiv = document.createElement('div');
        messageDiv.id = 'message';
        form.appendChild(messageDiv);
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        console.log('Form submitted');
        
        // Disable button dan tampilkan loading
        submitBtn.disabled = true;
        submitBtn.textContent = '⏳ Menyimpan...';
        messageDiv.style.display = 'none';

        try {
            const formData = new FormData(form);
            
            const response = await fetch('../api/seller/add-product.php', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            console.log('Response:', result);

            if (result.success) {
                // Tampilkan pesan sukses
                messageDiv.style.display = 'block';
                messageDiv.className = 'success';
                messageDiv.textContent = '✅ ' + result.message;

                // Reset form
                form.reset();
                // Reset multi-image state
                selectedFiles = [];
                if (previewGrid) previewGrid.innerHTML = '';
                if (imageCounter) imageCounter.textContent = '0';
                checkFormValidity();

                // Redirect ke dashboard setelah 2 detik
                setTimeout(() => {
                    // Switch to dashboard view
                    menuItems.forEach(mi => mi.classList.remove('active'));
                    menuItems[0].classList.add('active');
                    views.forEach(view => view.classList.remove('active'));
                    document.getElementById('dashboard-view').classList.add('active');
                    
                    messageDiv.style.display = 'none';
                    submitBtn.textContent = 'Simpan Produk';
                }, 2000);
            } else {
                // Tampilkan pesan error
                messageDiv.style.display = 'block';
                messageDiv.className = 'error';
                messageDiv.textContent = '❌ ' + (result.message || 'Gagal menambahkan produk');
                
                // Enable button kembali
                submitBtn.disabled = false;
                submitBtn.textContent = 'Simpan Produk';
            }

        } catch (error) {
            console.error('Error:', error);
            messageDiv.style.display = 'block';
            messageDiv.className = 'error';
            messageDiv.textContent = '❌ Terjadi kesalahan. Silakan coba lagi.';
            
            submitBtn.disabled = false;
            submitBtn.textContent = 'Simpan Produk';
        }
    });
});

// ===== MOBILE SIDEBAR TOGGLE - FIXED VERSION =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded - initializing sidebar');
    
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const sidebar = document.querySelector('.sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const sidebarClose = document.getElementById('sidebarClose');
    const menuItems = document.querySelectorAll('.menu-item');
    const content = document.querySelector('.content');

    // Toggle sidebar dengan hamburger button
    if (hamburgerBtn && sidebar) {
        hamburgerBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const isOpening = !sidebar.classList.contains('active');
            
            if (isOpening) {
                // Buka sidebar
                sidebar.classList.add('active');
                hamburgerBtn.classList.add('active');
                if (sidebarOverlay) sidebarOverlay.classList.add('active');
                if (content) content.style.pointerEvents = 'none';
                
                document.body.style.overflow = 'hidden';
                document.body.classList.add('sidebar-open');
            } else {
                // Tutup sidebar
                closeSidebar();
            }
        });
    }

    // Tutup sidebar dengan tombol close
    if (sidebarClose) {
        sidebarClose.addEventListener('click', function(e) {
            e.preventDefault();
            closeSidebar();
        });
    }

    // Tutup sidebar saat klik overlay (hanya area di luar sidebar)
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', function(e) {
            e.preventDefault();
            // Pastikan klik tidak pada sidebar
            if (!sidebar.contains(e.target) && e.target !== sidebar) {
                closeSidebar();
            }
        });
    }

    // Tutup sidebar saat menu item diklik (mobile only)
    menuItems.forEach(item => {
        item.addEventListener('click', function(e) {
            if (window.innerWidth <= 768) {
                // Tunggu sebentar untuk animasi sebelum redirect
                setTimeout(() => {
                    closeSidebar();
                }, 300);
            }
        });
    });

    // Fungsi untuk menutup sidebar
    function closeSidebar() {
        if (sidebar) sidebar.classList.remove('active');
        if (hamburgerBtn) hamburgerBtn.classList.remove('active');
        if (sidebarOverlay) sidebarOverlay.classList.remove('active');
        if (content) content.style.pointerEvents = 'auto';
        
        document.body.style.overflow = '';
        document.body.classList.remove('sidebar-open');
    }

    // Tutup sidebar saat resize ke desktop
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            closeSidebar();
        }
    });

    // Tutup sidebar dengan Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && sidebar && sidebar.classList.contains('active')) {
            closeSidebar();
        }
    });

    // Debug info
    console.log('Sidebar initialized successfully');
});