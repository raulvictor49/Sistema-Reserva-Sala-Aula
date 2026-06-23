const apiBase = "http://localhost:5000";

const horariosFixos = [
    "07:00", "08:00", "09:00", "10:00", "11:00", "12:00",
    "13:00", "14:00", "15:00", "16:00", "17:00", "18:00",
    "19:00", "20:00", "21:00", "22:00"
];

let pollingInterval = null;

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
    // Configura data atual no input
    const hoje = new Date().toISOString().split('T')[0];
    document.getElementById("data-input").value = hoje;
    
    // Inicia a primeira carga
    carregarGrade();

    // Configura o Polling a cada 3 segundos
    pollingInterval = setInterval(carregarGrade, 3000);
});

// Atualiza a grade quando a sala ou data mudam
document.getElementById('sala-select').addEventListener('change', carregarGrade);
document.getElementById('data-input').addEventListener('change', carregarGrade);

// ==========================================
// COMANDO: CHECK (Atualiza a Grade Visual)
// ==========================================
async function carregarGrade() {
    const sala = document.getElementById("sala-select").value;
    const data = document.getElementById("data-input").value;
    const statusMsg = document.getElementById("status-mensagem");
    const grid = document.getElementById("grade-horaria");

    if(!data) return;

    try {
        const response = await fetch(`${apiBase}/check?sala=${sala}&data=${data}`);
        const result = await response.json();

        if(response.ok) {
            statusMsg.textContent = `Grade atualizada: ${new Date().toLocaleTimeString()}`;
            statusMsg.style.color = "#666";
            
            // Limpa a grade atual
            grid.innerHTML = "";

            // Desenha os blocos baseado na resposta do backend
            // Note que o backend pode não retornar a lista completa se não adaptamos,
            // mas o backend atual (rotas.py) retorna a agenda completa para a sala.
            const agenda = result.agenda || {};
            
            horariosFixos.forEach(hora => {
                const status = agenda[hora] || "Livre";
                const isLivre = status === "Livre";

                const div = document.createElement('div');
                div.className = `bloco-horario ${isLivre ? 'livre' : 'ocupado'}`;
                
                div.innerHTML = `
                    <span>${hora}</span>
                    <span class="info-status">${isLivre ? 'Disponível' : status.replace('Ocupado por ', 'Reserva: ')}</span>
                `;
                
                // Se estiver livre, permite clicar para preencher o formulário
                if(isLivre) {
                    div.style.cursor = 'pointer';
                    div.onclick = () => {
                        document.getElementById('reserva-hora').value = hora;
                    };
                }
                
                grid.appendChild(div);
            });

        } else {
            statusMsg.textContent = `Erro: ${result.erro}`;
            statusMsg.style.color = "red";
        }
    } catch (error) {
        statusMsg.textContent = "Erro ao conectar com o servidor.";
        statusMsg.style.color = "red";
    }
}

// ==========================================
// COMANDO: RESERVE (Faz Reserva)
// ==========================================
async function reservarSala() {
    const sala = document.getElementById("sala-select").value;
    const data = document.getElementById("data-input").value;
    let hora = document.getElementById("reserva-hora").value;
    const cliente = document.getElementById("reserva-cliente").value;
    const feedback = document.getElementById("reserva-feedback");

    if(!hora || !cliente) {
        mostrarFeedback(feedback, "Preencha a hora e o cliente.", "erro");
        return;
    }
    
    // Pega só os primeiros 5 caracteres HH:MM para evitar os segundos se o browser enviar
    hora = hora.substring(0, 5);

    const payload = { sala, data, hora, cliente };

    try {
        const response = await fetch(`${apiBase}/reserve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if(response.ok) {
            mostrarFeedback(feedback, `Sucesso! ID: ${result.id_reserva}`, "sucesso");
            document.getElementById("reserva-cliente").value = ""; // limpa
            carregarGrade(); // atualiza imediato
        } else {
            // Rejeição (ex: Conflito de concorrência)
            mostrarFeedback(feedback, `Erro: ${result.erro}`, "erro");
            carregarGrade(); // atualiza imediato para mostrar o vermelho
        }
    } catch (error) {
        mostrarFeedback(feedback, "Falha na comunicação.", "erro");
    }
}

// ==========================================
// COMANDO: CANCEL (Cancela Reserva)
// ==========================================
async function cancelarReserva() {
    const id = document.getElementById("cancelar-id").value;
    const feedback = document.getElementById("cancel-feedback");

    if(!id) {
        mostrarFeedback(feedback, "Informe o ID.", "erro");
        return;
    }

    try {
        const response = await fetch(`${apiBase}/cancel`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });

        const result = await response.json();

        if(response.ok) {
            mostrarFeedback(feedback, "Cancelado com sucesso!", "sucesso");
            document.getElementById("cancelar-id").value = "";
            carregarGrade(); // atualiza imediato
        } else {
            mostrarFeedback(feedback, `Erro: ${result.erro}`, "erro");
        }
    } catch (error) {
        mostrarFeedback(feedback, "Falha na comunicação.", "erro");
    }
}

function mostrarFeedback(elemento, msg, tipo) {
    elemento.textContent = msg;
    elemento.className = `feedback ${tipo}`;
    
    // Se for sucesso (contém o ID), deixa a mensagem por muito mais tempo (30 segundos)
    // Se for erro, pode sumir mais rápido (5 segundos)
    const tempo = tipo === 'sucesso' ? 30000 : 5000;
    
    setTimeout(() => {
        if(elemento.textContent === msg) elemento.textContent = "";
    }, tempo);
}
