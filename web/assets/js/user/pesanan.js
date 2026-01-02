document.addEventListener("DOMContentLoaded", () => {
  // Cek apakah kita berada di tab pesanan (jika di-refresh langsung ke tab pesanan)
  const activeTab = document.querySelector(".menu-item.active");
  if (activeTab && activeTab.dataset.page === "pesanan") {
    loadMyOrders();
  }

  // Tambahkan event listener khusus untuk menu pesanan
  const pesananMenu = document.querySelector('.menu-item[data-page="pesanan"]');
  if (pesananMenu) {
    pesananMenu.addEventListener("click", () => {
      loadMyOrders();
    });
  }
});

// --- LOGIKA PESANAN SAYA ---
function loadMyOrders() {
  const container = document.getElementById("orders-container");
  if (!container) return; // Stop jika tidak di halaman pesanan

  // Tampilkan loading state
  container.innerHTML =
    '<p style="text-align:center; padding:20px;">Memuat riwayat pesanan...</p>';

  fetch("../api/user/get-orders.php")
    .then((res) => res.json())
    .then((result) => {
      if (!result.success || !result.data || result.data.length === 0) {
        container.innerHTML =
          '<p style="text-align:center; padding:20px;">Belum ada pesanan.</p>';
        return;
      }

      container.innerHTML = result.data
        .map((order) => {
          // Tentukan warna & teks status
          let statusText = order.status;
          let statusColor = "#666";
          let actionBtn = "";

          if (order.status === "pending") {
            statusText = "Menunggu Konfirmasi Seller";
            statusColor = "#f39c12"; // Kuning
            // Tombol Cancel User
            actionBtn = `<button class="btn-cancel" onclick="cancelOrder(${order.id})" style="background:#e74c3c; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">Batalkan Pesanan</button>`;
          } else if (order.status === "processing") {
            statusText = "Menunggu Konfirmasi Penjual";
            statusColor = "#3498db"; // Biru
            // Allow cancel for paid orders too (refund stock)
            actionBtn = `<button class="btn-cancel" onclick="cancelOrder(${order.id})" style="background:#e74c3c; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">Batalkan Pesanan</button>`;
          } else if (order.status === "confirmed") {
            statusText = "Sedang Dikemas / Diproses Seller";
            statusColor = "#2980b9"; // Biru tua
            // No cancel button allowed after confirmation
          } else if (order.status === "shipped") {
            statusText = "Barang Sedang Diantar 🚚";
            statusColor = "#1abc9c"; // Tosca
            actionBtn = `
                        <button class="btn-done" onclick="finishOrder(${order.id})" style="background:#27ae60; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer; margin-right:5px;">Pesanan Diterima</button>
                        <button class="btn-return" onclick="requestReturn(${order.id})" style="background:#e67e22; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">Ajukan Return</button>
                    `;
          } else if (order.status === "cancelled") {
            statusText = "Dibatalkan / Ditolak";
            statusColor = "#e74c3c"; // Merah
          } else if (order.status === "completed") {
            statusText = "Selesai ✅";
            statusColor = "#27ae60"; // Hijau
          } else if (order.status === "return_requested") {
            statusText = "Menunggu Konfirmasi Return dari Seller";
            statusColor = "#f39c12"; // Kuning
          } else if (order.status === "return_approved") {
            statusText = "Return Disetujui - Silakan Kirim Barang";
            statusColor = "#3498db"; // Biru
            actionBtn = `<button class="btn-ship-return" onclick="shipReturn(${order.id})" style="background:#9b59b6; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">Kirim Barang</button>`;
          } else if (order.status === "return_shipped") {
            statusText = "Barang Return Dikirim - Menunggu Konfirmasi Seller";
            statusColor = "#1abc9c"; // Tosca
          } else if (order.status === "return_rejected") {
            statusText = "Return Ditolak oleh Seller";
            statusColor = "#e74c3c"; // Merah
          } else if (order.status === "return_completed") {
            statusText = "Return Berhasil ✅";
            statusColor = "#27ae60"; // Hijau
          }

          // Cek items ada atau tidak
          if (!order.items || order.items.length === 0) {
            return ""; // Skip jika data item rusak
          }

          // Ambil info item pertama
          const firstItem = order.items[0];
          const itemCount = order.items.length;
          const otherItemsText =
            itemCount > 1 ? `+ ${itemCount - 1} barang lainnya` : "";

          // Handle gambar (local vs cloudinary)
          let imgSrc = firstItem.image;
          if (imgSrc && !imgSrc.startsWith("http")) {
            imgSrc = "../assets/images/products/" + imgSrc;
          } else if (!imgSrc) {
            imgSrc = "../assets/images/bag.png";
          }

          return `
                <div class="cart-item order-card" style="border:1px solid #eee; padding:15px; border-radius:8px; display:flex; gap:15px; align-items:center;">
                    <div class="item-image">
                        <img src="${imgSrc}" style="width:60px; height:60px; object-fit:cover; border-radius:4px;" onerror="this.src='../assets/images/bag.png'">
                    </div>
                    <div class="item-details" style="flex:1;">
                        <h4 style="margin:0;">${
                          firstItem.name
                        } <small style="color:#666; font-weight:normal;">${otherItemsText}</small></h4>
                        <p style="margin:5px 0; color:#888;">Toko: ${
                          order.store_name || "Seller"
                        }</p>
                        <p class="item-price" style="font-weight:bold;">Total: Rp ${Number(
                          order.total_amount
                        ).toLocaleString("id-ID")}</p>
                        <p class="item-variant" style="font-size:0.9rem;">Status: <span style="color:${statusColor}; font-weight:bold;">${statusText}</span></p>
                    </div>
                    <div class="item-actions">
                        ${actionBtn}
                    </div>
                </div>
                `;
        })
        .join("");
    })
    .catch((err) => {
      console.error(err);
      container.innerHTML =
        '<p style="text-align:center; color:red;">Gagal memuat pesanan.</p>';
    });
}

window.finishOrder = function (orderId) {
  if (
    !confirm(
      "Apakah barang sudah diterima dengan baik? Barang yang sudah diterima tidak dapat dikembalikan."
    )
  )
    return;

  fetch("../api/user/complete-order.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ order_id: orderId }),
  })
    .then((res) => res.json())
    .then((res) => {
      if (res.success) {
        alert("Terima kasih! Pesanan selesai.");
        loadMyOrders();
      } else {
        alert("Gagal: " + res.message);
      }
    })
    .catch((err) => {
      console.error(err);
      alert("Terjadi kesalahan koneksi");
    });
};

// Global function agar bisa dipanggil di HTML (onclick)
window.cancelOrder = function (orderId) {
  if (!confirm("Yakin ingin membatalkan pesanan ini?")) return;

  fetch("../api/user/cancel-order.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ order_id: orderId }),
  })
    .then((res) => res.json())
    .then((res) => {
      if (res.success) {
        alert("Pesanan dibatalkan");
        loadMyOrders(); // Reload list
      } else {
        alert("Gagal: " + res.message);
      }
    })
    .catch((err) => {
      console.error(err);
      alert("Terjadi kesalahan koneksi");
    });
};

// Global function untuk request return
window.requestReturn = function (orderId) {
  if (!confirm("Apakah Anda yakin ingin mengajukan return untuk pesanan ini?")) return;

  fetch("../api/user/request-return.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ order_id: orderId }),
  })
    .then((res) => res.json())
    .then((res) => {
      if (res.success) {
        alert("Permintaan return berhasil diajukan. Menunggu konfirmasi seller.");
        loadMyOrders();
      } else {
        alert("Gagal: " + res.message);
      }
    })
    .catch((err) => {
      console.error(err);
      alert("Terjadi kesalahan koneksi");
    });
};

// Global function untuk kirim barang return
window.shipReturn = function (orderId) {
  if (!confirm("Apakah Anda sudah siap mengirim barang kembali ke seller?")) return;

  fetch("../api/user/ship-return.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ order_id: orderId }),
  })
    .then((res) => res.json())
    .then((res) => {
      if (res.success) {
        alert("Barang return sudah dikirim. Menunggu konfirmasi seller.");
        loadMyOrders();
      } else {
        alert("Gagal: " + res.message);
      }
    })
    .catch((err) => {
      console.error(err);
      alert("Terjadi kesalahan koneksi");
    });
};
