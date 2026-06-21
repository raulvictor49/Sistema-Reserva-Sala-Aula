# Sistema de Reservas de Salas de Estudo - Equipe 02

Este projeto é a evolução do sistema de reservas de salas de aula, migrando de sockets puros para uma arquitetura baseada em API RESTful.

## 🛠️ Decisão Tecnológica
Para este projeto, optamos por utilizar **Python com o framework Flask**. 
A escolha se justifica pela leveza e simplicidade do framework, que nos permite focar na lógica de sistemas distribuídos (como o controle de concorrência e o estado em memória) sem a complexidade de configurações pesadas. O Flask lida nativamente com requisições HTTP e payloads JSON, o que atende perfeitamente ao requisito de arquitetura de alto nível proposta para o cliente-servidor.

## 📂 Estrutura do Projeto
A arquitetura foi modularizada para manter a organização e boas práticas:
* `app.py`: Servidor base e inicialização do Flask.
* `rotas.py`: Controladores que lidam com os comandos HTTP (CHECK, RESERVE, CANCEL).
* `dados.py`: Modelagem do estado central em memória e mecanismos de trava (Locks) para controle de concorrência.
* `requirements.txt`: Dependências do projeto.

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
