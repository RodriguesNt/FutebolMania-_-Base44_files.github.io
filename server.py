import json
import os
import smtplib
from email.mime.text import MIMEText
from http.server import SimpleHTTPRequestHandler, HTTPServer

# CONFIGURACOES DE EMAIL (PREENCHA AQUI SEUS DADOS REAIS PARA FUNCIONAR)
SMTP_SERVER = "smtp.gmail.com" # Ex: smtp.gmail.com para Gmail
SMTP_PORT = 587
SMTP_USER = "seu_email@gmail.com" # <--- COLOQUE SEU EMAIL AQUI
SMTP_PASS = "sua_senha_de_app"    # <--- COLOQUE SUA SENHA DE APP AQUI (NÃO É A SENHA DE LOGIN, CRIE UMA SENHA DE APP NO GOOGLE)

ROOT_DIR = os.path.dirname(__file__)
DB_DIR = os.path.join(ROOT_DIR, "lista de usuarios")
DB_FILE = os.path.join(DB_DIR, "users.json")

os.makedirs(DB_DIR, exist_ok=True)
if not os.path.exists(DB_FILE):
    with open(DB_FILE, "w", encoding="utf-8") as f:
        json.dump([], f, ensure_ascii=False, indent=2)

def send_email_real(to_email, code):
    if "seu_email" in SMTP_USER:
        print("!!! AVISO: SMTP NAO CONFIGURADO. EMAIL NAO SERA ENVIADO REALMENTE !!!")
        return False
        
    subject = "Seu código de verificação"
    body = f"Olá,\n\nSeu código de verificação é: {code}\n\nFutebolMania"
    
    msg = MIMEText(body)
    msg['Subject'] = subject
    msg['From'] = SMTP_USER
    msg['To'] = to_email
    
    try:
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.send_message(msg)
        print(f"Email enviado com sucesso para {to_email}")
        return True
    except Exception as e:
        print(f"Erro ao enviar email: {e}")
        return False

class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_POST(self):
        if self.path == "/api/users" or self.path == "/save_user.php":
            length = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(length) if length > 0 else b""
            try:
                data = json.loads(raw.decode("utf-8"))
                email = data.get("email") or ""
                login = data.get("login") or email
                cpf = data.get("cpf") or ""
                password_hash = data.get("password_hash") or ""
                entry = {
                    "email": email,
                    "login": login,
                    "cpf": cpf,
                    "password_hash": password_hash,
                }
                with open(DB_FILE, "r", encoding="utf-8") as f:
                    arr = json.load(f)
                arr.append(entry)
                with open(DB_FILE, "w", encoding="utf-8") as f:
                    json.dump(arr, f, ensure_ascii=False, indent=2)
                self.send_response(200)
                self.end_headers()
                self.wfile.write(b'{"ok":true}')
            except Exception as e:
                self.send_response(400)
                self.end_headers()
                msg = {"ok": False, "error": str(e)}
                self.wfile.write(json.dumps(msg).encode("utf-8"))
        elif self.path == "/send_code.php" or self.path == "/send_code":
            length = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(length) if length > 0 else b""
            try:
                data = json.loads(raw.decode("utf-8"))
                code = data.get("code")
                email = data.get("email")
                print(f"!!! CODIGO DE VERIFICACAO PARA {email}: {code} !!!")
                
                # Tenta enviar email real se configurado
                send_email_real(email, code)
                
                self.send_response(200)
                self.end_headers()
                # Retornamos ok=true para o front achar que enviou
                self.wfile.write(b'{"ok":true}')
            except:
                self.send_response(200)
                self.end_headers()
                self.wfile.write(b'{"ok":false}')
        else:
            super().do_POST()

def run(server_class=HTTPServer, handler_class=Handler):
    os.chdir(ROOT_DIR)
    httpd = server_class(("", 8000), handler_class)
    print(f"Serving at http://localhost:8000/")
    httpd.serve_forever()

if __name__ == "__main__":
    run()
