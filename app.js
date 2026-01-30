let treinoData = null;
let treinoAtual = null;

document.addEventListener('DOMContentLoaded', () => {
    carregarPerfil(); // Carrega o peso salvo
    renderizarHistorico(); // Mostra o histórico lá embaixo

    // Tenta carregar o treino
    // ATENÇÃO: A pasta no GitHub tem que se chamar "data"
    fetch('data/hipertrofia.json')
        .then(res => {
            if (!res.ok) {
                throw new Error("Não achei o arquivo JSON. Verifique se a pasta se chama 'data'");
            }
            return res.json();
        })
        .then(data => {
            treinoData = data;
            // Atualiza o título e libera o menu
            document.getElementById('workout-title').innerText = data.titulo;
            renderMenu();
        })
        .catch(err => {
            console.error(err);
            document.getElementById('workout-title').innerText = "Erro: " + err.message;
            document.getElementById('workout-title').style.color = "red";
        });
});

// --- RENDERIZAÇÃO DO MENU ---
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

// --- ABRIR O TREINO ---
function abrirTreino(dia) {
    treinoAtual = dia;
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

// --- FINALIZAR TREINO (Lógica do Recorde) ---
function concluirTreino() {
    if (!treinoAtual) return;

    if (!confirm("Finalizar o treino e salvar os recordes?")) return;

    // 1. Verifica recordes
    treinoAtual.exercicios.forEach((ex, index) => {
        const input = document.getElementById(`input_peso_${index}`);
        const pesoDigitado = parseFloat(input.value);

        if (pesoDigitado > 0) {
            const chaveRecorde = `recorde_${treinoAtual.letra}_${index}`;
            const recordeAntigo = parseFloat(localStorage.getItem(chaveRecorde)) || 0;

            // SÓ SALVA SE FOR MAIOR QUE O ANTERIOR
            if (pesoDigitado > recordeAntigo) {
                localStorage.setItem(chaveRecorde, pesoDigitado);
            }
        }
    });

    // 2. Salva no histórico
    salvarHistoricoGeral();
    salvarPerfil(); // Salva o peso corporal

    alert("Treino Concluído! Recordes atualizados. 💪");
    voltarMenu();
}

// --- HISTÓRICO E PERFIL ---
function salvarHistoricoGeral() {
    const historico = JSON.parse(localStorage.getItem('workout_history')) || [];
    const hoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    
    // Captura os pesos usados HOJE para detalhe
    const cargasUtilizadas = treinoAtual.exercicios.map((ex, index) => {
        const input = document.getElementById(`input_peso_${index}`);
        return {
            exercicio: ex.nome,
            carga: input.value || 0
        };
    });

    historico.unshift({
        data: hoje,
        nome: `TREINO ${treinoAtual.letra}`,
        cargas: cargasUtilizadas
    });

    localStorage.setItem('workout_history', JSON.stringify(historico));
    renderizarHistorico();
}

function renderizarHistorico() {
    const lista = document.getElementById('history-list');
    const historico = JSON.parse(localStorage.getItem('workout_history')) || [];

    if (historico.length === 0) {
        lista.innerHTML = '<li class="history-item" style="cursor: default;">Nenhum treino registrado.</li>';
        return;
    }

    lista.innerHTML = '';
    historico.slice(0, 5).forEach((item, index) => {
        const li = document.createElement('li');
        li.className = 'history-item';
        li.onclick = () => abrirDetalhesHistorico(index);
        li.innerHTML = `<span>${item.data}</span> <strong>${item.nome}</strong>`;
        lista.appendChild(li);
    });
}

function salvarPerfil() {
    const peso = document.getElementById('user-weight').value;
    if(peso) {
        localStorage.setItem('user_profile', JSON.stringify({ peso: peso }));
    }
}

function carregarPerfil() {
    const perfil = JSON.parse(localStorage.getItem('user_profile'));
    // BLINDAGEM: Verifica se o elemento existe antes de tentar preencher
    if (perfil && document.getElementById('user-weight')) {
        document.getElementById('user-weight').value = perfil.peso || '';
    }
}

// --- MODAIS ---
function abrirDetalhesHistorico(index) {
    const historico = JSON.parse(localStorage.getItem('workout_history')) || [];
    const item = historico[index];
    if (!item) return;

    document.getElementById('history-date-title').innerText = `${item.data} - ${item.nome}`;
    const listaDetalhes = document.getElementById('history-details-list');
    listaDetalhes.innerHTML = '';

    if (item.cargas && item.cargas.length > 0) {
        item.cargas.forEach(c => {
            const li = document.createElement('li');
            li.className = 'detail-item';
            li.innerHTML = `<span>${c.exercicio}</span> <strong>${c.carga} kg</strong>`;
            listaDetalhes.appendChild(li);
        });
    } else {
        listaDetalhes.innerHTML = '<p style="text-align:center; padding:20px; color:#666;">Sem detalhes.</p>';
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
