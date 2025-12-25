// Seller Registration Form Handler
document.addEventListener('DOMContentLoaded', () => {
    // 1. Cek apakah ada data dari halaman registrasi sebelumnya
    const tempUserDataStr = sessionStorage.getItem('temp_register_data');
    
    if (!tempUserDataStr) {
        alert("Silakan melakukan registrasi awal terlebih dahulu");
        window.location.href = "registrasi.html";
        return;
    }

    const tempUserData = JSON.parse(tempUserDataStr);
    console.log("Loaded user data:", tempUserData);

    const form = document.getElementById('register-seller-form');
    const submitBtn = document.getElementById('submit-btn');
    const messageDiv = document.getElementById('message');
    const imageInput = document.getElementById('profile-avatar');
    const imagePreview = document.getElementById('image-preview');
    
    // Image preview
    imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        
        if (file) {
            // Validate file size (5MB)
            if (file.size > 5 * 1024 * 1024) {
                showMessage('Ukuran foto maksimal 5MB', 'error');
                imageInput.value = '';
                imagePreview.innerHTML = '';
                imagePreview.classList.remove('show');
                return;
            }
            
            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
            if (!allowedTypes.includes(file.type)) {
                showMessage('Format foto tidak didukung. Gunakan JPG, PNG, atau GIF', 'error');
                imageInput.value = '';
                imagePreview.innerHTML = '';
                imagePreview.classList.remove('show');
                return;
            }
            
            // Show preview
            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreview.innerHTML = `
                    <img src="${e.target.result}" alt="Preview">
                    <button type="button" class="remove-image" onclick="removeImage()">✕</button>
                `;
                imagePreview.classList.add('show');
            };
            reader.readAsDataURL(file);
        } else {
            imagePreview.innerHTML = '';
            imagePreview.classList.remove('show');
        }
    });
    
    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Clear previous messages
        clearErrors();
        messageDiv.style.display = 'none';
        
        // Get form data
        const nameToko = document.getElementById('nameToko').value.trim();
        
        // Validate
        let hasError = false;
        
        if (!nameToko) {
            showError('nameToko', 'Nama toko wajib diisi');
            hasError = true;
        }
        
        if (hasError) return;
        
        // Disable button and show loading
        submitBtn.disabled = true;
        submitBtn.textContent = '⏳ Mendaftar...';
        
        try {
            const formData = new FormData(form);
            
            // Tambahkan data dari session ke FormData
            formData.append('username', tempUserData.username);
            formData.append('password', tempUserData.password);
            formData.append('email', tempUserData.email);
            formData.append('phone', tempUserData.phone);
            // Default agree karena sudah di tahap sebelumnya (atau tambahkan input hidden jika perlu validasi ulang)
            formData.append('agree', 'on'); 

            const response = await fetch('../../api/seller/register-seller.php', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                showMessage(result.message, 'success');
                
                // Hapus data session
                sessionStorage.removeItem('temp_register_data');

                // Redirect to seller login after 2 seconds
                setTimeout(() => {
                    window.location.href = 'loginSeller.html';
                }, 2000);
            } else {
                showMessage(result.message, 'error');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Selesaikan Pendaftaran';
            }
            
        } catch (error) {
            console.error('Error:', error);
            showMessage('Terjadi kesalahan. Silakan coba lagi.', 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Selesaikan Pendaftaran';
        }
    });
});

function showError(fieldId, message) {
    const errorSpan = document.getElementById(`${fieldId}-error`);
    const input = document.getElementById(fieldId);
    
    if (errorSpan) {
        errorSpan.textContent = message;
        errorSpan.style.display = 'block';
    }
    
    if (input) {
        input.classList.add('error');
    }
}

function clearErrors() {
    const errorMessages = document.querySelectorAll('.error-message');
    errorMessages.forEach(msg => {
        msg.textContent = '';
        msg.style.display = 'none';
    });
    
    const inputs = document.querySelectorAll('.error');
    inputs.forEach(input => input.classList.remove('error'));
}

function showMessage(message, type) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = message;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = 'block';
}

function removeImage() {
    const imageInput = document.getElementById('profile-avatar');
    const imagePreview = document.getElementById('image-preview');
    
    imageInput.value = '';
    imagePreview.innerHTML = '';
    imagePreview.classList.remove('show');
}
