let treinoData = null;
let treinoAtual = null;

// --- VARIÁVEIS DO CALENDÁRIO HÍBRIDO ---
let dataReferencia = new Date(); // Data que estamos olhando (hoje)
let modoVisualizacao = 'mensal'; // Começa vendo o mês inteiro

document.addEventListener('DOMContentLoaded', () => {
    carregarPerfil(); // Carrega o peso salvo
    
    // Inicia o calendário na tela
    renderizarCalendario();

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

// --- FUNÇÕES DO CALENDÁRIO (MÊS / SEMANA) ---
function alternarModo(modo) {
    modoVisualizacao = modo;
    
    // Atualiza visual dos botões (quem está ativo fica azul)
    document.getElementById('btn-view-month').className = modo === 'mensal' ? 'active' : '';
    document.getElementById('btn-view-week').className = modo === 'semanal' ? 'active' : '';
    
    // Redesenha o calendário no novo modo
    renderizarCalendario();
}

function navegarCalendario(direcao) {
    if (modoVisualizacao === 'mensal') {
        // Pula mês (Direção: -1 ou +1)
        dataReferencia.setMonth(dataReferencia.getMonth() + direcao);
    } else {
        // Pula semana (7 dias)
        dataReferencia.setDate(dataReferencia.getDate() + (direcao * 7));
    }
    renderizarCalendario();
}

function renderizarCalendario() {
    const calendarDays = document.getElementById('calendar-days');
    const labelTitulo = document.getElementById('calendar-month-year');
    const historico = JSON.parse(localStorage.getItem('workout_history')) || [];
    
    calendarDays.innerHTML = '';
    
    const meses = ["JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO", "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"];
    
    if (modoVisualizacao === 'mensal') {
        // --- LÓGICA MENSAL ---
        labelTitulo.innerText = `${meses[dataReferencia.getMonth()]} ${dataReferencia.getFullYear()}`;
        
        const ano = dataReferencia.getFullYear();
        const mes = dataReferencia.getMonth();
        const primeiroDiaSemana = new Date(ano, mes, 1).getDay();
        const totalDiasMes = new Date(ano, mes + 1, 0).getDate();

        // Espaços vazios antes do dia 1
        for (let i = 0; i < primeiroDiaSemana; i++) {
            calendarDays.appendChild(document.createElement('div'));
        }
        
        // Dias do mês (1 a 31)
        for (let d = 1; d <= totalDiasMes; d++) {
            criarDiaVisual(new Date(ano, mes, d), historico, calendarDays);
        }

    } else {
        // --- LÓGICA SEMANAL ---
        // 1. Descobre o Domingo da semana atual da dataReferencia
        const diaDaSemana = dataReferencia.getDay(); // 0 (Domingo) a 6 (Sábado)
        const domingoDaSemana = new Date(dataReferencia);
        domingoDaSemana.setDate(dataReferencia.getDate() - diaDaSemana);

        // 2. Título mostra o intervalo (Ex: 12 JAN - 18 JAN)
        const sabadoDaSemana = new Date(domingoDaSemana);
        sabadoDaSemana.setDate(domingoDaSemana.getDate() + 6);
        
        const mesCurto = meses[domingoDaSemana.getMonth()].substring(0,3);
        const mesFim = meses[sabadoDaSemana.getMonth()].substring(0,3);
        
        labelTitulo.innerText = `${domingoDaSemana.getDate()} ${mesCurto} - ${sabadoDaSemana.getDate()} ${mesFim}`;

        // 3. Loop de 7 dias (Domingo a Sábado)
        for (let i = 0; i < 7; i++) {
            const dataRender = new Date(domingoDaSemana);
            dataRender.setDate(domingoDaSemana.getDate() + i);
            criarDiaVisual(dataRender, historico, calendarDays);
        }
    }
}

// Helper para criar o quadradinho do dia
function criarDiaVisual(data, historico, container) {
    const div = document.createElement('div');
    div.className = 'calendar-day';
    div.innerText = data.getDate();

    // Formata DD/MM/AAAA para buscar no histórico
    const diaF = String(data.getDate()).padStart(2, '0');
    const mesF = String(data.getMonth() + 1).padStart(2, '0');
    const anoF = data.getFullYear();
    const chaveData = `${diaF}/${mesF}/${anoF}`;

    // Marca se for HOJE
    const hoje = new Date();
    if (data.getDate() === hoje.getDate() && data.getMonth() === hoje.getMonth() && data.getFullYear() === hoje.getFullYear()) {
        div.classList.add('today');
    }

    // Marca se tem TREINO
    const treinos = historico.filter(h => h.data === chaveData);
    if (treinos.length > 0) {
        div.classList.add('has-workout');
        div.onclick = () => abrirDetalhesData(treinos[0]);
    }

    container.appendChild(div);
}

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
                ${ex.video_id
