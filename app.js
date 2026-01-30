// --- FUNÇÃO ATUALIZADA: Salva os pesos junto com a data ---
function salvarHistoricoGeral() {
    const historico = JSON.parse(localStorage.getItem('workout_history')) || [];
    const hoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    
    // 1. Captura os pesos que estão na tela AGORA
    const cargasUtilizadas = treinoAtual.exercicios.map((ex, index) => {
        const input = document.getElementById(`input_peso_${index}`);
        return {
            exercicio: ex.nome,
            carga: input.value || 0 // Se não preencheu, salva 0
        };
    });

    // 2. Salva tudo no objeto
    historico.unshift({
        data: hoje,
        nome: `TREINO ${treinoAtual.letra}`,
        detalhe: treinoAtual.foco,
        cargas: cargasUtilizadas // <--- O PULO DO GATO ESTÁ AQUI
    });

    localStorage.setItem('workout_history', JSON.stringify(historico));
    renderizarHistorico();
}

// --- FUNÇÃO ATUALIZADA: Cria os itens clicáveis ---
function renderizarHistorico() {
    const lista = document.getElementById('history-list');
    const historico = JSON.parse(localStorage.getItem('workout_history')) || [];

    if (historico.length === 0) {
        lista.innerHTML = '<li class="history-item" style="cursor: default;">Nenhum treino registrado.</li>';
        return;
    }

    lista.innerHTML = '';
    
    // O index é importante para sabermos qual item abrir
    historico.slice(0, 7).forEach((item, index) => {
        const li = document.createElement('li');
        li.className = 'history-item';
        // Adicionamos o onclick passando o índice
        li.onclick = () => abrirDetalhesHistorico(index);
        
        li.innerHTML = `
            <span>${item.data}</span> 
            <strong>${item.nome}</strong>
        `;
        lista.appendChild(li);
    });
}

// --- NOVAS FUNÇÕES: Modal de Detalhes ---
function abrirDetalhesHistorico(index) {
    const historico = JSON.parse(localStorage.getItem('workout_history')) || [];
    const item = historico[index];

    if (!item) return;

    // Preenche Título
    document.getElementById('history-date-title').innerText = `${item.data} - ${item.nome}`;
    
    const listaDetalhes = document.getElementById('history-details-list');
    listaDetalhes.innerHTML = '';

    // Verifica se esse histórico antigo tem cargas salvas (treinos velhos não terão)
    if (item.cargas && item.cargas.length > 0) {
        item.cargas.forEach(c => {
            // Só mostra se teve carga (maior que 0) ou mostra tudo se quiser
            const li = document.createElement('li');
            li.className = 'detail-item';
            li.innerHTML = `
                <span>${c.exercicio}</span>
                <strong>${c.carga} kg</strong>
            `;
            listaDetalhes.appendChild(li);
        });
    } else {
        listaDetalhes.innerHTML = '<p style="text-align:center; padding:20px; color:#666;">Detalhes de carga não disponíveis para este registro.</p>';
    }

    // Abre Modal
    document.getElementById('history-modal').classList.remove('hidden');
}

function fecharHistorico() {
    document.getElementById('history-modal').classList.add('hidden');
}
