# Sistema de Reservas de Salas de Estudo - Equipe 02

Este projeto é a evolução do sistema de reservas de salas de aula, migrando de sockets puros para uma arquitetura baseada em API RESTful.

## 🛠️ Decisão Tecnológica
Para este projeto, optamos por utilizar **Python com o framework Flask**. 
A escolha se justifica pela leveza e simplicidade do framework, que nos permite focar na lógica de sistemas distribuídos (como o controle de concorrência e o estado em memória) sem a complexidade de configurações pesadas. O Flask lida nativamente com requisições HTTP e payloads JSON, o que atende perfeitamente ao requisito de arquitetura de alto nível proposta para o cliente-servidor.

## 📂 Estrutura do Projeto
O projeto foi separado em camadas (backend/frontend) para maior organização:
* `backend/app.py`: Servidor base, inicialização do Flask e interceptador de logs operacionais.
* `backend/rotas.py`: Controladores que lidam com os comandos HTTP e payloads JSON.
* `backend/dados.py`: Modelagem do estado central em memória e travas de concorrência.
* `backend/requirements.txt`: Dependências do projeto.
* `frontend/`: Diretório reservado para futuras implementações da interface de usuário.

## 🚀 Como rodar o projeto

1. Clone este repositório.
2. Certifique-se de ter o Python instalado.
3. Instale as dependências executando o comando:
   ```bash
   pip install -r requirements.txt
4. Inicie o servidor
   ```bash
   python app.py
O servidor estará rodando em http://localhost:5000/.

## 📡 Protocolo de Comunicação (Rotas e Payloads)

1. Consultar Salas (CHECK)
Retorna o estado de todas as salas para uma data específica.

    - Rota: `GET /check?data=AAAA-MM-DD`

    - Exemplo de Retorno:
      ```json
      {
        "data": "2026-06-15",
        "agenda": {
          "Grad_1": {"08:00": "Livre", "09:00": "Ocupado"}
        }
      }

2. Reservar Sala (RESERVE)
Reserva uma sala em um horário específico, utilizando Locks para evitar condição de corrida.

    - Rota: `POST /reserve`
    
    - Payload esperado (JSON):
      ```json
      {
      "sala": "Grad_1",
      "data": "2026-06-15",
      "hora": "09:00"
      }

3. Cancelar Reserva (CANCEL)
Cancela uma reserva previamente feita através do seu ID único.

    - Rota: POST /cancel

    - Payload esperado (JSON):
      ```json
      {
      "id": "codigo-gerado-na-reserva"
      }
      
## 📡 Testando os Comandos via Terminal (cURL)
Abra um novo terminal (preferencialmente Git Bash ou ambiente Linux/Mac) e execute os comandos abaixo para testar o Core do sistema.

1. Reservar Sala (RESERVE)
Registra uma reserva na memória associada a um cliente.
   ```bash
      curl -X POST http://localhost:5000/reserve \
     -H "Content-Type: application/json" \
     -d '{"sala": "Grad_1", "data": "2026-06-25", "hora": "08:00", "cliente": "Maria"}'

2. Consultar Sala Específica (CHECK)
Retorna o estado das faixas horárias de uma sala específica.
   ```bash
      curl -X GET "http://localhost:5000/check?sala=Grad_1&data=2026-06-25"

3. Cancelar Reserva (CANCEL)
Cancela uma reserva previamente feita através do ID único gerado no comando RESERVE.
   ```bash
      curl -X POST http://localhost:5000/cancel \
     -H "Content-Type: application/json" \
     -d '{"id": "COLOQUE_O_ID_GERADO_AQUI"}'
   
