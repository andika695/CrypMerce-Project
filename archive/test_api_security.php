<?php
/**
 * CrypMerce API Security Test Script
 * Tests various security improvements implemented
 */

echo "=== CrypMerce API Security Tests ===\n\n";

// Test 1: Security Helpers File Exists
echo "Test 1: Checking Security Helper Functions...\n";
$securityHelperPath = __DIR__ . '/api/config/security-helpers.php';
if (file_exists($securityHelperPath)) {
    require_once $securityHelperPath;
    echo "✓ Security helpers file exists\n";
    
    // Test individual functions
    if (function_exists('sanitizeInput')) {
        echo "✓ sanitizeInput() function available\n";
        $test = sanitizeInput('<script>alert("xss")</script>');
        if (strpos($test, '<script>') === false) {
            echo "✓ XSS protection working\n";
        }
    }
    
    if (function_exists('validateImageFile')) {
        echo "✓ validateImageFile() function available\n";
    }
    
    if (function_exists('checkRateLimit')) {
        echo "✓ checkRateLimit() function available\n";
    }
    
    if (function_exists('logSecurityEvent')) {
        echo "✓ logSecurityEvent() function available\n";
    }
} else {
    echo "✗ Security helpers file NOT found\n";
}

echo "\n";

// Test 2: Config File Security Headers
echo "Test 2: Checking Config Security Settings...\n";
$configPath = __DIR__ . '/api/config/config.php';
if (file_exists($configPath)) {
    $configContent = file_get_contents($configPath);
    
    if (strpos($configContent, 'X-Content-Type-Options') !== false) {
        echo "✓ Security headers configured\n";
    }
    
    if (strpos($configContent, 'CORS') !== false || strpos($configContent, 'Access-Control') !== false) {
        echo "✓ CORS configuration present\n";
    }
    
    if (strpos($configContent, 'session.cookie_httponly') !== false) {
        echo "✓ Secure session configuration present\n";
    }
} else {
    echo "✗ Config file NOT found\n";
}

echo "\n";

// Test 3: Cloudinary File Validation
echo "Test 3: Checking Cloudinary Security...\n";
$cloudinaryPath = __DIR__ . '/api/config/cloudinary.php';
if (file_exists($cloudinaryPath)) {
    $cloudinaryContent = file_get_contents($cloudinaryPath);
    
    if (strpos($cloudinaryContent, 'validateImageFile') !== false) {
        echo "✓ File validation implemented in Cloudinary upload\n";
    } else {
        echo "✗ File validation NOT found\n";
    }
    
    if (strpos($cloudinaryContent, 'security-helpers') !== false) {
        echo "✓ Security helpers imported\n";
    }
} else {
    echo "✗ Cloudinary config NOT found\n";
}

echo "\n";

// Test 4: PlaceOrder.php Fixes
echo "Test 4: Checking PlaceOrder.php Security...\n";
$placeOrderPath = __DIR__ . '/checkout/PlaceOrder.php';
if (file_exists($placeOrderPath)) {
    $placeOrderContent = file_get_contents($placeOrderPath);
    
    // Check for duplicate params (should NOT exist)
    $paramsCount = substr_count($placeOrderContent, '$params = [');
    if ($paramsCount === 1) {
        echo "✓ No duplicate parameter definitions\n";
    } else {
        echo "✗ Warning: Found $paramsCount parameter definitions\n";
    }
    
    if (strpos($placeOrderContent, 'security-helpers') !== false) {
        echo "✓ Security helpers imported\n";
    }
    
    if (strpos($placeOrderContent, 'sanitizeInput') !== false) {
        echo "✓ Input sanitization implemented\n";
    }
    
    if (strpos($placeOrderContent, 'FILTER_VALIDATE') !== false) {
        echo "✓ Input validation implemented\n";
    }
    
    if (strpos($placeOrderContent, 'logSecurityEvent') !== false) {
        echo "✓ Error logging implemented\n";
    }
} else {
    echo "✗ PlaceOrder.php NOT found\n";
}

echo "\n";

// Test 5: Authentication Security
echo "Test 5: Checking Login Security...\n";
$loginPath = __DIR__ . '/api/auth/login.php';
if (file_exists($loginPath)) {
    $loginContent = file_get_contents($loginPath);
    
    if (strpos($loginContent, 'checkRateLimit') !== false) {
        echo "✓ Rate limiting implemented\n";
    }
    
    if (strpos($loginContent, 'session_regenerate_id') !== false) {
        echo "✓ Session regeneration implemented\n";
    }
    
    if (strpos($loginContent, 'logSecurityEvent') !== false) {
        echo "✓ Login attempt logging implemented\n";
    }
} else {
    echo "✗ Login file NOT found\n";
}

echo "\n";

// Test 6: Geocoding Security
echo "Test 6: Checking Geocoding Security...\n";
$geocodePath = __DIR__ . '/api/utils/geocode-lookup.php';
if (file_exists($geocodePath)) {
    $geocodeContent = file_get_contents($geocodePath);
    
    if (strpos($geocodeContent, 'checkRateLimit') !== false) {
        echo "✓ Rate limiting implemented\n";
    }
    
    if (strpos($geocodeContent, 'validateCoordinates') !== false) {
        echo "✓ Coordinate validation implemented\n";
    }
} else {
    echo "✗ Geocode lookup file NOT found\n";
}

echo "\n";

// Test 7: Seller API Security
echo "Test 7: Checking Seller API Security...\n";
$addProductPath = __DIR__ . '/api/seller/add-product.php';
if (file_exists($addProductPath)) {
    $addProductContent = file_get_contents($addProductPath);
    
    if (strpos($addProductContent, 'sanitizeInput') !== false) {
        echo "✓ Input sanitization in add-product\n";
    }
    
    if (strpos($addProductContent, 'checkRateLimit') !== false) {
        echo "✓ Rate limiting in add-product\n";
    }
    
    if (strpos($addProductContent, 'error_log') !== false) {
        echo "✓ Error logging in add-product\n";
    }
} else {
    echo "✗ Add product file NOT found\n";
}

echo "\n";

// Test 8: User API Security
echo "Test 8: Checking User API Security...\n";
$updateProfilePath = __DIR__ . '/api/user/update-profile.php';
if (file_exists($updateProfilePath)) {
    $updateProfileContent = file_get_contents($updateProfilePath);
    
    if (strpos($updateProfileContent, 'sanitizeInput') !== false) {
        echo "✓ Input sanitization in update-profile\n";
    }
    
    if (strpos($updateProfileContent, 'logSecurityEvent') !== false) {
        echo "✓ Security event logging in update-profile\n";
    }
} else {
    echo "✗ Update profile file NOT found\n";
}

echo "\n";

// Test 9: Log Directory
echo "Test 9: Checking Log Directory...\n";
$logDir = __DIR__ . '/logs';
if (!is_dir($logDir)) {
    if (@mkdir($logDir, 0755, true)) {
        echo "✓ Log directory created\n";
    } else {
        echo "✗ Could not create log directory\n";
    }
} else {
    echo "✓ Log directory exists\n";
}

echo "\n";

// Summary
echo "=== Test Summary ===\n";
echo "Security implementation tests completed.\n";
echo "Please review any ✗ marks above for issues.\n";
echo "\nNext steps:\n";
echo "1. Test payment flow manually\n";
echo "2. Test image upload with various file types\n";
echo "3. Test location features\n";
echo "4. Monitor logs/security_*.log files\n";
?>
