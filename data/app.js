let treinoData = null;

// Carregar dados ao iniciar
document.addEventListener('DOMContentLoaded', () => {
    fetch('data/hipertrofia.json')
        .then(response => response.json())
        .then(data => {
            treinoData = data;
            document.getElementById('workout-title').innerText = data.titulo;
            renderMenu();
        })
        .catch(err => console.error("Erro ao carregar treino:", err));
});

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
    document.getElementById('days-menu').classList.add('hidden');
    document.getElementById('workout-area').classList.remove('hidden');
    document.getElementById('current-day-title').innerText = `Treino ${dia.letra}: ${dia.foco}`;
    
    const lista = document.getElementById('exercises-list');
    lista.innerHTML = '';

    dia.exercicios.forEach((ex, index) => {
        // Recuperar carga salva
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
                <span style="font-size:0.8rem; margin-left:10px;">(Último: ${savedWeight}kg)</span>
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
}

// Funções do Modal de Vídeo
function abrirVideo(videoId) {
    const modal = document.getElementById('video-modal');
    const container = document.getElementById('video-container');
    // Embed do YouTube
    container.innerHTML = `<iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
    modal.classList.remove('hidden');
}

function fecharVideo() {
    const modal = document.getElementById('video-modal');
    const container = document.getElementById('video-container');
    container.innerHTML = ''; // Parar o vídeo
    modal.classList.add('hidden');
}