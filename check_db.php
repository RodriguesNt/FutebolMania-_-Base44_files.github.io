<?php
header("Content-Type: text/plain");

$host = 'localhost';
$user = 'root';
$pass = ''; // Senha padrão XAMPP/WAMP costuma ser vazia
$dbname = 'lista de usuarios'; // Nome conforme imagem

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "Conexão OK!\n";

    // Verificar colunas
    $stmt = $pdo->query("DESCRIBE users");
    $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo "Colunas encontradas: " . implode(", ", $columns) . "\n";

} catch (PDOException $e) {
    echo "Erro: " . $e->getMessage();
}
?>