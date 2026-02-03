let treinoData = null;
let treinoAtual = null;
let timerInterval = null;

// Configuração Inicial
let dataReferencia = new Date();
let modoVisualizacao = 'semanal';

document.addEventListener('DOMContentLoaded', () => {
    carregarPerfil();
    mudarAba('treino');
    
    // Carrega Ficha Padrão
    const ficha = document.getElementById('workout-select').value;
    carregarJSON(ficha);
});

// --- SISTEMA DE ABAS ---
function mudarAba(abaNome) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));

    document.getElementById(`tab-${abaNome}`).classList.remove('hidden');
    document.getElementById(`tab-${abaNome}`).classList.add('active');
    
    const index = abaNome === 'treino' ? 0 : abaNome === 'calendario' ? 1 : 2;
    document.querySelectorAll('.nav-btn')[index].classList.add('active');

    if (abaNome === 'calendario') renderizarCalendario();
    if (abaNome === 'stats') renderizarGraficos();
}

// --- CARREGAMENTO ---
function carregarJSON(arquivo) {
    fetch(`data/${arquivo}`)
        .then(res => res.json())
        .then(data => {
            treinoData = data;
            document.getElementById('workout-title').innerText = data.titulo;
            renderMenu();
        })
        .catch(err => console.error(err));
}

function trocarFicha() {
    const nova = document.getElementById('workout-select').value;
    document.getElementById('workout-title').innerText = "Carregando...";
    document.getElementById('workout-area').classList.add('hidden');
    document.getElementById('days-menu').classList.remove('hidden');
    carregarJSON(nova);
}

// --- RENDERIZAÇÃO DO TREINO (LÓGICA NOVA DE SÉRIES) ---
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
    document.getElementById('current-day-title').innerText = `DIA ${dia.letra} - ${dia.foco}`;
    
    const lista = document.getElementById('exercises-list');
    lista.innerHTML = '';

    dia.exercicios.forEach((ex, exIndex) => {
        // Gera HTML das linhas de séries (Loop)
        let setsHTML = '';
        for (let i = 1; i <= ex.series; i++) {
            // Tenta recuperar carga salva da última vez para essa série específica
            const lastLoad = localStorage.getItem(`hist_${dia.letra}_${exIndex}_s${i}_load`) || '';
            const lastReps = localStorage.getItem(`hist_${dia.letra}_${exIndex}_s${i}_reps`) || '';

            setsHTML += `
                <div class="set-row">
                    <span class="set-label">${i}</span>
                    <div class="set-input-group">
                        <input type="number" class="set-input" id="peso_${exIndex}_${i}" value="${lastLoad}" placeholder="kg" oninput="calcular1RM(${exIndex}, ${ex.series})">
                    </div>
                    <div class="set-input-group">
                        <input type="number" class="set-input" id="reps_${exIndex}_${i}" value="${lastReps}" placeholder="reps" oninput="calcular1RM(${exIndex}, ${ex.series})">
                    </div>
                </div>
            `;
        }

        const card = document.createElement('div');
        card.className = 'exercise-card';
        card.innerHTML = `
            <div class="exercise-header">
                <h3>${ex.nome}</h3>
                ${ex.video_id ? `<button class="btn-video" onclick="abrirVideo('${ex.video_id}')">▶ VÍDEO</button>` : ''}
            </div>
            
            <div class="meta-tags">
                <span class="tag">${ex.series} Séries</span>
                <span class="tag">${ex.repeticoes} Reps</span>
                <span class="tag timer-btn" onclick="iniciarTimer(${ex.descanso_segundos})">⏱ ${ex.descanso_segundos}s</span>
            </div>

            <div class="sets-container">
                <div style="display:flex; justify-content:space-between; padding:0 35px 5px 35px; color:#666; font-size:0.6rem;">
                    <span>CARGA</span> <span>REPS</span>
                </div>
                ${setsHTML}
            </div>
            
            <div class="rm-container">
                <span id="rm_display_${exIndex}" class="rm-value">--</span>
                <span class="tooltip-icon">?</span>
            </div>
        `;
        lista.appendChild(card);
        // Calcula inicial
        calcular1RM(exIndex, ex.series);
    });
}

function voltarMenu() {
    document.getElementById('workout-area').classList.add('hidden');
    document.getElementById('days-menu').classList.remove('hidden');
    treinoAtual = null;
}

// --- CÁLCULO 1RM (MELHOR SÉRIE) ---
function calcular1RM(exIndex, totalSeries) {
    let maxRM = 0;
    
    // Varre todas as séries para achar a melhor performance
    for(let i=1; i<=totalSeries; i++) {
        const p = parseFloat(document.getElementById(`peso_${exIndex}_${i}`).value) || 0;
        const r = parseFloat(document.getElementById(`reps_${exIndex}_${i}`).value) || 0;
        
        if(p > 0 && r > 0) {
            // Epley Formula
            const rm = p * (1 + r/30);
            if(rm > maxRM) maxRM = rm;
        }
    }

    const display = document.getElementById(`rm_display_${exIndex}`);
    if(maxRM > 0) {
        let nivel = "Iniciante";
        if(maxRM > 60) nivel = "Intermediário";
        if(maxRM > 100) nivel = "Avançado";
        if(maxRM > 140) nivel = "Elite";
        if(maxRM > 200) nivel = "Monstro"; // ;)

        display.innerHTML = `1RM Est: ${Math.round(maxRM)}kg (${nivel})`;
    } else {
        display.innerHTML = "--";
    }
}

// --- TIMER ---
function iniciarTimer(segundos) {
    document.getElementById('timer-overlay').classList.remove('hidden');
    let tempo = segundos;
    const display = document.getElementById('timer-countdown');
    display.innerText = tempo;
    
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        tempo--;
        display.innerText = tempo;
        if (tempo <= 0) {
            clearInterval(timerInterval);
            display.innerText = "BORA!";
            if(navigator.vibrate) navigator.vibrate([300]);
            setTimeout(() => document.getElementById('timer-overlay').classList.add('hidden'), 1000);
        }
    }, 1000);
}
function fecharTimer() {
    clearInterval(timerInterval);
    document.getElementById('timer-overlay').classList.add('hidden');
}

// --- FINALIZAR TREINO (SALVAMENTO COMPLEXO) ---
function concluirTreino() {
    if (!treinoAtual || !confirm("Salvar treino?")) return;

    const historico = JSON.parse(localStorage.getItem('workout_history')) || [];
    const hoje = new Date();
    const dataF = `${String(hoje.getDate()).padStart(2,'0')}/${String(hoje.getMonth()+1).padStart(2,'0')}/${hoje.getFullYear()}`;
    
    const exerciciosRealizados = [];

    treinoAtual.exercicios.forEach((ex, exIndex) => {
        const seriesData = [];
        
        for(let i=1; i<=ex.series; i++) {
            const load = document.getElementById(`peso_${exIndex}_${i}`).value;
            const reps = document.getElementById(`reps_${exIndex}_${i}`).value;
            
            if(load || reps) {
                seriesData.push({ s: i, k: load, r: reps });
                // Salva memória para autolayout na próxima
                localStorage.setItem(`hist_${treinoAtual.letra}_${exIndex}_s${i}_load`, load);
                localStorage.setItem(`hist_${treinoAtual.letra}_${exIndex}_s${i}_reps`, reps);
            }
        }
        
        if(seriesData.length > 0) {
            exerciciosRealizados.push({
                nome: ex.nome,
                sets: seriesData
            });
        }
    });

    historico.unshift({
        data: dataF,
        nome: `TREINO ${treinoAtual.letra}`,
        exercicios: exerciciosRealizados,
        timestamp: new Date().getTime()
    });

    localStorage.setItem('workout_history', JSON.stringify(historico));
    alert("Treino salvo! Foco total! 🔥");
    voltarMenu();
}

// --- PERFIL E BACKUP ---
function abrirPerfil() { document.getElementById('profile-modal').classList.remove('hidden'); }
function fecharPerfil() { document.getElementById('profile-modal').classList.add('hidden'); }
function salvarPerfil() {
    const p = document.getElementById('user-weight').value;
    if(p) localStorage.setItem('user_profile', JSON.stringify({ peso: p }));
}
function carregarPerfil() {
    const p = JSON.parse(localStorage.getItem('user_profile'));
    if(p) document.getElementById('user-weight').value = p.peso || '';
}

// --- BACKUP ---
function baixarBackup() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(localStorage));
    const el = document.createElement('a');
    el.setAttribute("href", dataStr);
    el.setAttribute("download", "gym_backup.json");
    document.body.appendChild(el);
    el.click();
    el.remove();
}
function restaurarBackup(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        const data = JSON.parse(e.target.result);
        localStorage.clear();
        for (let key in data) localStorage.setItem(key, data[key]);
        alert("Restaurado!");
        location.reload();
    };
    reader.readAsText(file);
}

// --- CALENDÁRIO & GRÁFICOS ---
// ... (Mesma lógica de antes, ajustada para nova estrutura de dados)
function alternarModo(modo) {
    modoVisualizacao = modo;
    document.getElementById('btn-view-month').className = modo === 'mensal' ? 'active' : '';
    document.getElementById('btn-view-week').className = modo === 'semanal' ? 'active' : '';
    renderizarCalendario();
}
function navegarCalendario(dir) {
    if(modoVisualizacao === 'mensal') dataReferencia.setMonth(dataReferencia.getMonth() + dir);
    else dataReferencia.setDate(dataReferencia.getDate() + (dir*7));
    renderizarCalendario();
}
function renderizarCalendario() {
    const container = document.getElementById('calendar-days');
    const label = document.getElementById('calendar-month-year');
    const hist = JSON.parse(localStorage.getItem('workout_history')) || [];
    const meses = ["JAN","FEV","MAR","ABR","MAI","JUN","JUL","AGO","SET","OUT","NOV","DEZ"];
    container.innerHTML = '';
    
    // Lógica Semanal (Padrão)
    if(modoVisualizacao === 'semanal') {
        const d = dataReferencia.getDay();
        const dom = new Date(dataReferencia);
        dom.setDate(dataReferencia.getDate() - d);
        const sab = new Date(dom);
        sab.setDate(dom.getDate()+6);
        label.innerText = `${dom.getDate()} ${meses[dom.getMonth()]} - ${sab.getDate()} ${meses[sab.getMonth()]}`;
        for(let i=0; i<7; i++) {
            const dt = new Date(dom);
            dt.setDate(dom.getDate()+i);
            criarDia(dt, hist, container);
        }
    } else {
        // Mensal
        label.innerText = `${meses[dataReferencia.getMonth()]} ${dataReferencia.getFullYear()}`;
        const ano = dataReferencia.getFullYear();
        const mes = dataReferencia.getMonth();
        const first = new Date(ano, mes, 1).getDay();
        const total = new Date(ano, mes + 1, 0).getDate();
        for(let i=0; i<first; i++) container.appendChild(document.createElement('div'));
        for(let i=1; i<=total; i++) criarDia(new Date(ano, mes, i), hist, container);
    }
}
function criarDia(data, hist, container) {
    const div = document.createElement('div');
    div.className = 'calendar-day';
    div.innerText = data.getDate();
    const k = `${String(data.getDate()).padStart(2,'0')}/${String(data.getMonth()+1).padStart(2,'0')}/${data.getFullYear()}`;
    if(data.toDateString() === new Date().toDateString()) div.classList.add('today');
    
    const t = hist.find(h => h.data === k);
    if(t) {
        const l = t.nome.split(' ').pop().toLowerCase();
        div.classList.add(`workout-${l}`);
        div.onclick = () => abrirDetalhesData(t);
    }
    container.appendChild(div);
}

// GRÁFICOS CORRIGIDOS
function renderizarGraficos() {
    const hist = JSON.parse(localStorage.getItem('workout_history')) || [];
    if(hist.length === 0) return;

    // Pizza
    const count = {A:0, B:0, C:0, D:0};
    hist.forEach(h => {
        const l = h.nome.split(' ').pop();
        if(count[l]!==undefined) count[l]++;
    });
    new Chart(document.getElementById('chart-pie'), {
        type: 'doughnut',
        data: {
            labels: ['A','B','C','D'],
            datasets: [{data:[count.A,count.B,count.C,count.D], backgroundColor:['#00f0ff','#bd00ff','#00ff9d','#ff9100'], borderWidth:0}]
        },
        options: { plugins: { legend: { position:'bottom', labels:{color:'#fff'} } } }
    });

    // Linha (Volume Total)
    const ultimos = hist.slice(0, 10).reverse();
    const labels = ultimos.map(h => h.data.substring(0,5));
    const dataVol = ultimos.map(h => {
        let vol = 0;
        // Soma Carga * Reps de todas as séries de todos os exercícios
        if(h.exercicios) {
            h.exercicios.forEach(ex => {
                ex.sets.forEach(s => vol += (parseFloat(s.k)||0) * (parseFloat(s.r)||0));
            });
        }
        return vol;
    });

    new Chart(document.getElementById('chart-line'), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{ label:'Volume Total (kg)', data:dataVol, borderColor:'#00f0ff', tension:0.4 }]
        },
        options: { scales:{ y:{ticks:{color:'#666'}, grid:{color:'#222'}}, x:{ticks:{color:'#666'}, grid:{display:false}} }, plugins:{legend:{display:false}} }
    });
}

// Modais Extras
function abrirDetalhesData(t) {
    document.getElementById('history-date-title').innerText = t.data;
    const ul = document.getElementById('history-details-list');
    ul.innerHTML = '';
    // Lógica para nova estrutura
    if(t.exercicios) {
        t.exercicios.forEach(ex => {
            const bestSet = ex.sets.reduce((prev, current) => (parseFloat(prev.k) > parseFloat(current.k)) ? prev : current);
            ul.innerHTML += `<li class="detail-item"><span>${ex.nome}</span><strong>${bestSet.k}kg x ${bestSet.r}</strong></li>`;
        });
    } else if (t.cargas) { // Suporte legado
        t.cargas.forEach(c => ul.innerHTML += `<li class="detail-item"><span>${c.exercicio}</span><strong>${c.carga}kg</strong></li>`);
    }
    document.getElementById('history-modal').classList.remove('hidden');
}
function fecharHistorico() { document.getElementById('history-modal').classList.add('hidden'); }
function abrirVideo(id) { document.getElementById('video-container').innerHTML = `<iframe src="https://www.youtube.com/embed/${id}?autoplay=1" allow="autoplay; encrypted-media" allowfullscreen></iframe>`; document.getElementById('video-modal').classList.remove('hidden'); }
function fecharVideo() { document.getElementById('video-container').innerHTML = ''; document.getElementById('video-modal').classList.add('hidden'); }
