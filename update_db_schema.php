<?php
// DB Config Candidates
$configs = [
    ['host' => 'localhost', 'user' => 'root', 'pass' => 'rootpass123', 'port' => 3306],
    ['host' => '127.0.0.1', 'user' => 'root', 'pass' => 'rootpass123', 'port' => 3306],
    ['host' => 'localhost', 'user' => 'root', 'pass' => '', 'port' => 3306],
    ['host' => 'localhost', 'user' => 'root', 'pass' => 'root', 'port' => 3306],
    ['host' => 'localhost', 'user' => 'root', 'pass' => 'rootpass123', 'port' => 3307],
];

echo "Attempting database connection...\n";

$connected = false;
$pdo = null;

foreach ($configs as $cfg) {
    try {
        echo "Trying {$cfg['host']}:{$cfg['port']} with user '{$cfg['user']}'... ";
        $dsn = "mysql:host={$cfg['host']};port={$cfg['port']};dbname=crypmerce_database;charset=utf8mb4";
        $pdo = new PDO($dsn, $cfg['user'], $cfg['pass'], [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
        ]);
        echo "SUCCESS!\n";
        $connected = true;
        break;
    } catch (PDOException $e) {
        echo "Failed.\n";
    }
}

if (!$connected) {
    die("Could not connect to database with any known method.\n");
}

try {
    echo "Adding midtrans_order_uuid column to orders table...\n";
    
    // Check if column exists
    $check = $pdo->query("SHOW COLUMNS FROM orders LIKE 'midtrans_order_uuid'");
    if ($check->rowCount() == 0) {
        $sql = "ALTER TABLE orders ADD COLUMN midtrans_order_uuid VARCHAR(255) AFTER id";
        $pdo->exec($sql);
        echo "Column 'midtrans_order_uuid' added successfully.\n";
    } else {
        echo "Column 'midtrans_order_uuid' already exists.\n";
    }

    echo "Migration completed.\n";

} catch (PDOException $e) {
    echo "Migration Error: " . $e->getMessage() . "\n";
}
?>
