<?php
require '../config/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    die('Invalid request');
}

$seller_id   = $_POST['seller_id'];
$category_id = $_POST['category_id'];
$name        = $_POST['name'];
$price       = $_POST['price'];
$stock       = $_POST['stock'];
$description = $_POST['description'] ?? null;

$imageName = null;
if (!empty($_FILES['image']['name'])) {
    $imageName = time() . '_' . $_FILES['image']['name'];
    move_uploaded_file(
        $_FILES['image']['tmp_name'],
        '../../assets/images/products/' . $imageName
    );
}

$sql = "INSERT INTO products
        (seller_id, category_id, name, price, stock, description, image)
        VALUES
        (:seller_id, :category_id, :name, :price, :stock, :description, :image)";

$stmt = $pdo->prepare($sql);
$stmt->execute([
    'seller_id'   => $seller_id,
    'category_id' => $category_id,
    'name'        => $name,
    'price'       => $price,
    'stock'       => $stock,
    'description' => $description,
    'image'       => $imageName
]);

echo "Produk berhasil disimpan";
