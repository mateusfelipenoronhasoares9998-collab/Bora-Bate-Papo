const MAX_MESSAGE_LENGTH = 280;
const STORAGE_KEY = 'boranexus-state-v1';

const appState = {
  user: null,
  room: null,
  roomId: '',
  messages: [],
  connectionAlive: false,
  localStream: null,
  screenStream: null,
  micEnabled: false,
  camEnabled: false,
  screenEnabled: false,
  rpgStats: {
    hp: 100,
    mana: 64,
    quests: 3,
  },
};

const ids = [
  'loginForm',
  'displayName',
  'email',
  'userBadge',
  'roomStatus',
  'roomName',
  'joinCode',
  'createRoomBtn',
  'joinRoomBtn',
  'micBtn',
  'camBtn',
  'screenBtn',
  'voicePresetBtn',
  'chatForm',
  'messageInput',
  'chatList',
  'chatCounter',
  'connectionLog',
  'connectionState',
  'googleLoginBtn',
  'logoutBtn',
  'copyInviteBtn',
  'rpgBtn',
  'hpValue',
  'manaValue',
  'questValue',
];

const els = {};
ids.forEach((id) => {
  els[id] = document.getElementById(id);
});

function safeStorageGet() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    console.warn('[BoraNexus] localStorage indisponível:', error?.message || error);
    return {};
  }
}

function safeStorageSet(value) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch (error) {
    console.warn('[BoraNexus] Não foi possível salvar estado local:', error?.message || error);
  }
}

function sanitizeText(input, limit = MAX_MESSAGE_LENGTH) {
  return String(input || '').replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, limit);
}

function logConnection(message) {
  if (!els.connectionLog) return;
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  els.connectionLog.textContent = `[${timestamp}] ${message}`;
}

function setConnectionState(isOnline) {
  if (!els.connectionState) return;
  appState.connectionAlive = isOnline;
  els.connectionState.textContent = isOnline ? 'Online' : 'Offline';
  els.connectionState.classList.toggle('online', isOnline);
  els.connectionState.classList.toggle('offline', !isOnline);
}

function hydrate() {
  const persisted = safeStorageGet();
  appState.user = persisted.user || null;
  appState.room = persisted.room || null;
  appState.messages = Array.isArray(persisted.messages) ? persisted.messages : [];

  if (appState.user && els.userBadge) {
    els.userBadge.textContent = appState.user.name;
  }

  if (appState.room && els.roomStatus) {
    appState.roomId = appState.room.id;
    els.roomStatus.textContent = `Sala ativa: ${appState.room.name} (${appState.room.id})`;
  }

  refreshMessages();
}

function persist() {
  safeStorageSet({ user: appState.user, room: appState.room, messages: appState.messages });
}

function refreshMessages() {
  if (!els.chatList) return;
  els.chatList.innerHTML = '';

  if (!appState.messages.length) {
    const empty = document.createElement('li');
    empty.className = 'chat-item';
    empty.innerHTML = '<strong>Sistema</strong><span>Não há mensagens ainda. Comece a conversa.</span>';
    els.chatList.appendChild(empty);
  } else {
    appState.messages.forEach((message) => {
      const item = document.createElement('li');
      item.className = 'chat-item';
      item.innerHTML = `<strong>${message.author}</strong><span>${message.text}</span>`;
      els.chatList.appendChild(item);
    });
  }

  if (els.chatCounter) {
    els.chatCounter.textContent = `${appState.messages.length} mensagem${appState.messages.length === 1 ? '' : 's'}`;
  }
}

function buildInvite() {
  if (!appState.roomId) return 'Nenhuma sala ativa';
  return `https://example.com/room/${appState.roomId}`;
}

function handleLogin(event) {
  event.preventDefault();
  if (!els.displayName || !els.email) {
    logConnection('Formulário de login não disponível.');
    return;
  }

  const name = sanitizeText(els.displayName.value, 24);
  const email = sanitizeText(els.email.value, 120);
  if (!name || !email) {
    logConnection('Informe nome e email para autenticar.');
    return;
  }

  appState.user = { name, email };
  if (els.userBadge) els.userBadge.textContent = name;
  logConnection(`Usuário ${name} autenticado.`);
  setConnectionState(true);
  persist();
}

function handleGoogleLogin() {
  logConnection('Fluxo de Google deve ser validado em backend seguro com OAuth2 e token server-side.');
}

function createRoom() {
  if (!els.roomName || !els.roomStatus) {
    logConnection('Campos da sala não disponíveis.');
    return;
  }

  const roomName = sanitizeText(els.roomName.value, 32) || 'Sala do BoraNexus';
  const id = Math.random().toString(36).slice(2, 8).toUpperCase();
  appState.roomId = id;
  appState.room = { id, name: roomName };
  els.roomStatus.textContent = `Sala ativa: ${roomName} (${id})`;
  logConnection(`Sala ${roomName} criada com sucesso.`);
  setConnectionState(true);
  persist();
}

function joinRoom() {
  if (!els.joinCode || !els.roomStatus) {
    logConnection('Código de sala indisponível.');
    return;
  }

  const roomId = sanitizeText(els.joinCode.value, 12).toUpperCase();
  if (!roomId) {
    logConnection('Informe um código de sala válido.');
    return;
  }

  appState.roomId = roomId;
  appState.room = { id: roomId, name: `Sala ${roomId}` };
  els.roomStatus.textContent = `Sala ativa: Sala ${roomId} (${roomId})`;
  logConnection(`Você entrou na sala ${roomId}.`);
  setConnectionState(true);
  persist();
}

async function requestMedia(constraints, button, label) {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('getUserMedia não está disponível neste navegador.');
    }
    if (!window.isSecureContext) {
      throw new Error('HTTPS ou localhost é necessário para obter permissão de mídia.');
    }

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    if (constraints.audio) {
      appState.localStream = stream;
      appState.micEnabled = true;
    }
    if (constraints.video) {
      appState.camEnabled = true;
    }

    if (button) button.classList.add('is-on');
    logConnection(`${label} iniciada com sucesso.`);
    return stream;
  } catch (error) {
    logConnection(`Falha ao acessar ${label}: ${error.message || 'permissão negada.'}`);
    if (button) button.classList.remove('is-on');
    return null;
  }
}

async function toggleMicrophone() {
  if (!els.micBtn) return;

  if (appState.micEnabled && appState.localStream) {
    appState.localStream.getAudioTracks().forEach((track) => track.stop());
    appState.localStream = null;
    appState.micEnabled = false;
    els.micBtn.classList.remove('is-on');
    logConnection('Microfone desligado.');
    return;
  }

  await requestMedia({ audio: true }, els.micBtn, 'microfone');
}

async function toggleCamera() {
  if (!els.camBtn) return;

  if (appState.camEnabled && appState.localStream) {
    appState.localStream.getVideoTracks().forEach((track) => track.stop());
    appState.localStream = null;
    appState.camEnabled = false;
    els.camBtn.classList.remove('is-on');
    logConnection('Câmera desligada.');
    return;
  }

  await requestMedia({ video: { facingMode: 'user' } }, els.camBtn, 'câmera');
}

async function toggleScreenShare() {
  if (!els.screenBtn) return;

  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      throw new Error('Compartilhamento de tela não suportado neste navegador.');
    }

    if (appState.screenEnabled && appState.screenStream) {
      appState.screenStream.getTracks().forEach((track) => track.stop());
      appState.screenStream = null;
      appState.screenEnabled = false;
      els.screenBtn.classList.remove('is-on');
      logConnection('Compartilhamento de tela encerrado.');
      return;
    }

    const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
    appState.screenStream = stream;
    appState.screenEnabled = true;
    els.screenBtn.classList.add('is-on');
    logConnection('Compartilhamento de tela iniciado.');

    stream.getVideoTracks()[0]?.addEventListener('ended', () => {
      appState.screenStream = null;
      appState.screenEnabled = false;
      els.screenBtn.classList.remove('is-on');
      logConnection('Compartilhamento de tela encerrado pelo usuário.');
    });
  } catch (error) {
    logConnection(`Falha no compartilhamento de tela: ${error.message || 'usuário cancelou.'}`);
    els.screenBtn.classList.remove('is-on');
  }
}

function applyVoicePreset() {
  const presets = ['Névoa', 'Voz 1', 'Voz 2', 'Celular', 'Estúdio'];
  const current = presets[Math.floor(Math.random() * presets.length)];
  logConnection(`Preset de voz aplicado: ${current}.`);
}

function handleMessageSubmit(event) {
  event.preventDefault();
  if (!els.messageInput) return;

  const text = sanitizeText(els.messageInput.value, MAX_MESSAGE_LENGTH);
  if (!text) return;

  appState.messages.push({ author: appState.user?.name || 'Você', text });
  persist();
  refreshMessages();
  els.messageInput.value = '';
  logConnection(`Mensagem enviada para ${appState.room?.name || 'a sala atual'}.`);
}

async function copyInvite() {
  const invite = buildInvite();
  if (!navigator.clipboard) {
    logConnection('Clipboard do navegador indisponível no contexto atual.');
    return;
  }

  try {
    await navigator.clipboard.writeText(invite);
    logConnection(`Convite copiado: ${invite}`);
  } catch (error) {
    logConnection('Não foi possível copiar o convite.');
  }
}

function updateRpgStats() {
  if (!els.hpValue || !els.manaValue || !els.questValue) return;
  els.hpValue.textContent = String(appState.rpgStats.hp);
  els.manaValue.textContent = String(appState.rpgStats.mana);
  els.questValue.textContent = String(appState.rpgStats.quests);
}

function openRpgMission() {
  const missionPool = [
    'Explorar o mercado negro de São Paulo.',
    'Recuperar um artefato perdido no litoral.',
    'Desvendar a rota da guilda no centro da cidade.',
  ];

  const mission = missionPool[Math.floor(Math.random() * missionPool.length)];
  appState.rpgStats.hp = Math.max(45, appState.rpgStats.hp - 5);
  appState.rpgStats.mana = Math.min(100, appState.rpgStats.mana + 8);
  appState.rpgStats.quests = Math.max(1, appState.rpgStats.quests - 1);
  updateRpgStats();
  logConnection(`Missão ativa: ${mission}`);
}

function logout() {
  appState.user = null;
  appState.room = null;
  appState.roomId = '';
  appState.messages = [];

  if (els.displayName) els.displayName.value = '';
  if (els.email) els.email.value = '';
  if (els.userBadge) els.userBadge.textContent = 'Visitante';
  if (els.roomStatus) els.roomStatus.textContent = 'Sem sala ativa.';
  if (els.joinCode) els.joinCode.value = '';
  if (els.roomName) els.roomName.value = '';

  setConnectionState(false);
  persist();
  refreshMessages();
  logConnection('Sessão encerrada.');
}

function bindEvents() {
  const requiredButtons = [
    'loginForm', 'googleLoginBtn', 'createRoomBtn', 'joinRoomBtn', 'micBtn',
    'camBtn', 'screenBtn', 'voicePresetBtn', 'chatForm', 'copyInviteBtn',
    'rpgBtn', 'logoutBtn',
  ];

  const missing = requiredButtons.filter((id) => !els[id]);
  if (missing.length) {
    console.warn('[BoraNexus] Elementos faltando:', missing);
    return;
  }

  els.loginForm.addEventListener('submit', handleLogin);
  els.googleLoginBtn.addEventListener('click', handleGoogleLogin);
  els.createRoomBtn.addEventListener('click', createRoom);
  els.joinRoomBtn.addEventListener('click', joinRoom);
  els.micBtn.addEventListener('click', toggleMicrophone);
  els.camBtn.addEventListener('click', toggleCamera);
  els.screenBtn.addEventListener('click', toggleScreenShare);
  els.voicePresetBtn.addEventListener('click', applyVoicePreset);
  els.chatForm.addEventListener('submit', handleMessageSubmit);
  els.copyInviteBtn.addEventListener('click', copyInvite);
  els.rpgBtn.addEventListener('click', openRpgMission);
  els.logoutBtn.addEventListener('click', logout);
}

function init() {
  try {
    hydrate();
    bindEvents();
    updateRpgStats();
    setConnectionState(Boolean(appState.user));
    logConnection('Sistema pronto. Aguardando autenticação e sala.');
  } catch (error) {
    console.error('[BoraNexus] Erro na inicialização:', error);
    if (document.body) {
      document.body.innerHTML = `
        <div style="font-family: Arial, sans-serif; color: #111; background: #fff; padding: 24px;">
          BoraNexus falhou ao iniciar. Verifique o console do navegador e recarregue a página.
        </div>
      `;
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}

window.addEventListener('error', (event) => {
  console.error('[BoraNexus] Erro global:', event.error || event.message);
});
