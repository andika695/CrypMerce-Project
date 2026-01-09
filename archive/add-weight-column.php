<?php
require 'api/config/config.php';

try {
    // Check if column exists
    $stmt = $pdo->query("SHOW COLUMNS FROM products LIKE 'weight'");
    $exists = $stmt->fetch();

    if ($exists) {
        echo "<h1>Kolom 'weight' sudah ada!</h1>";
        echo "<p>Tidak perlu update lagi.</p>";
    } else {
        // Add column
        $sql = "ALTER TABLE products ADD COLUMN weight INT DEFAULT 1000 AFTER stock";
        $pdo->exec($sql);
        
        echo "<h1>BERHASIL!</h1>";
        echo "<p>Kolom <code>weight</code> berhasil ditambahkan ke tabel products.</p>";
        echo "<p>Sekarang error di dashboard harusnya sudah hilang.</p>";
    }
    
    echo "<br><a href='seller/dashboard.php'>Kembali ke Dashboard</a>";

} catch (PDOException $e) {
    echo "<h1>ERROR</h1>";
    echo "<p>" . $e->getMessage() . "</p>";
}
?>
