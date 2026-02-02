let treinoData = null;
let treinoAtual = null;
let timerInterval = null;

// Configuração Inicial
let dataReferencia = new Date();
let modoVisualizacao = 'semanal'; // PADRÃO SEMANAL COMO PEDIU

document.addEventListener('DOMContentLoaded', () => {
    carregarPerfil();
    
    // Inicia na aba de Treino
    mudarAba('treino');
    
    // Carrega Ficha Padrão
    const ficha = document.getElementById('workout-select').value;
    carregarJSON(ficha);
});

// --- SISTEMA DE ABAS ---
function mudarAba(abaNome) {
    // Esconde todas as seções
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    
    // Desativa botões
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));

    // Ativa a escolhida
    document.getElementById(`tab-${abaNome}`).classList.remove('hidden');
    document.getElementById(`tab-${abaNome}`).classList.add('active');
    
    // Ativa botão (gambiarra simples pelo index)
    const btnIndex = abaNome === 'treino' ? 0 : abaNome === 'calendario' ? 1 : 2;
    document.querySelectorAll('.nav-btn')[btnIndex].classList.add('active');

    if (abaNome === 'calendario') renderizarCalendario();
    if (abaNome === 'stats') renderizarGraficos();
}

// --- CARREGAMENTO DE DADOS ---
function carregarJSON(arquivo) {
    fetch(`data/${arquivo}`)
        .then(res => {
            if(!res.ok) throw new Error("Erro ao ler arquivo");
            return res.json();
        })
        .then(data => {
            treinoData = data;
            document.getElementById('workout-title').innerText = data.titulo;
            renderMenu();
        })
        .catch(err => console.error(err));
}

function trocarFicha() {
    const nova = document.getElementById('workout-select').value;
    voltarMenu();
    document.getElementById('workout-title').innerText = "Trocando ficha...";
    carregarJSON(nova);
}

// --- RENDERIZAÇÃO DE TREINO ---
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
    document.getElementById('workout-area').classList.remove('hidden');
    document.getElementById('current-day-title').innerText = `TREINO ${dia.letra} /// ${dia.foco.toUpperCase()}`;
    
    const lista = document.getElementById('exercises-list');
    lista.innerHTML = '';

    dia.exercicios.forEach((ex, index) => {
        // Recupera dados salvos (agora salvamos Carga E Reps)
        const lastLoad = localStorage.getItem(`last_load_${dia.letra}_${index}`) || '';
        const lastReps = localStorage.getItem(`last_reps_${dia.letra}_${index}`) || '';

        const card = document.createElement('div');
        card.className = 'exercise-card';
        card.innerHTML = `
            <div class="exercise-header">
                <h3>${ex.nome}</h3>
                ${ex.video_id ? `<button class="btn-video" onclick="abrirVideo('${ex.video_id}')">▶ VÍDEO</button>` : ''}
            </div>
            
            <div class="meta-row">
                <span class="meta-tag">${ex.series} Séries</span>
                <span class="meta-tag">${ex.repeticoes} Reps</span>
                <span class="meta-tag timer-btn" onclick="iniciarTimer(${ex.descanso_segundos})">⏱ ${ex.descanso_segundos}s</span>
            </div>
            <p style="font-size:0.7rem; color:#666; margin-bottom:10px;">${ex.observacao}</p>
            
            <div class="input-row">
                <div class="input-wrapper">
                    <label>CARGA (KG)</label>
                    <input type="number" id="input_peso_${index}" value="${lastLoad}" placeholder="0" oninput="calcular1RM(${index})">
                </div>
                <div class="input-wrapper">
                    <label>REPS FEITAS</label>
                    <input type="number" id="input_reps_${index}" value="${lastReps}" placeholder="0" oninput="calcular1RM(${index})">
                </div>
            </div>
            <div class="rm-display" id="rm_display_${index}"></div>
        `;
        lista.appendChild(card);
        // Calcula 1RM inicial se já tiver dados
        if(lastLoad && lastReps) calcular1RM(index);
    });
}

function voltarMenu() {
    document.getElementById('workout-area').classList.add('hidden');
    document.getElementById('days-menu').classList.remove('hidden');
    treinoAtual = null;
}

// --- CÁLCULO DE 1RM E CRONÔMETRO ---
function calcular1RM(index) {
    const peso = parseFloat(document.getElementById(`input_peso_${index}`).value) || 0;
    const reps = parseFloat(document.getElementById(`input_reps_${index}`).value) || 0;
    const display = document.getElementById(`rm_display_${index}`);
    
    if (peso > 0 && reps > 0) {
        // Fórmula Epley: 1RM = Peso * (1 + Reps/30)
        const rm = Math.round(peso * (1 + reps / 30));
        let nivel = "Iniciante";
        
        // Lógica simples de nível baseada apenas no peso absoluto (para motivar)
        if (rm > 40) nivel = "Intermediário";
        if (rm > 80) nivel = "Avançado";
        if (rm > 120) nivel = "Elite";

        display.innerHTML = `1RM Estm: <strong>${rm}kg</strong> (${nivel})`;
    } else {
        display.innerHTML = "";
    }
}

function iniciarTimer(segundos) {
    const overlay = document.getElementById('timer-overlay');
    const display = document.getElementById('timer-countdown');
    overlay.classList.remove('hidden');
    
    let tempo = segundos;
    display.innerText = tempo < 10 ? `0${tempo}:00` : `${tempo}:00`; // Formata simples
    
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        tempo--;
        display.innerText = tempo < 10 ? `0${tempo}` : tempo;
        if (tempo <= 0) {
            clearInterval(timerInterval);
            display.innerText = "BORA!";
            // Vibrar celular se suportado
            if(navigator.vibrate) navigator.vibrate([200, 100, 200]);
            setTimeout(() => overlay.classList.add('hidden'), 1500);
        }
    }, 1000);
}

function fecharTimer() {
    clearInterval(timerInterval);
    document.getElementById('timer-overlay').classList.add('hidden');
}

// --- FINALIZAR TREINO ---
function concluirTreino() {
    if (!treinoAtual) return;
    if (!confirm("Salvar treino e registrar cargas?")) return;

    const historico = JSON.parse(localStorage.getItem('workout_history')) || [];
    const hoje = new Date();
    const dia = String(hoje.getDate()).padStart(2, '0');
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const ano = hoje.getFullYear();
    const dataFormatada = `${dia}/${mes}/${ano}`;
    
    const cargasDetalhadas = [];

    treinoAtual.exercicios.forEach((ex, index) => {
        const inputPeso = document.getElementById(`input_peso_${index}`).value;
        const inputReps = document.getElementById(`input_reps_${index}`).value;
        
        // Salva memória para próxima vez
        if(inputPeso) localStorage.setItem(`last_load_${treinoAtual.letra}_${index}`, inputPeso);
        if(inputReps) localStorage.setItem(`last_reps_${treinoAtual.letra}_${index}`, inputReps);

        cargasDetalhadas.push({
            exercicio: ex.nome,
            carga: inputPeso || 0,
            reps: inputReps || 0
        });
    });

    historico.unshift({
        data: dataFormatada,
        nome: `TREINO ${treinoAtual.letra}`, // Importante: Guarda a letra para a cor
        cargas: cargasDetalhadas,
        timestamp: new Date().getTime() // Para ordenar gráficos
    });

    localStorage.setItem('workout_history', JSON.stringify(historico));
    alert("Treino salvo com sucesso! 🔥");
    voltarMenu();
}

// --- CALENDÁRIO COM CORES ---
function alternarModo(modo) {
    modoVisualizacao = modo;
    document.getElementById('btn-view-month').className = modo === 'mensal' ? 'active' : '';
    document.getElementById('btn-view-week').className = modo === 'semanal' ? 'active' : '';
    renderizarCalendario();
}

function navegarCalendario(direcao) {
    if (modoVisualizacao === 'mensal') {
        dataReferencia.setMonth(dataReferencia.getMonth() + direcao);
    } else {
        dataReferencia.setDate(dataReferencia.getDate() + (direcao * 7));
    }
    renderizarCalendario();
}

function renderizarCalendario() {
    const container = document.getElementById('calendar-days');
    const label = document.getElementById('calendar-month-year');
    const historico = JSON.parse(localStorage.getItem('workout_history')) || [];
    const meses = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
    
    container.innerHTML = '';

    if (modoVisualizacao === 'mensal') {
        label.innerText = `${meses[dataReferencia.getMonth()]} ${dataReferencia.getFullYear()}`;
        const ano = dataReferencia.getFullYear();
        const mes = dataReferencia.getMonth();
        const firstDay = new Date(ano, mes, 1).getDay();
        const daysInMonth = new Date(ano, mes + 1, 0).getDate();

        for(let i=0; i<firstDay; i++) container.appendChild(document.createElement('div'));
        for(let d=1; d<=daysInMonth; d++) criarDia(new Date(ano, mes, d), historico, container);

    } else {
        // Modo Semanal
        const diaSemana = dataReferencia.getDay();
        const domingo = new Date(dataReferencia);
        domingo.setDate(dataReferencia.getDate() - diaSemana);
        const sabado = new Date(domingo);
        sabado.setDate(domingo.getDate() + 6);
        
        label.innerText = `${domingo.getDate()} ${meses[domingo.getMonth()]} - ${sabado.getDate()} ${meses[sabado.getMonth()]}`;
        
        for(let i=0; i<7; i++) {
            const d = new Date(domingo);
            d.setDate(domingo.getDate() + i);
            criarDia(d, historico, container);
        }
    }
}

function criarDia(data, historico, container) {
    const div = document.createElement('div');
    div.className = 'calendar-day';
    div.innerText = data.getDate();
    
    // Formata Data
    const diaF = String(data.getDate()).padStart(2, '0');
    const mesF = String(data.getMonth() + 1).padStart(2, '0');
    const anoF = data.getFullYear();
    const chave = `${diaF}/${mesF}/${anoF}`;

    if(data.toDateString() === new Date().toDateString()) div.classList.add('today');

    // Procura treino
    const treinos = historico.filter(h => h.data === chave);
    if(treinos.length > 0) {
        const t = treinos[0];
        // Define cor baseada na letra (A, B, C, D)
        const letra = t.nome.split(' ').pop().toLowerCase(); // "TREINO A" -> "a"
        div.classList.add(`workout-${letra}`);
        div.onclick = () => abrirDetalhesData(t);
    }
    container.appendChild(div);
}

// --- GRÁFICOS (CHART.JS) ---
let chartPieInstance = null;
let chartLineInstance = null;

function renderizarGraficos() {
    const historico = JSON.parse(localStorage.getItem('workout_history')) || [];
    
    if(historico.length === 0) return;

    // 1. Gráfico de Pizza (Frequência)
    const contagem = { 'A': 0, 'B': 0, 'C': 0, 'D': 0 };
    historico.forEach(h => {
        const letra = h.nome.split(' ').pop();
        if(contagem[letra] !== undefined) contagem[letra]++;
    });

    const ctxPie = document.getElementById('chart-pie').getContext('2d');
    if(chartPieInstance) chartPieInstance.destroy();

    chartPieInstance = new Chart(ctxPie, {
        type: 'doughnut',
        data: {
            labels: ['A', 'B', 'C', 'D'],
            datasets: [{
                data: [contagem.A, contagem.B, contagem.C, contagem.D],
                backgroundColor: ['#00f0ff', '#bd00ff', '#00ff9d', '#ff9100'],
                borderWidth: 0
            }]
        },
        options: {
            plugins: { legend: { position: 'bottom', labels: { color: '#fff' } } }
        }
    });

    // 2. Gráfico de Linha (Volume Semanal)
    // Agrupa por semana (simples: últimos 10 treinos)
    const ultimosTreinos = historico.slice(0, 10).reverse(); // Do mais antigo pro novo
    const labels = ultimosTreinos.map(h => h.data.substring(0, 5)); // "DD/MM"
    const dataVol = ultimosTreinos.map(h => {
        // Soma total de carga * reps do dia (Volume Load Aproximado)
        return h.cargas.reduce((acc, curr) => acc + (parseFloat(curr.carga)||0), 0);
    });

    const ctxLine = document.getElementById('chart-line').getContext('2d');
    if(chartLineInstance) chartLineInstance.destroy();

    chartLineInstance = new Chart(ctxLine, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Carga Total (kg)',
                data: dataVol,
                borderColor: '#00f0ff',
                tension: 0.4,
                pointBackgroundColor: '#fff'
            }]
        },
        options: {
            scales: {
                y: { ticks: { color: '#666' }, grid: { color: '#222' } },
                x: { ticks: { color: '#666' }, grid: { display: false } }
            },
            plugins: { legend: { display: false } }
        }
    });
}

// --- BACKUP E UTILITÁRIOS ---
function baixarBackup() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(localStorage));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "gym_backup.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

function restaurarBackup(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        const conteudo = JSON.parse(e.target.result);
        // Limpa e restaura
        localStorage.clear();
        for (let key in conteudo) {
            localStorage.setItem(key, conteudo[key]);
        }
        alert("Dados restaurados! A página irá recarregar.");
        location.reload();
    };
    reader.readAsText(file);
}

// Modais (Vídeo e Detalhes)
function abrirVideo(id) {
    document.getElementById('video-container').innerHTML = `<iframe src="https://www.youtube.com/embed/${id}?autoplay=1" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
    document.getElementById('video-modal').classList.remove('hidden');
}
function fecharVideo() {
    document.getElementById('video-container').innerHTML = '';
    document.getElementById('video-modal').classList.add('hidden');
}
function abrirDetalhesData(item) {
    document.getElementById('history-date-title').innerText = `${item.data} - ${item.nome}`;
    const lista = document.getElementById('history-details-list');
    lista.innerHTML = '';
    if(item.cargas) {
        item.cargas.forEach(c => {
            // Mostra Reps se tiver
            const repsInfo = c.reps ? `x ${c.reps} reps` : '';
            lista.innerHTML += `<li class="detail-item"><span>${c.exercicio}</span><strong>${c.carga}kg ${repsInfo}</strong></li>`;
        });
    }
    document.getElementById('history-modal').classList.remove('hidden');
}
function fecharHistorico() { document.getElementById('history-modal').classList.add('hidden'); }
function salvarPerfil() {
    const p = document.getElementById('user-weight').value;
    if(p) localStorage.setItem('user_profile', JSON.stringify({ peso: p }));
}
function carregarPerfil() {
    const p = JSON.parse(localStorage.getItem('user_profile'));
    if(p) document.getElementById('user-weight').value = p.peso || '';
}
