<?php
session_start();

// Mengambil konfigurasi dari environment variables
$clientKey = getenv('MIDTRANS_CLIENT_KEY');
$isProduction = (getenv('MIDTRANS_IS_PRODUCTION') === 'true');

// Menentukan URL Snap JS berdasarkan lingkungan
$snapUrl = $isProduction 
    ? "https://app.midtrans.com/snap/snap.js" 
    : "https://app.sandbox.midtrans.com/snap/snap.js";

header('Content-Type: application/json');
echo json_encode([
    'success' => true,
    'client_key' => $clientKey,
    'snap_url' => $snapUrl,
    'is_production' => $isProduction
]);
?>
