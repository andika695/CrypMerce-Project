<?php
// Use direct .env loading or assume key is set if not using DB
$apiKey = "AIzaSyCIMJD2HapF46Yqrt-BuUdtdvFIoZXaT2s";
echo "Using Key: " . substr($apiKey, 0, 5) . "...\n";

echo "Using Key: " . substr($apiKey, 0, 5) . "...\n";

$url = "https://generativelanguage.googleapis.com/v1beta/models?key=" . $apiKey;

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);

$data = json_decode($response, true);

if (isset($data['models'])) {
    echo "Available Models:\n";
    foreach ($data['models'] as $model) {
        if (strpos($model['name'], 'generateContent') !== false || strpos($model['name'], 'gemini') !== false) {
            echo "- " . $model['name'] . "\n";
            echo "  Methods: " . implode(", ", $model['supportedGenerationMethods'] ?? []) . "\n";
        }
    }
} else {
    echo "Error listing models: " . $response;
}
?>
