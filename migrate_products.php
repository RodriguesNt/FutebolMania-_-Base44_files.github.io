<?php
header("Content-Type: text/plain");

$host = 'localhost';
$user = 'root';
$pass = ''; 
$dbname = 'lista de usuarios'; 

$products = [
  ["id"=>"flamengo-home", "name"=>"Flamengo 24/25 Home", "league"=>"br", "price"=>100, "img"=>"https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?auto=format&fit=crop&w=800&q=80", "badge"=>"Destaque", "featured"=>true, "type"=>"torcedor"],
  ["id"=>"palmeiras-home", "name"=>"Palmeiras 24/25 Home", "league"=>"br", "price"=>100, "img"=>"https://images.unsplash.com/photo-1577212017184-80cc0da11082?auto=format&fit=crop&w=800&q=80", "featured"=>true, "type"=>"torcedor"],
  ["id"=>"city-home", "name"=>"Man City 24/25 Home", "league"=>"pl", "price"=>100, "img"=>"https://images.unsplash.com/photo-1551854838-212c50b4c184?auto=format&fit=crop&w=800&q=80", "featured"=>true, "type"=>"torcedor"],
  ["id"=>"brasil-home", "name"=>"Brasil 24/25", "league"=>"sel", "price"=>100, "img"=>"https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?auto=format&fit=crop&w=800&q=80", "type"=>"torcedor"],
  ["id"=>"real-home", "name"=>"Real Madrid 24/25", "league"=>"ll", "price"=>100, "img"=>"https://images.unsplash.com/photo-1551854838-212c50b4c184?auto=format&fit=crop&w=800&q=80", "type"=>"torcedor"],
  ["id"=>"barca-home", "name"=>"Barcelona 24/25", "league"=>"ll", "price"=>100, "img"=>"https://images.unsplash.com/photo-1577212017184-80cc0da11082?auto=format&fit=crop&w=800&q=80", "type"=>"torcedor"],
  ["id"=>"fla-short", "name"=>"Short Flamengo 24/25", "league"=>"br", "price"=>115, "img"=>"https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?auto=format&fit=crop&w=800&q=80", "type"=>"short"],
  ["id"=>"fla-wind", "name"=>"Corta Vento Flamengo", "league"=>"br", "price"=>270, "img"=>"https://images.unsplash.com/photo-1577212017184-80cc0da11082?auto=format&fit=crop&w=800&q=80", "type"=>"cortavento"],
  ["id"=>"real-player", "name"=>"Real Madrid 24/25 Jogador", "league"=>"ll", "price"=>130, "img"=>"https://images.unsplash.com/photo-1551854838-212c50b4c184?auto=format&fit=crop&w=800&q=80", "type"=>"jogador"]
];

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $sql = "INSERT IGNORE INTO products (id, name, league, price, img, badge, featured, type, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())";
    $stmt = $pdo->prepare($sql);

    foreach ($products as $p) {
        $badge = isset($p['badge']) ? $p['badge'] : null;
        $featured = isset($p['featured']) && $p['featured'] ? 1 : 0;
        $type = isset($p['type']) ? $p['type'] : 'torcedor';
        
        $stmt->execute([$p['id'], $p['name'], $p['league'], $p['price'], $p['img'], $badge, $featured, $type]);
    }
    
    echo "Produtos migrados com sucesso.";

} catch (PDOException $e) {
    echo "Erro: " . $e->getMessage();
}
?>