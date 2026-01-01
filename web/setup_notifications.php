<?php
require_once 'api/config/config.php';

echo "<h2>Setup Notifikasi</h2>";

try {
    $sql = "CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        order_id INT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT,
        type VARCHAR(50) DEFAULT 'info',
        is_read TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

    $pdo->exec($sql);
    echo "<p style='color:green'>Tabel 'notifications' berhasil dibuat/diperiksa.</p>";

    // Cek kolom type jika tabel sudah ada sebelumnya tapi belum ada kolom type
    $check = $pdo->query("SHOW COLUMNS FROM notifications LIKE 'type'");
    if ($check->rowCount() == 0) {
        $pdo->exec("ALTER TABLE notifications ADD COLUMN type VARCHAR(50) DEFAULT 'info' AFTER message");
        echo "<p>Kolom 'type' ditambahkan.</p>";
    }

} catch (PDOException $e) {
    echo "<p style='color:red'>Error: " . $e->getMessage() . "</p>";
}
?>
