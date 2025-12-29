<?php
/**
 * Geocoding Service
 * Handles reverse geocoding using Geoapify API
 */

class GeocodingService {
    private $apiKey;
    private $baseUrl = 'https://api.geoapify.com/v1/geocode';
    
    public function __construct($apiKey) {
        $this->apiKey = $apiKey;
    }
    
    /**
     * Reverse geocode: Convert coordinates to address
     * @param float $lat Latitude
     * @param float $lon Longitude
     * @return array|null Address details or null on error
     */
    public function reverseGeocode($lat, $lon) {
        try {
            $url = $this->baseUrl . "/reverse";
            $url .= "?lat=" . urlencode($lat);
            $url .= "&lon=" . urlencode($lon);
            $url .= "&apiKey=" . urlencode($this->apiKey);
            $url .= "&format=json";
            
            $response = @file_get_contents($url);
            
            if ($response === false) {
                error_log("Geoapify API request failed");
                return null;
            }
            
            $data = json_decode($response, true);
            
            if (!isset($data['results'][0])) {
                error_log("No results from Geoapify");
                return null;
            }
            
            $result = $data['results'][0];
            
            return [
                'formatted' => $result['formatted'] ?? 'Unknown location',
                'street' => $result['street'] ?? '',
                'housenumber' => $result['housenumber'] ?? '',
                'suburb' => $result['suburb'] ?? '',
                'city' => $result['city'] ?? $result['county'] ?? '',
                'state' => $result['state'] ?? '',
                'postcode' => $result['postcode'] ?? '',
                'country' => $result['country'] ?? 'Indonesia',
                'country_code' => $result['country_code'] ?? 'id'
            ];
            
        } catch (Exception $e) {
            error_log("Geocoding error: " . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Forward geocode: Convert address to coordinates (optional, for future use)
     * @param string $address Address string
     * @return array|null Coordinates or null on error
     */
    public function geocode($address) {
        try {
            $url = $this->baseUrl . "/search";
            $url .= "?text=" . urlencode($address);
            $url .= "&apiKey=" . urlencode($this->apiKey);
            $url .= "&format=json";
            
            $response = @file_get_contents($url);
            
            if ($response === false) {
                return null;
            }
            
            $data = json_decode($response, true);
            
            if (!isset($data['results'][0])) {
                return null;
            }
            
            $result = $data['results'][0];
            
            return [
                'lat' => $result['lat'],
                'lon' => $result['lon'],
                'formatted' => $result['formatted']
            ];
            
        } catch (Exception $e) {
            error_log("Forward geocoding error: " . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Validate coordinates
     * @param float $lat Latitude
     * @param float $lon Longitude
     * @return bool True if valid
     */
    public static function validateCoordinates($lat, $lon) {
        return (
            is_numeric($lat) && 
            is_numeric($lon) && 
            $lat >= -90 && 
            $lat <= 90 && 
            $lon >= -180 && 
            $lon <= 180
        );
    }
}
?>
