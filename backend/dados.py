import threading
from datetime import datetime

# --- ESTRUTURA DE DADOS EM MEMÓRIA ---
salas_db = {
    "Grad_1": {},
    "Grad_2": {},
    "Grad_3": {},
    "Grad_4": {},
    "Grad_5": {}
}

# Dicionário para guardar o ID da reserva e facilitar o CANCEL
# Formato: { "id_gerado": {"sala": "Grad_1", "data": "2026-06-15", "hora": "08:00"} }
reservas_ativas = {}

# Trava de Concorrência (Lock)
lock = threading.Lock()

#  REGRAS DE VALIDAÇÃO
horarios_permitidos = [
    "07:00", "08:00", "09:00", "10:00", "11:00", "12:00",
    "13:00", "14:00", "15:00", "16:00", "17:00", "18:00",
    "19:00", "20:00", "21:00", "22:00"
]

def validar_sala(sala_str):
    return sala_str in salas_db

def validar_data(data_str):
    try:
        datetime.strptime(data_str, "%Y-%m-%d")
        return True
    except (ValueError, TypeError):
        return False

def validar_horario(hora_str):
    return hora_str in horarios_permitidos