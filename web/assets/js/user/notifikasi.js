document.addEventListener('DOMContentLoaded', () => {
    initGlobalNotifications();
});

function initGlobalNotifications() {
    // 1. Inject CSS
    const style = document.createElement('style');
    style.innerHTML = `
        /* Global Notification CSS Injected by JS */
        #global-notif-modal {
            display: none;
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 9999;
            align-items: center; justify-content: center;
        }
        #global-notif-modal.active { display: flex; }
        .g-notif-content {
            background: white;
            width: 90%; max-width: 480px;
            max-height: 80vh;
            border-radius: 12px;
            padding: 20px;
            display: flex; flex-direction: column;
            position: relative;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        }
        .g-notif-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
        .g-notif-header h3 { margin: 0; font-size: 1.2rem; color: #333; }
        .g-close-btn { background: none; border: none; font-size: 24px; cursor: pointer; color: #666; }
        .g-notif-list { overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 10px; }
        
        /* Reused Card Styles */
        .g-notif-card {
            background: #fff;
            border: 1px solid #eee;
            padding: 12px;
            border-radius: 8px;
            display: flex; gap: 12px;
            cursor: pointer; transition: background 0.2s;
        }
        .g-notif-card:hover { background: #f9f9f9; border-color: #ddd; }
        .g-notif-card.unread { border-left: 3px solid #3498db; background: #f0f9ff; }
        .g-n-icon { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; }
        .g-n-icon.info { background: #e0f2fe; color: #0284c7; }
        .g-n-icon.success { background: #dcfce7; color: #22c55e; }
        .g-n-icon.error { background: #fee2e2; color: #ef4444; }
        .g-n-content h4 { margin: 0 0 4px; font-size: 14px; color: #333; }
        .g-n-content p { margin: 0; font-size: 12px; color: #666; line-height: 1.4; }
        .g-n-content .time { font-size: 11px; color: #999; margin-top: 4px; display: block; }

        /* Tracking Modal Styles */
        #tracking-modal { display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); z-index: 10000; align-items: center; justify-content: center; }
        #tracking-modal.active { display: flex; }
        .tracking-content { background: white; width: 90%; max-width: 450px; padding: 20px; border-radius: 12px; position: relative; }
        .tracking-timeline { margin-top: 20px; padding-left: 20px; border-left: 2px solid #eee; }
        .tracking-step { position: relative; padding-left: 20px; margin-bottom: 20px; opacity: 0.4; }
        .tracking-step.active { opacity: 1; }
        .tracking-step::before { content: ''; position: absolute; left: -9px; top: 2px; width: 12px; height: 12px; background: white; border: 2px solid #ccc; border-radius: 50%; }
        .tracking-step.active::before { background: #2ecc71; border-color: #2ecc71; }
        .tracking-step strong { display: block; font-size: 14px; color: #333; }
        .tracking-step small { font-size: 12px; color: #777; }
    `;
    document.head.appendChild(style);

    // 2. Inject HTML
    const container = document.createElement('div');
    container.innerHTML = `
        <!-- Notification Modal -->
        <div id="global-notif-modal">
            <div class="g-notif-content">
                <div class="g-notif-header">
                    <h3>Notifikasi</h3>
                    <button class="g-close-btn" onclick="toggleGlobalNotif(false)">&times;</button>
                </div>
                <div id="g-notif-list" class="g-notif-list">
                    <div style="text-align:center; padding:20px; color:#999;">Loading...</div>
                </div>
            </div>
        </div>

        <!-- Tracking Modal -->
        <div id="tracking-modal">
            <div class="tracking-content">
                <button class="g-close-btn" style="position:absolute; right:15px; top:15px;" onclick="closeTrackingModal()">&times;</button>
                <h3 style="margin-top:0; border-bottom:1px solid #eee; padding-bottom:10px;">Lacak Status</h3>
                <div id="tracking-info"></div>
                <div class="tracking-timeline">
                    <div class="tracking-step" id="step-pending"><strong>Dibuat</strong><small>Menunggu Pembayaran</small></div>
                    <div class="tracking-step" id="step-processing"><strong>Dibayar</strong><small>Menunggu Konfirmasi</small></div>
                    <div class="tracking-step" id="step-confirmed"><strong>Dikonfirmasi</strong><small>Sedang Dikemas</small></div>
                    <div class="tracking-step" id="step-shipped"><strong>Dikirim</strong><small>Dalam Perjalanan</small></div>
                    <div class="tracking-step" id="step-completed"><strong>Selesai</strong><small>Diterima</small></div>
                </div>
                <div id="tracking-cancel-msg" style="display:none; text-align:center; color:red; padding:10px; font-weight:bold; background:#fee; border-radius:6px; margin-top:10px;">❌ Dibatalkan</div>
            </div>
        </div>
    `;
    document.body.appendChild(container);

    // 3. Attach Listener to Bell Icon
    const bellBtn = document.getElementById('notificationBtn');
    if (bellBtn) {
        bellBtn.addEventListener('click', (e) => {
            e.preventDefault();
            toggleGlobalNotif(true);
            loadGlobalNotifications();
        });
    }

    // Listener for close click outside
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('global-notif-modal');
        if (e.target === modal) toggleGlobalNotif(false);
        const trackModal = document.getElementById('tracking-modal');
        if (e.target === trackModal) closeTrackingModal();
    });
}

// Global functions
window.toggleGlobalNotif = function(show) {
    const modal = document.getElementById('global-notif-modal');
    if(show) modal.classList.add('active');
    else modal.classList.remove('active');
};

window.closeTrackingModal = function() {
    document.getElementById('tracking-modal').classList.remove('active');
};

async function loadGlobalNotifications() {
    const list = document.getElementById('g-notif-list');
    list.innerHTML = '<div style="text-align:center; padding:20px;"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';

    try {
        const response = await fetch('../api/user/get-notifications.php');
        const result = await response.json();

        if (result.success && result.data.length > 0) {
            list.innerHTML = result.data.map(n => `
                <div class="g-notif-card ${n.is_read ? '' : 'unread'}" onclick="handleGlobalNotifClick(${n.order_id})">
                    <div class="g-n-icon ${n.type}">
                        <i class="fas ${getGlobalIcon(n.type)}"></i>
                    </div>
                    <div class="g-n-content">
                        <h4>${n.title}</h4>
                        <p>${n.message}</p>
                        <span class="time">${n.time_ago}</span>
                    </div>
                </div>
            `).join('');
        } else {
            list.innerHTML = '<div style="text-align:center; padding:30px; color:#999;">Tidak ada notifikasi</div>';
        }
    } catch (e) {
        console.error(e);
        list.innerHTML = '<div style="text-align:center; color:red;">Gagal memuat info</div>';
    }
}

function getGlobalIcon(type) {
    if (type === 'success') return 'fa-check-circle';
    if (type === 'error') return 'fa-times-circle';
    return 'fa-info-circle';
}

// Reuse logic fetch orders cache
let gOrdersCache = [];
window.handleGlobalNotifClick = async function(orderId) {
    if(!orderId) return;
    
    // Open Tracking Modal
    const modal = document.getElementById('tracking-modal');
    modal.classList.add('active');
    
    // Reset steps
    document.querySelectorAll('.tracking-step').forEach(el => el.classList.remove('active'));
    document.getElementById('tracking-cancel-msg').style.display = 'none';
    document.querySelector('.tracking-timeline').style.display = 'block';

    try {
        if(gOrdersCache.length === 0) {
            const res = await fetch('../api/user/get-orders.php');
            const data = await res.json();
            if(data.success) gOrdersCache = data.data;
        }
        
        const order = gOrdersCache.find(o => o.id == orderId);
        if(!order) {
            document.getElementById('tracking-info').innerHTML = '<p style="color:red">Data pesanan tidak ditemukan</p>';
            return;
        }

        document.getElementById('tracking-info').innerHTML = `
            <p style="margin:0 0 5px;"><strong>Order #${order.id}</strong></p>
            <p style="margin:0; font-size:14px; color:#666;">Total: Rp ${Number(order.total_amount).toLocaleString('id-ID')}</p>
        `;

        updateGlobalTimeline(order.status);
    } catch(e) {
        console.error(e);
    }
};

function updateGlobalTimeline(status) {
    const steps = ['pending', 'processing', 'confirmed', 'shipped', 'completed'];
    if(status === 'cancelled') {
        document.querySelector('.tracking-timeline').style.display = 'none';
        document.getElementById('tracking-cancel-msg').style.display = 'block';
        return;
    }
    
    let activeIndex = steps.indexOf(status);
    if(activeIndex === -1) activeIndex = 0;

    steps.forEach((s, i) => {
        const el = document.getElementById(`step-${s}`);
        if(i <= activeIndex) el.classList.add('active');
    });
}
