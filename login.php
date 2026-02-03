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

$email = isset($data['email']) ? $data['email'] : '';
$password = isset($data['password']) ? $data['password'] : '';

// Suporte legado para password_hash enviado diretamente (opcional, mas bom manter se algum código antigo usar)
$password_hash_input = isset($data['password_hash']) ? $data['password_hash'] : '';

if (!$email || (!$password && !$password_hash_input)) {
    http_response_code(400);
    echo json_encode(["ok" => false, "error" => "missing_credentials"]);
    exit;
}

// Buscar usuário (somente colunas existentes)
$stmt = $pdo->prepare("SELECT id, name, email, phone, cpf, login, password_hash, is_admin FROM users WHERE email = ?");
$stmt->execute([$email]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    echo json_encode(["ok" => false, "error" => "user_not_found"]);
    exit;
}

// Verificar senha
// 1. Se enviou senha plana, faz hash e compara
// 2. Se enviou hash direto, compara direto
$valid = false;
if ($password) {
    // Usando SHA-256 para compatibilidade com o sistema atual
    if (hash('sha256', $password) === $user['password_hash']) {
        $valid = true;
    }
} elseif ($password_hash_input) {
    if ($password_hash_input === $user['password_hash']) {
        $valid = true;
    }
}

if (!$valid) {
    echo json_encode(["ok" => false, "error" => "invalid_password"]);
    exit;
}

// Remover senha do retorno
unset($user['password_hash']);

// Retornar dados do usuário com flag is_admin
echo json_encode(["ok" => true, "user" => $user]);
?>
