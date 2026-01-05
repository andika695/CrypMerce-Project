<div id="notifikasi-view" class="view">
    <h1 class="profile-title-new">Notifikasi</h1>
    <p style="text-align:center; margin-bottom: 2rem; color: #666;">Pantau status pesanan dan info terbaru Anda di sini.</p>

    <div id="notification-list" class="notification-list">
        <div style="text-align:center; padding: 40px; color:#bdc3c7;">
            <i class="fas fa-spinner fa-spin"></i> Memuat notifikasi...
        </div>
    </div>
</div>

<!-- Modal Tracking -->
<div id="tracking-modal" class="modal">
    <div class="modal-content" style="max-width: 500px;">
        <span class="close-modal" onclick="closeTrackingModal()">&times;</span>
        <h3 style="margin-top:0; border-bottom:1px solid #eee; padding-bottom:10px;">Lacak Pesanan</h3>
        
        <div id="tracking-info" style="margin-bottom: 20px;">
            <!-- Order ID, Product info -->
        </div>

        <div class="tracking-timeline">
            <div class="step" id="step-pending">
                <div class="icon"><i class="fas fa-file-invoice"></i></div>
                <div class="text">
                    <strong>Dibuat</strong>
                    <small>Menunggu Pembayaran</small>
                </div>
            </div>
            <div class="step" id="step-processing">
                <div class="icon"><i class="fas fa-wallet"></i></div>
                <div class="text">
                    <strong>Dibayar</strong>
                    <small>Menunggu Konfirmasi Seller</small>
                </div>
            </div>
            <div class="step" id="step-confirmed">
                <div class="icon"><i class="fas fa-box-open"></i></div>
                <div class="text">
                    <strong>Dikonfirmasi</strong>
                    <small>Sedang Dikemas</small>
                </div>
            </div>
            <div class="step" id="step-shipped">
                <div class="icon"><i class="fas fa-truck"></i></div>
                <div class="text">
                    <strong>Dikirim</strong>
                    <small>Dalam Perjalanan</small>
                </div>
            </div>
            <div class="step" id="step-completed">
                <div class="icon"><i class="fas fa-check-circle"></i></div>
                <div class="text">
                    <strong>Selesai</strong>
                    <small>Pesanan Diterima</small>
                </div>
            </div>
        </div>
        
        <div id="tracking-cancel-status" style="display:none; text-align:center; color:red; margin-top:20px; font-weight:bold; background:#fee; padding:10px; border-radius:8px;">
            ❌ Pesanan Dibatalkan
        </div>

        <div style="margin-top: 20px; text-align: right;">
            <button class="btn-primary" onclick="closeTrackingModal()">Tutup</button>
        </div>
    </div>
</div>

<style>
/* Local style for timeline, can be moved to CSS file */
.tracking-timeline {
    position: relative;
    margin-top: 20px;
    padding-left: 20px;
    border-left: 2px solid #e0e0e0;
}
.tracking-timeline .step {
    position: relative;
    padding-left: 30px;
    margin-bottom: 20px;
    opacity: 0.5; /* Default inactive */
}
.tracking-timeline .step.active {
    opacity: 1;
}
.tracking-timeline .step::before {
    content: '';
    position: absolute;
    left: -9px;
    top: 5px;
    width: 16px;
    height: 16px;
    background: #fff;
    border: 3px solid #ccc;
    border-radius: 50%;
}
.tracking-timeline .step.active::before {
    background: #2ecc71;
    border-color: #2ecc71;
}
.tracking-timeline .step .icon {
    position: absolute;
    left: 0;
    top: 0;
    font-size: 18px;
    width: 20px;
    text-align: center;
}
.tracking-timeline .step .text {
    display: flex;
    flex-direction: column;
}
.tracking-timeline .step .text strong {
    font-size: 14px;
    color: #2c3e50;
}
.tracking-timeline .step .text small {
    font-size: 12px;
    color: #7f8c8d;
}
</style>
