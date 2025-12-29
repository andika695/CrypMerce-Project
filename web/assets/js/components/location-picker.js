/**
 * Location Picker Component
 * Interactive map component using Leaflet.js for selecting location
 */

class LocationPicker {
    constructor(options = {}) {
        this.containerId = options.containerId || 'location-map';
        this.map = null;
        this.marker = null;
        this.defaultCenter = options.center || [-6.2088, 106.8456]; // Jakarta default
        this.defaultZoom = options.zoom || 13;
        this.onLocationSelected = options.onLocationSelected || (() => {});
        this.currentLat = null;
        this.currentLon = null;
    }
    
    /**
     * Initialize the map
     */
    init() {
        // Cleanup existing map if present on this instance
        if (this.map) {
            this.map.remove();
            this.map = null;
        }

        // Cleanup if container already has a map (from dropped instance)
        const container = document.getElementById(this.containerId);
        if (container && container._leaflet_id) {
            container._leaflet_id = null; // Reset Leaflet ID
            container.innerHTML = '';     // Clear lingering map elements
        }

        // Create map instance
        this.map = L.map(this.containerId).setView(this.defaultCenter, this.defaultZoom);
        
        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(this.map);
        
        // Add draggable marker
        this.marker = L.marker(this.defaultCenter, {
            draggable: true,
            autoPan: true
        }).addTo(this.map);
        
        // Listen to marker drag end
        this.marker.on('dragend', () => {
            const position = this.marker.getLatLng();
            this.currentLat = position.lat;
            this.currentLon = position.lng;
            this.onLocationSelected(position.lat, position.lng);
        });
        
        // Click on map to move marker
        this.map.on('click', (e) => {
            this.setLocation(e.latlng.lat, e.latlng.lng);
            this.currentLat = e.latlng.lat;
            this.currentLon = e.latlng.lng;
            this.onLocationSelected(e.latlng.lat, e.latlng.lng);
        });
        
        console.log('Location picker initialized');
    }
    
    /**
     * Set marker location
     */
    setLocation(lat, lng, zoom = null) {
        if (!this.map || !this.marker) {
            console.error('Map not initialized');
            return;
        }
        
        const position = [lat, lng];
        this.marker.setLatLng(position);
        
        // Use flyTo for smooth animation if detecting location
        if (zoom) {
            this.map.flyTo(position, zoom, {
                animate: true,
                duration: 1.5
            });
        } else {
            this.map.setView(position);
        }

        this.currentLat = lat;
        this.currentLon = lng;
    }
    
    /**
     * Get current location from browser
     */
    getCurrentLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation not supported'));
                return;
            }
            
            const options = {
                enableHighAccuracy: true, // Request GPS precision
                timeout: 10000,           // Wait up to 10s
                maximumAge: 0             // Do not use cached position
            };
            
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    
                    // Zoom level 16 for better street view
                    this.setLocation(lat, lng, 16);
                    this.onLocationSelected(lat, lng);
                    resolve({ lat, lng });
                },
                (error) => {
                    console.warn(`Geolocation error: ${error.message}`);
                    reject(error);
                },
                options
            );
        });
    }
    
    /**
     * Get current position
     */
    getPosition() {
        if (this.currentLat && this.currentLon) {
            return {
                lat: this.currentLat,
                lon: this.currentLon
            };
        }
        
        if (this.marker) {
            const pos = this.marker.getLatLng();
            return {
                lat: pos.lat,
                lon: pos.lng
            };
        }
        
        return null;
    }
    
    /**
     * Destroy map instance
     */
    destroy() {
        if (this.map) {
            this.map.remove();
            this.map = null;
            this.marker = null;
        }
    }
}

// Export for use in other scripts
window.LocationPicker = LocationPicker;
