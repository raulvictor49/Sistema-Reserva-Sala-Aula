from flask import Flask, jsonify, request
from rotas import rotas_bp
import logging
from datetime import datetime

# 1. Configuração para ocultar os logs "feios" padrão do Flask
# Assim, apenas o nosso log estruturado e bonito vai aparecer no terminal
log = logging.getLogger('werkzeug')
log.setLevel(logging.ERROR)

import os
app = Flask(__name__, static_folder='../frontend', static_url_path='/')
# Registra todas as rotas do arquivo rotas.py no aplicativo principal
app.register_blueprint(rotas_bp)

# A anotação @app.after_request faz o Flask rodar essa função 
# automaticamente DEPOIS que qualquer requisição terminar de ser processada.
@app.after_request
def registrar_log(response):
    metodo = request.method
    rota = request.path
    ip_cliente = request.remote_addr
    status = response.status_code
    
    # Pegando a hora atual para o log ficar completo
    agora = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
    
    # Ignoramos a rota '/favicon.ico' pois navegadores a chamam sozinhos sem precisarmos logar
    if rota != '/favicon.ico':
        # Imprime o log formatado no console do servidor
        print(f"[{agora}] {metodo} {rota} | Cliente: {ip_cliente} | Resultado: {status}")
        
    return response

# Rota de Health-Check (Teste de funcionamento)
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "rodando", 
        "mensagem": "Servidor do Sistema de Reservas de Sala de Aula - online!"
    }), 200

@app.route('/')
def login_page():
    return app.send_static_file('login.html')

@app.route('/sistema')
def sistema_page():
    return app.send_static_file('index.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True, threaded=True)