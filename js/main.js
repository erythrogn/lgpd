// ================= URL GOOGLE APPS SCRIPT =================
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyDo2N0QnGcpiSeYCm9n4uMZ6JoOjsDXxF0FE52J6sCKUVt4wGDQL0WDbFCKsCEcaasiA/exec';

// ================= ESTADO GLOBAL =================
let userData = { nome: "", setor: "" };
let totalCorrect = 0;
const TOTAL_QUESTIONS_GAME = 16; // 4 por fase

// ================= CONTROLE DE TELAS =================
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    window.scrollTo(0, 0);
}

function registerUser() {
    const nome = document.getElementById('input-nome').value.trim();
    const setor = document.getElementById('input-setor').value;

    if (nome === "" || setor === "") {
        alert("Por favor, preencha todos os campos.");
        return;
    }

    userData.nome = nome;
    userData.setor = setor;
    document.getElementById('display-nome').textContent = nome.split(' ')[0];
    showScreen('screen-start');
}

function startPhase(n) {
    if (n === 1) { showScreen('screen-fase1'); initQuiz(); }
    else if (n === 2) { showScreen('screen-fase2'); }
    else if (n === 3) { showScreen('screen-fase3'); initChatSequence(); }
    else if (n === 4) { showScreen('screen-fase4'); initTriage(); }
}

// ================= FASE 1: QUIZ (4 Testes) =================
const quizData = [
    { q: "Na LGPD, quem é considerado o 'Titular' dos dados coletados durante uma consulta médica?", opts: ["O médico que atende", "A Policlínica (Instituição)", "O paciente em atendimento", "O setor de TI"], correct: 2, explain: "O Titular é a pessoa natural a quem os dados pessoais se referem." },
    { q: "Qual o objetivo do princípio da 'necessidade' na coleta de dados na recepção?", opts: ["Coletar o máximo de informações para marketing", "Coletar apenas dados estritamente essenciais para o atendimento", "Guardar os dados permanentemente no banco", "Garantir que o paciente assine um contrato"], correct: 1, explain: "O tratamento deve ser restrito ao mínimo necessário para a finalidade pretendida." },
    { q: "Quem é o 'Controlador' das informações dentro do contexto da nossa instituição?", opts: ["O analista de TI", "O paciente", "O Ministério da Saúde", "A Policlínica"], correct: 3, explain: "A Policlínica é quem toma as decisões sobre as finalidades e os meios de tratamento dos dados." },
    { q: "Como a LGPD classifica informações que revelam origem racial, crença religiosa ou diagnósticos de saúde (como códigos CID)?", opts: ["Dados de Domínio Público", "Dados Pessoais Comuns", "Dados Pessoais Sensíveis", "Dados Comerciais"], correct: 2, explain: "Informações íntimas ou relacionadas à saúde são rigorosamente classificadas como sensíveis e exigem proteção máxima." }
];
let quizIdx = 0, quizCorrect = 0;

function initQuiz() { quizIdx = 0; quizCorrect = 0; renderQuiz(); }

function renderQuiz() {
    document.getElementById('btn-quiz-next').classList.add('hidden');
    document.getElementById('btn-quiz-finish').classList.add('hidden');
    document.getElementById('quiz-progress').style.width = (quizIdx / quizData.length) * 100 + '%';

    if (quizIdx >= quizData.length) {
        totalCorrect += quizCorrect;
        document.getElementById('quiz-area').innerHTML = `<div class="quiz-card" style="text-align:center"><p class="quiz-score">Fase 1: ${quizCorrect} de 4 acertos.</p></div>`;
        document.getElementById('quiz-progress').style.width = '100%';
        document.getElementById('btn-quiz-finish').classList.remove('hidden');
        return;
    }

    const q = quizData[quizIdx];
    document.getElementById('quiz-area').innerHTML = `
        <div class="quiz-card">
            <p class="quiz-question">(${quizIdx+1}/4) ${q.q}</p>
            <div class="quiz-options">
                ${q.opts.map((o, i) => `
                    <button class="quiz-opt stagger-${i+1}" onclick="answerQuiz(${i})">
                        <svg class="icon" width="16" height="16" style="flex-shrink:0"><circle cx="12" cy="12" r="10"></circle></svg> ${o}
                    </button>
                `).join('')}
            </div>
            <div class="quiz-feedback" id="quiz-fb"></div>
        </div>`;
}

function answerQuiz(idx) {
    const q = quizData[quizIdx];
    const btns = document.querySelectorAll('.quiz-opt');
    btns.forEach(b => b.disabled = true);
    const fb = document.getElementById('quiz-fb');
    const isOk = idx === q.correct;
    
    btns[q.correct].classList.add('correct');
    btns[q.correct].innerHTML = `<svg class="icon" width="16" height="16" style="flex-shrink:0"><use href="#icon-check"></use></svg> ` + q.opts[q.correct];
    
    if (!isOk) {
        btns[idx].classList.add('wrong');
        btns[idx].innerHTML = `<svg class="icon" width="16" height="16" style="flex-shrink:0"><use href="#icon-x"></use></svg> ` + q.opts[idx];
    } else {
        quizCorrect++;
    }
    
    const feedbackIcon = isOk ? `<svg class="icon" width="20" height="20" style="color:var(--success)"><use href="#icon-check"></use></svg>` : `<svg class="icon" width="20" height="20" style="color:#f99"><use href="#icon-x"></use></svg>`;
    fb.innerHTML = `${feedbackIcon} <div><strong>${isOk ? 'Correto!' : 'Incorreto.'}</strong> ${q.explain}</div>`;
    fb.className = 'quiz-feedback show ' + (isOk ? 'ok' : 'err');
    
    quizIdx++;
    setTimeout(() => document.getElementById(quizIdx >= quizData.length ? 'btn-quiz-finish' : 'btn-quiz-next').classList.remove('hidden'), 800);
}
function nextQuiz() { renderQuiz(); }

// ================= FASE 2: INSPEÇÃO (4 Testes) =================
const modals = {
    pc: { title: "Sistema Destravado", desc: "O prontuário eletrônico está aberto e o colaborador não está na mesa. Qualquer pessoa pode ver os dados.", correct: 1, opts: ["Apenas abaixar o monitor", "Bloquear a tela (Windows + L)", "Esperar o colega voltar"] },
    doc: { title: "Ficha Abandonada", desc: "Uma Ficha de Atendimento Código 268 foi esquecida no balcão da recepção.", correct: 2, opts: ["Descartar no lixo do banheiro", "Guardar em uma gaveta sem chave", "Destruir na fragmentadora de papel"] },
    laudo: { title: "Envio Incorreto", desc: "Um laudo com diagnóstico sensível foi encaminhado acidentalmente para um contato errado no WhatsApp.", correct: 1, opts: ["Bloquear o número que recebeu", "Apagar para todos e comunicar o TI e o DPO", "Pedir por favor para a pessoa apagar"] },
    senha: { title: "Senha Exposta", desc: "Um Post-it amarelo com o login e senha do Salutem está colado na borda do monitor, burlando os controles.", correct: 0, opts: ["Retirar, triturar e memorizar a senha", "Esconder debaixo do teclado numérico", "Deixar lá, pois o sistema já pede digital"] }
};
let solvedF2 = 0, currentModal = '';

function openModal(key) {
    currentModal = key; const m = modals[key];
    document.getElementById('m-title').textContent = m.title;
    document.getElementById('m-desc').textContent = m.desc;
    document.getElementById('m-opts').innerHTML = m.opts.map((o, i) => `
        <button class="modal-opt" onclick="checkModal(${i})">
            <svg class="icon" width="16" height="16" style="flex-shrink:0"><use href="#icon-arrow"></use></svg> ${o}
        </button>
    `).join('');
    document.getElementById('main-modal').classList.add('active');
}

function checkModal(idx) {
    const m = modals[currentModal];
    const btns = document.querySelectorAll('#m-opts .modal-opt');
    btns.forEach(b => b.disabled = true);
    
    if (idx === m.correct) {
        btns[idx].classList.add('correct'); 
        totalCorrect++;
        setTimeout(() => {
            document.getElementById('main-modal').classList.remove('active');
            const card = document.getElementById('item-' + currentModal);
            card.classList.remove('alert'); card.classList.add('resolved');
            solvedF2++;
            if (solvedF2 >= 4) document.getElementById('btn-next-f2').classList.remove('hidden');
        }, 700);
    } else {
        btns[idx].classList.add('wrong');
        setTimeout(() => { btns[idx].classList.remove('wrong'); btns.forEach(b => b.disabled = false); }, 800);
    }
}

// ================= FASE 3: CHAT SEQUENCE (4 Testes) =================
const chatSequence = [
    {
        sender: "Dr. Marcos", avatar: "DM", role: "Corpo Clínico",
        msg: "Ei, esqueci minha senha e o suporte tá demorando. Me empresta o seu login do Salutem rapidinho pra eu ver o CID do paciente do leito 3?",
        opts: [
            { text: "Emprestar a senha para agilizar o atendimento do paciente.", correct: false },
            { text: "Negar acesso. Orientar a abrir chamado no GLPI para o TI.", correct: true },
            { text: "Digitar minha senha no computador dele e sair.", correct: false }
        ],
        feedbackOk: "Isso mesmo. Compartilhamento de credenciais burla a rastreabilidade.",
        feedbackErr: "Falha de segurança. Cada acesso deve ser pessoal e intransferível."
    },
    {
        sender: "Ana", avatar: "AR", role: "Recepção",
        msg: "Um familiar do paciente da triagem quer ver o prontuário. Ele não tem autorização oficial registrada. Posso imprimir uma cópia e entregar?",
        opts: [
            { text: "Sim, familiares sempre têm direito de acessar o prontuário.", correct: false },
            { text: "Imprimir apenas a primeira página com dados básicos.", correct: false },
            { text: "Não. Acesso restrito ao titular ou representante legal documentado.", correct: true }
        ],
        feedbackOk: "Correto. O acesso de terceiros sem representação legal viola o sigilo.",
        feedbackErr: "A LGPD proíbe entrega de dados médicos a terceiros sem procuração ou mandato."
    },
    {
        sender: "Suporte TI", avatar: "TI", role: "Administrativo",
        msg: "Olá, aqui é o suporte técnico. Detectamos uma falha no banco de dados da Policlínica. Qual a sua senha atual para podermos revalidar seu usuário?",
        opts: [
            { text: "Informar a senha para resolver o problema logo.", correct: false },
            { text: "Informar a senha e pedir para eles trocarem depois.", correct: false },
            { text: "Não enviar. Bloquear e reportar incidente de engenharia social.", correct: true }
        ],
        feedbackOk: "Exato! A equipe de TI NUNCA solicita senhas de usuários.",
        feedbackErr: "Perigo! Isso é Phishing (Engenharia Social). O TI não pede sua senha."
    },
    {
        sender: "Carla", avatar: "CE", role: "Enfermagem",
        msg: "Acabei de tirar foto da tela do painel de exames para mandar no grupo de WhatsApp da equipe. Fica bem mais fácil acompanhar o plantão assim, né?",
        opts: [
            { text: "Alertar que é proibido transitar dados sensíveis em WhatsApp não oficial.", correct: true },
            { text: "Concordar, pois melhora a agilidade da equipe médica.", correct: false },
            { text: "Pedir para ela borrar apenas o nome do paciente na foto.", correct: false }
        ],
        feedbackOk: "Muito bem. WhatsApp pessoal não é ferramenta homologada para tráfego clínico.",
        feedbackErr: "Transitar exames em WhatsApp expõe os dados a redes não criptografadas oficialmente."
    }
];
let chatIdx = 0;

function initChatSequence() {
    chatIdx = 0;
    document.getElementById('chat-messages').innerHTML = ''; // Limpa mensagens anteriores
    loadChatScenario();
}

function loadChatScenario() {
    const messagesBox = document.getElementById('chat-messages');
    const choicesBox = document.getElementById('chat-choices');
    
    // Se finalizou os 4 cenários
    if(chatIdx >= chatSequence.length) {
        document.getElementById('btn-next-f3').classList.remove('hidden');
        return;
    }

    const data = chatSequence[chatIdx];
    
    // Atualiza cabeçalho
    document.getElementById('chat-avatar').textContent = data.avatar;
    document.getElementById('chat-name').textContent = data.sender;
    document.getElementById('chat-role').textContent = data.role;
    document.getElementById('chat-counter').textContent = `${chatIdx + 1}/4`;

    // Limpa a tela do chat com suavidade
    messagesBox.innerHTML = '';
    choicesBox.style.display = 'none';
    
    // Cria e exibe indicador de digitação
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'typing-indicator';
    typingIndicator.id = 'typing-indicator';
    typingIndicator.innerHTML = '<div class="dot"></div><div class="dot"></div><div class="dot"></div>';
    messagesBox.appendChild(typingIndicator);
    typingIndicator.style.display = 'flex';

    setTimeout(() => {
        // Remove o indicador de digitação
        typingIndicator.remove();
        
        // Adiciona a mensagem recebida
        const recvMsg = document.createElement('div');
        recvMsg.className = 'msg recv';
        recvMsg.innerHTML = `<strong>${data.sender}:</strong><br>${data.msg}`;
        messagesBox.appendChild(recvMsg);

        // Adiciona as opções de resposta
        choicesBox.innerHTML = data.opts.map((opt, i) => `
            <button class="chat-opt stagger-${i+1}" onclick="answerChatSequence(${i})">
                ${opt.text}
            </button>
        `).join('');
        choicesBox.style.display = 'flex';
        
        messagesBox.scrollTop = messagesBox.scrollHeight;
    }, 1200);
}

function answerChatSequence(optIdx) {
    const data = chatSequence[chatIdx];
    const isOk = data.opts[optIdx].correct;
    const messagesBox = document.getElementById('chat-messages');
    const choicesBox = document.getElementById('chat-choices');
    
    choicesBox.style.display = 'none';

    // Mostra a escolha do usuário
    const sendMsg = document.createElement('div');
    sendMsg.className = 'msg send';
    sendMsg.textContent = data.opts[optIdx].text;
    messagesBox.appendChild(sendMsg);
    messagesBox.scrollTop = messagesBox.scrollHeight;

    // Feedback do Sistema
    setTimeout(() => {
        const systemMsg = document.createElement('div');
        systemMsg.className = `msg system ${isOk ? 'ok' : 'fail'}`;
        
        const iconSvg = isOk ? `<use href="#icon-check"></use>` : `<use href="#icon-alert"></use>`;
        const titleStatus = isOk ? "Ação Correta" : "Alerta de Segurança";
        const feedbackText = isOk ? data.feedbackOk : data.feedbackErr;
        
        systemMsg.innerHTML = `
            <svg class="icon" width="24" height="24" style="margin-bottom: 4px;"><${iconSvg}></svg>
            <strong>${titleStatus}</strong>
            <span>${feedbackText}</span>
        `;
        
        messagesBox.appendChild(systemMsg);
        
        if(isOk) totalCorrect++;
        messagesBox.scrollTop = messagesBox.scrollHeight;

        chatIdx++;
        
        // Pausa antes do próximo cenário
        setTimeout(loadChatScenario, 3000);

    }, 800);
}

// ================= FASE 4: TRIAGEM (4 Testes) =================
const cards = [
    { text: "Código CID inserido em um Atestado Médico", type: "sensivel" }, 
    { text: "Endereço Residencial para Cadastro Base", type: "comum" },
    { text: "Recusa Médica de Transfusão de Sangue", type: "sensivel" }, 
    { text: "E-mail Pessoal do Colaborador da Clínica", type: "comum" }
];
let cardIdx = 0;

function initTriage() { cardIdx = 0; renderCard(); }

function renderCard() {
    if (cardIdx >= cards.length) { showEnd(); return; }
    document.getElementById('triage-progress').style.width = ((cardIdx) / cards.length) * 100 + '%';
    document.getElementById('card-counter').textContent = `${cardIdx + 1} / ${cards.length}`;
    document.getElementById('card-stage').innerHTML = `
        <div class="data-card" id="cur-card">
            <div class="card-tag">Classifique o Registro</div>
            <div>${cards[cardIdx].text}</div>
        </div>`;
}

function sortCard(selected) {
    const c = cards[cardIdx]; const el = document.getElementById('cur-card');
    
    if (selected === c.type) {
        totalCorrect++;
        el.style.transform = selected === 'comum' ? 'translateX(-150%) rotate(-15deg) scale(0.8)' : 'translateX(150%) rotate(15deg) scale(0.8)';
        el.style.opacity = '0'; cardIdx++;
        setTimeout(renderCard, 400);
    } else {
        el.style.borderColor = 'var(--danger)'; 
        el.style.boxShadow = '0 0 20px rgba(231,64,64,0.4)';
        el.style.animation = 'shake 0.4s';
        setTimeout(() => { el.style.borderColor = 'var(--border)'; el.style.boxShadow = '0 15px 35px rgba(0,0,0,0.3)'; el.style.animation = 'none'; }, 500);
    }
}

// ================= FIM & ENVIO =================
function showEnd() {
    showScreen('screen-end');
    document.getElementById('triage-progress').style.width = '100%';
    
    const scoreString = `${totalCorrect}/${TOTAL_QUESTIONS_GAME}`;
    document.getElementById('final-score').textContent = scoreString;

    const payload = {
        nome: userData.nome,
        setor: userData.setor,
        pontuacao: scoreString
    };

    const syncStatus = document.getElementById('sync-status');

    fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    }).then(() => {
        syncStatus.innerHTML = `<svg class="icon" width="20" height="20" style="color:var(--success)"><use href="#icon-check"></use></svg> <strong>Sincronização concluída com sucesso!</strong>`;
        syncStatus.style.borderColor = "var(--success)";
        document.getElementById('btn-restart').classList.remove('hidden');
    }).catch(err => {
        syncStatus.innerHTML = `<svg class="icon" width="20" height="20" style="color:var(--danger)"><use href="#icon-alert"></use></svg> <strong>Erro ao registrar na nuvem.</strong>`;
        syncStatus.style.borderColor = "var(--danger)";
        document.getElementById('btn-restart').classList.remove('hidden');
    });
}