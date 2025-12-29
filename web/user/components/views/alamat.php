<div id="alamat-view" class="view" style="display: none;">
    <div class="location-header">
        <h2>📍 Alamat Pengiriman</h2>
        <p>Tentukan lokasi alamat Anda untuk pengiriman pesanan yang akurat</p>
    </div>
    
    <!-- Status Debugger (Temporary) -->
    <div id="debug-status" style="font-size: 10px; color: #aaa; margin-bottom: 5px;">Ready</div>
    
    <!-- Alert message container -->
    <div id="user-location-view-alert" style="display: none;"></div>
    
    <div class="location-card">
        <!-- Current Location Display -->
        <div class="current-location">
            <h3>Lokasi Terkini</h3>
            <p id="user-current-address-view">Belum diatur - Klik peta di bawah untuk menentukan lokasi</p>
            <small id="user-current-coords-view">-</small>
        </div>
        
        <!-- Map Container -->
        <div class="map-container" style="position: relative;">
            <div id="user-view-map"></div>
            <div id="user-map-loading" class="loading-overlay" style="display: none;">
                <div class="loading-spinner"></div>
            </div>
        </div>
        
        <!-- Location Actions -->
        <div class="location-actions">
            <button class="btn-detect" id="detect-user-location-view-btn" onclick="detectUserLocationView()">
                📍 Deteksi Lokasi Saya
            </button>
            <input 
                type="text" 
                id="user-address-detail-view" 
                placeholder="Detail alamat (contoh: Gedung A Lantai 2, RT 01/RW 05)" 
                maxlength="500"
            >
            <button class="btn-save" id="save-user-location-view-btn" onclick="saveUserLocationSettings()">
                💾 Simpan Alamat
            </button>
        </div>
        
        <!-- Info box -->
        <div class="location-alert info" style="margin-top: 20px;">
            <strong>💡 Info:</strong> 
            <ul style="margin: 8px 0 0 20px; padding: 0;">
                <li>Pastikan titik lokasi sesuai dengan tempat tinggal Anda</li>
                <li>Alamat ini akan otomatis muncul saat Checkout</li>
            </ul>
        </div>
    </div>
</div>

<script>
// User Location Management (View Scope)
let userLocationViewPicker = null;
// Inject server-side data directly to avoid fetch race conditions/failures
const SERVER_USER_PROFILE = <?php echo json_encode($userProfile ?? []); ?>;
console.log('Server Profile Data:', SERVER_USER_PROFILE);

// Initialize location picker when view is shown
document.addEventListener('DOMContentLoaded', () => {
    // Check if this view is active
    const addressView = document.getElementById('alamat-view');
    const debugEl = document.getElementById('debug-status');
    
    if (!addressView) return;
    
    const updateDebug = (msg) => {
        if(debugEl) debugEl.textContent = msg + ' (' + new Date().toLocaleTimeString() + ')';
        console.log('[LocationView] ' + msg);
    };
    
    // Function to handle map refresh
    const checkAndResizeMap = () => {
        const isVisible = window.getComputedStyle(addressView).display !== 'none';
        updateDebug('Check visibility: ' + isVisible);
        
        if (isVisible) {
            if (!userLocationViewPicker) {
                // First time init
                updateDebug('Initializing Map directly...');
                initUserLocationView(updateDebug);
            } else if (userLocationViewPicker.map) {
                // Resize existing map
                updateDebug('Resizing Map...');
                setTimeout(() => {
                    userLocationViewPicker.map.invalidateSize();
                }, 100);
            }
        }
    };

    // Observer to detect when view becomes active
    const observer = new MutationObserver((mutations) => {
        checkAndResizeMap();
    });
    
    observer.observe(addressView, { attributes: true, attributeFilter: ['style', 'class'] });
    
    // Also listen to sidebar clicks (backup trigger)
    const menuBtn = document.querySelector('.menu-item[data-page="alamat"]');
    if (menuBtn) {
        menuBtn.addEventListener('click', () => {
            updateDebug('Menu clicked');
            setTimeout(checkAndResizeMap, 200);
        });
    }
    
    // Initial check (if loaded directly or cached)
    setTimeout(checkAndResizeMap, 500);

    // Add Enter listener for address search
    const addressInput = document.getElementById('user-address-detail-view');
    if (addressInput) {
        addressInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                searchUserAddressView();
            }
        });
    }
});

function initUserLocationView(debugCallback) {
    if (userLocationViewPicker) return; 

    // Check dependencies
    if (typeof L === 'undefined') {
        if(debugCallback) debugCallback('Error: Leaflet (L) not defined');
        showUserAlertView('error', 'Gagal memuat peta: Library Peta tidak ditemukan.');
        return;
    }
    if (typeof LocationPicker === 'undefined') {
        if(debugCallback) debugCallback('Error: LocationPicker class not defined');
        showUserAlertView('error', 'Gagal memuat modul lokasi.');
        return;
    }

    try {
        // 1. Init Map IMMEDIATELY with JS Default
        const defaultCenter = [-6.1754, 106.8272]; // Monas Jakarta
        
        userLocationViewPicker = new LocationPicker({
            containerId: 'user-view-map',
            center: defaultCenter,
            zoom: 13,
            onLocationSelected: onUserLocationViewChange
        });
        
        userLocationViewPicker.init();
        if(debugCallback) debugCallback('Map initialized with default');
        
        // 2. Then Load Profile Async
        loadCurrentUserLocationView(debugCallback);
        
    } catch (e) {
        if(debugCallback) debugCallback('Init Exception: ' + e.message);
    }
}

async function loadCurrentUserLocationView(debugCallback) {
    const debugEl = document.getElementById('debug-status');
    const updateVisibleDebug = (msg) => {
        if(debugEl) debugEl.innerHTML += '<br>' + msg;
        if(debugCallback) debugCallback(msg);
    };

    updateVisibleDebug('Loading profile data...');

    let data = null;

    // 1. Try Server Side Data First (Fastest, Robust)
    if (typeof SERVER_USER_PROFILE !== 'undefined' && SERVER_USER_PROFILE && (SERVER_USER_PROFILE.latitude || SERVER_USER_PROFILE.address)) {
        updateVisibleDebug('Using Server-Injected Data');
        data = SERVER_USER_PROFILE;
    } 
    // 2. Fallback to API Fetch
    else {
        try {
            updateVisibleDebug('Fetching from API (Fallback)...');
            const response = await fetch('../api/user/get-profile.php?t=' + new Date().getTime(), {
                cache: "no-store",
                headers: { "Pragma": "no-cache" }
            });
            const result = await response.json();
            if (result.success && result.data) {
                data = result.data;
                updateVisibleDebug('API Data received');
            }
        } catch (e) {
            updateVisibleDebug('API Fetch failed: ' + e.message);
        }
    }

    if (data) {
        updateVisibleDebug('Found Data: ' + (data.address || 'No Address'));
        updateVisibleDebug('Coords: ' + data.latitude + ', ' + data.longitude);

        // Re-populate global inputs / display
        const addrDisplay = document.getElementById('user-current-address-view');
        if (addrDisplay) {
            addrDisplay.textContent = data.address || 'Belum diatur - Klik peta di bawah untuk menentukan lokasi';
        }
                
        if (data.address_detail) {
                document.getElementById('user-address-detail-view').value = data.address_detail;
        }
        
        // Only update map if user has saved location
        if (data.latitude && data.longitude) {
            document.getElementById('user-current-coords-view').textContent = 
                `${data.latitude}, ${data.longitude}`;

            // Fly to saved location
            if (userLocationViewPicker) {
                    const lat = parseFloat(data.latitude);
                    const lon = parseFloat(data.longitude);
                    
                    updateVisibleDebug('Map flyTo: ' + lat + ',' + lon);
                    userLocationViewPicker.setLocation(lat, lon, 16);
            }
        }
    } else {
        updateVisibleDebug('No profile data available to load.');
    }
}

async function lookupUserAddressView(lat, lon) {
    const addressDisplay = document.getElementById('user-current-address-view');
    addressDisplay.textContent = '⏳ Mengambil alamat...';
    
    try {
        const response = await fetch(`../api/utils/geocode-lookup.php?lat=${lat}&lon=${lon}`);
        const result = await response.json();
        
        if (result.success && result.data) {
            const addr = result.data;
            addressDisplay.textContent = addr.formatted;
            
            const detailInput = document.getElementById('user-address-detail-view');
            if (detailInput) {
                 detailInput.value = addr.formatted.split(',')[0];
            }
        } else {
            addressDisplay.textContent = result.message || 'Alamat tidak ditemukan';
        }
    } catch (error) {
        addressDisplay.textContent = 'Offline / Gagal koneksi';
    }
}

async function searchUserAddressView() {
    const input = document.getElementById('user-address-detail-view');
    const query = input.value.trim();
    if (!query) return;

    if(!userLocationViewPicker) return;

    const originalValue = input.value;
    input.disabled = true;
    input.value = '🔍 Mencari...';

    try {
        const response = await fetch(`../api/utils/address-search.php?text=${encodeURIComponent(query)}`);
        const result = await response.json();

        if (result.success && result.data) {
            const { lat, lon, formatted } = result.data;
            userLocationViewPicker.setLocation(lat, lon, 16);
            document.getElementById('user-current-address-view').textContent = formatted;
            document.getElementById('user-current-coords-view').textContent = `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
            input.value = formatted.split(',')[0];
            showUserAlertView('success', 'Lokasi ditemukan!');
        } else {
            input.value = originalValue;
            showUserAlertView('error', result.message || 'Alamat tidak ditemukan');
        }
    } catch (e) {
        input.value = originalValue;
        showUserAlertView('error', 'Gagal mencari lokasi');
    } finally {
        input.disabled = false;
    }
}

function onUserLocationViewChange(lat, lon) {
    document.getElementById('user-current-coords-view').textContent = 
        `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
    lookupUserAddressView(lat, lon);
}

async function detectUserLocationView() {
    const btn = document.getElementById('detect-user-location-view-btn');
    
    if(!userLocationViewPicker) {
        showUserAlertView('error', 'Peta belum siap. Silakan refresh halaman.');
        return;
    }
    
    btn.disabled = true;
    btn.textContent = '⏳ Mendeteksi...';
    
    try {
        await userLocationViewPicker.getCurrentLocation();
        if (userLocationViewPicker.map) userLocationViewPicker.map.invalidateSize();
        showUserAlertView('success', 'Lokasi berhasil terdeteksi!');
    } catch (error) {
        let msg = 'Gagal mendeteksi lokasi.';
        if (error.code === 1) msg = 'Izin lokasi ditolak browser.';
        else if (error.code === 2) msg = 'Sinyal lokasi tidak tersedia.';
        else if (error.code === 3) msg = 'Timeout deteksi lokasi.';
        showUserAlertView('error', msg);
    } finally {
        btn.disabled = false;
        btn.textContent = '📍 Deteksi Lokasi Saya';
    }
}

async function saveUserLocationSettings() {
    if(!userLocationViewPicker) return;
    const position = userLocationViewPicker.getPosition();
    
    if (!position) {
        showUserAlertView('error', 'Silakan pilih lokasi di peta terlebih dahulu');
        return;
    }
    
    const addressDetail = document.getElementById('user-address-detail-view').value.trim();
    const saveBtn = document.getElementById('save-user-location-view-btn');
    
    saveBtn.disabled = true;
    saveBtn.textContent = '⏳ Menyimpan...';
    
    try {
        const formData = new FormData();
        formData.append('latitude', position.lat);
        formData.append('longitude', position.lon);
        if (addressDetail) {
            formData.append('address_detail', addressDetail);
        }
        
        // Use existing user API
        const response = await fetch('../api/user/update-location.php', {
            method: 'POST',
            body: formData
        });
        
        // Handle non-JSON response gracefully
        const text = await response.text();
        let result;
        try {
            result = JSON.parse(text);
        } catch(e) {
             console.error('Save invalid JSON:', text);
             throw new Error('Respons server tidak valid');
        }
        
        if (result.success) {
            document.getElementById('user-current-address-view').textContent = result.data.address;
            showUserAlertView('success', '✅ Alamat berhasil disimpan!');
        } else {
            showUserAlertView('error', '❌ ' + (result.message || 'Gagal menyimpan'));
        }
    } catch (error) {
        showUserAlertView('error', '❌ ' + error.message);
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = '💾 Simpan Alamat';
    }
}

function showUserAlertView(type, message) {
    const alertDiv = document.getElementById('user-location-view-alert');
    if(!alertDiv) return;
    alertDiv.className = `location-alert ${type}`;
    alertDiv.textContent = message;
    alertDiv.style.display = 'block';
    setTimeout(() => {
        alertDiv.style.display = 'none';
    }, 5000);
}
</script>
