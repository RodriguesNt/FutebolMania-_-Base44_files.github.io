<?php
header("Content-Type: text/plain");

$host = 'localhost';
$user = 'root';
$pass = ''; 
$dbname = 'lista de usuarios'; 

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $email = 'admin@futebolmania.com';
    $password = 'admin123';
    $name = 'Administrador Principal';
    $phone = '00000000000';
    $cpf = '000.000.000-00';
    $login = 'admin';

    // Hash da senha (usando SHA-256 para compatibilidade com o frontend atual que usa SHA-256 no JS)
    // Nota: O ideal seria bcrypt no backend, mas o frontend atual manda hash SHA-256.
    // Vamos manter o padrão do frontend por enquanto: frontend manda hash, backend salva hash.
    // Se o frontend manda senha crua, backend faz hash.
    // Verificando products.js: postUserToDB faz hash antes de enviar.
    // Então aqui devemos simular isso ou salvar o hash direto.
    $password_hash = hash('sha256', $password);

    // Verificar se já existe
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        // Atualizar para admin
        $stmt = $pdo->prepare("UPDATE users SET is_admin = 1, password_hash = ? WHERE email = ?");
        $stmt->execute([$password_hash, $email]);
        echo "Usuário admin atualizado (senha resetada para admin123).\n";
    } else {
        // Criar novo
        $stmt = $pdo->prepare("INSERT INTO users (email, login, cpf, password_hash, name, phone, is_admin, created_at) VALUES (?, ?, ?, ?, ?, ?, 1, NOW())");
        $stmt->execute([$email, $login, $cpf, $password_hash, $name, $phone]);
        echo "Usuário admin criado com sucesso.\n";
    }
    
    echo "Email: $email\n";
    echo "Senha: $password\n";

} catch (PDOException $e) {
    echo "Erro: " . $e->getMessage();
}
?>