# 🛒 CrypMerce Project

**CrypMerce** adalah aplikasi **e-commerce berbasis web** yang dikembangkan sebagai proyek pembelajaran dan pengembangan sistem transaksi online. Project ini mendukung fitur **manajemen produk, pesanan, profil pengguna**, serta **integrasi payment gateway Midtrans**.

Repository ini bersifat **public** dan terbuka untuk dipelajari, diuji, serta dikembangkan lebih lanjut.

---

## ✨ Fitur Utama

* 🔐 **Autentikasi User**

  * Login & registrasi
  * Profil pengguna

* 🛍️ **E-Commerce Core**

  * Manajemen produk
  * Halaman seller & pesanan
  * Detail transaksi

* 💳 **Integrasi Payment Gateway**

  * Midtrans Payment V1
  * Mendukung sandbox environment

* 🐳 **Docker Ready**

  * Menggunakan `docker-compose`
  * Mudah dijalankan di environment lokal maupun server

* ☁️ **Cloudinary**

  * Upload & manajemen gambar produk

---

## 🧱 Teknologi yang Digunakan

* **Backend**: PHP
* **Frontend**: HTML, CSS, JavaScript
* **Database**: MySQL
* **Payment Gateway**: Midtrans
* **Containerization**: Docker & Docker Compose
* **Image Storage**: Cloudinary

---

## 📂 Struktur Project (Ringkas)

```
CrypMerce-Project
│── web/                # Source code aplikasi
│── docker-compose.yml  # Konfigurasi Docker
│── Dockerfile          # Docker image setup
│── .env.example        # Contoh environment variable
│── README.md           # Dokumentasi project
```

---

## ⚙️ Cara Menjalankan Project

### 1️⃣ Clone Repository

```bash
git clone https://github.com/username/CrypMerce-Project.git
cd CrypMerce-Project
```

### 2️⃣ Konfigurasi Environment

Salin file `.env.example` menjadi `.env` lalu sesuaikan isinya:

```bash
cp .env.example .env
```

Pastikan mengisi:

* Database credentials
* **MIDTRANS_SERVER_KEY**
* **MIDTRANS_CLIENT_KEY**
* Cloudinary config (jika digunakan)

---

### 3️⃣ Jalankan dengan Docker

```bash
docker-compose up -d
```

Akses aplikasi melalui browser:

```
http://localhost:PORT
```

(Sesuaikan dengan port di `docker-compose.yml`)

---

## 💳 Catatan Penting (Midtrans)

Bagi teman-teman yang ingin mencoba **fitur payment**, **WAJIB**:

* Mendaftar akun **Midtrans**
* Menggunakan **Sandbox Mode**
* Mengisi `Server Key` & `Client Key` pada file `.env`

📌 Tanpa konfigurasi Midtrans, fitur pembayaran tidak akan berjalan.

---

## 🚀 Status Project

* ✔️ Core e-commerce: **Selesai**
* ✔️ Integrasi payment V1
* 🔄 Pengembangan lanjutan & optimasi

---

## 🤝 Kontribusi

Kontribusi sangat terbuka!

* Fork repository
* Buat branch baru
* Pull request dengan penjelasan yang jelas

---

## 📄 Lisensi

Project ini dibuat untuk **pembelajaran dan pengembangan**.
Silakan digunakan dan dimodifikasi sesuai kebutuhan.
