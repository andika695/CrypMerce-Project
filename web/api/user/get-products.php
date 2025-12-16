<?php
require '../config/config.php';

$sql = "
    SELECT 
        p.id,
        p.name,
        p.price,
        p.image,
        c.name AS category
    FROM products p
    JOIN categories c ON p.category_id = c.id
    ORDER BY p.created_at DESC
";

$stmt = $pdo->query($sql);
$products = $stmt->fetchAll();

echo json_encode($products);
