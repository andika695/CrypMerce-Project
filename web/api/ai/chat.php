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
    // 2. RAG Sederhana: Keyword Extraction/Category Match
    // Bersihkan tanda baca
    $cleanMessage = preg_replace('/[^\w\s]/', ' ', $userMessage);
    $keywords = explode(' ', $cleanMessage);
    
    $searchTerms = [];
    foreach ($keywords as $word) {
        $word = trim($word);
        // Abaikan kata pendek/umum, kecuali kata 2 huruf tertentu
        if ((strlen($word) >= 3 || in_array(strtolower($word), ['hp', 'tv', 'pc', 'lg'])) && 
            !in_array(strtolower($word), ['saya', 'aku', 'kami', 'anda', 'yang', 'dari', 'untuk', 'ingin', 'mau', 'cari', 'butuh', 'adalah', 'nama', 'bisa', 'tolong', 'tanya', 'dimana', 'apakah', 'penjual', 'toko', 'rekomendasi', 'saran'])) {
            $searchTerms[] = $word;
        }
    }

    $products = [];
    $matchedCategories = [];

    // Ambil daftar kategori untuk konteks
    $catStmt = $pdo->query("SELECT name FROM categories");
    $allCategories = $catStmt->fetchAll(PDO::FETCH_COLUMN);
    $categoryListStr = implode(", ", $allCategories);

    if (!empty($searchTerms)) {
        // Buat query dinamis: Cek di Produk Name, Desc, DAN Category Name
        $paramSql = [];
        $params = [];
        foreach ($searchTerms as $i => $term) {
            $paramSql[] = "(p.name LIKE :term{$i} OR p.description LIKE :term{$i} OR c.name LIKE :term{$i})";
            $params["term{$i}"] = "%" . $term . "%";
        }
        
        // Update SQL: Join dengan Categories dan Sellers
        $sql = "SELECT p.id, p.name, p.price, p.stock, p.description, s.store_name, s.city, c.name as category_name
                FROM products p
                JOIN sellers s ON p.seller_id = s.id
                JOIN categories c ON p.category_id = c.id
                WHERE p.stock > 0 AND (" . implode(' OR ', $paramSql) . ") 
                LIMIT 5";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    // Fallback: Jika search biasa kosong, cek apakah ada keyword yang COCOK BANGET dengan nama Kategori
    if (empty($products) && !empty($searchTerms)) {
        foreach ($searchTerms as $term) {
            // Cari kategori yang mirip dengan term
            $matchedCat = null;
            foreach ($allCategories as $catName) {
                if (stripos($catName, $term) !== false) {
                    $matchedCat = $catName;
                    break;
                }
            }
            
            if ($matchedCat) {
                // Query khusus berdasarkan Kategori match
                $stmt = $pdo->prepare("SELECT p.id, p.name, p.price, p.stock, p.description, s.store_name, s.city, c.name as category_name
                                       FROM products p
                                       JOIN sellers s ON p.seller_id = s.id
                                       JOIN categories c ON p.category_id = c.id
                                       WHERE c.name = :catName AND p.stock > 0
                                       LIMIT 5");
                $stmt->execute(['catName' => $matchedCat]);
                $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                if (!empty($products)) break; // Jika sudah ketemu produk, stop loop
            }
        }
    }

    if ($products) {
        $contextData .= "Stok Produk Real-time (sesuai pencarian/kategori user):\n";
        foreach ($products as $p) {
           $storeInfo = $p['store_name'] . ($p['city'] ? " ({$p['city']})" : "");
           $link = "product-detail.html?id=" . $p['id'];
           $contextData .= "- [{$p['category_name']}] {$p['name']}: Rp " . number_format($p['price'], 0, ',', '.') . 
                           " | Stok: {$p['stock']} | Toko: {$storeInfo} | Link: {$link}\n";
        }
    } else {
         // Fallback: Produk Unggulan
         $stmt = $pdo->query("SELECT p.id, p.name, p.price, s.store_name, c.name as category_name
                              FROM products p
                              LEFT JOIN sellers s ON p.seller_id = s.id 
                              LEFT JOIN categories c ON p.category_id = c.id
                              ORDER BY p.created_at DESC LIMIT 3");
         $feature = $stmt->fetchAll(PDO::FETCH_ASSOC);  
         $contextData .= "Info Produk Terbaru (Pencarian spesifik tidak ketemu):\n";
         foreach ($feature as $p) {
            $storeName = $p['store_name'] ?? 'CrypMerce Official';
            $catName = $p['category_name'] ?? 'Umum';
            $link = "product-detail.html?id=" . $p['id'];
            $contextData .= "- [{$catName}] {$p['name']}: Rp " . number_format($p['price'], 0, ',', '.') . " (Toko: {$storeName}) | Link: {$link}\n";
         }
    }
    
    // Tambahkan daftar kategori ke konteks agar AI tahu apa saja yang tersedia
    $contextData .= "\nKategori Tersedia di Toko: " . $categoryListStr . "\n";
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