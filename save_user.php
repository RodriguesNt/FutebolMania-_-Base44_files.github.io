<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");

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
    echo json_encode(["ok" => false, "error" => "db_connection_failed: " . $e->getMessage()]);
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
$login = isset($data['login']) ? $data['login'] : $email;
$cpf = isset($data['cpf']) ? $data['cpf'] : '';
$password_hash = isset($data['password_hash']) ? $data['password_hash'] : '';
$name = isset($data['name']) ? $data['name'] : '';
$phone = isset($data['phone']) ? $data['phone'] : '';

if (!$email) {
    http_response_code(400);
    echo json_encode(["ok" => false, "error" => "email_required"]);
    exit;
}

// Verificar duplicidade
$stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
$stmt->execute([$email]);
if ($stmt->fetch()) {
    http_response_code(400);
    echo json_encode(["ok" => false, "error" => "email_exists"]);
    exit;
}

// Inserir no banco
$sql = "INSERT INTO users (email, login, cpf, password_hash, name, phone, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())";
$stmt = $pdo->prepare($sql);

try {
    $stmt->execute([$email, $login, $cpf, $password_hash, $name, $phone]);
    echo json_encode(["ok" => true]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["ok" => false, "error" => "insert_failed: " . $e->getMessage()]);
}
?>