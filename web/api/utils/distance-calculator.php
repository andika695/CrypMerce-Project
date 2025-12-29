<?php
/**
 * Distance Calculator & Shipping Cost Calculator
 * Uses Haversine formula for distance calculation
 */

class DistanceCalculator {
    
    /**
     * Calculate distance between two coordinates using Haversine formula
     * @param float $lat1 Latitude of point 1
     * @param float $lon1 Longitude of point 1
     * @param float $lat2 Latitude of point 2
     * @param float $lon2 Longitude of point 2
     * @return float Distance in kilometers
     */
    public static function calculateDistance($lat1, $lon1, $lat2, $lon2) {
        $earthRadius = 6371; // Earth's radius in kilometers
        
        // Convert degrees to radians
        $latFrom = deg2rad($lat1);
        $lonFrom = deg2rad($lon1);
        $latTo = deg2rad($lat2);
        $lonTo = deg2rad($lon2);
        
        // Calculate differences
        $latDelta = $latTo - $latFrom;
        $lonDelta = $lonTo - $lonFrom;
        
        // Haversine formula
        $a = sin($latDelta / 2) * sin($latDelta / 2) +
             cos($latFrom) * cos($latTo) *
             sin($lonDelta / 2) * sin($lonDelta / 2);
        
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
        
        $distance = $earthRadius * $c;
        
        return round($distance, 2); // Round to 2 decimal places
    }
    
    /**
     * Calculate shipping cost based on city
     * Pricing: Rp 10,000 for same city, +Rp 5,000 per different city
     * 
     * @param string $sellerCity Seller's city
     * @param string $buyerCity Buyer's city
     * @param float $distance Distance in km (optional, for future use)
     * @return array Shipping details
     */
    public static function calculateShippingCost($sellerCity, $buyerCity, $distance = 0) {
        $baseCost = 10000; // Rp 10,000 base cost (start price)
        $costPerHop = 5000; // Rp 5,000 per city passed
        
        // Normalize city names
        $sellerCityNorm = strtolower(trim($sellerCity));
        $buyerCityNorm = strtolower(trim($buyerCity));
        
        $isSameCity = ($sellerCityNorm === $buyerCityNorm);
        $shippingCost = $baseCost;
        $additionalCost = 0;
        
        if (!$isSameCity) {
            // Logic: Estimate cities passed based on distance
            // Assumption: Average inter-city distance is ~40km
            // If distance is small (< 30km) but different city name (border), counting as 1 hop
            
            if ($distance <= 30) {
                $hops = 1;
            } else {
                // For longer distances, every 40km adds another "city hop"
                $hops = ceil(($distance - 30) / 40) + 1;
            }
            
            // Limit max hops reasonable (e.g. max 200k ongkir)
            if ($hops > 40) $hops = 40;
            
            $additionalCost = $hops * $costPerHop;
            $shippingCost = $baseCost + $additionalCost;
        }
        
        // Estimate delivery time
        $estimatedDelivery = self::estimateDeliveryTime($distance, $isSameCity);
        
        return [
            'shipping_cost' => $shippingCost,
            'base_cost' => $baseCost,
            'additional_cost' => $additionalCost,
            'is_same_city' => $isSameCity,
            'distance_km' => $distance,
            'estimated_delivery' => $estimatedDelivery,
            'seller_city' => $sellerCity,
            'buyer_city' => $buyerCity
        ];
    }
    
    /**
     * Estimate delivery time based on distance
     * @param float $distance Distance in km
     * @param bool $isSameCity Whether same city or not
     * @return string Estimated delivery time
     */
    private static function estimateDeliveryTime($distance, $isSameCity) {
        if ($isSameCity) {
            if ($distance <= 10) {
                return '1 hari';
            } else {
                return '1-2 hari';
            }
        } else {
            if ($distance <= 50) {
                return '2-3 hari';
            } else if ($distance <= 100) {
                return '3-5 hari';
            } else {
                return '5-7 hari';
            }
        }
    }
    
    /**
     * Get shipping cost breakdown for display
     * @param array $shippingDetails From calculateShippingCost
     * @return string Formatted breakdown
     */
    public static function getShippingBreakdown($shippingDetails) {
        $breakdown = "Ongkir: Rp " . number_format($shippingDetails['shipping_cost'], 0, ',', '.');
        
        if ($shippingDetails['is_same_city']) {
            $breakdown .= " (Dalam kota)";
        } else {
            $breakdown .= " (Beda kota +Rp " . number_format($shippingDetails['additional_cost'], 0, ',', '.') . ")";
        }
        
        $breakdown .= "\nEstimasi: " . $shippingDetails['estimated_delivery'];
        
        return $breakdown;
    }
}
?>
