<?php 
header('Content-Type: application/json');
require '../config/config.php';

// 1. Ambil Pesan User
$input = json_decode(file_get_contents('php://input'), true);
$userMessage = $input['message'] ?? '';

if (empty($userMessage)) {
    echo json_encode(['reply' => 'Halo! Ada yang bisa saya bantu?']);
    exit;
}

// 2. RAG Sederhana: Cari Produk yang Relevan di Database
// Kita cari produk yang namanya mirip dengan pesan user untuk dijadikan konteks
$contextData = "";
try {
    // 2. RAG Sederhana: Keyword Extraction
    // Bersihkan tanda baca (titik, koma, tanya, seru) agar keyword bersih
    $cleanMessage = preg_replace('/[^\w\s]/', ' ', $userMessage);
    $keywords = explode(' ', $cleanMessage);
    
    $searchTerms = [];
    foreach ($keywords as $word) {
        $word = trim($word);
        // Abaikan kata pendek, tapi izinkan kata 2 huruf seperti 'hp', 'tv', 'pc'
        if ((strlen($word) >= 3 || in_array(strtolower($word), ['hp', 'tv', 'pc', 'lg'])) && !in_array(strtolower($word), ['saya', 'aku', 'kami', 'anda', 'yang', 'dari', 'untuk', 'ingin', 'mau', 'cari', 'butuh', 'adalah', 'nama', 'bisa', 'tolong', 'tanya', 'dimana', 'apakah', 'penjual', 'toko'])) {
            $searchTerms[] = $word;
        }
    }

    $products = [];
    if (!empty($searchTerms)) {
        // Buat query dinamis: (name LIKE %word1% OR description LIKE %word1%) OR (name LIKE %word2%...)
        $paramSql = [];
        $params = [];
        foreach ($searchTerms as $i => $term) {
            $paramSql[] = "(p.name LIKE :term{$i} OR p.description LIKE :term{$i})";
            $params["term{$i}"] = "%" . $term . "%";
        }
        
        // Update SQL: Join dengan tabel sellers
        $sql = "SELECT p.id, p.name, p.price, p.stock, p.description, s.store_name, s.city 
                FROM products p
                JOIN sellers s ON p.seller_id = s.id
                WHERE p.stock > 0 AND (" . implode(' OR ', $paramSql) . ") LIMIT 5";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    if ($products) {
        $contextData .= "Stok Produk Real-time (sesuai pencarian user):\n";
        foreach ($products as $p) {
           $storeInfo = $p['store_name'] . ($p['city'] ? " ({$p['city']})" : "");
           $link = "product-detail.html?id=" . $p['id'];
           $contextData .= "- {$p['name']}: Rp " . number_format($p['price'], 0, ',', '.') . 
                           " | Stok: {$p['stock']} | Toko: {$storeInfo} | Link: {$link}\n";
        }
    } else {
         // Jika tidak ada keyword spesifik, ambil beberapa produk unggulan/terbaru sebagai overview
         // Update juga di sini untuk menampilkan nama toko (jika ada)
         // Note: Kita pakai LEFT JOIN di backup query jaga-jaga kalau ada produk tanpa seller valid
         $stmt = $pdo->query("SELECT p.id, p.name, p.price, s.store_name 
                              FROM products p
                              LEFT JOIN sellers s ON p.seller_id = s.id 
                              ORDER BY p.created_at DESC LIMIT 3");
         $feature = $stmt->fetchAll(PDO::FETCH_ASSOC);  
         $contextData .= "Info Produk Terbaru (Katakan ini rekomendasi umum karena pencarian spesifik tidak ketemu):\n";
         foreach ($feature as $p) {
            $storeName = $p['store_name'] ?? 'CrypMerce Official';
            $link = "product-detail.html?id=" . $p['id'];
            $contextData .= "- {$p['name']}: Rp " . number_format($p['price'], 0, ',', '.') . " (Toko: {$storeName}) | Link: {$link}\n";
         }
    }
} catch (Exception $e) { 
    error_log("Context Error: " . $e->getMessage());
}

// 3. Susun System Prompt untuk Gemini
$systemPrompt = "
Kamu adalah 'CrypBot', asisten AI pintar untuk toko online 'CrypMerce'.
Tugasmu adalah membantu pelanggan mencari produk dan menjawab pertanyaan seputar toko.
Gunakan Bahasa Indonesia yang ramah, sopan, dan membantu.

DATA KONTEKS TOKO (Gunakan ini untuk menjawab):
{$contextData}

ATURAN:
1. Jika user bertanya produk, prioritaskan data dari KONTEKS di atas.
2. Jika produk tidak ada di konteks, katakan bahwa kamu tidak menemukan produk yang spesifik, tapi tawarkan rekomendasi lain.
3. Jangan mengarang harga atau stok jika tidak ada datanya.
4. Jawablah dengan ringkas (maksimal 3-4 kalimat) kecuali diminta menjelaskan detail.
5. PENTING: Jika merekomendasikan produk, WAJIB sertakan linknya dalam format markdown: [Lihat Produk](url_produk).
";

// 4. Panggil Gemini API
$apiKey = getenv('GEMINI_API_KEY');
if (!$apiKey && isset($_ENV['GEMINI_API_KEY'])) {
    $apiKey = $_ENV['GEMINI_API_KEY'];
}

$apiEndpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=" . $apiKey;

$payload = [
    "contents" => [
        [
            "parts" => [
                [
                    "text" => $systemPrompt . "\n\nUser: " . $userMessage . "\nAI:"
                ]
            ]
        ]
    ]
];

$ch = curl_init($apiEndpoint);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));

$response = curl_exec($ch);
$curlError = curl_error($ch);
$curlErrno = curl_errno($ch);
curl_close($ch);

// 5. Proses Response
$responseData = json_decode($response, true);
$aiReply = "Maaf, saya sedang istirahat sebentar (Error API).";

if ($curlErrno) {
    $aiReply .= " Curl Error: " . $curlError;
} elseif (isset($responseData['error'])) {
    $aiReply .= " Gemini Error: " . ($responseData['error']['message'] ?? 'Unknown');
} elseif (isset($responseData['candidates'][0]['content']['parts'][0]['text'])) {
    $aiReply = $responseData['candidates'][0]['content']['parts'][0]['text'];
} else {
    $aiReply .= " Debug: " . substr($response, 0, 200); // Show raw response if JSON fails
}

echo json_encode(['reply' => $aiReply]);
?>