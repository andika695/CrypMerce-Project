document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('.form-login');

    if (!form) {
        console.error("Form registrasi tidak ditemukan");
        return;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('username')?.value.trim();
        const phone    = document.getElementById('phone')?.value.trim();
        const email    = document.getElementById('email')?.value.trim();
        const password = document.getElementById('password')?.value;
        const role     = document.getElementById('role')?.value;
        const agree    = document.getElementById('agree')?.checked;

        // Validasi dasar
        if (!username || !phone || !email || !password || !role) {
            alert("Semua field wajib diisi");
            return;
        }

        if (!agree) {
            alert("Anda harus menyetujui syarat & ketentuan");
            return;
        }

        try {
            const response = await fetch("../../../api/auth/registrasi.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ username, phone, email, password, role })
            });

            if (!response.ok) {
                throw new Error("HTTP Error " + response.status);
            }

            const result = await response.json();

            if (result.success) {
                alert(result.message || "Registrasi berhasil");
                window.location.href = "login.html";
            } else {
                alert(result.message || "Registrasi gagal");
            }

        } catch (err) {
            console.error("Registrasi Error:", err);
            alert("Terjadi kesalahan server");
        }
    });
});
