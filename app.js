let treinoData = null;
let treinoAtual = null;

// --- VARIÁVEIS GLOBAIS DO CALENDÁRIO ---
let dataReferencia = new Date();
let modoVisualizacao = 'mensal'; // Começa mensal

// --- INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
    carregarPerfil();
    renderizarCalendario(); // Renderiza o calendário logo de cara

    // Carrega o JSON
    fetch('data/hipertrofia.json')
        .then(res => {
            if (!res.ok) throw new Error("Erro ao ler JSON");
            return res.json();
        })
        .then(data => {
            treinoData = data;
            document.getElementById('workout-title').innerText = data.titulo;
            renderMenu();
        })
        .catch(err => {
            console.error(err);
            document.getElementById('workout-title').innerText = "Erro ao carregar treino";
        });
});

// --- FUNÇÕES GLOBAIS (FORA DO DOMContentLoaded) ---

// 1. Troca entre Mês e Semana
function alternarModo(modo) {
    modoVisualizacao = modo;
    // Atualiza botões
    document.getElementById('btn-view-month').className = modo === 'mensal' ? 'active' : '';
    document.getElementById('btn-view-week').className = modo === 'semanal' ? 'active' : '';
    renderizarCalendario();
}

// 2. Navega (Voltar/Avançar)
function navegarCalendario(direcao) {
    if (modoVisualizacao === 'mensal') {
        dataReferencia.setMonth(dataReferencia.getMonth() + direcao);
    } else {
        dataReferencia.setDate(dataReferencia.getDate() + (direcao * 7));
    }
    renderizarCalendario();
}

// 3. Renderiza o Calendário (O Cérebro)
function renderizarCalendario() {
    const calendarDays = document.getElementById('calendar-days');
    const labelTitulo = document.getElementById('calendar-month-year');
    const historico = JSON.parse(localStorage.getItem('workout_history')) || [];
    const meses = ["JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO", "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"];
    
    calendarDays.innerHTML = '';

    if (modoVisualizacao === 'mensal') {
        // --- VISÃO MENSAL ---
        labelTitulo.innerText = `${meses[dataReferencia.getMonth()]} ${dataReferencia.getFullYear()}`;
        
        const ano = dataReferencia.getFullYear();
        const mes = dataReferencia.getMonth();
        const primeiroDiaSemana = new Date(ano, mes, 1).getDay();
        const totalDiasMes = new Date(ano, mes + 1, 0).getDate();

        // Espaços vazios
        for (let i = 0; i < primeiroDiaSemana; i++) {
            calendarDays.appendChild(document.createElement('div'));
        }
        // Dias
        for (let d = 1; d <= totalDiasMes; d++) {
            criarDiaVisual(new Date(ano, mes, d), historico, calendarDays);
        }

    } else {
        // --- VISÃO SEMANAL ---
        const diaDaSemana = dataReferencia.getDay();
        const domingo = new Date(dataReferencia);
        domingo.setDate(dataReferencia.getDate() - diaDaSemana);

        const sabado = new Date(domingo);
        sabado.setDate(domingo.getDate() + 6);

        const mesIni = meses[domingo.getMonth()].substring(0,3);
        const mesFim = meses[sabado.getMonth()].substring(0,3);
        labelTitulo.innerText = `${domingo.getDate()} ${mesIni} - ${sabado.getDate()} ${mesFim}`;

        for (let i = 0; i < 7; i++) {
            const dataRender = new Date(domingo);
            dataRender.setDate(domingo.getDate() + i);
            criarDiaVisual(dataRender, historico, calendarDays);
        }
    }
}

// Helper para criar o quadradinho do dia
function criarDiaVisual(data, historico, container) {
    const div = document.createElement('div');
    div.className = 'calendar-day';
    div.innerText = data.getDate();

    // Formata DD/MM/AAAA
    const diaF = String(data.getDate()).padStart(2, '0');
    const mesF = String(data.getMonth() + 1).padStart(2, '0');
    const anoF = data.getFullYear();
    const chaveData = `${diaF}/${mesF}/${anoF}`;

    // Hoje?
    const hoje = new Date();
    if (data.toDateString() === hoje.toDateString()) {
        div.classList.add('today');
    }

    // Tem Treino?
    const treinos = historico.filter(h => h.data === chaveData);
    if (treinos.length > 0) {
        div.classList.add('has-workout');
        div.onclick = () => abrirDetalhesData(treinos[0]);
    }

    container.appendChild(div);
}

// --- MENUS E INTERAÇÃO ---
function renderMenu() {
    const menu = document.getElementById('days-menu');
    menu.innerHTML = '';
    treinoData.dias.forEach(dia => {
        const div = document.createElement('div');
        div.className = 'card-day';
        div.innerHTML = `<h2>${dia.letra}</h2><span>${dia.foco}</span>`;
        div.onclick = () => abrirTreino(dia);
        menu.appendChild(div);
    });
}

function abrirTreino(dia) {
    treinoAtual = dia;
    document.getElementById('days-menu').classList.add('hidden');
    document.getElementById('history-section').classList.add('hidden');
    document.getElementById('workout-area').classList.remove('hidden');
    document.getElementById('current-day-title').innerText = `TREINO ${dia.letra} /// ${dia.foco.toUpperCase()}`;
    
    const lista = document.getElementById('exercises-list');
    lista.innerHTML = '';

    dia.exercicios.forEach((ex, index) => {
        const recorde = localStorage.getItem(`recorde_${dia.letra}_${index}`) || 0;
        const card = document.createElement('div');
        card.className = 'exercise-card';
        card.innerHTML = `
            <div class="exercise-header">
                <h3>${ex.nome}</h3>
                ${ex.video_id ? `<button class="btn-video" onclick="abrirVideo('${ex.video_id}')">▶ VÍDEO</button>` : ''}
            </div>
            <span class="meta-info">${ex.series} SERIES x ${ex.repeticoes} REPS</span>
            <p style="font-size:0.75rem; color:#666; margin: 5px 0;">${ex.observacao}</p>
            <div class="input-group">
                <div><label>CARGA HOJE</label><input type="number" id="input_peso_${index}" placeholder="0"></div>
                <div class="recorde-info">RECORDE<br><strong>${recorde} kg</strong></div>
            </div>`;
        lista.appendChild(card);
    });
}

function voltarMenu() {
    document.getElementById('workout-area').classList.add('hidden');
    document.getElementById('days-menu').classList.remove('hidden');
    document.getElementById('history-section').classList.remove('hidden');
    treinoAtual = null;
}

function concluirTreino() {
    if (!treinoAtual) return;
    if (!confirm("Salvar treino?")) return;

    // Salva recordes
    treinoAtual.exercicios.forEach((ex, index) => {
        const input = document.getElementById(`input_peso_${index}`);
        const peso = parseFloat(input.value);
        if (peso > 0) {
            const chave = `recorde_${treinoAtual.letra}_${index}`;
            const antigo = parseFloat(localStorage.getItem(chave)) || 0;
            if (peso > antigo) localStorage.setItem(chave, peso);
        }
    });

    // Salva histórico
    const historico = JSON.parse(localStorage.getItem('workout_history')) || [];
    const hoje = new Date();
    const dia = String(hoje.getDate()).padStart(2, '0');
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const ano = hoje.getFullYear();
    
    // Captura cargas
    const cargas = treinoAtual.exercicios.map((ex, index) => {
        return { exercicio: ex.nome, carga: document.getElementById(`input_peso_${index}`).value || 0 };
    });

    historico.unshift({ data: `${dia}/${mes}/${ano}`, nome: `TREINO ${treinoAtual.letra}`, cargas: cargas });
    localStorage.setItem('workout_history', JSON.stringify(historico));
    
    salvarPerfil();
    renderizarCalendario(); // Atualiza calendário
    alert("Treino Salvo!");
    voltarMenu();
}

// --- MODAIS ---
function abrirDetalhesData(item) {
    document.getElementById('history-date-title').innerText = `${item.data} - ${item.nome}`;
    const lista = document.getElementById('history-details-list');
    lista.innerHTML = '';
    if(item.cargas) {
        item.cargas.forEach(c => {
            lista.innerHTML += `<li class="detail-item"><span>${c.exercicio}</span><strong>${c.carga} kg</strong></li>`;
        });
    }
    document.getElementById('history-modal').classList.remove('hidden');
}
function fecharHistorico() { document.getElementById('history-modal').classList.add('hidden'); }
function abrirVideo(id) {
    document.getElementById('video-container').innerHTML = `<iframe src="https://www.youtube.com/embed/${id}?autoplay=1" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
    document.getElementById('video-modal').classList.remove('hidden');
}
function fecharVideo() {
    document.getElementById('video-container').innerHTML = '';
    document.getElementById('video-modal').classList.add('hidden');
}

// --- PERFIL ---
function salvarPerfil() {
    const p = document.getElementById('user-weight').value;
    if(p) localStorage.setItem('user_profile', JSON.stringify({ peso: p }));
}
function carregarPerfil() {
    const p = JSON.parse(localStorage.getItem('user_profile'));
    if(p) document.getElementById('user-weight').value = p.peso || '';
}
