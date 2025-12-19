// Seller Login Form Handler
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-seller-form');
    const submitBtn = document.getElementById('submit-btn');
    const messageDiv = document.getElementById('message');
    
    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Clear previous messages
        clearErrors();
        messageDiv.style.display = 'none';
        
        // Get form data
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const nameToko = document.getElementById('nameToko').value.trim();
        
        // Validate
        let hasError = false;
        
        if (!username) {
            showError('username', 'Username wajib diisi');
            hasError = true;
        }
        
        if (!password) {
            showError('password', 'Password wajib diisi');
            hasError = true;
        }
        
        if (!nameToko) {
            showError('nameToko', 'Nama toko wajib diisi');
            hasError = true;
        }
        
        if (hasError) return;
        
        // Disable button and show loading
        submitBtn.disabled = true;
        submitBtn.textContent = '⏳ Masuk...';
        
        try {
            const response = await fetch('../../api/seller/login-seller.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: username,
                    password: password,
                    storeName: nameToko
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                showMessage(result.message, 'success');
                
                // Store seller data in sessionStorage
                sessionStorage.setItem('seller_data', JSON.stringify(result.data));
                
                // Redirect to dashboard
                setTimeout(() => {
                    window.location.href = '../../seller/dashboard.html';
                }, 1000);
            } else {
                showMessage(result.message, 'error');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Masuk';
            }
            
        } catch (error) {
            console.error('Error:', error);
            showMessage('Terjadi kesalahan. Silakan coba lagi.', 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Masuk';
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
