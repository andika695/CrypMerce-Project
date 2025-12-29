<?php
/**
 * Security Helper Functions for CrypMerce API
 * Centralized security utilities for all API endpoints
 */

/**
 * Generate CSRF Token
 */
function generateCSRFToken() {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    
    if (!isset($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    
    return $_SESSION['csrf_token'];
}

/**
 * Validate CSRF Token
 */
function validateCSRFToken($token) {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    
    if (!isset($_SESSION['csrf_token'])) {
        return false;
    }
    
    return hash_equals($_SESSION['csrf_token'], $token);
}

/**
 * Sanitize input to prevent XSS
 */
function sanitizeInput($input, $allowHTML = false) {
    if (is_array($input)) {
        return array_map(function($item) use ($allowHTML) {
            return sanitizeInput($item, $allowHTML);
        }, $input);
    }
    
    $input = trim($input);
    
    if (!$allowHTML) {
        $input = htmlspecialchars($input, ENT_QUOTES, 'UTF-8');
    } else {
        // Strip potentially dangerous tags but keep basic formatting
        $input = strip_tags($input, '<p><br><strong><em><u><a>');
    }
    
    return $input;
}

/**
 * Validate image file
 * @param array $file File from $_FILES
 * @param int $maxSize Maximum file size in bytes (default 5MB)
 * @return array ['valid' => bool, 'error' => string]
 */
function validateImageFile($file, $maxSize = 5242880) {
    // Check if file exists
    if (!isset($file) || !isset($file['tmp_name']) || empty($file['tmp_name'])) {
        return ['valid' => false, 'error' => 'Tidak ada file yang dipilih'];
    }
    
    // Check upload errors
    if ($file['error'] !== UPLOAD_ERR_OK) {
        $errors = [
            UPLOAD_ERR_INI_SIZE => 'File terlalu besar (melebihi batas server)',
            UPLOAD_ERR_FORM_SIZE => 'File terlalu besar',
            UPLOAD_ERR_PARTIAL => 'File hanya terupload sebagian',
            UPLOAD_ERR_NO_FILE => 'Tidak ada file yang dipilih',
            UPLOAD_ERR_NO_TMP_DIR => 'Folder temporary tidak ditemukan',
            UPLOAD_ERR_CANT_WRITE => 'Gagal menulis file',
            UPLOAD_ERR_EXTENSION => 'Upload dibatalkan oleh extension'
        ];
        return ['valid' => false, 'error' => $errors[$file['error']] ?? 'Error upload tidak diketahui'];
    }
    
    // Check file size
    if ($file['size'] > $maxSize) {
        $maxMB = round($maxSize / 1048576, 1);
        return ['valid' => false, 'error' => "File terlalu besar. Maksimal {$maxMB}MB"];
    }
    
    // Check file size is not zero
    if ($file['size'] === 0) {
        return ['valid' => false, 'error' => 'File kosong atau tidak valid'];
    }
    
    // Validate MIME type
    $allowedMimes = [
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'image/gif',
        'image/webp'
    ];
    
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);
    
    if (!in_array($mimeType, $allowedMimes)) {
        return ['valid' => false, 'error' => 'Tipe file tidak diizinkan. Hanya JPEG, PNG, GIF, dan WebP yang diperbolehkan'];
    }
    
    // Validate file extension
    $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    
    if (!in_array($extension, $allowedExtensions)) {
        return ['valid' => false, 'error' => 'Extension file tidak valid'];
    }
    
    // Validate image dimensions (optional - prevent extremely large images)
    $imageInfo = @getimagesize($file['tmp_name']);
    if ($imageInfo === false) {
        return ['valid' => false, 'error' => 'File bukan gambar yang valid'];
    }
    
    $maxWidth = 4000;
    $maxHeight = 4000;
    if ($imageInfo[0] > $maxWidth || $imageInfo[1] > $maxHeight) {
        return ['valid' => false, 'error' => "Dimensi gambar terlalu besar. Maksimal {$maxWidth}x{$maxHeight} pixels"];
    }
    
    return ['valid' => true, 'error' => null];
}

/**
 * Simple rate limiting
 * @param string $key Unique identifier (e.g., user_id or IP)
 * @param int $maxAttempts Maximum attempts allowed
 * @param int $timeWindow Time window in seconds
 * @return bool True if within limit, false if exceeded
 */
function checkRateLimit($key, $maxAttempts = 10, $timeWindow = 60) {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    
    $rateLimitKey = 'rate_limit_' . $key;
    $now = time();
    
    if (!isset($_SESSION[$rateLimitKey])) {
        $_SESSION[$rateLimitKey] = [
            'attempts' => 1,
            'start_time' => $now
        ];
        return true;
    }
    
    $data = $_SESSION[$rateLimitKey];
    
    // Reset if time window has passed
    if ($now - $data['start_time'] > $timeWindow) {
        $_SESSION[$rateLimitKey] = [
            'attempts' => 1,
            'start_time' => $now
        ];
        return true;
    }
    
    // Increment attempts
    $_SESSION[$rateLimitKey]['attempts']++;
    
    // Check if limit exceeded
    if ($_SESSION[$rateLimitKey]['attempts'] > $maxAttempts) {
        return false;
    }
    
    return true;
}

/**
 * Log security events
 * @param string $event Event type
 * @param string $message Event message
 * @param array $context Additional context
 */
function logSecurityEvent($event, $message, $context = []) {
    $logDir = dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . 'logs';
    
    if (!is_dir($logDir)) {
        @mkdir($logDir, 0755, true);
    }
    
    $logFile = $logDir . DIRECTORY_SEPARATOR . 'security_' . date('Y-m-d') . '.log';
    
    $logEntry = [
        'timestamp' => date('Y-m-d H:i:s'),
        'event' => $event,
        'message' => $message,
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
        'context' => $context
    ];
    
    $logLine = json_encode($logEntry) . PHP_EOL;
    
    @file_put_contents($logFile, $logLine, FILE_APPEND);
}

/**
 * Validate and sanitize coordinates
 * @param float $lat Latitude
 * @param float $lon Longitude
 * @return array ['valid' => bool, 'lat' => float, 'lon' => float, 'error' => string]
 */
function validateCoordinates($lat, $lon) {
    $lat = filter_var($lat, FILTER_VALIDATE_FLOAT);
    $lon = filter_var($lon, FILTER_VALIDATE_FLOAT);
    
    if ($lat === false || $lon === false) {
        return ['valid' => false, 'error' => 'Koordinat tidak valid'];
    }
    
    if ($lat < -90 || $lat > 90 || $lon < -180 || $lon > 180) {
        return ['valid' => false, 'error' => 'Koordinat di luar jangkauan yang valid'];
    }
    
    return ['valid' => true, 'lat' => $lat, 'lon' => $lon, 'error' => null];
}

/**
 * Check if request has valid authentication
 * @param array $allowedRoles Allowed user roles
 * @return array ['authenticated' => bool, 'user_id' => int, 'role' => string, 'error' => string]
 */
function checkAuthentication($allowedRoles = ['user', 'seller']) {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    
    if (!isset($_SESSION['user_id']) || !isset($_SESSION['role'])) {
        return [
            'authenticated' => false,
            'error' => 'Unauthorized: Silakan login terlebih dahulu'
        ];
    }
    
    if (!in_array($_SESSION['role'], $allowedRoles)) {
        return [
            'authenticated' => false,
            'error' => 'Forbidden: Anda tidak memiliki akses ke resource ini'
        ];
    }
    
    return [
        'authenticated' => true,
        'user_id' => $_SESSION['user_id'],
        'role' => $_SESSION['role'],
        'error' => null
    ];
}

/**
 * Send JSON response with proper headers
 * @param array $data Response data
 * @param int $statusCode HTTP status code
 */
function sendJSONResponse($data, $statusCode = 200) {
    // Clear any previous output
    if (ob_get_length()) ob_clean();
    
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}
?>
