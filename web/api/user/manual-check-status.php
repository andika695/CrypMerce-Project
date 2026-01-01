<?php
require_once '../config/config.php';
require_once '../../checkout/midtrans-php-master/Midtrans.php';

// Midtrans Config
\Midtrans\Config::$serverKey = getenv('MIDTRANS_SERVER_KEY');
\Midtrans\Config::$isProduction = false;
\Midtrans\Config::$isSanitized = true;
\Midtrans\Config::$is3ds = true;

header('Content-Type: application/json');

$json = file_get_contents('php://input');
$data = json_decode($json);

if (!$data || !isset($data->order_id)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Order ID required']);
    exit;
}

$orderUuid = $data->order_id;

try {
    // 1. Cek status ke Midtrans
    $rawStatus = \Midtrans\Transaction::status($orderUuid);
    $midtransStatus = (object) $rawStatus; // Cast to object to handle array return possibility
    
    $transactionStatus = $midtransStatus->transaction_status ?? null;
    $fraudStatus = $midtransStatus->fraud_status ?? null;

    $final_status = 'pending';

    if ($transactionStatus == 'capture') {
        if ($fraudStatus == 'challenge') {
            $final_status = 'pending';
        } else {
            $final_status = 'processing';
        }
    } else if ($transactionStatus == 'settlement') {
        $final_status = 'processing';
    } else if ($transactionStatus == 'deny' || $transactionStatus == 'expire' || $transactionStatus == 'cancel') {
        $final_status = 'cancelled';
    }

    // 2. Update Database (Copy logic dari notification-handler)
    $pdo->beginTransaction();

    $stmtGet = $pdo->prepare("SELECT id, status, buyer_id FROM orders WHERE midtrans_order_uuid = ?");
    $stmtGet->execute([$orderUuid]);
    $order = $stmtGet->fetch(PDO::FETCH_ASSOC);

    if (!$order) {
        throw new Exception("Order not found in local database");
    }

    $db_id = $order['id'];
    $current_status = $order['status'];
    $updated = false;

    // Logic stok (Processing = Paid)
    if ($final_status == 'processing' && $current_status != 'processing' && $current_status != 'completed') {
        // Ambil item
        $stmtItems = $pdo->prepare("SELECT product_id, quantity FROM order_items WHERE order_id = ?");
        $stmtItems->execute([$db_id]);
        $items = $stmtItems->fetchAll(PDO::FETCH_ASSOC);

        // Update stok
        $updateStock = $pdo->prepare("UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?");
        foreach ($items as $item) {
            $updateStock->execute([$item['quantity'], $item['product_id'], $item['quantity']]);
        }
        $updated = true;
    }

    // Update status jika berubah
    if ($current_status != $final_status) {
        $updateStmt = $pdo->prepare("UPDATE orders SET status = ? WHERE id = ?");
        $updateStmt->execute([$final_status, $db_id]);
        $updated = true;

        // Create Notification (Only for payment success 'processing')
        if ($final_status === 'processing') {
             require_once '../helpers/notification_helper.php';
             createNotification($pdo, $order['buyer_id'], "Pembayaran Berhasil", "Pembayaran telah diverifikasi. Menunggu konfirmasi penjual.", $db_id, 'success');
        }
    }

    $pdo->commit();

    echo json_encode([
        'success' => true,
        'status' => $final_status,
        'updated' => $updated,
        'message' => 'Transaction status verified'
    ]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
