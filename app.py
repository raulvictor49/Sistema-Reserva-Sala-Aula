from flask import Flask, jsonify

# Inicializa o aplicativo Flask
app = Flask(__name__)

# Rota de Health-Check (Teste de funcionamento)
# Quando alguém acessar a raiz do servidor, ele retorna essa mensagem
@app.route('/', methods=['GET'])
def health_check():
    return jsonify({
        "status": "rodando", 
        "mensagem": "Servidor do Sistema de Reservas - Equipe 02 online!"
    }), 200

# Garante que o servidor só rode se o arquivo for executado diretamente
if __name__ == '__main__':
    # Ligando o servidor na porta 5000 com modo de depuração ativo (ajuda a ver erros)
    app.run(host='0.0.0.0', port=5000, debug=True)