let treinoData = null;
let treinoAtual = null;
let timerInterval = null;
let dataReferencia = new Date();
let modoVisualizacao = 'semanal';

document.addEventListener('DOMContentLoaded', () => {
    carregarPerfil();
    mudarAba('treino');
    const ficha = document.getElementById('workout-select').value;
    carregarJSON(ficha);
});

// --- ABAS ---
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

// --- CARREGAR TREINO ---
function carregarJSON(arquivo) {
    fetch(`data/${arquivo}`).then(res => res.json()).then(data => {
        treinoData = data;
        renderMenu();
    }).catch(err => console.error(err));
}
function trocarFicha() {
    const nova = document.getElementById('workout-select').value;
    document.getElementById('workout-area').classList.add('hidden');
    document.getElementById('days-menu').classList.remove('hidden');
    carregarJSON(nova);
}

// --- RENDERIZAR ---
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
    
    // Limpa notas
    document.getElementById('workout-notes').value = '';
    
    const lista = document.getElementById('exercises-list');
    lista.innerHTML = '';

    dia.exercicios.forEach((ex, exIndex) => {
        let setsHTML = '';
        for (let i = 1; i <= ex.series; i++) {
            const lastLoad = localStorage.getItem(`hist_${dia.letra}_${exIndex}_s${i}_load`) || '';
            const lastReps = localStorage.getItem(`hist_${dia.letra}_${exIndex}_s${i}_reps`) || '';
            setsHTML += `
                <div class="set-row">
                    <span class="set-label">${i}</span>
                    <div class="set-input-group"><input type="number" class="set-input" id="peso_${exIndex}_${i}" value="${lastLoad}" placeholder="kg" oninput="calcular1RM(${exIndex}, ${ex.series})"></div>
                    <div class="set-input-group"><input type="number" class="set-input" id="reps_${exIndex}_${i}" value="${lastReps}" placeholder="reps" oninput="calcular1RM(${exIndex}, ${ex.series})"></div>
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
                <span class="tag timer-btn" onclick="iniciarTimer(${ex.descanso_segundos})">⏱ ${ex.descanso_segundos}s</span>
                <input type="number" id="rpe_${exIndex}" class="rpe-input" placeholder="RPE" min="1" max="10" title="Esforço Percebido (1-10)">
            </div>
            <div class="sets-container">
                <div style="display:flex; justify-content:space-between; padding:0 35px 5px 35px; color:#666; font-size:0.6rem;"><span>CARGA</span> <span>REPS</span></div>
                ${setsHTML}
            </div>
            <div class="rm-container">
                <span id="rm_display_${exIndex}" class="rm-value">--</span>
                <span class="tooltip-icon" onclick="alert('1RM: Carga máxima teórica para 1 repetição.')">?</span>
            </div>
        `;
        lista.appendChild(card);
        calcular1RM(exIndex, ex.series);
    });
}

function voltarMenu() {
    document.getElementById('workout-area').classList.add('hidden');
    document.getElementById('days-menu').classList.remove('hidden');
    treinoAtual = null;
}

// --- CALCULADORA DE BARRA ---
function abrirCalculadora() { document.getElementById('calc-modal').classList.remove('hidden'); }
function fecharCalculadora() { document.getElementById('calc-modal').classList.add('hidden'); }
function calcularBarra() {
    const plates = parseFloat(document.getElementById('calc-plates').value) || 0;
    const hasBar = document.getElementById('calc-bar-check').checked;
    
    // Se marcou barra, soma 20kg. Se não, é só as anilhas.
    const total = plates + (hasBar ? 20 : 0);
    const side = plates / 2;
    
    document.getElementById('calc-total').innerText = total + ' kg';
    document.getElementById('calc-side-info').innerText = `${side} kg cada lado`;
}

// --- LÓGICA 1RM ---
function calcular1RM(exIndex, totalSeries) {
    let maxRM = 0;
    for(let i=1; i<=totalSeries; i++) {
        const p = parseFloat(document.getElementById(`peso_${exIndex}_${i}`).value) || 0;
        const r = parseFloat(document.getElementById(`reps_${exIndex}_${i}`).value) || 0;
        if(p>0 && r>0) { const rm = p*(1+r/30); if(rm>maxRM) maxRM=rm; }
    }
    const display = document.getElementById(`rm_display_${exIndex}`);
    display.innerHTML = maxRM > 0 ? `1RM Est: <strong>${Math.round(maxRM)}kg</strong>` : "--";
}

// --- TIMER ---
function iniciarTimer(segundos) {
    document.getElementById('timer-overlay').classList.remove('hidden');
    let tempo = segundos;
    const display = document.getElementById('timer-countdown');
    const format = (t) => { const m = Math.floor(t/60); const s = t%60; return `${m<10?'0'+m:m}:${s<10?'0'+s:s}`; };
    display.innerText = format(tempo);
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        tempo--; display.innerText = format(tempo);
        if (tempo <= 0) {
            clearInterval(timerInterval); display.innerText = "BORA!";
            if(navigator.vibrate) navigator.vibrate([500]);
        }
    }, 1000);
}
function fecharTimer() { clearInterval(timerInterval); document.getElementById('timer-overlay').classList.add('hidden'); }

// --- SALVAR TREINO (COM NOTAS E RPE) ---
function concluirTreino() {
    if (!treinoAtual || !confirm("Salvar treino?")) return;
    const hist = JSON.parse(localStorage.getItem('workout_history')) || [];
    const hoje = new Date();
    const dataF = `${String(hoje.getDate()).padStart(2,'0')}/${String(hoje.getMonth()+1).padStart(2,'0')}/${hoje.getFullYear()}`;
    const notas = document.getElementById('workout-notes').value;
    const execs = [];

    treinoAtual.exercicios.forEach((ex, exIndex) => {
        const setsData = [];
        for(let i=1; i<=ex.series; i++) {
            const load = document.getElementById(`peso_${exIndex}_${i}`).value;
            const reps = document.getElementById(`reps_${exIndex}_${i}`).value;
            if(load || reps) {
                setsData.push({s:i, k:load, r:reps});
                localStorage.setItem(`hist_${treinoAtual.letra}_${exIndex}_s${i}_load`, load);
                localStorage.setItem(`hist_${treinoAtual.letra}_${exIndex}_s${i}_reps`, reps);
            }
        }
        const rpe = document.getElementById(`rpe_${exIndex}`).value;
        if(setsData.length > 0) execs.push({ nome: ex.nome, sets: setsData, rpe: rpe });
    });

    hist.unshift({
        data: dataF, nome: `TREINO ${treinoAtual.letra}`, exercicios: execs,
        notes: notas, timestamp: new Date().getTime()
    });
    localStorage.setItem('workout_history', JSON.stringify(hist));
    alert("Treino Salvo! 💪");
    voltarMenu();
}

// --- UTILITÁRIOS E CALENDÁRIO ---
function abrirPerfil() { document.getElementById('profile-modal').classList.remove('hidden'); }
function fecharPerfil() { document.getElementById('profile-modal').classList.add('hidden'); }
function salvarPerfil() { const p = document.getElementById('user-weight').value; if(p) localStorage.setItem('user_profile', JSON.stringify({ peso: p })); }
function carregarPerfil() { const p = JSON.parse(localStorage.getItem('user_profile')); if(p) document.getElementById('user-weight').value = p.peso || ''; }
function baixarBackup() { const s = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(localStorage)); const a = document.createElement('a'); a.href = s; a.download = "gym_backup.json"; document.body.appendChild(a); a.click(); a.remove(); }
function restaurarBackup(i) { const f = i.files[0]; if(!f) return; const r = new FileReader(); r.onload = function(e){ const d=JSON.parse(e.target.result); localStorage.clear(); for(let k in d) localStorage.setItem(k, d[k]); alert("Restaurado!"); location.reload(); }; r.readAsText(f); }
function gerarDadosDemo() { if(!confirm("Apagar tudo e gerar demo?")) return; const h=[]; const l=['A','B','C','D']; for(let i=0; i<10; i++){ const d=new Date(); d.setDate(d.getDate()-(9-i)); const k=20+(i*5); h.unshift({data:`${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`, nome:`TREINO ${l[i%4]}`, timestamp:d.getTime(), exercicios:[{nome:"Supino Demo", sets:[{s:1,k:k,r:10}]}]}); } localStorage.setItem('workout_history', JSON.stringify(h)); alert("Feito!"); location.reload(); }

function renderizarCalendario() {
    const c = document.getElementById('calendar-days');
    const l = document.getElementById('calendar-month-year');
    const h = JSON.parse(localStorage.getItem('workout_history')) || [];
    const ms = ["JAN","FEV","MAR","ABR","MAI","JUN","JUL","AGO","SET","OUT","NOV","DEZ"];
    c.innerHTML = '';
    if(modoVisualizacao==='semanal') {
        const d=dataReferencia.getDay(); const dom=new Date(dataReferencia); dom.setDate(dataReferencia.getDate()-d); const sab=new Date(dom); sab.setDate(dom.getDate()+6);
        l.innerText=`${dom.getDate()} ${ms[dom.getMonth()]} - ${sab.getDate()} ${ms[sab.getMonth()]}`;
        for(let i=0;i<7;i++){ const dt=new Date(dom); dt.setDate(dom.getDate()+i); criarDia(dt,h,c); }
    } else {
        l.innerText=`${ms[dataReferencia.getMonth()]} ${dataReferencia.getFullYear()}`;
        const ano=dataReferencia.getFullYear(); const mes=dataReferencia.getMonth();
        const f=new Date(ano,mes,1).getDay(); const t=new Date(ano,mes+1,0).getDate();
        for(let i=0;i<f;i++) c.appendChild(document.createElement('div'));
        for(let i=1;i<=t;i++) criarDia(new Date(ano,mes,i),h,c);
    }
}
function criarDia(d,h,c) {
    const div=document.createElement('div'); div.className='calendar-day'; div.innerText=d.getDate();
    const k=`${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
    if(d.toDateString()===new Date().toDateString()) div.classList.add('today');
    const t=h.find(x=>x.data===k);
    if(t){ const l=t.nome.split(' ').pop().toLowerCase(); div.classList.add(`workout-${l}`); div.onclick=()=>abrirDetalhesData(t); }
    c.appendChild(div);
}
function alternarModo(m){ modoVisualizacao=m; document.getElementById('btn-view-month').className=m==='mensal'?'active':''; document.getElementById('btn-view-week').className=m==='semanal'?'active':''; renderizarCalendario(); }
function navegarCalendario(dir){ if(modoVisualizacao==='mensal') dataReferencia.setMonth(dataReferencia.getMonth()+dir); else dataReferencia.setDate(dataReferencia.getDate()+(dir*7)); renderizarCalendario(); }

function renderizarGraficos() {
    const hist = JSON.parse(localStorage.getItem('workout_history')) || [];
    if(hist.length===0) return;
    const cnt={A:0,B:0,C:0,D:0}; hist.forEach(h=>{const l=h.nome.split(' ').pop(); if(cnt[l]!==undefined)cnt[l]++;});
    new Chart(document.getElementById('chart-pie'), { type:'doughnut', data:{labels:['A','B','C','D'], datasets:[{data:[cnt.A,cnt.B,cnt.C,cnt.D], backgroundColor:['#00f0ff','#bd00ff','#00ff9d','#ff9100'], borderWidth:0}]}, options:{plugins:{legend:{position:'bottom', labels:{color:'#fff'}}}} });
    
    const ult=hist.slice(0,15).reverse(); const lbs=ult.map(h=>h.data.substring(0,5));
    const dA=[], dB=[], dC=[], dD=[];
    ult.forEach(h=>{
        let v=0; if(h.exercicios) h.exercicios.forEach(ex=>ex.sets.forEach(s=>v+=(parseFloat(s.k)||0)*(parseFloat(s.r)||0)));
        const l=h.nome.split(' ').pop();
        dA.push(l==='A'?v:null); dB.push(l==='B'?v:null); dC.push(l==='C'?v:null); dD.push(l==='D'?v:null);
    });
    new Chart(document.getElementById('chart-line'), { type:'line', data:{labels:lbs, datasets:[{label:'A',data:dA,borderColor:'#00f0ff',spanGaps:true},{label:'B',data:dB,borderColor:'#bd00ff',spanGaps:true},{label:'C',data:dC,borderColor:'#00ff9d',spanGaps:true},{label:'D',data:dD,borderColor:'#ff9100',spanGaps:true}]}, options:{scales:{y:{ticks:{color:'#666'},grid:{color:'#222'}},x:{ticks:{color:'#666'},grid:{display:false}}},plugins:{legend:{labels:{color:'#fff'}}}} });
}

function abrirDetalhesData(t) {
    document.getElementById('history-date-title').innerText = t.data;
    const ul = document.getElementById('history-details-list'); ul.innerHTML = '';
    const noteBox = document.getElementById('history-notes-display');
    noteBox.innerText = t.notes ? `📝 "${t.notes}"` : '';
    
    if(t.exercicios) {
        t.exercicios.forEach(ex => {
            const best = ex.sets.reduce((p, c) => (parseFloat(p.k)>parseFloat(c.k))?p:c);
            const rpeInfo = ex.rpe ? `(RPE ${ex.rpe})` : '';
            ul.innerHTML += `<li class="detail-item"><span>${ex.nome} <small style="color:#666">${rpeInfo}</small></span><strong>${best.k}kg x ${best.r}</strong></li>`;
        });
    }
    document.getElementById('history-modal').classList.remove('hidden');
}
function fecharHistorico() { document.getElementById('history-modal').classList.add('hidden'); }
function abrirVideo(id) { document.getElementById('video-container').innerHTML = `<iframe src="https://www.youtube.com/embed/${id}?autoplay=1" allow="autoplay; encrypted-media" allowfullscreen></iframe>`; document.getElementById('video-modal').classList.remove('hidden'); }
function fecharVideo() { document.getElementById('video-container').innerHTML = ''; document.getElementById('video-modal').classList.add('hidden'); }
