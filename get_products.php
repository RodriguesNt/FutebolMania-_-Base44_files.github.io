<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

$host = 'localhost';
$user = 'root';
$pass = ''; 
$dbname = 'lista de usuarios'; 

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $stmt = $pdo->query("SELECT * FROM products ORDER BY created_at DESC");
    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Converter tipos numéricos se necessário
    foreach ($products as &$p) {
        $p['price'] = isset($p['price']) ? (float)$p['price'] : 0.0;
        if(isset($p['price_torcedor'])) $p['price_torcedor'] = $p['price_torcedor']!==null ? (float)$p['price_torcedor'] : null;
        if(isset($p['price_jogador'])) $p['price_jogador'] = $p['price_jogador']!==null ? (float)$p['price_jogador'] : null;
        $p['featured'] = (bool)$p['featured'];
        if(isset($p['images']) && $p['images']){
            $decoded = json_decode($p['images'], true);
            $p['images'] = is_array($decoded) ? $decoded : [];
        } else {
            $p['images'] = [];
        }
    }

    echo json_encode(["ok" => true, "products" => $products]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["ok" => false, "error" => $e->getMessage()]);
}
?>
