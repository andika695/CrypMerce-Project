document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('.form-login');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('/api/login.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const result = await response.json();

            if (result.success) {
                alert(result.message);

                if (result.role === "admin") {
                    window.location.href = "/dashboard-admin/dashboard.html";
                } else {
                    window.location.href = "/dashboard-user/dashboard.html";
                }
            } else {
                alert("Login gagal: " + result.message);
            }
        } catch (err) {
            alert("Terjadi kesalahan koneksi.");
        }
    });
});
