from flask import Flask, jsonify
from backend.rotas import rotas_bp # Importa as rotas no outro arquivo

# Inicializa o aplicativo Flask
app = Flask(__name__)

# Registra todas as rotas do arquivo rotas.py no aplicativo principal
app.register_blueprint(rotas_bp)

# Rota de Health-Check (Teste de funcionamento)
@app.route('/', methods=['GET'])
def health_check():
    return jsonify({
        "status": "rodando", 
        "mensagem": "Servidor do Sistema de Reservas - Equipe 02 online!"
    }), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)