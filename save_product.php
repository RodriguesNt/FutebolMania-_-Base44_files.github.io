<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$host = 'localhost';
$user = 'root';
$pass = ''; 
$dbname = 'lista de usuarios'; 

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    try { $pdo->exec("SET SESSION max_allowed_packet=67108864"); } catch (Throwable $e) {}
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["ok" => false, "error" => "db_connection_failed"]);
    exit;
}

$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(["ok" => false, "error" => "invalid_json"]);
    exit;
}

// Verificar autenticação de admin (simplificada: requer email e password_hash no corpo)
// Em produção, usar token/session
$authEmail = isset($data['auth_email']) ? $data['auth_email'] : '';
$authHash = isset($data['auth_hash']) ? $data['auth_hash'] : '';

if (!$authEmail || !$authHash) {
    http_response_code(401);
    echo json_encode(["ok" => false, "error" => "unauthorized"]);
    exit;
}

$stmt = $pdo->prepare("SELECT is_admin FROM users WHERE email = ? AND password_hash = ?");
$stmt->execute([$authEmail, $authHash]);
$admin = $stmt->fetch();

if (!$admin || !$admin['is_admin']) {
    http_response_code(403);
    echo json_encode(["ok" => false, "error" => "forbidden_not_admin"]);
    exit;
}

$action = isset($data['action']) ? $data['action'] : '';

if ($action === 'delete') {
    try {
        $id = isset($data['id']) ? $data['id'] : '';
        if (!$id) {
            echo json_encode(["ok" => false, "error" => "missing_id"]);
            exit;
        }
        $stmt = $pdo->prepare("DELETE FROM products WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(["ok" => true]);
        exit;
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode(["ok" => false, "error" => "delete_failed: " . $e->getMessage()]);
        exit;
    }
}

if ($action === 'save') {
    try {
        $product = isset($data['product']) ? $data['product'] : null;
        if (!$product) {
            echo json_encode(["ok" => false, "error" => "missing_product_data"]);
            exit;
        }
        
        $id = isset($product['id']) ? $product['id'] : '';
        if (!$id) {
            // Gerar ID se novo
            $id = uniqid('prod_');
        }
    
    $name = $product['name'];
    $league = isset($product['league']) ? $product['league'] : '';
    $price = isset($product['price']) ? $product['price'] : null;
    $priceTorcedor = isset($product['price_torcedor']) && $product['price_torcedor']!=='' ? (float)$product['price_torcedor'] : null;
    $priceJogador = isset($product['price_jogador']) && $product['price_jogador']!=='' ? (float)$product['price_jogador'] : null;
        $images = isset($product['images']) ? $product['images'] : null;
        $imageUrls = isset($product['image_urls']) ? $product['image_urls'] : [];
        if (!is_array($images)) $images = [];
        if (!is_array($imageUrls)) $imageUrls = [];
        if (count($imageUrls) > 0) {
            // Baixar imagens por URL e converter para data URL base64
            foreach ($imageUrls as $u) {
                $u = trim($u);
                if ($u === '') continue;
                $ch = curl_init($u);
                curl_setopt_array($ch, [
                    CURLOPT_RETURNTRANSFER => true,
                    CURLOPT_FOLLOWLOCATION => true,
                    CURLOPT_SSL_VERIFYPEER => false,
                    CURLOPT_SSL_VERIFYHOST => false,
                    CURLOPT_TIMEOUT => 15,
                ]);
                $bin = curl_exec($ch);
                $ctype = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
                curl_close($ch);
                if ($bin && strlen($bin) > 0) {
                    $mime = $ctype ? explode(';', $ctype)[0] : 'image/jpeg';
                    $images[] = 'data:' . $mime . ';base64,' . base64_encode($bin);
                }
            }
        }
        $img = isset($product['img']) ? $product['img'] : '';
        if(!$img && is_array($images) && count($images)>0){
            $img = $images[0];
        }
        if((!$img || strlen($img)<10) && (!is_array($images) || count($images)===0)){
            echo json_encode(["ok" => false, "error" => "missing_image"]);
            exit;
        }
    $badge = isset($product['badge']) ? $product['badge'] : '';
        $featured = isset($product['featured']) && $product['featured'] ? 1 : 0;
        $type = isset($product['type']) ? $product['type'] : 'torcedor';
        $imagesJson = $images ? json_encode($images) : null;
    
    // Definir preço base como o menor entre as variantes informadas
    if ($price === null && ($priceTorcedor !== null || $priceJogador !== null)) {
        $candidates = [];
        if ($priceTorcedor !== null) $candidates[] = $priceTorcedor;
        if ($priceJogador !== null) $candidates[] = $priceJogador;
        if (count($candidates) > 0) $price = min($candidates);
    }
    if ($price === null) $price = 0;
    
        // Verificar se existe para UPDATE ou INSERT
        $stmt = $pdo->prepare("SELECT id FROM products WHERE id = ?");
        $stmt->execute([$id]);
        if ($stmt->fetch()) {
        $sql = "UPDATE products SET name=?, league=?, price=?, price_torcedor=?, price_jogador=?, img=?, images=?, badge=?, featured=?, type=? WHERE id=?";
            $stmt = $pdo->prepare($sql);
        $stmt->execute([$name, $league, $price, $priceTorcedor, $priceJogador, $img, $imagesJson, $badge, $featured, $type, $id]);
        } else {
        $sql = "INSERT INTO products (id, name, league, price, price_torcedor, price_jogador, img, images, badge, featured, type, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())";
            $stmt = $pdo->prepare($sql);
        $stmt->execute([$id, $name, $league, $price, $priceTorcedor, $priceJogador, $img, $imagesJson, $badge, $featured, $type]);
        }
        echo json_encode(["ok" => true, "id" => $id]);
        exit;
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode(["ok" => false, "error" => "save_failed: " . $e->getMessage()]);
        exit;
    }
}

// Mesclar dois produtos (torcedor/jogador) em um único registro por nome
if ($action === 'merge_by_name') {
    try {
        $name = isset($data['name']) ? trim($data['name']) : '';
        if ($name === '') {
            echo json_encode(["ok" => false, "error" => "missing_name"]);
            exit;
        }
        $stmt = $pdo->prepare("SELECT * FROM products WHERE name = ?");
        $stmt->execute([$name]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        if (!$rows || count($rows) < 2) {
            echo json_encode(["ok" => false, "error" => "not_found_or_single"]);
            exit;
        }
        $tor = null; $jog = null;
        foreach ($rows as $r) {
            $t = isset($r['type']) ? $r['type'] : '';
            if ($t === 'torcedor' && $tor === null) $tor = $r;
            if ($t === 'jogador' && $jog === null) $jog = $r;
        }
        if (!$tor && !$jog) {
            echo json_encode(["ok" => false, "error" => "no_variants_found"]);
            exit;
        }
        $base = $tor ? $tor : $rows[0];
        $otherIds = [];
        foreach ($rows as $r) {
            if ($r['id'] !== $base['id']) $otherIds[] = $r['id'];
        }
        $league = $base['league'];
        $priceTor = $tor ? (float)$tor['price'] : null;
        $priceJog = $jog ? (float)$jog['price'] : null;
        $imagesMerged = [];
        $pushImgs = function($row) use (&$imagesMerged) {
            if (!$row) return;
            if (!empty($row['images'])) {
                $arr = json_decode($row['images'], true);
                if (is_array($arr)) {
                    foreach ($arr as $img) {
                        if (is_string($img) && strlen($img) > 10 && !in_array($img, $imagesMerged, true)) {
                            $imagesMerged[] = $img;
                        }
                    }
                }
            }
            if (!empty($row['img']) && strlen($row['img']) > 10 && !in_array($row['img'], $imagesMerged, true)) {
                $imagesMerged[] = $row['img'];
            }
        };
        $pushImgs($tor);
        $pushImgs($jog);
        $imgCover = count($imagesMerged) > 0 ? $imagesMerged[0] : ($base['img'] ?? '');
        $imagesJson = count($imagesMerged) > 0 ? json_encode($imagesMerged) : null;
        $badge = $base['badge'] ?? '';
        $featured = isset($base['featured']) && $base['featured'] ? 1 : 0;
        $typeFinal = 'torcedor'; // manter tipo padrão único
        $priceBase = 0.0;
        if ($priceTor !== null && $priceJog !== null) {
            $priceBase = min($priceTor, $priceJog);
        } elseif ($priceTor !== null) {
            $priceBase = $priceTor;
        } elseif ($priceJog !== null) {
            $priceBase = $priceJog;
        } else {
            $priceBase = isset($base['price']) ? (float)$base['price'] : 0.0;
        }
        // Atualizar registro base com dados mesclados
        $sql = "UPDATE products SET name=?, league=?, price=?, price_torcedor=?, price_jogador=?, img=?, images=?, badge=?, featured=?, type=? WHERE id=?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$name, $league, $priceBase, $priceTor, $priceJog, $imgCover, $imagesJson, $badge, $featured, $typeFinal, $base['id']]);
        // Excluir demais registros
        if (!empty($otherIds)) {
            $in = implode(",", array_fill(0, count($otherIds), "?"));
            $del = $pdo->prepare("DELETE FROM products WHERE id IN ($in)");
            $del->execute($otherIds);
        }
        echo json_encode(["ok" => true, "id" => $base['id']]);
        exit;
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode(["ok" => false, "error" => "merge_failed: " . $e->getMessage()]);
        exit;
    }
}

echo json_encode(["ok" => false, "error" => "invalid_action"]);
?>
