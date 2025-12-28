<?php
require_once '../config/config.php'; 

// Ambil data JSON dari body request
$json = file_get_contents('php://input');
$data = json_decode($json);


if (!$data || !isset($data->id) || !isset($data->status)) {
    http_response_code(400);
    die("Error: Format JSON tidak sesuai. Gunakan {'id': '...', 'status': '...'}");
}

$order_id = $data->id; 
$status_midtrans = strtolower($data->status); 
$final_status = 'pending';

// status untuk database
if ($status_midtrans == 'Settlement' || $status_midtrans == 'capture') {
    $final_status = 'processing'; 
} else if ($status_midtrans == 'cancelled' || $status_midtrans == 'cancel') {
    $final_status = 'cancelled';
}

try {
    $pdo->beginTransaction();

    //  Jika statusnya batal/gagal, kembalikan stok produk
    if ($final_status == 'cancelled') {
        // Ambil item produk untuk order ini
        $stmtItems = $pdo->prepare("SELECT product_id, quantity FROM order_items WHERE order_id = ?");
        $stmtItems->execute([$order_id]);
        $items = $stmtItems->fetchAll(PDO::FETCH_ASSOC);

        // Update stok: Cukup tambah kembali 
        $updateStock = $pdo->prepare("UPDATE products SET stock = stock + ? WHERE id = ?");
        foreach ($items as $item) {
            $updateStock->execute([
                $item['quantity'], 
                $item['product_id']
            ]);
        }
    }

    $pdo->commit();
    echo json_encode(["success" => true, "status_sekarang" => $final_status]);

} catch (Exception $e) {
    $pdo->rollBack();
    echo "Database Error: " . $e->getMessage();
}

$db_id = $data->id; 
$status_midtrans = $data->status; 



try {
    // Update tabel orders berdasarkan ID numerik
    $query = "UPDATE orders SET status = ? WHERE id = ?";
    $stmt = $pdo->prepare($query);
    $stmt->execute([$final_status, $db_id]);

    http_response_code(200);
    echo json_encode([
        "success" => true,
        "message" => "Status pesanan ID $db_id berhasil diupdate ke $final_status"
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo "Database Error: " . $e->getMessage();
}