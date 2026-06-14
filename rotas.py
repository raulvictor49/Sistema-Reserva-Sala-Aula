import uuid
from flask import Blueprint, jsonify, request
from dados import (salas_db, reservas_ativas, lock, 
                   validar_sala, validar_data, validar_horario, horarios_permitidos)

# Cria o agrupador de rotas
rotas_bp = Blueprint('rotas', __name__)

# ==========================================
# COMANDO 1: CHECK|data
# ==========================================
@rotas_bp.route('/check', methods=['GET'])
def check_salas():
    data_solicitada = request.args.get('data')

    if not validar_data(data_solicitada):
        return jsonify({"erro": "Data inválida ou não informada. Use AAAA-MM-DD."}), 400

    relatorio_do_dia = {}
    for sala in salas_db:
        relatorio_do_dia[sala] = {}
        for hora in horarios_permitidos:
            if data_solicitada in salas_db[sala] and hora in salas_db[sala][data_solicitada]:
                status = "Ocupado"
            else:
                status = "Livre"
            relatorio_do_dia[sala][hora] = status

    return jsonify({"data": data_solicitada, "agenda": relatorio_do_dia}), 200

# ==========================================
# COMANDO 2: RESERVE|sala|hora
# ==========================================
@rotas_bp.route('/reserve', methods=['POST'])
def reserve_sala():
    dados = request.json # Recebe os dados no formato JSON
    
    if not dados:
        return jsonify({"erro": "Nenhum dado JSON enviado."}), 400

    sala = dados.get('sala')
    data = dados.get('data')
    hora = dados.get('hora')

    # Validações de entrada
    if not validar_sala(sala): return jsonify({"erro": "Sala inexistente."}), 400
    if not validar_data(data): return jsonify({"erro": "Data inválida."}), 400
    if not validar_horario(hora): return jsonify({"erro": "Horário não permitido."}), 400

    # INÍCIO DA ZONA CRÍTICA (Usando a trava)
    with lock:
        # Garante que a data existe no dicionário da sala
        if data not in salas_db[sala]:
            salas_db[sala][data] = {}

        # Verifica se já está ocupado
        if hora in salas_db[sala][data]:
            return jsonify({"erro": "A sala já está reservada neste horário."}), 409

        # Efetua a reserva e gera um ID único
        salas_db[sala][data][hora] = "Ocupado"
        id_reserva = uuid.uuid4().hex # Gera um código único (ex: 3b4d1...)
        
        # Salva o ID para o caso de cancelamento
        reservas_ativas[id_reserva] = {"sala": sala, "data": data, "hora": hora}

    # FIM DA ZONA CRÍTICA
    return jsonify({"mensagem": "Reserva confirmada!", "id_reserva": id_reserva}), 201

# ==========================================
# COMANDO 3: CANCEL|id
# ==========================================
@rotas_bp.route('/cancel', methods=['POST'])
def cancel_sala():
    dados = request.json
    id_reserva = dados.get('id') if dados else None

    if not id_reserva:
        return jsonify({"erro": "ID da reserva não informado."}), 400

    # INÍCIO DA ZONA CRÍTICA (Usando a trava)
    with lock:
        if id_reserva not in reservas_ativas:
            return jsonify({"erro": "ID de reserva não encontrado."}), 404

        # Pega as informações de onde a reserva foi feita
        info = reservas_ativas[id_reserva]
        sala = info["sala"]
        data = info["data"]
        hora = info["hora"]

        # Libera a sala removendo o horário do banco de dados
        del salas_db[sala][data][hora]
        
        # Apaga o ID das reservas ativas
        del reservas_ativas[id_reserva]

    # FIM DA ZONA CRÍTICA
    return jsonify({"mensagem": "Reserva cancelada com sucesso!"}), 200