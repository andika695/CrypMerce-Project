<?php
include '../config/config.php';
session_start();

$user_id = $_SESSION['user_id']; // Ambil ID user dari session login

// Query untuk mengambil riwayat pesanan beserta satu contoh nama produk untuk ringkasan
$query = "SELECT o.*, 
          (SELECT p.name FROM order_items oi 
           JOIN products p ON oi.product_id = p.id 
           WHERE oi.order_id = o.id LIMIT 1) as first_product_name,
          (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as total_items
          FROM orders o 
          WHERE o.buyer_id = ? 
          ORDER BY o.created_at DESC";

$stmt = $conn->prepare($query);
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();

$orders = [];
while($row = $result->fetch_assoc()) {
    $orders[] = $row;
}

echo json_encode(['success' => true, 'data' => $orders]);
?>