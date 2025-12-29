<?php
require_once __DIR__ . '/api/config/config.php';
session_start();

if (!isset($_SESSION['user_id'])) {
    die("Not logged in. Session User ID: " . json_encode($_SESSION));
}

$userId = $_SESSION['user_id'];

try {
    $stmt = $pdo->prepare("SELECT id, username, latitude, longitude, address, address_detail FROM users WHERE id = :id");
    $stmt->execute([':id' => $userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    echo "<h1>Database Debug Check</h1>";
    echo "<p>User ID: " . htmlspecialchars($userId) . "</p>";
    echo "<pre>";
    print_r($user);
    echo "</pre>";

    echo "<h2>Session Data</h2>";
    echo "<pre>";
    print_r($_SESSION);
    echo "</pre>";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
