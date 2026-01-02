<?php
header('Content-Type: application/json');
require_once '../config/config.php';
session_start();

if (!isset($_SESSION['seller']) || !isset($_SESSION['seller']['seller_id'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['order_id']) || !isset($data['status'])) {
    echo json_encode(['success' => false, 'message' => 'Missing required fields']);
    exit;
}

$order_id = $data['order_id'];
$status = $data['status'];
$seller_id = $_SESSION['seller']['seller_id'];

try {
    // Verify order belongs to seller AND fetch buyer_id for notification
    $checkStmt = $pdo->prepare("SELECT id, buyer_id FROM orders WHERE id = :order_id AND seller_id = :seller_id");
    $checkStmt->execute(['order_id' => $order_id, 'seller_id' => $seller_id]);
    
    $orderData = $checkStmt->fetch(PDO::FETCH_ASSOC);

    if (!$orderData) {
        echo json_encode(['success' => false, 'message' => 'Order not found or access denied']);
        exit;
    }

    $stmt = $pdo->prepare("UPDATE orders SET status = :status WHERE id = :order_id");
    $stmt->execute(['status' => $status, 'order_id' => $order_id]);

    // Send Notification
    require_once '../helpers/notification_helper.php';
    
    $title = "Update Pesanan";
    $message = "Status pesanan Anda telah diperbarui.";
    $type = "info";

    if ($status === 'processing') {
        $title = "Pesanan Diterima";
        $message = "Penjual telah menerima pesanan Anda.";
    } else if ($status === 'confirmed') {
        $title = "Pesanan Dikonfirmasi";
        $message = "Pesanan sedang dikemas oleh penjual.";
        $type = "success";
    } else if ($status === 'shipped') {
        $title = "Pesanan Dikirim";
        $message = "Pesanan Anda sedang dalam perjalanan.";
        $type = "success";
    } else if ($status === 'cancelled') {
        $title = "Pesanan Ditolak";
        $message = "Maaf, pesanan Anda ditolak oleh penjual.";
        $type = "error";
    } else if ($status === 'return_approved') {
        $title = "Return Disetujui";
        $message = "Penjual telah menyetujui return Anda. Silakan kirim barang kembali.";
        $type = "success";
    } else if ($status === 'return_rejected') {
        $title = "Return Ditolak";
        $message = "Maaf, permintaan return Anda ditolak oleh penjual.";
        $type = "error";
    } else if ($status === 'return_completed') {
        $title = "Return Berhasil";
        $message = "Barang return telah diterima oleh penjual. Proses return selesai.";
        $type = "success";
    }

    createNotification($pdo, $orderData['buyer_id'], $title, $message, $order_id, $type);

    echo json_encode(['success' => true, 'message' => 'Order status updated successfully']);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
