document.addEventListener('DOMContentLoaded', loadOrders);

async function loadOrders() {
    const container = document.getElementById('orderHistoryList');
    if (!container) return;

    try {
        // Memanggil API get-orders.php yang Anda miliki
        const response = await fetch('../api/user/get-orders.php');
        const result = await response.json();

        if (result.success && result.data.length > 0) {
            container.innerHTML = result.data.map(order => `
                <div class="order-card">
                    <div class="order-header">
                        <span>📅 ${new Date(order.created_at).toLocaleDateString('id-ID')}</span>
                        <span class="status-badge ${order.status}">${order.status.toUpperCase()}</span>
                    </div>
                    <div class="order-body">
                        <p><strong>${order.first_product_name || 'Pesanan Produk'}</strong> 
                           ${order.total_items > 1 ? `(+${order.total_items - 1} produk lainnya)` : ''}</p>
                        <p class="total-price">Rp ${new Intl.NumberFormat('id-ID').format(order.total_amount)}</p>
                    </div>
                    <div class="order-footer">
                        ${order.status === 'pending' ? 
                            `<button onclick="continuePayment('${order.id}')" class="btn-pay">Bayar Sekarang</button>` : 
                            ''
                        }
                        <button class="btn-detail">Lihat Detail</button>
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<div class="empty-state">Belum ada transaksi.</div>';
        }
    } catch (error) {
        console.error('Error:', error);
        container.innerHTML = '<div class="error-state">Gagal memuat data riwayat pesanan.</div>';
    }
}

// Fungsi untuk melanjutkan pembayaran yang tertunda
async function continuePayment(orderId) {
    try {
        const response = await fetch('../checkout/GetSnapToken.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_id: orderId })
        });

        if (!response.ok) throw new Error('Gagal mengambil token');
        
        const snapToken = await response.text();

        window.snap.pay(snapToken, {
            onSuccess: function(result) { window.location.href = '../../checkout/success.html'; },
            onPending: function(result) { location.reload(); },
            onError: function(result) { alert("Pembayaran gagal!"); }
        });
    } catch (error) {
        console.error('Error:', error);
        alert('Terjadi kesalahan teknis saat memproses pembayaran.');
    }
}