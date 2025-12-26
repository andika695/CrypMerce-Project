<?php
session_start();

require_once __DIR__ . '/midtrans-php-master/Midtrans.php';
require_once __DIR__ . '/../api/config/config.php'; // koneksi PDO

use Midtrans\Config;
use Midtrans\Snap;

/* =====================
   VALIDASI LOGIN
===================== */
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo "Unauthorized";
    exit;
}

/* =====================
   KONFIGURASI MIDTRANS
===================== */
Config::$serverKey = getenv('MIDTRANS_SERVER_KEY');
Config::$isProduction = false;
Config::$isSanitized = true;
Config::$is3ds = true;

/* =====================
   AMBIL DATA JSON
===================== */
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    http_response_code(400);
    echo "Invalid JSON";
    exit;
}

$total_price = (int) $input['total_price'];
$items = $input['items'];

/* =====================
   AMBIL DATA USER
===================== */
$userId = $_SESSION['user_id'];

$stmt = $pdo->prepare("
    SELECT username, email, phone 
    FROM users 
    WHERE id = ?
");
$stmt->execute([$userId]);
$user = $stmt->fetch();

if (!$user) {
    http_response_code(404);
    echo "User not found";
    exit;
}

/* =====================
   PARAMETER MIDTRANS
===================== */
$params = [
    'transaction_details' => [
        'order_id' => 'ORDER-' . time(),
        'gross_amount' => $total_price
    ],
    'item_details' => $items,
    'customer_details' => [
        'first_name' => $user['username'],
        'email' => $user['email'],
        'phone' => $user['phone'] ?? '081000000000'
    ]
];

/* =====================
   REQUEST SNAP TOKEN
===================== */
$snapToken = Snap::getSnapToken($params);
echo $snapToken;
