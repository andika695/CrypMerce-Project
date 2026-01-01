<?php
require_once '../config/config.php'; 

// Ambil data JSON dari body request (Midtrans Standard Notification)
$json = file_get_contents('php://input');
$data = json_decode($json);

if (!$data) {
    http_response_code(400);
    die("Error: No data received");
}

// Log notification untuk debugging (opsional)
// file_put_contents('midtrans_log.txt', print_r($data, true), FILE_APPEND);

// Ambil Order ID (yang kita kirim sebagai ORDER-xxx-yyy)
$order_id_midtrans = $data->order_id ?? null;
$transaction_status = $data->transaction_status ?? null;
$fraud_status = $data->fraud_status ?? null;

if (!$order_id_midtrans) {
    die("Error: No Order ID");
}

// Tentukan status final berdasarkan status transaksi Midtrans
$final_status = 'pending';

if ($transaction_status == 'capture') {
    if ($fraud_status == 'challenge') {
        $final_status = 'pending';
    } else {
        $final_status = 'processing'; // Paid
    }
} else if ($transaction_status == 'settlement') {
    $final_status = 'processing'; // Paid
} else if ($transaction_status == 'pending') {
    $final_status = 'pending';
} else if ($transaction_status == 'deny' || $transaction_status == 'expire' || $transaction_status == 'cancel') {
    $final_status = 'cancelled'; 
}

try {
    $pdo->beginTransaction();

    // 1. Cari Order berdasarkan UUID
    $stmtGet = $pdo->prepare("SELECT id, status, buyer_id FROM orders WHERE midtrans_order_uuid = ?");
    $stmtGet->execute([$order_id_midtrans]);
    $order = $stmtGet->fetch(PDO::FETCH_ASSOC);

    if (!$order) {
        throw new Exception("Order with UUID $order_id_midtrans not found");
    }

    $db_id = $order['id'];
    $current_status = $order['status'];

    // 2. Logika Pengurangan Stok (Hanya jika status berubah menjadi processing/paid)
    //    Dan pastikan belum pernah diproses sebelumnya (idempotency check sederhana)
    if ($final_status == 'processing' && $current_status != 'processing' && $current_status != 'completed') {
        
        // Ambil item produk
        $stmtItems = $pdo->prepare("SELECT product_id, quantity FROM order_items WHERE order_id = ?");
        $stmtItems->execute([$db_id]);
        $items = $stmtItems->fetchAll(PDO::FETCH_ASSOC);

        // Kurangi Stok
        $updateStock = $pdo->prepare("UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?");
        
        foreach ($items as $item) {
            $qty = (int)$item['quantity'];
            $prodId = (int)$item['product_id'];

            $updateStock->execute([$qty, $prodId, $qty]);

            if ($updateStock->rowCount() === 0) {
                // Opsional: Handle jika stok habis saat pembayaran berhasil
                // Untuk sekarang kita biarkan, atau bisa set status khusus 'failed_stock'
                // throw new Exception("Stock insufficent for Product ID $prodId");
            }
        }
    }

    // 3. Update Status Order
    if ($current_status != $final_status) {
        $updateStmt = $pdo->prepare("UPDATE orders SET status = ? WHERE id = ?");
        $updateStmt->execute([$final_status, $db_id]);

        // Kirim Notifikasi jika status processing (Success)
        if ($final_status == 'processing') {
            require_once '../helpers/notification_helper.php';
            createNotification($pdo, $order['buyer_id'], "Pembayaran Berhasil", "Pembayaran Anda telah diterima. Menunggu konfirmasi penjual.", $db_id, "success");
        }
    }

    $pdo->commit();
    echo json_encode(["success" => true, "status" => $final_status]);

} catch (Exception $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo "Error: " . $e->getMessage();
}
?>