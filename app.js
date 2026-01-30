let treinoData = null;
let treinoAtual = null;

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    carregarPerfil();
    renderizarHistorico();

    fetch('data/hipertrofia.json')
        .then(res => res.json())
        .then(data => {
            treinoData = data;
            document.getElementById('workout-title').innerText = data.titulo;
            renderMenu();
        })
        .catch(err => console.error("Erro ao carregar:", err));
});

// --- RENDERIZAÇÃO ---
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

function abrirTreino(dia) {
    treinoAtual = dia;
    // Esconde menu e mostra área de treino
    document.getElementById('days-menu').classList.add('hidden');
    document.getElementById('history-section').classList.add('hidden');
    document.getElementById('workout-area').classList.remove('hidden');
    
    document.getElementById('current-day-title').innerText = `TREINO ${dia.letra} /// ${dia.foco.toUpperCase()}`;
    
    const lista = document.getElementById('exercises-list');
    lista.innerHTML = '';

    dia.exercicios.forEach((ex, index) => {
        // Busca o recorde PESSOAL salvo (Maior carga já feita)
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

// --- LÓGICA DE FINALIZAR TREINO (AQUI ESTÁ A MÁGICA) ---
function concluirTreino() {
    if (!treinoAtual) return;

    // 1. Pergunta se quer finalizar
    if (!confirm("Finalizar o treino e salvar os recordes?")) return;

    // 2. Loop para verificar cada exercício
    treinoAtual.exercicios.forEach((ex, index) => {
        const input = document.getElementById(`input_peso_${index}`);
        const pesoDigitado = parseFloat(input.value);

        // Se o usuário digitou algo válido
        if (pesoDigitado > 0) {
            const chaveRecorde = `recorde_${treinoAtual.letra}_${index}`;
            const recordeAntigo = parseFloat(localStorage.getItem(chaveRecorde)) || 0;

            // Lógica: Só salva se for MAIOR que o recorde anterior (PR)
            if (pesoDigitado > recordeAntigo) {
                localStorage.setItem(chaveRecorde, pesoDigitado);
                console.log(`Novo recorde em ${ex.nome}: ${pesoDigitado}kg`);
            }
        }
    });

    // 3. Salva no histórico geral
    salvarHistoricoGeral();

    // 4. Salva perfil (caso tenha mudado peso/meta na tela inicial)
    salvarPerfil();

    alert("Treino Concluído! Recordes atualizados. 💪");
    voltarMenu();
}

// --- UTILITÁRIOS ---
function salvarHistoricoGeral() {
    const historico = JSON.parse(localStorage.getItem('workout_history')) || [];
    const hoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    
    historico.unshift({
        data: hoje,
        nome: `TREINO ${treinoAtual.letra}`,
        detalhe: treinoAtual.foco
    });

    localStorage.setItem('workout_history', JSON.stringify(historico));
    renderizarHistorico();
}

function renderizarHistorico() {
    const lista = document.getElementById('history-list');
    const historico = JSON.parse(localStorage.getItem('workout_history')) || [];

    if (historico.length === 0) {
        lista.innerHTML = '<li class="history-item">Nenhum treino registrado.</li>';
        return;
    }

    lista.innerHTML = '';
    historico.slice(0, 5).forEach(item => {
        const li = document.createElement('li');
        li.className = 'history-item';
        li.innerHTML = `<span>${item.data}</span> <strong>${item.nome}</strong>`;
        lista.appendChild(li);
    });
}

function salvarPerfil() {
    const peso = document.getElementById('user-weight').value;
    const meta = document.getElementById('user-goal').value;
    if(peso || meta) {
        localStorage.setItem('user_profile', JSON.stringify({ peso, meta }));
    }
}

function carregarPerfil() {
    const perfil = JSON.parse(localStorage.getItem('user_profile'));
    if (perfil) {
        document.getElementById('user-weight').value = perfil.peso || '';
        document.getElementById('user-goal').value = perfil.meta || '';
    }
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
