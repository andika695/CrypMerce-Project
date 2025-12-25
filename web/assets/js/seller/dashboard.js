// ===== NAVIGATION SYSTEM =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('Dashboard JS loaded');
    
    const menuItems = document.querySelectorAll('.menu-item');
    const views = document.querySelectorAll('.view');
    
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
    const imageInput = document.getElementById('image');
    const imagePreview = document.getElementById('image-preview');

    console.log('Form elements found:', {
        form: !!form,
        submitBtn: !!submitBtn,
        requiredFields: requiredFields.length,
        imageInput: !!imageInput,
        imagePreview: !!imagePreview
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

    // ===== IMAGE PREVIEW =====
    if (imageInput) {
        imageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            
            if (file) {
                // Validasi ukuran file (5MB)
                if (file.size > 5 * 1024 * 1024) {
                    alert('Ukuran gambar maksimal 5MB');
                    imageInput.value = '';
                    imagePreview.classList.remove('show');
                    return;
                }

                // Validasi tipe file
                const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
                if (!allowedTypes.includes(file.type)) {
                    alert('Format gambar tidak didukung. Gunakan JPG, PNG, atau GIF');
                    imageInput.value = '';
                    imagePreview.classList.remove('show');
                    return;
                }

                // Show preview
                const reader = new FileReader();
                reader.onload = (e) => {
                    imagePreview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
                    imagePreview.classList.add('show');
                };
                reader.readAsDataURL(file);
            } else {
                imagePreview.classList.remove('show');
            }
        });
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
                imagePreview.classList.remove('show');
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
