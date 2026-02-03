<?php
header("Content-Type: text/plain");

$host = 'localhost';
$user = 'root';
$pass = ''; 
$dbname = 'lista de usuarios'; 

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Adicionar colunas se não existirem
    $sql = "
    ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS name VARCHAR(255) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS phone VARCHAR(50) DEFAULT NULL;
    ";
    
    // Obs: IF NOT EXISTS no ADD COLUMN é suportado no MySQL 8.0+. 
    // Para versões antigas (MariaDB comum no XAMPP), pode falhar se já existir.
    // Vamos tentar uma abordagem mais segura para versões antigas: verificar primeiro.
    
    $stmt = $pdo->query("DESCRIBE users");
    $cols = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    if(!in_array('name', $cols)){
        $pdo->exec("ALTER TABLE users ADD COLUMN name VARCHAR(255) DEFAULT NULL");
        echo "Coluna 'name' adicionada.\n";
    } else {
        echo "Coluna 'name' já existe.\n";
    }

    if(!in_array('phone', $cols)){
        $pdo->exec("ALTER TABLE users ADD COLUMN phone VARCHAR(50) DEFAULT NULL");
        echo "Coluna 'phone' adicionada.\n";
    } else {
        echo "Coluna 'phone' já existe.\n";
    }

    // Adicionar is_admin se não existir
    if (!in_array("is_admin", $cols)) {
        $pdo->exec("ALTER TABLE users ADD COLUMN is_admin TINYINT(1) DEFAULT 0");
        echo "Coluna 'is_admin' adicionada.\n";
    }

    // Criar tabela de produtos
    $pdo->exec("CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        league VARCHAR(50),
        price DECIMAL(10, 2) NOT NULL,
        img LONGTEXT,
        images LONGTEXT,
        badge VARCHAR(50),
        featured TINYINT(1) DEFAULT 0,
        type VARCHAR(50) DEFAULT 'torcedor',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");
    
    // Atualizar img para LONGTEXT se já existir como VARCHAR
    try {
        $pdo->exec("ALTER TABLE products MODIFY COLUMN img LONGTEXT");
    } catch (Exception $e) {
        // Ignorar se falhar (ex: tabela nao existe ainda)
    }
    // Adicionar coluna images se não existir
    try {
        $stmt = $pdo->query("DESCRIBE products");
        $cols = $stmt->fetchAll(PDO::FETCH_COLUMN);
        if(!in_array('images', $cols)){
            $pdo->exec("ALTER TABLE products ADD COLUMN images LONGTEXT");
            echo "Coluna 'images' adicionada.\n";
        } else {
            echo "Coluna 'images' já existe.\n";
        }
        // Adicionar colunas de variantes (preços) se não existirem
        if(!in_array('price_torcedor', $cols)){
            $pdo->exec("ALTER TABLE products ADD COLUMN price_torcedor DECIMAL(10,2) DEFAULT NULL");
            echo "Coluna 'price_torcedor' adicionada.\n";
        } else {
            echo "Coluna 'price_torcedor' já existe.\n";
        }
        if(!in_array('price_jogador', $cols)){
            $pdo->exec("ALTER TABLE products ADD COLUMN price_jogador DECIMAL(10,2) DEFAULT NULL");
            echo "Coluna 'price_jogador' adicionada.\n";
        } else {
            echo "Coluna 'price_jogador' já existe.\n";
        }
    } catch (Exception $e) {
        // Ignore
    }

    try { $pdo->exec("SET GLOBAL max_allowed_packet=67108864"); } catch (Exception $e) {}
    try { $pdo->exec("SET SESSION max_allowed_packet=67108864"); } catch (Exception $e) {}

    echo "Tabela 'products' verificada/criada.\n";
    
    echo "Estrutura atualizada com sucesso.";

} catch (PDOException $e) {
    echo "Erro: " . $e->getMessage();
}
?>
