import uuid
from flask import Blueprint, jsonify, request
from dados import (salas_db, reservas_ativas, lock, salvar_banco,
                   validar_sala, validar_data, validar_horario, horarios_permitidos)

# Cria o agrupador de rotas
rotas_bp = Blueprint('rotas', __name__)

# =====================
# COMANDO 1: CHECK|data
# =====================
@rotas_bp.route('/check', methods=['GET'])
def check_salas():
    # Recebe tanto a sala quanto a data
    sala_solicitada = request.args.get('sala')
    data_solicitada = request.args.get('data')

    # Validações
    if not sala_solicitada or not validar_sala(sala_solicitada):
        return jsonify({"erro": "Sala inválida ou não informada."}), 400

    if not data_solicitada or not validar_data(data_solicitada):
        return jsonify({"erro": "Data inválida ou não informada. Use AAAA-MM-DD."}), 400

    agenda_sala = {}
    
    # Busca apenas na sala solicitada
    for hora in horarios_permitidos:
        if data_solicitada in salas_db[sala_solicitada] and hora in salas_db[sala_solicitada][data_solicitada]:
            # Pega o nome do cliente que está salvo na memória
            cliente = salas_db[sala_solicitada][data_solicitada][hora]
            status = f"Ocupado por {cliente}"
        else:
            status = "Livre"
            
        agenda_sala[hora] = status

    return jsonify({
        "sala": sala_solicitada,
        "data": data_solicitada, 
        "agenda": agenda_sala
    }), 200

# ===============================================
# COMANDO 2: RESERVE (Registra cliente e horário)
# ===============================================
@rotas_bp.route('/reserve', methods=['POST'])
def reserve_sala():
    dados = request.json 
    
    if not dados:
        return jsonify({"erro": "Nenhum dado JSON enviado."}), 400

    sala = dados.get('sala')
    data = dados.get('data')
    hora = dados.get('hora')
    cliente = dados.get('cliente')

    # Validações de entrada
    if not cliente: return jsonify({"erro": "Nome do cliente é obrigatório."}), 400
    if not validar_sala(sala): return jsonify({"erro": "Sala inexistente."}), 400
    if not validar_data(data): return jsonify({"erro": "Data inválida."}), 400
    if not validar_horario(hora): return jsonify({"erro": "Horário não permitido."}), 400

    # INÍCIO DA ZONA CRÍTICA
    with lock:
        if data not in salas_db[sala]:
            salas_db[sala][data] = {}

        if hora in salas_db[sala][data]:
            return jsonify({"erro": "A sala já está reservada neste horário."}), 409

        # Efetua a reserva gravando o NOME DO CLIENTE na memória
        salas_db[sala][data][hora] = cliente
        id_reserva = uuid.uuid4().hex 
        
        reservas_ativas[id_reserva] = {
            "sala": sala, "data": data, "hora": hora, "cliente": cliente
        }
        
        # Salva as alterações em disco
        salvar_banco()

    # FIM DA ZONA CRÍTICA
    return jsonify({
        "mensagem": "Reserva confirmada!", 
        "id_reserva": id_reserva, 
        "cliente": cliente
    }), 201

# ====================
# COMANDO 3: CANCEL|id
# ====================
@rotas_bp.route('/cancel', methods=['POST'])
def cancel_sala():
    dados = request.json
    if not dados:
        return jsonify({"erro": "Nenhum dado enviado."}), 400

    id_reserva = dados.get('id')
    sala_req = dados.get('sala')
    data_req = dados.get('data')
    hora_req = dados.get('hora')

    # INÍCIO DA ZONA CRÍTICA (Usando a trava)
    with lock:
        # Se não enviou ID, mas enviou sala, data e hora, procura o ID
        if not id_reserva and (sala_req and data_req and hora_req):
            for key, info in reservas_ativas.items():
                if info["sala"] == sala_req and info["data"] == data_req and info["hora"] == hora_req:
                    id_reserva = key
                    break

        if not id_reserva or id_reserva not in reservas_ativas:
            return jsonify({"erro": "Reserva não encontrada."}), 404

        # Pega as informações de onde a reserva foi feita
        info = reservas_ativas[id_reserva]
        sala = info["sala"]
        data = info["data"]
        hora = info["hora"]

        # Libera a sala removendo o horário do banco de dados
        if data in salas_db.get(sala, {}) and hora in salas_db[sala][data]:
            del salas_db[sala][data][hora]
        
        # Apaga o ID das reservas ativas
        del reservas_ativas[id_reserva]
        
        # Salva as alterações em disco
        salvar_banco()

    # FIM DA ZONA CRÍTICA
    return jsonify({"mensagem": "Reserva cancelada com sucesso!"}), 200