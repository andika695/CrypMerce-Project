/**
 * User Location Management
 * Handles the location modal, map interaction, and saving logic
 */

let userLocationPicker = null;

document.addEventListener('DOMContentLoaded', () => {
    // Check if user has location set (optional: auto-open if not set)
    fetchUserProfile();
});

// Fetch user profile to get saved location
async function fetchUserProfile() {
    try {
        const response = await fetch('../api/user/get-profile.php');
        const result = await response.json();
        
        if (result.success && result.data) {
            const data = result.data;
            
            // Update header button text if address exists
            if (data.address) {
                const shortAddress = data.address.split(',')[0]; // Take first part
                document.getElementById('headerLocationText').textContent = shortAddress;
                
                // Update modal display
                document.getElementById('current-address').textContent = data.address;
                document.getElementById('current-coords').textContent = `${data.latitude}, ${data.longitude}`;
                document.getElementById('user-address-detail').value = data.address_detail || '';
            }
            
            // Store for map init
            window.currentUserLocation = data;
        }
    } catch (error) {
        console.error('Error fetching profile:', error);
    }
}

// Open Location Modal
function openLocationModal() {
    const modal = document.getElementById('locationModal');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
    
    // Initialize map if not already done
    if (!userLocationPicker) {
        // Wait for modal transition a bit or init immediately
        setTimeout(initUserMap, 100);
    } else {
        // Refresh map size
        setTimeout(() => {
            userLocationPicker.map.invalidateSize();
        }, 100);
    }
}

// Close Location Modal
function closeLocationModal() {
    document.getElementById('locationModal').style.display = 'none';
    document.body.style.overflow = '';
}

// Close on outside click
window.onclick = function(event) {
    const modal = document.getElementById('locationModal');
    if (event.target === modal) {
        closeLocationModal();
    }
};

// Initialize Map
function initUserMap() {
    const data = window.currentUserLocation || {};
    
    const center = (data.latitude && data.longitude)
        ? [data.latitude, data.longitude]
        : [-6.2088, 106.8456]; // Default Jakarta
        
    userLocationPicker = new LocationPicker({
        containerId: 'user-location-map',
        center: center,
        zoom: data.latitude ? 15 : 12,
        onLocationSelected: onUserLocationChange
    });
    
    userLocationPicker.init();
    
    // If location exists, set marker
    if (data.latitude && data.longitude) {
        userLocationPicker.setLocation(data.latitude, data.longitude);
    }
}

async function lookupUserAddress(lat, lon) {
    const addressDisplay = document.getElementById('current-address');
    addressDisplay.textContent = '⏳ Mengambil alamat...';
    
    try {
        const response = await fetch(`../api/utils/geocode-lookup.php?lat=${lat}&lon=${lon}`);
        const result = await response.json();
        
        if (result.success && result.data) {
            const addr = result.data;
            addressDisplay.textContent = addr.formatted;
        } else {
            addressDisplay.textContent = 'Alamat tidak ditemukan';
        }
    } catch (error) {
        console.error('Lookup error:', error);
        addressDisplay.textContent = 'Gagal memuat detail alamat';
    }
}

function onUserLocationChange(lat, lon) {
    document.getElementById('current-coords').textContent = `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
    
    // Trigger address lookup
    lookupUserAddress(lat, lon);
}

// Use Geolocation
async function userDetectLocation() {
    if (!userLocationPicker) return;
    
    const btn = document.querySelector('.btn-detect');
    const originalText = btn.textContent;
    btn.textContent = '⏳ Mendeteksi...';
    btn.disabled = true;
    
    try {
        await userLocationPicker.getCurrentLocation();
        showLocationAlert('success', 'Lokasi berhasil dideteksi!');
    } catch (error) {
        let msg = 'Gagal mendeteksi lokasi.';
        if (error.code === 1) msg = 'Izin lokasi ditolak browser. Mohon reset izin lokasi situs ini.';
        else if (error.code === 2) msg = 'Sinyal lokasi tidak tersedia. Pastikan GPS aktif.';
        else if (error.code === 3) msg = 'Waktu deteksi habis (Timeout). Silakan coba lagi.';
        
        showLocationAlert('error', msg);
        console.error('Geolocation Error Detail:', error);
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

// Save Location
async function saveUserLocation() {
    if (!userLocationPicker) return;
    
    const position = userLocationPicker.getPosition();
    if (!position) {
        showLocationAlert('error', 'Silakan pilih lokasi di peta');
        return;
    }
    
    const addressDetail = document.getElementById('user-address-detail').value;
    const saveBtn = document.getElementById('save-user-location-btn');
    
    saveBtn.disabled = true;
    saveBtn.textContent = 'Menyimpan...';
    
    try {
        const formData = new FormData();
        formData.append('latitude', position.lat);
        formData.append('longitude', position.lon);
        formData.append('address_detail', addressDetail);
        
        const response = await fetch('../api/user/update-location.php', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Update UI
            const data = result.data;
            document.getElementById('current-address').textContent = data.address;
            
            // Update header button
            const shortAddress = data.address.split(',')[0];
            document.getElementById('headerLocationText').textContent = shortAddress;
            
            // Update cached data
            window.currentUserLocation = data;
            
            showLocationAlert('success', '✅ Alamat berhasil disimpan!');
            
            // Close modal after success
            setTimeout(closeLocationModal, 1500);
        } else {
            showLocationAlert('error', result.message || 'Gagal menyimpan');
        }
    } catch (error) {
        console.error('Error saving:', error);
        showLocationAlert('error', 'Terjadi kesalahan sistem');
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Simpan Alamat';
    }
}

function showLocationAlert(type, message) {
    const alert = document.getElementById('location-alert');
    alert.className = `location-alert ${type}`;
    alert.textContent = message;
    alert.style.display = 'block';
    
    setTimeout(() => {
        alert.style.display = 'none';
    }, 4000);
}
