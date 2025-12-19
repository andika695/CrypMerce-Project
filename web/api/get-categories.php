<?php
// web/api/get-categories.php
header('Content-Type: application/json');
require_once 'config/config.php';

try {
    $stmt = $pdo->query("SELECT id, name FROM categories ORDER BY name ASC");
    $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'categories' => $categories]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error']);
}
