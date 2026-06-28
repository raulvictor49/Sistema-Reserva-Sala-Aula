const apiBase = "http://localhost:5000";

const horariosFixos = [
    "07:00", "08:00", "09:00", "10:00", "11:00", "12:00",
    "13:00", "14:00", "15:00", "16:00", "17:00", "18:00",
    "19:00", "20:00", "21:00", "22:00"
];

let pollingInterval = null;

// Estado Global da Interface
let slotSelecionado = null; // Guardará a hora selecionada
let salaAtual = "";
let dataAtual = "";

// Estado do Modal de Cancelamento
let slotParaCancelar = null;

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
    const usuarioLogado = localStorage.getItem('usuarioCin');
    if (!usuarioLogado) {
        // Se não tem ninguém logado, expulsa de volta para o login
        window.location.href = '/';
        return;
    }
    const spanNome = document.getElementById('nome-usuario');
    if (spanNome) {
        spanNome.textContent = usuarioLogado;
    }

    // Configura data atual no input
    const hoje = new Date().toISOString().split('T')[0];
    document.getElementById("data-input").value = hoje;
    
    // Inicia a primeira carga
    carregarGrade();

    // Configura o Polling a cada 3 segundos
    pollingInterval = setInterval(carregarGrade, 3000);

    // Configura o input do modal
    const modalInput = document.getElementById('modal-input');
    const btnConfirmar = document.getElementById('btn-confirmar-cancelamento');
    
    modalInput.addEventListener('input', (e) => {
        if(e.target.value.trim().toLowerCase() === 'cancelar') {
            btnConfirmar.disabled = false;
        } else {
            btnConfirmar.disabled = true;
        }
    });

    btnConfirmar.addEventListener('click', () => {
        if(slotParaCancelar) {
            cancelarPorSlot(slotParaCancelar.sala, slotParaCancelar.data, slotParaCancelar.hora);
        }
    });

    // Ao digitar no cliente, validar o botão Confirmar
    const clienteInput = document.getElementById('reserva-cliente');
    if (clienteInput) {
        clienteInput.addEventListener('input', validarFormulario);
    }
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

    // Se mudou de sala ou data, limpa a seleção
    if (sala !== salaAtual || data !== dataAtual) {
        slotSelecionado = null;
        salaAtual = sala;
        dataAtual = data;
        validarFormulario();
    }

    try {
        const response = await fetch(`${apiBase}/check?sala=${sala}&data=${data}`);
        const result = await response.json();

        if(response.ok) {
            statusMsg.textContent = `Grade atualizada: ${new Date().toLocaleTimeString()}`;
            statusMsg.style.color = "#666";
            
            // Limpa a grade
            grid.innerHTML = "";
            
            // Define os turnos lógicos
            const turnos = [
                { titulo: "Manhã", ids: ["07:00", "08:00", "09:00", "10:00", "11:00", "12:00"] },
                { titulo: "Tarde", ids: ["13:00", "14:00", "15:00", "16:00", "17:00"] },
                { titulo: "Noite", ids: ["18:00", "19:00", "20:00", "21:00", "22:00"] }
            ];

            const agenda = result.agenda || {};

            turnos.forEach(turno => {
                // Cria um container para o turno
                const turnoDiv = document.createElement("div");
                turnoDiv.className = "turno-container";
                
                const titulo = document.createElement("h4");
                titulo.className = "turno-titulo";
                titulo.textContent = turno.titulo;
                turnoDiv.appendChild(titulo);

                const gridDiv = document.createElement("div");
                gridDiv.className = "grid";

                turno.ids.forEach(hora => {
                    const isLivre = (agenda[hora] === "Livre");
                    const status = isLivre ? "Livre" : agenda[hora];

                    const div = document.createElement("div");
                    div.className = `bloco-horario ${isLivre ? "livre" : "ocupado"}`;
                    // Mantém o estado visual de selecionado após o polling
                    if(slotSelecionado === hora) {
                        div.classList.add("selecionado");
                    }

                    div.innerHTML = `
                        <span>${hora}</span>
                        <span class="info-status">${status.replace('Ocupado por ', 'Reserva: ')}</span>
                    `;

                    if(isLivre) {
                        div.style.cursor = 'pointer';
                        div.onclick = () => {
                            selecionarSlot(hora);
                        };
                    } else {
                        div.style.cursor = 'pointer';
                        div.onclick = () => {
                            const clienteNome = status.replace('Ocupado por ', '');
                            abrirModal(sala, data, hora, clienteNome);
                        };
                    }
                    
                    gridDiv.appendChild(div);
                });

                turnoDiv.appendChild(gridDiv);
                grid.appendChild(turnoDiv);
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

// ==============================
// COMANDO: RESERVE (Faz Reserva)
// ==============================
async function reservarSala() {
    const cliente = localStorage.getItem('usuarioCin');
    const hora = slotSelecionado; // Usa a variável de estado
    const sala = salaAtual;
    const data = dataAtual;

    const feedback = document.getElementById("reserva-feedback");

    if(!cliente || !hora || !sala || !data) {
        mostrarFeedback(feedback, "Preencha todos os campos e selecione um horário.", "erro");
        return;
    }
    
    // Pega só os primeiros 5 caracteres HH:MM para evitar os segundos se o browser enviar
    const horaFormatada = hora.substring(0, 5);

    const payload = { sala, data, hora: horaFormatada, cliente };

    try {
        const response = await fetch(`${apiBase}/reserve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if(response.ok) {
            mostrarFeedback(feedback, `Sucesso! ID: ${result.id_reserva}`, "sucesso");
            document.getElementById("reserva-cliente").value = "";
            slotSelecionado = null; // limpa seleção
            validarFormulario(); // reseta o botão
            carregarGrade(); // atualiza imediato
            
            // Apaga mensagem de sucesso após 30 segundos
            setTimeout(() => {
                feedback.style.display = "none";
                feedback.textContent = "";
            }, 30000);
        } else {
            // Rejeição (ex: Conflito de concorrência)
            mostrarFeedback(feedback, `Erro: ${result.erro}`, "erro");
            carregarGrade(); // atualiza imediato para mostrar o vermelho
        }
    } catch (error) {
        mostrarFeedback(feedback, "Falha na comunicação.", "erro");
    }
}


// Cancela clicando diretamente na grade
async function cancelarPorSlot(sala, data, hora) {
    const feedback = document.getElementById("cancel-feedback");
    const usuarioLogado = localStorage.getItem('usuarioCin');
    try {
        const response = await fetch(`${apiBase}/cancel`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sala, data, hora, cliente: usuarioLogado })
        });

        const result = await response.json();

        if(response.ok) {
            fecharModal();
            // feedback visual direto na tela onde a reserva é feita
            const feedback = document.getElementById("reserva-feedback");
            mostrarFeedback(feedback, "Reserva cancelada com sucesso!", "sucesso");
            carregarGrade(); // atualiza imediato
        } else {
            alert(`Erro ao cancelar: ${result.erro}`);
        }
    } catch (error) {
        alert("Falha na comunicação ao tentar cancelar.");
    }
}

// Funções do Modal
function abrirModal(sala, data, hora, cliente) {
    slotParaCancelar = { sala, data, hora };
    document.getElementById('modal-texto').textContent = `Você está prestes a cancelar a reserva de ${cliente} na sala ${sala} às ${hora}.`;
    document.getElementById('modal-input').value = '';
    document.getElementById('btn-confirmar-cancelamento').disabled = true;
    document.getElementById('cancel-modal').classList.remove('hidden');
}

function fecharModal() {
    document.getElementById('cancel-modal').classList.add('hidden');
    slotParaCancelar = null;
}

// =================================
// FUNÇÕES DE UX E VALIDAÇÃO (Novas)
// =================================

function selecionarSlot(hora) {
    slotSelecionado = hora;
    
    // Atualiza visualmente na grade a borda selecionada sem recarregar tudo do zero (opcional, carregarGrade já faria isso)
    carregarGrade(); 
    validarFormulario();
}

function validarFormulario() {
    const btnConfirmar = document.getElementById("btn-confirmar-reserva");
    const resumoTexto = document.getElementById("resumo-texto");
    const clienteInput = document.getElementById("reserva-cliente").value.trim();

    if(slotSelecionado) {
        resumoTexto.innerHTML = `Reservando: <strong>${salaAtual}</strong> às <strong>${slotSelecionado}</strong> no dia ${dataAtual}.`;
        
        // Habilita se tiver nome
        if(clienteInput.length >= 2) {
            btnConfirmar.disabled = false;
        } else {
            btnConfirmar.disabled = true;
        }
    } else {
        resumoTexto.innerHTML = "Selecione um horário disponível na grade acima para começar.";
        btnConfirmar.disabled = true;
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

// ================
// FUNÇÃO DE LOGOUT
// ================
function fazerLogout() {
    // 1. Apaga o e-mail salvo na memória do navegador
    localStorage.removeItem('usuarioCin');
    
    // 2. Redireciona o usuário de volta para a tela de Login (rota raiz)
    window.location.href = '/';
}


