let treinoData = null;
let treinoAtual = null; // Para saber qual dia estamos fazendo

document.addEventListener('DOMContentLoaded', () => {
    carregarPerfil();
    renderizarHistorico();

    fetch('data/hipertrofia.json')
        .then(response => response.json())
        .then(data => {
            treinoData = data;
            document.getElementById('workout-title').innerText = data.titulo;
            renderMenu();
        })
        .catch(err => console.error("Erro ao carregar treino:", err));
});

// --- FUNÇÕES DE PERFIL ---
function salvarPerfil() {
    const peso = document.getElementById('user-weight').value;
    const meta = document.getElementById('user-goal').value;
    localStorage.setItem('user_profile', JSON.stringify({ peso, meta }));
}

function carregarPerfil() {
    const perfil = JSON.parse(localStorage.getItem('user_profile'));
    if (perfil) {
        document.getElementById('user-weight').value = perfil.peso || '';
        document.getElementById('user-goal').value = perfil.meta || '';
    }
}

// --- RENDERIZAÇÃO ---
function renderMenu() {
    const menu = document.getElementById('days-menu');
    menu.innerHTML = '';
    
    treinoData.dias.forEach(dia => {
        const div = document.createElement('div');
        div.className = 'card-day';
        div.innerHTML = `
            <h2>Dia ${dia.letra}</h2>
            <span>${dia.foco}</span>
        `;
        div.onclick = () => abrirTreino(dia);
        menu.appendChild(div);
    });
}

function abrirTreino(dia) {
    treinoAtual = dia; // Salva qual o treino de hoje
    document.getElementById('days-menu').classList.add('hidden');
    document.getElementById('history-section').classList.add('hidden'); // Esconde histórico
    document.getElementById('workout-area').classList.remove('hidden');
    document.getElementById('current-day-title').innerText = `Treino ${dia.letra}: ${dia.foco}`;
    
    const lista = document.getElementById('exercises-list');
    lista.innerHTML = '';

    dia.exercicios.forEach((ex, index) => {
        const savedWeight = localStorage.getItem(`peso_${dia.letra}_${index}`) || '';
        
        const card = document.createElement('div');
        card.className = 'exercise-card';
        card.innerHTML = `
            <div class="exercise-header">
                <h3>${ex.nome}</h3>
                ${ex.video_id ? `<button class="btn-video" onclick="abrirVideo('${ex.video_id}')">🎥 Ver Vídeo</button>` : ''}
            </div>
            <span class="meta-info">${ex.series} séries x ${ex.repeticoes} reps | ⏸ ${ex.descanso_segundos}s</span>
            <p style="font-size:0.8rem; color:#888;">💡 ${ex.observacao}</p>
            
            <div class="input-group">
                <label>Carga (kg):</label>
                <input type="number" value="${savedWeight}" onchange="salvarCarga('${dia.letra}', ${index}, this.value)">
                <span style="font-size:0.8rem; margin-left:10px;">(Último: ${savedWeight || '-'}kg)</span>
            </div>
        `;
        lista.appendChild(card);
    });
}

function salvarCarga(diaLetra, exercicioIndex, valor) {
    localStorage.setItem(`peso_${diaLetra}_${exercicioIndex}`, valor);
}

function voltarMenu() {
    document.getElementById('workout-area').classList.add('hidden');
    document.getElementById('days-menu').classList.remove('hidden');
    document.getElementById('history-section').classList.remove('hidden');
}

// --- FUNÇÕES DE HISTÓRICO ---
function concluirTreino() {
    if (!treinoAtual) return;

    const confirmacao = confirm("Parabéns! Quer registrar esse treino como concluído?");
    if (confirmacao) {
        const historico = JSON.parse(localStorage.getItem('workout_history')) || [];
        const hoje = new Date().toLocaleDateString('pt-BR');
        
        // Adiciona novo registro
        historico.unshift({
            data: hoje,
            treino: `Treino ${treinoAtual.letra}`,
            foco: treinoAtual.foco
        });

        // Salva e atualiza tela
        localStorage.setItem('workout_history', JSON.stringify(historico));
        renderizarHistorico();
        voltarMenu();
        alert("Treino registrado com sucesso! 💪");
    }
}

function renderizarHistorico() {
    const lista = document.getElementById('history-list');
    const historico = JSON.parse(localStorage.getItem('workout_history')) || [];

    if (historico.length === 0) {
        lista.innerHTML = '<li style="color: #666;">Nenhum treino registrado ainda. Bora treinar?</li>';
        return;
    }

    lista.innerHTML = '';
    // Mostra apenas os últimos 7 treinos para não poluir
    historico.slice(0, 7).forEach(item => {
        const li = document.createElement('li');
        li.className = 'history-item';
        li.innerHTML = `<span>${item.data}</span> <strong>${item.treino}</strong>`;
        lista.appendChild(li);
    });
}

// --- VÍDEO ---
function abrirVideo(videoId) {
    const modal = document.getElementById('video-modal');
    const container = document.getElementById('video-container');
    container.innerHTML = `<iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
    modal.classList.remove('hidden');
}

function fecharVideo() {
    const modal = document.getElementById('video-modal');
    document.getElementById('video-container').innerHTML = '';
    modal.classList.add('hidden');
}
