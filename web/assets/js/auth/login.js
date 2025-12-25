document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('.form-login');

    if (!form) {
        console.error("Form login tidak ditemukan");
        return;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('username')?.value.trim();
        const password = document.getElementById('password')?.value.trim();

        if (!username || !password) {
            alert("Username dan password wajib diisi");
            return;
        }

        try {
            const response = await fetch("../../../api/auth/login.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ username, password })
            });

            // ⛔ Cegah error kalau PHP error / bukan JSON
            if (!response.ok) {
                throw new Error("HTTP error " + response.status);
            }

            const data = await response.json();

            if (data.success) {
                // Redirect berdasarkan role
                if (data.role === "seller") {
                    window.location.href = "../../seller/dashboard.php";
                } else {
                    window.location.href = "../../user/dashboard.html";
                }
            } else {
                alert(data.message || "Login gagal");
            }

        } catch (error) {
            console.error("Login Error:", error);
            alert("Terjadi kesalahan. Silakan coba lagi.");
        }
    });
});
