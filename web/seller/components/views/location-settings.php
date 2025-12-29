<div id="location-settings-view" class="view">
    <div class="location-header">
        <h2>📍 Lokasi Toko</h2>
        <p>Tentukan lokasi toko Anda untuk perhitungan ongkir yang akurat</p>
    </div>
    
    <!-- Alert message container -->
    <div id="location-alert" style="display: none;"></div>
    
    <div class="location-card">
        <!-- Current Location Display -->
        <div class="current-location">
            <h3>Lokasi Terkini</h3>
            <p id="current-address">Belum diatur - Klik peta di bawah untuk menentukan lokasi</p>
            <small id="current-coords">-</small>
        </div>
        
        <!-- Map Container -->
        <div class="map-container" style="position: relative;">
            <div id="location-map"></div>
            <div id="map-loading" class="loading-overlay" style="display: none;">
                <div class="loading-spinner"></div>
            </div>
        </div>
        
        <!-- Location Actions -->
        <div class="location-actions">
            <button class="btn-detect" id="detect-location-btn" onclick="detectMyLocation()">
                📍 Deteksi Lokasi Saya
            </button>
            <input 
                type="text" 
                id="address-detail" 
                placeholder="Detail alamat (contoh: Gedung A Lantai 2, RT 01/RW 05)" 
                maxlength="500"
            >
            <button class="btn-save" id="save-location-btn" onclick="saveSellerLocation()">
                💾 Simpan Lokasi
            </button>
        </div>
        
        <!-- Info box -->
        <div class="location-alert info" style="margin-top: 20px;">
            <strong>💡 Tips:</strong> 
            <ul style="margin: 8px 0 0 20px; padding: 0;">
                <li>Klik atau seret marker untuk mengatur lokasi toko</li>
                <li>Gunakan tombol "Deteksi Lokasi Saya" untuk otomatis mendeteksi posisi Anda</li>
                <li>Lokasi ini akan digunakan untuk menghitung ongkir ke pembeli</li>
            </ul>
        </div>
    </div>
</div>

<script>
// Seller Location Management
let locationPicker = null;
let currentSellerLocation = null;

// Initialize location picker when view is shown
document.addEventListener('DOMContentLoaded', () => {
    // Check if this view is active
    const locationView = document.getElementById('location-settings-view');
    if (!locationView) return;
    
    // Observer to detect when view becomes active
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'class') {
                const isActive = locationView.classList.contains('active');
                if (isActive && !locationPicker) {
                    initSellerLocationPicker();
                }
            }
        });
    });
    
    observer.observe(locationView, { attributes: true });
    
    // If view is already active, init immediately
    if (locationView.classList.contains('active')) {
        initSellerLocationPicker();
    }

    // Add Enter listener for address search
    const addressInput = document.getElementById('address-detail');
    if (addressInput) {
        addressInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                searchAddress();
            }
        });
    }
});

function initSellerLocationPicker() {
    console.log('Initializing seller location picker...');
    
    // Load current seller location first
    loadCurrentSellerLocation();
}

async function loadCurrentSellerLocation() {
    try {
        const response = await fetch('../api/seller/get-seller-profile.php');
        const result = await response.json();
        
        if (result.success && result.data) {
            const data = result.data;
            currentSellerLocation = {
                lat: data.latitude,
                lon: data.longitude,
                address: data.address,
                city: data.city
            };
            
            // Initialize map with current location or default
            const center = (data.latitude && data.longitude) 
                ? [data.latitude, data.longitude]
                : [-6.2088, 106.8456]; // Jakarta default
            
            locationPicker = new LocationPicker({
                containerId: 'location-map',
                center: center,
                zoom: data.latitude ? 15 : 12,
                onLocationSelected: onLocationPickerChange
            });
            
            locationPicker.init();
            
            // Update display
            if (data.latitude && data.longitude) {
                document.getElementById('current-address').textContent = 
                    data.address || 'Alamat sedang dimuat...';
                document.getElementById('current-coords').textContent = 
                    `${data.latitude}, ${data.longitude}`;
                    
                if (data.address_detail) {
                    document.getElementById('address-detail').value = data.address_detail;
                }
            }
        }
    } catch (error) {
        console.error('Error loading seller location:', error);
        showAlert('error', 'Gagal memuat data lokasi: ' + error.message);
    }
}

async function lookupAddress(lat, lon) {
    const addressDisplay = document.getElementById('current-address');
    addressDisplay.textContent = '⏳ Mengambil alamat...';
    
    try {
        const response = await fetch(`../api/utils/geocode-lookup.php?lat=${lat}&lon=${lon}`);
        const result = await response.json();
        
        if (result.success && result.data) {
            const addr = result.data;
            addressDisplay.textContent = addr.formatted;
            
            // Auto fill detail
            const detailInput = document.getElementById('address-detail');
            if (detailInput) {
                 // Only fill if simple street name
                 detailInput.value = addr.formatted.split(',')[0];
            }
            
        } else {
            addressDisplay.textContent = `Gagal memuat alamat: ${result.message || 'Tidak ditemukan'}`;
            console.warn('Geocoding result:', result);
        }
    } catch (error) {
        console.error('Lookup error:', error);
        // Debug mode: Show exact error to user
        addressDisplay.textContent = 'Debug Error: ' + error.message;
    }
}

async function searchAddress() {
    const input = document.getElementById('address-detail');
    const query = input.value.trim();
    if (!query) return;

    if(!locationPicker) return;

    const originalValue = input.value;
    input.disabled = true;
    input.value = '🔍 Mencari...';

    try {
        const response = await fetch(`../api/utils/address-search.php?text=${encodeURIComponent(query)}`);
        const result = await response.json();

        if (result.success && result.data) {
            const { lat, lon, formatted } = result.data;
            locationPicker.setLocation(lat, lon, 16);
            document.getElementById('current-address').textContent = formatted;
            document.getElementById('current-coords').textContent = `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
            input.value = formatted.split(',')[0];
            showAlert('success', 'Lokasi ditemukan!');
        } else {
            input.value = originalValue;
            showAlert('error', result.message || 'Alamat tidak ditemukan');
        }
    } catch (e) {
        input.value = originalValue;
        showAlert('error', 'Gagal mencari lokasi');
    } finally {
        input.disabled = false;
    }
}

function onLocationPickerChange(lat, lon) {
    console.log('Location changed:', lat, lon);
    
    // Update coords display
    document.getElementById('current-coords').textContent = 
        `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
    
    // Trigger lookup
    lookupAddress(lat, lon);
}

async function detectMyLocation() {
    const btn = document.getElementById('detect-location-btn');
    btn.disabled = true;
    btn.textContent = '⏳ Mendeteksi...';
    
    try {
        const coords = await locationPicker.getCurrentLocation();
        // Coords returned as {lat, lng} from location-picker.js
        
        // Force map update explicitly if needed (though location-picker does it)
        if (locationPicker.map) locationPicker.map.invalidateSize();
        
        showAlert('success', 'Lokasi berhasil terdeteksi!');
        
        // Lookup address
        // Note: onLocationPickerChange is already called by locationPicker inside getCurrentLocation
        // So lookupAddress is triggered automatically via callback
        
    } catch (error) {
        console.error('Geolocation error:', error);
        
        let msg = 'Gagal mendeteksi lokasi.';
        if (error.code === 1) msg = 'Izin lokasi ditolak browser. Mohon reset izin lokasi situs ini.';
        else if (error.code === 2) msg = 'Sinyal lokasi tidak tersedia. Pastikan GPS aktif.';
        else if (error.code === 3) msg = 'Waktu deteksi habis (Timeout). Silakan coba lagi.';
        
        showAlert('error', msg);
    } finally {
        btn.disabled = false;
        btn.textContent = '📍 Deteksi Lokasi Saya';
    }
}

async function saveSellerLocation() {
    const position = locationPicker.getPosition();
    
    if (!position) {
        showAlert('error', 'Silakan pilih lokasi di peta terlebih dahulu');
        return;
    }
    
    const addressDetail = document.getElementById('address-detail').value.trim();
    const saveBtn = document.getElementById('save-location-btn');
    
    saveBtn.disabled = true;
    saveBtn.textContent = '⏳ Menyimpan...';
    
    document.getElementById('map-loading').style.display = 'flex';
    
    try {
        const formData = new FormData();
        formData.append('latitude', position.lat);
        formData.append('longitude', position.lon);
        if (addressDetail) {
            formData.append('address_detail', addressDetail);
        }
        
        const response = await fetch('../api/seller/update-location.php', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Update display
            document.getElementById('current-address').textContent = result.data.address;
            document.getElementById('current-coords').textContent = 
                `${result.data.latitude}, ${result.data.longitude}`;
                
            showAlert('success', '✅ Lokasi toko berhasil disimpan!');
            
            // Update current location
            currentSellerLocation = result.data;
        } else {
            showAlert('error', '❌ ' + (result.message || 'Gagal menyimpan lokasi'));
        }
    } catch (error) {
        console.error('Error saving location:', error);
        showAlert('error', '❌ Terjadi kesalahan saat menyimpan lokasi');
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = '💾 Simpan Lokasi';
        document.getElementById('map-loading').style.display = 'none';
    }
}

function showAlert(type, message) {
    const alertDiv = document.getElementById('location-alert');
    alertDiv.className = `location-alert ${type}`;
    alertDiv.textContent = message;
    alertDiv.style.display = 'block';
    
    // Auto hide after 5 seconds
    setTimeout(() => {
        alertDiv.style.display = 'none';
    }, 5000);
}
</script>
