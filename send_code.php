<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

$input = file_get_contents('php://input');
$data = json_decode($input, true);
if (!$data || !isset($data['email']) || !isset($data['code'])) {
  http_response_code(400);
  echo json_encode(["ok"=>false, "error"=>"invalid_request"]);
  exit;
}

$email = trim($data['email']);
$code = trim($data['code']);
if ($email === '' || $code === '') {
  http_response_code(400);
  echo json_encode(["ok"=>false, "error"=>"invalid_fields"]);
  exit;
}

$subject = "Seu código de verificação";
$body = "Olá,\n\nSeu código de verificação é: {$code}\n\nSe você não solicitou, ignore este e-mail.\n\nFutebolMania";
$from = getenv('SMTP_FROM') ?: 'no-reply@localhost';

$autoload = __DIR__ . '/vendor/autoload.php';
if (file_exists($autoload)) {
  require_once $autoload;
}

if (class_exists('\\PHPMailer\\PHPMailer\\PHPMailer')) {
  try {
    $mail = new \PHPMailer\PHPMailer\PHPMailer(true);

    $host = getenv('SMTP_HOST');
    $user = getenv('SMTP_USER');
    $pass = getenv('SMTP_PASS');
    $port = getenv('SMTP_PORT') ?: 587;
    $secure = getenv('SMTP_SECURE') ?: 'tls';

    if ($host && $user && $pass) {
      $mail->isSMTP();
      $mail->Host = $host;
      $mail->SMTPAuth = true;
      $mail->Username = $user;
      $mail->Password = $pass;
      $mail->SMTPSecure = $secure;
      $mail->Port = (int)$port;
    } else {
      $mail->isMail();
    }

    $mail->CharSet = 'UTF-8';
    $mail->setFrom($from, 'FutebolMania');
    $mail->addAddress($email);
    $mail->Subject = $subject;
    $mail->Body = $body;
    $mail->AltBody = $body;

    $mail->send();
    echo json_encode(["ok"=>true]);
  } catch (\Throwable $e) {
    http_response_code(500);
    echo json_encode(["ok"=>false, "error"=>"send_failed"]);
  }
} else {
  $headers = "From: FutebolMania <{$from}>\r\n";
  $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
  $ok = @mail($email, $subject, $body, $headers);
  if ($ok) {
    echo json_encode(["ok"=>true]);
  } else {
    http_response_code(500);
    echo json_encode(["ok"=>false, "error"=>"mail_failed"]);
  }
}
?> 
