<?php
// Load key from environment variable
$apiKey = getenv('GEMINI_API_KEY');
if (!$apiKey && isset($_ENV['GEMINI_API_KEY'])) {
    $apiKey = $_ENV['GEMINI_API_KEY'];
}

if (!$apiKey) {
    die("Error: GEMINI_API_KEY is not set in environment variables or .env file.\n");
}

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
