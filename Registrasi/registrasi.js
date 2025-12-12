document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('.form-login');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value;
        const phone    = document.getElementById('phone').value;
        const email    = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const role     = document.getElementById('role').value;
        const agree    = document.getElementById('agree').checked;

        try {
            const response = await fetch('/api/register.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, phone, email, password, role, agree })
            });

            const result = await response.json();

            if (result.success) {
                alert(result.message);
                window.location.href = 'login.html';
            } else {
                alert('Registrasi gagal: ' + result.message);
            }
        } catch (err) {
            alert('Terjadi kesalahan koneksi.');
        }
    });
});
