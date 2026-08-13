/**
 * FocusQuest - Core Game Engine & Productivity System
 * Combines RPG Gamification, Premack Reward Shop, Pomodoro Arena, and Anti-Procrastination Triggers.
 */

// =============================================================================
// 1. CONSTANTS & GAME DEFINITIONS
// =============================================================================

const RANKS = [
  { level: 1, title: 'Novizio del Focus', xpNeeded: 100, avatar: '🌱' },
  { level: 2, title: 'Apprendista del Flusso', xpNeeded: 220, avatar: '⚔️' },
  { level: 3, title: 'Cacciatore di Scuse', xpNeeded: 380, avatar: '🛡️' },
  { level: 4, title: 'Sterminatore di Rane', xpNeeded: 600, avatar: '🐸' },
  { level: 5, title: 'Cavaliere della Disciplina', xpNeeded: 900, avatar: '💎' },
  { level: 6, title: 'Mastro del Deep Work', xpNeeded: 1300, avatar: '🔥' },
  { level: 7, title: 'Lord della Produttività', xpNeeded: 1800, avatar: '⚡' },
  { level: 8, title: 'Campione Senza Sosta', xpNeeded: 2500, avatar: '👑' },
  { level: 9, title: 'Gran Maestro del Tempo', xpNeeded: 3400, avatar: '🧙' },
  { level: 10, title: 'Divinità del Focus', xpNeeded: 5000, avatar: '🌌' }
];

const DIFFICULTY_MAP = {
  easy: { name: 'Facile', xp: 15, gold: 5, color: '#34d399', tag: '🟢 Facile' },
  medium: { name: 'Media', xp: 35, gold: 15, color: '#fbbf24', tag: '🟡 Media' },
  boss: { name: 'Boss Fight', xp: 80, gold: 40, color: '#f87171', tag: '🔴 Boss Fight' }
};

const CATEGORIES = {
  work: { name: 'Lavoro', icon: '💼' },
  study: { name: 'Studio', icon: '📚' },
  home: { name: 'Casa', icon: '🏠' },
  health: { name: 'Salute', icon: '🏃' },
  mind: { name: 'Crescita', icon: '🧘' }
};

const BADGES_DEF = [
  { id: 'first_step', name: 'Primo Passo', desc: 'Completa la tua prima quest', icon: '👣' },
  { id: 'frog_eater', name: 'Mangiatore di Rane', desc: 'Mangia la tua prima Rana del Giorno', icon: '🐸' },
  { id: 'deep_focus', name: 'Mente Zen', desc: 'Completa 25 min di Pomodoro', icon: '⏳' },
  { id: 'first_reward', name: 'Piacere Meritato', desc: 'Riscatta il tuo primo premio reale', icon: '🎁' },
  { id: 'boss_slayer', name: 'Slayer di Boss', desc: 'Completa 3 Boss Fight difficili', icon: '🐉' },
  { id: 'streak_3', name: 'Fuoco Sacro', desc: 'Mantieni una serie di 3 giorni', icon: '🔥' },
  { id: 'gold_hoarder', name: 'Ricco di Disciplina', desc: 'Accumula 150 monete d\'oro', icon: '🪙' }
];

const DEFAULT_REWARDS = [
  { id: 'rew_1', title: '30 min di Gaming / Console', cost: 30, emoji: '🎮' },
  { id: 'rew_2', title: '1 Episodio di una Serie TV', cost: 35, emoji: '🍿' },
  { id: 'rew_3', title: 'Pausa Caffè Speciale & Dolce', cost: 20, emoji: '☕' },
  { id: 'rew_4', title: '20 min Social senza sensi di colpa', cost: 25, emoji: '📱' },
  { id: 'rew_5', title: 'Cena Pizza / Sushi nel weekend', cost: 100, emoji: '🍕' }
];

// =============================================================================
// 2. STATE STORAGE & INITIALIZATION
// =============================================================================

let userState = {
  xp: 40,
  level: 1,
  gold: 50, // Starting gift
  streak: 1,
  lastActiveDate: new Date().toISOString().split('T')[0],
  soundEnabled: true,
  stats: {
    tasksCompleted: 0,
    focusMinutes: 0,
    totalGoldEarned: 50,
    frogsEaten: 0,
    bossesDefeated: 0,
    badges: ['first_step']
  },
  victoryLog: [
    { id: 'log_welcome', title: 'Benvenuto in FocusQuest! Bonus iniziale ricevuto', reward: '+40 XP • +50 🪙', time: 'Adesso' }
  ]
};

let quests = [
  {
    id: 'q_demo_1',
    title: 'Apri FocusQuest e scopri il tuo primo premio nel Negozio',
    diff: 'easy',
    category: 'mind',
    isFrog: false,
    subtasks: [],
    completed: true,
    createdAt: Date.now()
  },
  {
    id: 'q_demo_2',
    title: 'Scegli la tua Rana del Giorno (l\'attività più tosta da fare)',
    diff: 'boss',
    category: 'work',
    isFrog: true,
    subtasks: [
      { id: 'sub_1', text: 'Scrivi il titolo esatto del compito difficile', done: false },
      { id: 'sub_2', text: 'Avvia 5 minuti con il pulsante Focus', done: false }
    ],
    completed: false,
    createdAt: Date.now()
  }
];

let rewards = [...DEFAULT_REWARDS];
let claimedRewards = [];

// LocalStorage loaders
function loadSavedData() {
  try {
    const savedState = localStorage.getItem('focusquest_user_state');
    if (savedState) userState = { ...userState, ...JSON.parse(savedState) };

    const savedQuests = localStorage.getItem('focusquest_quests');
    if (savedQuests) quests = JSON.parse(savedQuests);

    const savedRewards = localStorage.getItem('focusquest_rewards');
    if (savedRewards) rewards = JSON.parse(savedRewards);

    const savedClaimed = localStorage.getItem('focusquest_claimed');
    if (savedClaimed) claimedRewards = JSON.parse(savedClaimed);
  } catch (e) {
    console.error('Error reading localStorage:', e);
  }
}

function saveData() {
  try {
    localStorage.setItem('focusquest_user_state', JSON.stringify(userState));
    localStorage.setItem('focusquest_quests', JSON.stringify(quests));
    localStorage.setItem('focusquest_rewards', JSON.stringify(rewards));
    localStorage.setItem('focusquest_claimed', JSON.stringify(claimedRewards));
  } catch (e) {
    console.error('Error saving to localStorage:', e);
  }
}

// =============================================================================
// 3. WEB AUDIO SYNTHESIZER (Pure JS, Zero File Latency)
// =============================================================================

let audioCtx = null;
let ambientNodes = null;
let currentAmbientType = 'none';

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) audioCtx = new AudioContextClass();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

const SoundFX = {
  coin() {
    if (!userState.soundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';

    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(987.77, now); // B5
    osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  },

  complete() {
    if (!userState.soundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;

      const startTime = ctx.currentTime + (idx * 0.06);
      gain.gain.setValueAtTime(0.25, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.45);
    });
  },

  levelUp() {
    if (!userState.soundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const chords = [440, 554.37, 659.25, 880, 1108.73];
    chords.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;

      const startTime = ctx.currentTime + (idx * 0.09);
      gain.gain.setValueAtTime(0.18, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.7);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.7);
    });
  },

  timerEnd() {
    if (!userState.soundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    // Singing bowl meditation tone
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(528, ctx.currentTime); // 528 Hz Love/Focus tone

    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.5);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 2.5);
  },

  click() {
    if (!userState.soundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.04);
  }
};

// Ambient Audio Generator
function stopAmbientSound() {
  if (ambientNodes) {
    try {
      if (ambientNodes.sources) {
        ambientNodes.sources.forEach(s => s.stop());
      }
    } catch (e) {}
    ambientNodes = null;
  }
}

function playAmbientSound(type, volume = 0.5) {
  stopAmbientSound();
  currentAmbientType = type;
  if (type === 'none') return;

  const ctx = getAudioContext();
  if (!ctx) return;

  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(volume, ctx.currentTime);
  masterGain.connect(ctx.destination);

  const sources = [];

  if (type === 'rain' || type === 'whitenoise') {
    // Noise buffer
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = type === 'rain' ? 'lowpass' : 'bandpass';
    filter.frequency.value = type === 'rain' ? 800 : 1200;

    noise.connect(filter);
    filter.connect(masterGain);
    noise.start();
    sources.push(noise);
  } else if (type === 'alpha') {
    // 432Hz Binaural Beat
    const oscLeft = ctx.createOscillator();
    const oscRight = ctx.createOscillator();
    oscLeft.frequency.value = 432;
    oscRight.frequency.value = 442; // 10Hz Alpha difference

    const merger = ctx.createChannelMerger(2);
    oscLeft.connect(merger, 0, 0);
    oscRight.connect(merger, 0, 1);
    merger.connect(masterGain);

    oscLeft.start();
    oscRight.start();
    sources.push(oscLeft, oscRight);
  } else if (type === 'waves') {
    // Modulated Ocean Waves
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;

    // LFO for wave swelling
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.12; // 1 wave every ~8 seconds
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 250;

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    noise.connect(filter);
    filter.connect(masterGain);

    noise.start();
    lfo.start();
    sources.push(noise, lfo);
  }

  ambientNodes = { masterGain, sources };
}

// =============================================================================
// 4. CONFETTI & VISUAL EFFECTS
// =============================================================================

function triggerConfetti() {
  const canvas = document.getElementById('confettiCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = [];
  const colors = ['#10b981', '#34d399', '#f59e0b', '#fbbf24', '#3b82f6', '#ec4899'];

  for (let i = 0; i < 90; i++) {
    particles.push({
      x: canvas.width / 2,
      y: canvas.height / 2,
      vx: (Math.random() - 0.5) * 16,
      vy: (Math.random() - 0.8) * 18,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1,
      rotation: Math.random() * 360,
      vRot: (Math.random() - 0.5) * 10
    });
  }

  let animationId;
  function updateConfetti() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let activeParticles = 0;

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.45; // gravity
      p.rotation += p.vRot;
      p.alpha -= 0.015;

      if (p.alpha > 0) {
        activeParticles++;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      }
    });

    if (activeParticles > 0) {
      animationId = requestAnimationFrame(updateConfetti);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      cancelAnimationFrame(animationId);
    }
  }

  updateConfetti();
}

function showFloatingReward(x, y, text) {
  const elem = document.createElement('div');
  elem.className = 'floating-sparkle';
  elem.textContent = text;
  elem.style.left = `${x}px`;
  elem.style.top = `${y}px`;
  document.body.appendChild(elem);
  setTimeout(() => elem.remove(), 1200);
}

function showToast(message, icon = '⚔️') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => toast.remove(), 3000);
}

// =============================================================================
// 5. GAMIFICATION & XP PROGRESSION
// =============================================================================

function addRewards(xpGained, goldGained, sourceTitle = '') {
  userState.xp += xpGained;
  userState.gold += goldGained;
  userState.stats.totalGoldEarned += goldGained;

  // Check level up
  let currentRank = RANKS.find(r => r.level === userState.level) || RANKS[0];
  let nextRank = RANKS.find(r => r.level === userState.level + 1);

  if (nextRank && userState.xp >= nextRank.xpNeeded) {
    userState.level += 1;
    userState.gold += 50; // Level up gift
    SoundFX.levelUp();
    triggerConfetti();
    showLevelUpModal(userState.level);
  }

  // Check badges
  checkBadges();

  if (sourceTitle) {
    userState.victoryLog.unshift({
      id: 'log_' + Date.now(),
      title: sourceTitle,
      reward: `+${xpGained} XP • +${goldGained} 🪙`,
      time: 'Oggi ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    if (userState.victoryLog.length > 20) userState.victoryLog.pop();
  }

  saveData();
  renderHUD();
}

function checkBadges() {
  const { stats, gold } = userState;
  const award = id => {
    if (!stats.badges.includes(id)) {
      stats.badges.push(id);
      const bDef = BADGES_DEF.find(b => b.id === id);
      showToast(`Nuovo Trofeo Sbloccato: ${bDef ? bDef.name : ''}!`, '🏆');
    }
  };

  if (stats.tasksCompleted >= 1) award('first_step');
  if (stats.frogsEaten >= 1) award('frog_eater');
  if (stats.focusMinutes >= 25) award('deep_focus');
  if (claimedRewards.length >= 1) award('first_reward');
  if (stats.bossesDefeated >= 3) award('boss_slayer');
  if (userState.streak >= 3) award('streak_3');
  if (gold >= 150) award('gold_hoarder');
}

function showLevelUpModal(newLevel) {
  const rank = RANKS.find(r => r.level === newLevel) || RANKS[RANKS.length - 1];
  document.getElementById('levelUpNewLevel').textContent = newLevel;
  document.getElementById('levelUpNewRank').textContent = rank.title;
  document.getElementById('levelUpModal').classList.remove('hidden');
}

// =============================================================================
// 6. UI RENDERING ENGINES
// =============================================================================

function renderHUD() {
  const curRank = RANKS.find(r => r.level === userState.level) || RANKS[0];
  const nextRank = RANKS.find(r => r.level === userState.level + 1);

  document.getElementById('userLevel').textContent = userState.level;
  document.getElementById('rankTitle').textContent = curRank.title;
  document.getElementById('heroAvatarIcon').textContent = curRank.avatar;
  document.getElementById('goldCount').textContent = userState.gold;
  document.getElementById('shopGoldDisplay').textContent = userState.gold;
  document.getElementById('streakCount').textContent = userState.streak;

  // XP calculation
  const curBase = curRank.xpNeeded;
  const nextBase = nextRank ? nextRank.xpNeeded : curBase * 1.5;
  const levelProgressXP = Math.max(0, userState.xp - (userState.level === 1 ? 0 : RANKS[userState.level - 2].xpNeeded));
  const levelTotalXP = nextBase - (userState.level === 1 ? 0 : curBase);
  const percentage = Math.min(100, Math.max(5, (levelProgressXP / levelTotalXP) * 100));

  document.getElementById('xpBarFill').style.width = `${percentage}%`;
  document.getElementById('xpBarLabel').textContent = `${userState.xp} / ${nextBase} XP`;

  // Frog status
  const frogTask = quests.find(q => q.isFrog && !q.completed);
  const frogPill = document.getElementById('frogPill');
  const frogStatusText = document.getElementById('frogStatusText');
  const frogBanner = document.getElementById('frogBanner');
  const frogBannerTitle = document.getElementById('frogBannerTitle');
  const frogBannerDesc = document.getElementById('frogBannerDesc');
  const frogActionBtn = document.getElementById('frogActionBtn');

  if (frogTask) {
    frogStatusText.textContent = 'In Corso';
    frogBanner.classList.remove('frog-eaten');
    frogBannerTitle.textContent = frogTask.title;
    frogBannerDesc.textContent = 'La tua Rana del Giorno è pronta: completala per ottenere 2x XP e Monete!';
    frogActionBtn.textContent = 'Focus Ora';
    frogActionBtn.onclick = () => launchFocusForQuest(frogTask.id);
  } else {
    const eatenToday = quests.some(q => q.isFrog && q.completed);
    if (eatenToday) {
      frogStatusText.textContent = 'Mangiata! 🏆';
      frogBanner.classList.add('frog-eaten');
      frogBannerTitle.textContent = 'Rana del Giorno Completata! 🎉';
      frogBannerDesc.textContent = 'Hai superato il compito più tosto. Sei inarrestabile!';
      frogActionBtn.textContent = 'Fantastico!';
      frogActionBtn.onclick = () => showToast('Ottimo lavoro per oggi!', '🐸');
    } else {
      frogStatusText.textContent = 'Da scegliere';
      frogBanner.classList.remove('frog-eaten');
      frogBannerTitle.textContent = 'Nessuna Rana selezionata per oggi';
      frogBannerDesc.textContent = 'Scegli il compito più tosto o che stai rimandando: fallo subito per vincere!';
      frogActionBtn.textContent = '+ Imposta';
      frogActionBtn.onclick = () => openTaskModal(true);
    }
  }
}

// Quests List Renderer
let currentQuestFilter = 'active';

function renderQuests() {
  const container = document.getElementById('questList');
  const emptyState = document.getElementById('emptyQuestState');
  if (!container) return;

  const activeQuests = quests.filter(q => !q.completed);
  const completedQuests = quests.filter(q => q.completed);

  document.getElementById('activeCount').textContent = activeQuests.length;
  document.getElementById('completedCount').textContent = completedQuests.length;

  let filtered = [];
  if (currentQuestFilter === 'active') filtered = activeQuests;
  else if (currentQuestFilter === 'frog') filtered = quests.filter(q => q.isFrog && !q.completed);
  else if (currentQuestFilter === 'boss') filtered = quests.filter(q => q.diff === 'boss' && !q.completed);
  else if (currentQuestFilter === 'today') filtered = activeQuests;
  else if (currentQuestFilter === 'completed') filtered = completedQuests;

  container.innerHTML = '';

  if (filtered.length === 0) {
    emptyState.classList.remove('hidden');
  } else {
    emptyState.classList.add('hidden');
    filtered.forEach(q => {
      const card = createQuestCard(q);
      container.appendChild(card);
    });
  }
}

function createQuestCard(q) {
  const diffInfo = DIFFICULTY_MAP[q.diff] || DIFFICULTY_MAP.medium;
  const catInfo = CATEGORIES[q.category] || CATEGORIES.work;
  const xpReward = q.isFrog ? diffInfo.xp * 2 : diffInfo.xp;
  const goldReward = q.isFrog ? diffInfo.gold * 2 : diffInfo.gold;

  const card = document.createElement('div');
  card.className = `quest-card ${q.isFrog ? 'is-frog' : ''} ${q.diff === 'boss' ? 'is-boss' : ''} ${q.completed ? 'is-completed' : ''}`;
  card.id = `quest_${q.id}`;

  card.innerHTML = `
    <div class="quest-main-row">
      <button class="quest-checkbox-btn" aria-label="Completa Quest" title="Completa Quest">
        ${q.completed ? '✓' : ''}
      </button>
      <div class="quest-info">
        <h4 class="quest-title">${escapeHTML(q.title)}</h4>
        <div class="quest-meta-row">
          <span class="diff-tag ${q.diff}">${diffInfo.tag}</span>
          <span class="category-tag">${catInfo.icon} ${catInfo.name}</span>
          ${q.isFrog ? '<span class="diff-tag medium">🐸 2x RANA</span>' : ''}
          <span class="reward-preview-pill">+${xpReward} XP • +${goldReward} 🪙</span>
        </div>
      </div>
      <button class="delete-quest-btn" title="Elimina Quest">&times;</button>
    </div>

    ${q.subtasks && q.subtasks.length > 0 ? `
      <div class="subtasks-list">
        ${q.subtasks.map((st, idx) => `
          <label class="subtask-item ${st.done ? 'is-done' : ''}">
            <input type="checkbox" class="subtask-checkbox" data-idx="${idx}" ${st.done ? 'checked' : ''}>
            <span>${escapeHTML(st.text)}</span>
          </label>
        `).join('')}
      </div>
    ` : ''}

    ${!q.completed ? `
      <div class="quest-actions-row">
        <div class="action-buttons-group">
          <button class="card-action-btn focus-now-btn">⏳ Focus Ora</button>
          <button class="card-action-btn unpack-btn">✂️ Scomponi</button>
        </div>
      </div>
    ` : ''}
  `;

  // Event Listeners
  const checkBtn = card.querySelector('.quest-checkbox-btn');
  checkBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const rect = checkBtn.getBoundingClientRect();
    completeQuest(q.id, rect.left + 20, rect.top);
  });

  const deleteBtn = card.querySelector('.delete-quest-btn');
  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    deleteQuest(q.id);
  });

  const focusBtn = card.querySelector('.focus-now-btn');
  if (focusBtn) {
    focusBtn.addEventListener('click', () => launchFocusForQuest(q.id));
  }

  const unpackBtn = card.querySelector('.unpack-btn');
  if (unpackBtn) {
    unpackBtn.addEventListener('click', () => unpackTask(q.id));
  }

  const subCheckboxes = card.querySelectorAll('.subtask-checkbox');
  subCheckboxes.forEach(cb => {
    cb.addEventListener('change', (e) => {
      const idx = parseInt(e.target.dataset.idx, 10);
      q.subtasks[idx].done = e.target.checked;
      SoundFX.click();
      saveData();
      renderQuests();
    });
  });

  return card;
}

function completeQuest(questId, clickX = window.innerWidth / 2, clickY = window.innerHeight / 2) {
  const quest = quests.find(q => q.id === questId);
  if (!quest) return;

  quest.completed = !quest.completed;
  quest.completedAt = quest.completed ? Date.now() : null;

  if (quest.completed) {
    const diffInfo = DIFFICULTY_MAP[quest.diff] || DIFFICULTY_MAP.medium;
    const xpReward = quest.isFrog ? diffInfo.xp * 2 : diffInfo.xp;
    const goldReward = quest.isFrog ? diffInfo.gold * 2 : diffInfo.gold;

    userState.stats.tasksCompleted += 1;
    if (quest.isFrog) userState.stats.frogsEaten += 1;
    if (quest.diff === 'boss') userState.stats.bossesDefeated += 1;

    SoundFX.complete();
    SoundFX.coin();
    triggerConfetti();
    showFloatingReward(clickX, clickY, `+${xpReward} XP  +${goldReward} 🪙`);
    addRewards(xpReward, goldReward, `Completata: ${quest.title}`);
  } else {
    SoundFX.click();
    saveData();
    renderHUD();
  }

  renderQuests();
}

function deleteQuest(questId) {
  quests = quests.filter(q => q.id !== questId);
  SoundFX.click();
  saveData();
  renderQuests();
  renderHUD();
}

function unpackTask(questId) {
  const quest = quests.find(q => q.id === questId);
  if (!quest) return;

  if (!quest.subtasks || quest.subtasks.length === 0) {
    quest.subtasks = [
      { id: 'st_1', text: 'Micro-Azione 1: Apri il file / prepara il materiale (1 min)', done: false },
      { id: 'st_2', text: 'Micro-Azione 2: Fai la prima riga o il primo step (2 min)', done: false },
      { id: 'st_3', text: 'Micro-Azione 3: Continua per 5 minuti senza pensare al resto', done: false }
    ];
    showToast('Task spacchettata con la Regola dei 2 Minuti! ✂️', '🚀');
    SoundFX.complete();
    saveData();
    renderQuests();
  }
}

// Rewards Shop Renderer
function renderRewards() {
  const grid = document.getElementById('rewardsGrid');
  const claimedList = document.getElementById('claimedHistoryList');
  const claimedCount = document.getElementById('claimedCount');
  if (!grid) return;

  grid.innerHTML = '';
  rewards.forEach(r => {
    const card = document.createElement('div');
    card.className = 'reward-card';
    const canAfford = userState.gold >= r.cost;

    card.innerHTML = `
      <div class="reward-emoji">${r.emoji || '🎁'}</div>
      <h4 class="reward-name">${escapeHTML(r.title)}</h4>
      <span class="reward-cost-tag">🪙 ${r.cost} Monete</span>
      <button class="claim-reward-btn" ${canAfford ? '' : 'disabled'}>
        ${canAfford ? 'Riscatta Premio 🎁' : `Mancano ${r.cost - userState.gold} 🪙`}
      </button>
      <button class="delete-reward-btn" title="Rimuovi premio">&times;</button>
    `;

    const claimBtn = card.querySelector('.claim-reward-btn');
    claimBtn.addEventListener('click', () => claimReward(r));

    const delBtn = card.querySelector('.delete-reward-btn');
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      rewards = rewards.filter(item => item.id !== r.id);
      SoundFX.click();
      saveData();
      renderRewards();
    });

    grid.appendChild(card);
  });

  // Claimed History
  claimedCount.textContent = claimedRewards.length;
  claimedList.innerHTML = '';
  if (claimedRewards.length === 0) {
    claimedList.innerHTML = '<p style="color: var(--text-faint); font-size: 12px;">Nessun premio riscattato ancora. Guadagna monete e concediti uno sfizio meritato!</p>';
  } else {
    claimedRewards.forEach(item => {
      const row = document.createElement('div');
      row.className = 'claimed-history-item';
      row.innerHTML = `
        <span>${item.emoji} ${escapeHTML(item.title)}</span>
        <span style="color: #fbbf24; font-weight: 700;">-${item.cost} 🪙 (${item.time})</span>
      `;
      claimedList.appendChild(row);
    });
  }
}

function claimReward(reward) {
  if (userState.gold < reward.cost) {
    showToast(`Non hai abbastanza monete! Completa altre quest per sbloccarlo.`, '⚠️');
    return;
  }

  userState.gold -= reward.cost;
  claimedRewards.unshift({
    id: 'claimed_' + Date.now(),
    title: reward.title,
    cost: reward.cost,
    emoji: reward.emoji,
    time: 'Oggi ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  });

  SoundFX.complete();
  SoundFX.coin();
  triggerConfetti();
  showToast(`Goditi il tuo premio meritato: ${reward.title}! 🎉`, reward.emoji);

  saveData();
  renderHUD();
  renderRewards();
  checkBadges();
}

// Trophies & Stats Renderer
function renderTrophiesAndStats() {
  document.getElementById('statCompletedTotal').textContent = userState.stats.tasksCompleted;
  document.getElementById('statFocusMinutes').textContent = userState.stats.focusMinutes;
  document.getElementById('statGoldEarned').textContent = userState.stats.totalGoldEarned;
  document.getElementById('statFrogsEaten').textContent = userState.stats.frogsEaten;

  // Rank Ladder
  const ladderContainer = document.getElementById('rankLadderList');
  ladderContainer.innerHTML = '';
  RANKS.forEach(rank => {
    const isCurrent = rank.level === userState.level;
    const isUnlocked = rank.level <= userState.level;
    const row = document.createElement('div');
    row.className = `rank-row ${isCurrent ? 'is-current' : ''}`;
    row.innerHTML = `
      <div class="rank-row-left">
        <span>${rank.avatar}</span>
        <span style="font-weight: ${isCurrent ? '700' : '500'}; color: ${isUnlocked ? '#ffffff' : 'var(--text-faint)'};">
          ${rank.title} ${isCurrent ? '(Rango Attuale)' : ''}
        </span>
      </div>
      <span class="rank-level-badge">${rank.xpNeeded} XP</span>
    `;
    ladderContainer.appendChild(row);
  });

  // Badges
  const badgesGrid = document.getElementById('badgesGrid');
  badgesGrid.innerHTML = '';
  BADGES_DEF.forEach(b => {
    const unlocked = userState.stats.badges.includes(b.id);
    const item = document.createElement('div');
    item.className = `badge-item ${unlocked ? 'unlocked' : ''}`;
    item.innerHTML = `
      <span class="badge-icon">${b.icon}</span>
      <span class="badge-name">${b.name}</span>
      <span class="badge-desc">${b.desc}</span>
    `;
    badgesGrid.appendChild(item);
  });

  // Victory Log
  const logList = document.getElementById('victoryLogList');
  logList.innerHTML = '';
  userState.victoryLog.forEach(log => {
    const item = document.createElement('div');
    item.className = 'victory-log-item';
    item.innerHTML = `
      <span>${escapeHTML(log.title)}</span>
      <span style="color: #34d399; font-weight: 700;">${log.reward}</span>
    `;
    logList.appendChild(item);
  });
}

// =============================================================================
// 7. FOCUS ARENA (Pomodoro Engine)
// =============================================================================

let timerDurationSeconds = 25 * 60;
let timerRemainingSeconds = 25 * 60;
let timerInterval = null;
let timerRunning = false;
let linkedFocusQuestId = null;

function updateTimerDisplay() {
  const minutes = Math.floor(timerRemainingSeconds / 60);
  const seconds = timerRemainingSeconds % 60;
  document.getElementById('timerTimeDisplay').textContent = 
    `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Update SVG circle
  const progressRatio = timerRemainingSeconds / timerDurationSeconds;
  const circumference = 2 * Math.PI * 110; // 691.15
  const offset = circumference * (1 - progressRatio);
  document.getElementById('timerProgressCircle').style.strokeDashoffset = offset;

  // Update growth stage icon
  const icon = document.getElementById('focusGrowthIcon');
  const label = document.getElementById('focusGrowthLabel');

  if (progressRatio > 0.75) {
    icon.textContent = '🌱';
    label.textContent = 'Seme di Concentrazione';
  } else if (progressRatio > 0.45) {
    icon.textContent = '🌿';
    label.textContent = 'Germoglio Attivo';
  } else if (progressRatio > 0.15) {
    icon.textContent = '🌸';
    label.textContent = 'Fioritura del Focus';
  } else {
    icon.textContent = '💎';
    label.textContent = 'Cristallo di Luce Quasi Pronto!';
  }
}

function startTimer() {
  if (timerRunning) {
    // Pause
    clearInterval(timerInterval);
    timerRunning = false;
    document.getElementById('startTimerText').textContent = 'Riprendi Focus';
    SoundFX.click();
    return;
  }

  getAudioContext();
  timerRunning = true;
  document.getElementById('startTimerText').textContent = 'Pausa Focus';
  SoundFX.click();

  timerInterval = setInterval(() => {
    if (timerRemainingSeconds > 0) {
      timerRemainingSeconds--;
      updateTimerDisplay();
    } else {
      // Completed!
      clearInterval(timerInterval);
      timerRunning = false;
      document.getElementById('startTimerText').textContent = 'Inizia Focus';
      handleTimerComplete();
    }
  }, 1000);
}

function resetTimer() {
  clearInterval(timerInterval);
  timerRunning = false;
  timerRemainingSeconds = timerDurationSeconds;
  document.getElementById('startTimerText').textContent = 'Inizia Focus';
  SoundFX.click();
  updateTimerDisplay();
}

function handleTimerComplete() {
  SoundFX.timerEnd();
  SoundFX.complete();
  triggerConfetti();

  const minutesFocused = Math.round(timerDurationSeconds / 60);
  userState.stats.focusMinutes += minutesFocused;

  const xpReward = minutesFocused >= 25 ? 50 : 20;
  const goldReward = minutesFocused >= 25 ? 20 : 10;

  addRewards(xpReward, goldReward, `Sessione Focus (${minutesFocused} min)`);
  showToast(`Sessione Focus completata! +${xpReward} XP e +${goldReward} 🪙 guadagnati!`, '💎');

  // If a quest was linked, mark it completed!
  if (linkedFocusQuestId) {
    const q = quests.find(item => item.id === linkedFocusQuestId);
    if (q && !q.completed) {
      completeQuest(q.id);
    }
  }

  resetTimer();
}

function launchFocusForQuest(questId) {
  const quest = quests.find(q => q.id === questId);
  if (!quest) return;

  linkedFocusQuestId = quest.id;
  document.getElementById('focusLinkedTaskTitle').textContent = quest.title;
  document.getElementById('focusLinkedTaskBanner').classList.remove('hidden');

  // Switch to Focus tab
  switchTab('focusTab');
  resetTimer();
  showToast(`Pronto a concentrarti su: ${quest.title}`, '⏳');
}

// =============================================================================
// 8. SOS ANTI-PROCRASTINAZIONE WORKFLOW
// =============================================================================

function setupSOSWorkflow() {
  const step1 = document.getElementById('sosStep1');
  const step2 = document.getElementById('sosStep2');
  const step3 = document.getElementById('sosStep3');

  const taskInput = document.getElementById('sosTaskInput');
  const microInput = document.getElementById('sosMicroInput');

  document.getElementById('sosNext1Btn').addEventListener('click', () => {
    if (!taskInput.value.trim()) {
      showToast('Scrivi prima cosa stai evitando di fare', '⚠️');
      return;
    }
    SoundFX.click();
    step1.classList.add('hidden');
    step2.classList.remove('hidden');
  });

  const sugButtons = document.querySelectorAll('.micro-sug-btn');
  sugButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      microInput.value = btn.dataset.text;
      SoundFX.click();
    });
  });

  document.getElementById('sosNext2Btn').addEventListener('click', () => {
    if (!microInput.value.trim()) {
      showToast('Scegli o scrivi la prima mossa da 60 secondi', '⚠️');
      return;
    }
    SoundFX.click();
    step2.classList.add('hidden');
    step3.classList.remove('hidden');
  });

  document.getElementById('sosLaunch5MinBtn').addEventListener('click', () => {
    // Create new quick quest with the micro-action
    const newQuest = {
      id: 'q_' + Date.now(),
      title: `${taskInput.value.trim()} (Micro: ${microInput.value.trim()})`,
      diff: 'easy',
      category: 'work',
      isFrog: true,
      subtasks: [{ id: 'st_1', text: microInput.value.trim(), done: false }],
      completed: false,
      createdAt: Date.now()
    };
    quests.unshift(newQuest);
    saveData();
    renderQuests();

    // Set 5-min timer
    timerDurationSeconds = 5 * 60;
    timerRemainingSeconds = 5 * 60;
    linkedFocusQuestId = newQuest.id;

    // Reset SOS steps for next time
    step3.classList.add('hidden');
    step1.classList.remove('hidden');
    taskInput.value = '';
    microInput.value = '';

    launchFocusForQuest(newQuest.id);
    startTimer();
  });
}

// =============================================================================
// 9. MODALS & FORMS HANDLING
// =============================================================================

function openTaskModal(isFrogDefault = false) {
  document.getElementById('modalTaskInput').value = '';
  document.getElementById('modalFrogCheckbox').checked = isFrogDefault;
  document.getElementById('modalSubtaskContainer').innerHTML = '';
  document.getElementById('taskModal').classList.remove('hidden');
}

function openRewardModal() {
  document.getElementById('modalRewardTitle').value = '';
  document.getElementById('modalRewardCost').value = '30';
  document.getElementById('rewardModal').classList.remove('hidden');
}

function setupModals() {
  // Task Modal
  document.getElementById('openNewTaskModalBtn').addEventListener('click', () => {
    const quickInput = document.getElementById('quickTaskInput');
    const title = quickInput.value.trim();
    if (title) {
      // Quick add directly
      const activeDiffBtn = document.querySelector('#quickDifficultySelector .preset-chip.active');
      const diff = activeDiffBtn ? activeDiffBtn.dataset.diff : 'easy';
      
      const newQuest = {
        id: 'q_' + Date.now(),
        title: title,
        diff: diff,
        category: 'work',
        isFrog: false,
        subtasks: [],
        completed: false,
        createdAt: Date.now()
      };
      quests.unshift(newQuest);
      quickInput.value = '';
      SoundFX.click();
      saveData();
      renderQuests();
      renderHUD();
      showToast('Quest aggiunta alla tua lista!', '⚔️');
    } else {
      openTaskModal();
    }
  });

  document.getElementById('closeTaskModalBtn').addEventListener('click', () => {
    document.getElementById('taskModal').classList.add('hidden');
  });
  document.getElementById('cancelTaskModalBtn').addEventListener('click', () => {
    document.getElementById('taskModal').classList.add('hidden');
  });

  // Modal difficulty selector
  const modalDiffBtns = document.querySelectorAll('#modalDiffSelector .diff-btn');
  modalDiffBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      modalDiffBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Subtask inputs inside modal
  document.getElementById('addSubtaskInputBtn').addEventListener('click', () => {
    const container = document.getElementById('modalSubtaskContainer');
    const row = document.createElement('div');
    row.className = 'subtask-input-row';
    row.innerHTML = `
      <input type="text" placeholder="Nome micro-step (es. aprire file)..." class="subtask-field">
      <button type="button" class="subtask-remove-btn">&times;</button>
    `;
    row.querySelector('.subtask-remove-btn').onclick = () => row.remove();
    container.appendChild(row);
  });

  // Save Task
  document.getElementById('saveTaskModalBtn').addEventListener('click', () => {
    const title = document.getElementById('modalTaskInput').value.trim();
    if (!title) {
      showToast('Inserisci il nome dell\'attività', '⚠️');
      return;
    }

    const activeDiffBtn = document.querySelector('#modalDiffSelector .diff-btn.active');
    const diff = activeDiffBtn ? activeDiffBtn.dataset.diff : 'easy';
    const category = document.getElementById('modalTaskCategory').value;
    const isFrog = document.getElementById('modalFrogCheckbox').checked;

    const subFields = document.querySelectorAll('#modalSubtaskContainer .subtask-field');
    const subtasks = [];
    subFields.forEach((field, i) => {
      if (field.value.trim()) {
        subtasks.push({ id: 'st_' + i + '_' + Date.now(), text: field.value.trim(), done: false });
      }
    });

    const newQuest = {
      id: 'q_' + Date.now(),
      title,
      diff,
      category,
      isFrog,
      subtasks,
      completed: false,
      createdAt: Date.now()
    };

    quests.unshift(newQuest);
    document.getElementById('taskModal').classList.add('hidden');
    SoundFX.complete();
    saveData();
    renderQuests();
    renderHUD();
    showToast('Nuova Quest creata con successo!', '⚔️');
  });

  // Reward Modal
  document.getElementById('addCustomRewardBtn').addEventListener('click', openRewardModal);
  document.getElementById('closeRewardModalBtn').addEventListener('click', () => {
    document.getElementById('rewardModal').classList.add('hidden');
  });
  document.getElementById('cancelRewardModalBtn').addEventListener('click', () => {
    document.getElementById('rewardModal').classList.add('hidden');
  });

  const emojiChips = document.querySelectorAll('#rewardEmojiPicker .emoji-chip');
  emojiChips.forEach(chip => {
    chip.addEventListener('click', () => {
      emojiChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
    });
  });

  document.getElementById('saveRewardModalBtn').addEventListener('click', () => {
    const title = document.getElementById('modalRewardTitle').value.trim();
    const cost = parseInt(document.getElementById('modalRewardCost').value, 10);
    if (!title || isNaN(cost) || cost <= 0) {
      showToast('Inserisci titolo e costo valido', '⚠️');
      return;
    }

    const activeEmoji = document.querySelector('#rewardEmojiPicker .emoji-chip.active');
    const emoji = activeEmoji ? activeEmoji.dataset.emoji : '🎁';

    rewards.push({
      id: 'rew_' + Date.now(),
      title,
      cost,
      emoji
    });

    document.getElementById('rewardModal').classList.add('hidden');
    SoundFX.complete();
    saveData();
    renderRewards();
    showToast('Premio aggiunto al tuo Negozio!', '🎁');
  });

  // Level Up Modal Close
  document.getElementById('closeLevelUpModalBtn').addEventListener('click', () => {
    document.getElementById('levelUpModal').classList.add('hidden');
  });
}

// =============================================================================
// 10. NAVIGATION & EVENT LISTENERS
// =============================================================================

function switchTab(tabId) {
  document.querySelectorAll('.pivot-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.view-tab').forEach(v => v.classList.remove('active'));

  const tabBtn = document.querySelector(`.pivot-tab[data-tab="${tabId}"]`);
  const viewSection = document.getElementById(tabId);

  if (tabBtn) tabBtn.classList.add('active');
  if (viewSection) viewSection.classList.add('active');

  SoundFX.click();

  if (tabId === 'rewardsTab') renderRewards();
  if (tabId === 'trophiesTab') renderTrophiesAndStats();
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// =============================================================================
// 11. APP INITIALIZATION
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {
  loadSavedData();

  // Pivot tabs
  document.querySelectorAll('.pivot-tab').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Quick Difficulty selector
  document.querySelectorAll('#quickDifficultySelector .preset-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#quickDifficultySelector .preset-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      SoundFX.click();
    });
  });

  // Quest Filter chips
  document.querySelectorAll('#questFilterBar .filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#questFilterBar .filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentQuestFilter = chip.dataset.filter;
      SoundFX.click();
      renderQuests();
    });
  });

  // Audio Toggle
  const soundBtn = document.getElementById('soundToggleBtn');
  soundBtn.addEventListener('click', () => {
    userState.soundEnabled = !userState.soundEnabled;
    document.getElementById('soundIconOn').classList.toggle('hidden', !userState.soundEnabled);
    document.getElementById('soundIconOff').classList.toggle('hidden', userState.soundEnabled);
    showToast(userState.soundEnabled ? 'Audio Attivato' : 'Audio Disattivato', userState.soundEnabled ? '🔊' : '🔇');
    saveData();
  });

  // Gold Pill click jumps to rewards
  document.getElementById('goldPill').addEventListener('click', () => switchTab('rewardsTab'));

  // Toggle Claimed History
  document.getElementById('toggleClaimedHistory').addEventListener('click', () => {
    document.getElementById('claimedHistoryList').classList.toggle('hidden');
  });

  // Focus Arena Controls
  document.getElementById('startTimerBtn').addEventListener('click', startTimer);
  document.getElementById('resetTimerBtn').addEventListener('click', resetTimer);

  document.querySelectorAll('#timerPresets .timer-preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#timerPresets .timer-preset-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const min = parseInt(btn.dataset.min, 10);
      timerDurationSeconds = min * 60;
      resetTimer();
    });
  });

  document.getElementById('clearFocusLinkedTaskBtn').addEventListener('click', () => {
    linkedFocusQuestId = null;
    document.getElementById('focusLinkedTaskBanner').classList.add('hidden');
    SoundFX.click();
  });

  // Ambient Sounds
  document.querySelectorAll('#ambientButtons .sound-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#ambientButtons .sound-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const vol = parseFloat(document.getElementById('ambientVolume').value);
      playAmbientSound(btn.dataset.sound, vol);
      SoundFX.click();
    });
  });

  document.getElementById('ambientVolume').addEventListener('input', (e) => {
    const vol = parseFloat(e.target.value);
    if (ambientNodes && ambientNodes.masterGain) {
      ambientNodes.masterGain.gain.setValueAtTime(vol, getAudioContext().currentTime);
    }
  });

  // Modals & SOS Workflow
  setupModals();
  setupSOSWorkflow();

  // Initial Renders
  renderHUD();
  renderQuests();
  updateTimerDisplay();

  // Register PWA Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(err => {
      console.log('SW registration note:', err);
    });
  }
});
