<?php
// Function reusable untuk mengirim notifikasi
function createNotification($pdo, $userId, $title, $message, $orderId = null, $type = 'info') {
    $stmt = $pdo->prepare("INSERT INTO notifications (user_id, order_id, title, message, type) VALUES (?, ?, ?, ?, ?)");
    $stmt->execute([$userId, $orderId, $title, $message, $type]);
}
?>
