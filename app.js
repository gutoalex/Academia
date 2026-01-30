let treinoData = null;
let treinoAtual = null;

// Variáveis do Calendário
let dataAtual = new Date();
let mesExibido = dataAtual.getMonth();
let anoExibido = dataAtual.getFullYear();

document.addEventListener('DOMContentLoaded', () => {
    carregarPerfil(); // Carrega o peso salvo
    
    // Inicia o calendário
    renderizarCalendario(mesExibido, anoExibido);

    // Carrega o arquivo JSON do treino
    fetch('data/hipertrofia.json')
        .then(res => {
            if (!res.ok) {
                throw new Error("Não achei o arquivo JSON. Verifique se a pasta se chama 'data'");
            }
            return res.json();
        })
        .then(data => {
            treinoData = data;
            document.getElementById('workout-title').innerText = data.titulo;
            renderMenu();
        })
        .catch(err => {
            console.error(err);
            document.getElementById('workout-title').innerText = "Erro: " + err.message;
            document.getElementById('workout-title').style.color = "red";
        });
});

// --- MENU INICIAL ---
function renderMenu() {
    const menu = document.getElementById('days-menu');
    menu.innerHTML = '';
    
    treinoData.dias.forEach(dia => {
        const div = document.createElement('div');
        div.className = 'card-day';
        div.innerHTML = `
            <h2>${dia.letra}</h2>
            <span>${dia.foco}</span>
        `;
        div.onclick = () => abrirTreino(dia);
        menu.appendChild(div);
    });
}

// --- ÁREA DE TREINO ---
function abrirTreino(dia) {
    treinoAtual = dia;
    document.getElementById('days-menu').classList.add('hidden');
    document.getElementById('history-section').classList.add('hidden');
    document.getElementById('workout-area').classList.remove('hidden');
    
    document.getElementById('current-day-title').innerText = `TREINO ${dia.letra} /// ${dia.foco.toUpperCase()}`;
    
    const lista = document.getElementById('exercises-list');
    lista.innerHTML = '';

    dia.exercicios.forEach((ex, index) => {
        // Busca recorde pessoal
        const recordePeso = localStorage.getItem(`recorde_${dia.letra}_${index}`) || 0;
        
        const card = document.createElement('div');
        card.className = 'exercise-card';
        card.innerHTML = `
            <div class="exercise-header">
                <h3>${ex.nome}</h3>
                ${ex.video_id ? `<button class="btn-video" onclick="abrirVideo('${ex.video_id}')">▶ VÍDEO</button>` : ''}
            </div>
            
            <span class="meta-info">${ex.series} SÉRIES x ${ex.repeticoes} REPS</span>
            <p style="font-size:0.75rem; color:#666; margin: 5px 0;">${ex.observacao}</p>
            
            <div class="input-group">
                <div>
                    <label>CARGA HOJE</label>
                    <input type="number" id="input_peso_${index}" placeholder="0">
                </div>
                <div class="recorde-info">
                    RECORDE<br>
                    <strong>${recordePeso} kg</strong>
                </div>
            </div>
        `;
        lista.appendChild(card);
    });
}

function voltarMenu() {
    document.getElementById('workout-area').classList.add('hidden');
    document.getElementById('days-menu').classList.remove('hidden');
    document.getElementById('history-section').classList.remove('hidden');
    treinoAtual = null;
}

// --- FINALIZAR TREINO ---
function concluirTreino() {
    if (!treinoAtual) return;

    if (!confirm("Finalizar o treino e salvar os recordes?")) return;

    // 1. Verifica e salva novos recordes
    treinoAtual.exercicios.forEach((ex, index) => {
        const input = document.getElementById(`input_peso_${index}`);
        const pesoDigitado = parseFloat(input.value);

        if (pesoDigitado > 0) {
            const chaveRecorde = `recorde_${treinoAtual.letra}_${index}`;
            const recordeAntigo = parseFloat(localStorage.getItem(chaveRecorde)) || 0;

            if (pesoDigitado > recordeAntigo) {
                localStorage.setItem(chaveRecorde, pesoDigitado);
            }
        }
    });

    // 2. Salva no histórico e perfil
    salvarHistoricoGeral();
    salvarPerfil();

    alert("Treino Concluído! 💪");
    voltarMenu();
}

// --- CALENDÁRIO E HISTÓRICO ---
function salvarHistoricoGeral() {
    const historico = JSON.parse(localStorage.getItem('workout_history')) || [];
    const hoje = new Date();
    
    // Formata data como DD/MM/AAAA para bater com o calendário
    const dia = String(hoje.getDate()).padStart(2, '0');
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const ano = hoje.getFullYear();
    const dataFormatada = `${dia}/${mes}/${ano}`;
    
    // Captura os pesos usados HOJE
    const cargasUtilizadas = treinoAtual.exercicios.map((ex, index) => {
        const input = document.getElementById(`input_peso_${index}`);
        return {
            exercicio: ex.nome,
            carga: input.value || 0
        };
    });

    historico.unshift({
        data: dataFormatada,
        nome: `TREINO ${treinoAtual.letra}`,
        cargas: cargasUtilizadas
    });

    localStorage.setItem('workout_history', JSON.stringify(historico));
    
    // Atualiza o calendário visualmente
    renderizarCalendario(mesExibido, anoExibido);
}

function renderizarCalendario(mes, ano) {
    const calendarDays = document.getElementById('calendar-days');
    const monthLabel = document.getElementById('calendar-month-year');
    
    const meses = ["JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO", "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"];
    
    monthLabel.innerText = `${meses[mes]} ${ano}`;
    calendarDays.innerHTML = '';

    const primeiroDiaDaSemana = new Date(ano, mes, 1).getDay();
    const diasNoMes = new Date(ano, mes + 1, 0).getDate();
    const historico = JSON.parse(localStorage.getItem('workout_history')) || [];

    // Espaços vazios
    for (let i = 0; i < primeiroDiaDaSemana; i++) {
        const div = document.createElement('div');
        calendarDays.appendChild(div);
    }

    // Dias do mês
    for (let dia = 1; dia <= diasNoMes; dia++) {
        const div = document.createElement('div');
        div.className = 'calendar-day';
        div.innerText = dia;

        // Monta a string da data deste dia para buscar no histórico
        const diaF = String(dia).padStart(2, '0');
        const mesF = String(mes + 1).padStart(2, '0');
        const dataFormatada = `${diaF}/${mesF}/${ano}`;

        // Marca dia atual
        const hoje = new Date();
        if (dia === hoje.getDate() && mes === hoje.getMonth() && ano === hoje.getFullYear()) {
            div.classList.add('today');
        }

        // Procura treinos nesta data
        const treinosDoDia = historico.filter(h => h.data === dataFormatada);

        if (treinosDoDia.length > 0) {
            div.classList.add('has-workout');
            // Ao clicar, abre o último treino feito nesse dia
            div.onclick = () => abrirDetalhesData(treinosDoDia[0]);
        }

        calendarDays.appendChild(div);
    }
}

function mudarMes(direcao) {
    mesExibido += direcao;
    if (mesExibido < 0) {
        mesExibido = 11;
        anoExibido--;
    } else if (mesExibido > 11) {
        mesExibido = 0;
        anoExibido++;
    }
    renderizarCalendario(mesExibido, anoExibido);
}

// --- MODAIS ---
function abrirDetalhesData(itemHistorico) {
    if (!itemHistorico) return;

    document.getElementById('history-date-title').innerText = `${itemHistorico.data} - ${itemHistorico.nome}`;
    const listaDetalhes = document.getElementById('history-details-list');
    listaDetalhes.innerHTML = '';

    if (itemHistorico.cargas && itemHistorico.cargas.length > 0) {
        itemHistorico.cargas.forEach(c => {
            const li = document.createElement('li');
            li.className = 'detail-item';
            li.innerHTML = `<span>${c.exercicio}</span> <strong>${c.carga} kg</strong>`;
            listaDetalhes.appendChild(li);
        });
    } else {
        listaDetalhes.innerHTML = '<p style="text-align:center; padding:20px; color:#666;">Sem detalhes salvos.</p>';
    }
    document.getElementById('history-modal').classList.remove('hidden');
}

function fecharHistorico() {
    document.getElementById('history-modal').classList.add('hidden');
}

function abrirVideo(videoId) {
    const container = document.getElementById('video-container');
    container.innerHTML = `<iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
    document.getElementById('video-modal').classList.remove('hidden');
}

function fecharVideo() {
    document.getElementById('video-container').innerHTML = '';
    document.getElementById('video-modal').classList.add('hidden');
}

// --- PERFIL ---
function salvarPerfil() {
    const peso = document.getElementById('user-weight').value;
    if(peso) {
        localStorage.setItem('user_profile', JSON.stringify({ peso: peso }));
    }
}

function carregarPerfil() {
    const perfil = JSON.parse(localStorage.getItem('user_profile'));
    if (perfil && document.getElementById('user-weight')) {
        document.getElementById('user-weight').value = perfil.peso || '';
    }
}
