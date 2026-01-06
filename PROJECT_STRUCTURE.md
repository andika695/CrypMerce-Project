# Struktur Folder dan File Project CrypMerce

Project ini adalah aplikasi e-commerce berbasis PHP (Native/Vanilla) dengan struktur sebagai berikut:

## 📂 Root Directory

- **`web/`**: Direktori utama aplikasi.
- **`.env`**: Konfigurasi environment (Database, API Keys).
- **`docker-compose.yml`**: Konfigurasi Docker.
- **`crypmerce_database.sql`**: Dump database utama.

## 📂 Web Directory (`/web`)

### 🔌 API (`/web/api`)

Backend endpoints dan logic.

- **`ai/`**: Integrasi AI Chatbot (`chat.php`).
- **`auth/`**: Autentikasi (`login.php`, `registrasi.php`, `logout.php`).
- **`config/`**: Konfigurasi (`config.php`, `cloudinary.php`, `midtrans-config.php`).
- **`seller/`**: API khusus Seller (`add-product.php`, `get-dashboard-data.php`, ...).
- **`user/`**: API khusus User (`get-products.php`, `add-to-cart.php`, `get-cart.php`, ...).
- **`services/`**: External services (`geocoding-service.php`).
- **`shipping/`**: Kalkulasi ongkir (`calculate-shipping.php`).

### 🎨 Assets (`/web/assets`)

Static files.

- **`css/`**: Stylesheets terpisah per modul (`auth`, `seller`, `user`).
- **`js/`**: Javascript logic terpisah per modul.
- **`Images/`**: Aset gambar (Logo, Banners, Payment Icons).

### 🏪 Seller Area (`/web/seller`)

Frontend untuk penjual.

- **`dashboard.php`**: Halaman utama dashboard seller.
- **`components/`**: Komponen reusable (`sidebar.php`, `modals.php`).
- **`views/`**: Halaman konten dinamis (`add-product.php`, `orders.php`, `profile.php`).

### 👤 User Area (`/web/user`)

Frontend untuk pembeli.

- **`dashboard.html`**: Homepage.
- **`shop.html`**: Halaman belanja.
- **`product-detail.html`**: Detail produk.
- **`cart.html`**: Keranjang belanja.
- **`components/`**: Komponen reusable (`sidebar.php`, `views.php`).

### 💳 Checkout (`/web/checkout`)

Modul pembayaran.

- **`PlaceOrder.php`**: Logic pemesanan utama.
- **`ConfirmCryptoPayment.php`**: Logic pembayaran crypto.
- **`midtrans-php-master/`**: Library Midtrans SDK.

### 💾 Database & Migrations (`/web/database`)

- Skrip migrasi dan setup database tambahan.

---

_Dibuat otomatis oleh Assistant pada 2026-01-06_
