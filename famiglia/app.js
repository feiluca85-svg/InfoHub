/**
 * FamTito - Core Application Engine & Real-Time Sync System
 * Windows Phone 8 Metro UI, 3 Horizontal Swipeable Tabs, AppTito Cloud Backend.
 */

// =============================================================================
// 1. FIREBASE INITIALIZATION (AppTito Cloud Backend)
// =============================================================================

const firebaseConfig = {
  apiKey: "AIzaSyC12o-f0D7yEUGb6LdQQK2KthGp10pMR2w",
  authDomain: "apptito-44c72.firebaseapp.com",
  projectId: "apptito-44c72",
  storageBucket: "apptito-44c72.firebasestorage.app",
  messagingSenderId: "730853120876",
  appId: "1:730853120876:web:3c582359cf0f18ed563149"
};

let db = null;
let familyDocRef = null;
let unsubscribeFamilyListener = null;

try {
  if (typeof firebase !== 'undefined') {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    db = firebase.firestore();
  }
} catch (err) {
  console.warn("Firebase initialization warning:", err);
}

// =============================================================================
// 2. STATE STORAGE & DEFAULTS
// =============================================================================

let userProfile = {
  name: 'Papà',
  avatar: '🧔'
};

let themeSettings = {
  mode: 'dark',
  accent: '#0078d7',
  sound: true
};

let currentFamilyCode = 'FAM-TITO';
let activeFamilyName = 'Famiglia Tito';

let familyTasks = [
  {
    id: 'f_task_1',
    title: 'Comprare latte parzialmente scremato e pane fresco',
    category: 'spesa',
    assignee: 'Tutti',
    addedBy: 'Mamma 👩',
    isUrgent: false,
    completed: false,
    createdAt: Date.now() - 3600000
  },
  {
    id: 'f_task_2',
    title: 'Pagare bolletta luce entro giovedì',
    category: 'bollette',
    assignee: 'Papà',
    addedBy: 'Papà 🧔',
    isUrgent: true,
    completed: false,
    createdAt: Date.now() - 7200000
  },
  {
    id: 'f_task_3',
    title: 'Passare in farmacia per lo sciroppo',
    category: 'salute',
    assignee: 'Papà',
    addedBy: 'Mamma 👩',
    isUrgent: false,
    completed: true,
    completedBy: 'Papà 🧔',
    completedAt: Date.now() - 1800000
  }
];

let personalTasks = [
  {
    id: 'p_task_1',
    title: 'Revisionare documento di lavoro e inviare mail',
    priority: 'alta',
    dueDate: 'oggi',
    category: 'lavoro',
    completed: false,
    createdAt: Date.now() - 5400000
  },
  {
    id: 'p_task_2',
    title: '30 minuti di allenamento o camminata',
    priority: 'media',
    dueDate: 'oggi',
    category: 'salute',
    completed: false,
    createdAt: Date.now() - 10800000
  }
];

let ideasList = [
  {
    id: 'idea_1',
    title: 'Idea Regalo Compleanno Mamma 🎁',
    content: 'Cofanetto terme relax oppure la borsa in pelle che ha visto in vetrina.',
    color: 'yellow',
    isPinned: true,
    createdAt: Date.now() - 86400000
  },
  {
    id: 'idea_2',
    title: 'Gita fuori porta nel weekend 🌲',
    content: 'Passeggiata al lago con pranzo al sacco se c\'è bel tempo.',
    color: 'green',
    isPinned: false,
    createdAt: Date.now() - 43200000
  }
];

// Active Filters
let activeTabSlide = 0; // 0: Famiglia, 1: Personale, 2: Idee
let familyMemberFilter = 'all';
let familyCategoryFilter = 'all';
let personalCategoryFilter = 'all';
let ideasActiveFilter = 'all';

let selectedIdeaColor = 'yellow';
let isIdeaPinned = false;
let isUrgentFamily = false;
let ideaPendingConversion = null;

// =============================================================================
// 3. PERSISTENCE & CLOUD SYNC ENGINE
// =============================================================================

function loadLocalData() {
  try {
    const savedProfile = localStorage.getItem('famtito_profile');
    if (savedProfile) userProfile = JSON.parse(savedProfile);

    const savedTheme = localStorage.getItem('famtito_theme');
    if (savedTheme) themeSettings = JSON.parse(savedTheme);

    const savedCode = localStorage.getItem('famtito_family_code');
    if (savedCode) currentFamilyCode = savedCode;

    const savedFamilyName = localStorage.getItem('famtito_family_name');
    if (savedFamilyName) activeFamilyName = savedFamilyName;

    const savedPersonal = localStorage.getItem('famtito_personal_tasks');
    if (savedPersonal) personalTasks = JSON.parse(savedPersonal);

    const savedIdeas = localStorage.getItem('famtito_ideas');
    if (savedIdeas) ideasList = JSON.parse(savedIdeas);

    const savedFamily = localStorage.getItem('famtito_family_tasks_' + currentFamilyCode);
    if (savedFamily) familyTasks = JSON.parse(savedFamily);
  } catch (e) {
    console.error("Errore lettura localStorage:", e);
  }
}

function saveLocalData() {
  try {
    localStorage.setItem('famtito_profile', JSON.stringify(userProfile));
    localStorage.setItem('famtito_theme', JSON.stringify(themeSettings));
    localStorage.setItem('famtito_family_code', currentFamilyCode);
    localStorage.setItem('famtito_family_name', activeFamilyName);
    localStorage.setItem('famtito_personal_tasks', JSON.stringify(personalTasks));
    localStorage.setItem('famtito_ideas', JSON.stringify(ideasList));
    localStorage.setItem('famtito_family_tasks_' + currentFamilyCode, JSON.stringify(familyTasks));
  } catch (e) {
    console.error("Errore salvataggio localStorage:", e);
  }
}

function initFirebaseSync() {
  if (!db) {
    updateCloudStatus(false, "Offline (Solo locale)");
    return;
  }

  if (unsubscribeFamilyListener) {
    unsubscribeFamilyListener();
  }

  updateCloudStatus(true, "Connessione a " + currentFamilyCode + "...");
  familyDocRef = db.collection("famtito_family_todos").doc(currentFamilyCode);

  unsubscribeFamilyListener = familyDocRef.onSnapshot((doc) => {
    if (doc.exists) {
      const data = doc.data();
      if (Array.isArray(data.tasks)) {
        familyTasks = data.tasks;
      }
      if (data.familyName) {
        activeFamilyName = data.familyName;
      }
      saveLocalData();
      renderFamilyTasks();
      updateBadges();
      updateCloudStatus(true, "Sincronizzato in tempo reale");
    } else {
      // Document does not exist yet on cloud, upload current local state
      pushFamilyTasksToCloud();
      updateCloudStatus(true, "Nuova Famiglia creata sul Cloud");
    }
  }, (error) => {
    console.warn("Sync warning:", error);
    updateCloudStatus(false, "Offline (Modifiche salvate in locale)");
  });
}

function pushFamilyTasksToCloud() {
  saveLocalData();
  if (db && familyDocRef) {
    familyDocRef.set({
      familyName: activeFamilyName,
      familyCode: currentFamilyCode,
      lastUpdated: Date.now(),
      updatedBy: `${userProfile.name} ${userProfile.avatar}`,
      tasks: familyTasks
    }, { merge: true }).catch(err => {
      console.warn("Cloud push error:", err);
    });
  }
}

function updateCloudStatus(isOnline, subtitleText) {
  const dot = document.getElementById('cloudStatusDot');
  const icon = document.getElementById('cloudSyncIcon');
  const sub = document.getElementById('familySyncSubtitle');

  if (dot) dot.classList.toggle('offline', !isOnline);
  if (icon) icon.textContent = isOnline ? '☁️' : '📡';
  if (sub) sub.textContent = subtitleText || (isOnline ? "Sincronizzato in tempo reale" : "Offline");
}

// =============================================================================
// 4. WEB AUDIO SYNTHESIZER (Pure JS, Zero File Latency)
// =============================================================================

let audioCtx = null;
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
  click() {
    if (!themeSettings.sound) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(480, ctx.currentTime);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.04);
  },

  complete() {
    if (!themeSettings.sound) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    const notes = [587.33, 880]; // D5, A5
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      const startTime = ctx.currentTime + (idx * 0.07);
      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.35);
    });
  },

  pop() {
    if (!themeSettings.sound) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(620, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.08);
  }
};

// =============================================================================
// 5. SMART CATEGORY AUTO-DETECTION
// =============================================================================

const CATEGORY_KEYWORDS = {
  spesa: ['latte', 'pane', 'uova', 'burro', 'pasta', 'riso', 'formaggio', 'mela', 'mele', 'frutta', 'verdura', 'carne', 'pesce', 'biscotti', 'acqua', 'olio', 'caffè', 'caffe', 'supermercato', 'pomodori', 'insalata', 'zucchero', 'farina', 'yogurt', 'prosciutto', 'spesa', 'detersivo', 'sapone', 'carta igienica'],
  bollette: ['luce', 'gas', 'enel', 'bolletta', 'bollette', 'affitto', 'condominio', 'assicurazione', 'wifi', 'internet', 'rata', 'tributi', 'tari', 'fattura', 'f24', 'banca', 'mutuo', 'canone'],
  casa: ['lampadina', 'pulizie', 'bucato', 'lavatrice', 'lavastoviglie', 'piatti', 'riparare', 'rubinetto', 'balcone', 'cantina', 'garage', 'letto', 'mobili', 'giardino', 'aspirapolvere', 'ferro da stiro', 'idraulico', 'elettricista'],
  figli: ['scuola', 'compiti', 'libri', 'quaderno', 'zaino', 'mensa', 'palestra', 'catechismo', 'pediatra', 'vestiti', 'gioco', 'maestra', 'prof', 'gita', 'matite', 'colori'],
  salute: ['farmacia', 'medicine', 'tachipirina', 'sciroppo', 'visita', 'dentista', 'dottore', 'ricetta', 'analisi', 'terapia', 'termometro', 'garze', 'cerotti']
};

function autoDetectCategory(text) {
  if (!text) return null;
  const lower = text.toLowerCase();
  for (const [cat, words] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const w of words) {
      if (lower.includes(w)) return cat;
    }
  }
  return null;
}

// =============================================================================
// 6. SPEECH RECOGNITION (VOICE INPUT)
// =============================================================================

let recognition = null;
let activeVoiceTargetInput = null;

function setupSpeechRecognition() {
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRec) return;

  recognition = new SpeechRec();
  recognition.lang = 'it-IT';
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = () => {
    document.querySelectorAll('.action-mini-btn, #globalVoiceBtn').forEach(b => b.classList.add('recording'));
    showToast("Ascolto in corso... Parla ora 🎙️");
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    if (activeVoiceTargetInput) {
      activeVoiceTargetInput.value = transcript;
      
      // Auto-trigger category check for family input
      if (activeVoiceTargetInput.id === 'familyTaskInput') {
        const detected = autoDetectCategory(transcript);
        if (detected) {
          document.getElementById('familyCategorySelect').value = detected;
        }
      }
    }
    showToast(`Dettato: "${transcript}"`, "✨");
    SoundFX.pop();
  };

  recognition.onerror = (e) => {
    console.log("Voice error:", e);
    showToast("Nessuna voce rilevata", "⚠️");
  };

  recognition.onend = () => {
    document.querySelectorAll('.action-mini-btn, #globalVoiceBtn').forEach(b => b.classList.remove('recording'));
  };
}

function startVoiceDictation(targetInput) {
  if (!recognition) {
    showToast("Dettatura vocale non supportata su questo browser", "⚠️");
    return;
  }
  activeVoiceTargetInput = targetInput;
  try {
    recognition.start();
  } catch (e) {
    recognition.stop();
  }
}

// =============================================================================
// 7. HORIZONTAL SWIPE & CAROUSEL ENGINE
// =============================================================================

function goToSlide(index) {
  if (index < 0) index = 0;
  if (index > 2) index = 2;
  activeTabSlide = index;

  const track = document.getElementById('carouselTrack');
  if (track) {
    track.style.transform = `translateX(-${index * 33.3333}%)`;
  }

  // Update Pivot Nav
  const pivotButtons = document.querySelectorAll('#metroPivotNav .pivot-item');
  pivotButtons.forEach((btn, i) => {
    btn.classList.toggle('active', i === index);
  });

  SoundFX.click();
}

function setupTouchSwipe() {
  const viewport = document.getElementById('carouselViewport');
  if (!viewport) return;

  let startX = 0;
  let startY = 0;
  let isSwiping = false;

  viewport.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    isSwiping = true;
  }, { passive: true });

  viewport.addEventListener('touchend', (e) => {
    if (!isSwiping) return;
    isSwiping = false;

    const diffX = e.changedTouches[0].clientX - startX;
    const diffY = e.changedTouches[0].clientY - startY;

    // Must be predominantly horizontal gesture
    if (Math.abs(diffX) > 45 && Math.abs(diffX) > Math.abs(diffY) * 1.4) {
      if (diffX < 0 && activeTabSlide < 2) {
        goToSlide(activeTabSlide + 1); // Swipe Left -> Next tab
      } else if (diffX > 0 && activeTabSlide > 0) {
        goToSlide(activeTabSlide - 1); // Swipe Right -> Prev tab
      }
    }
  }, { passive: true });
}

// =============================================================================
// 8. TAB 1: RENDERING FAMIGLIA (Condivisa)
// =============================================================================

const CATEGORY_MAP = {
  spesa: { name: 'Spesa', icon: '🛒' },
  casa: { name: 'Casa', icon: '🏠' },
  bollette: { name: 'Bollette', icon: '📄' },
  figli: { name: 'Figli', icon: '🎒' },
  salute: { name: 'Salute', icon: '💊' },
  urgente: { name: 'Urgente', icon: '🚨' },
  altro: { name: 'Altro', icon: '📌' }
};

function renderFamilyTasks() {
  const container = document.getElementById('familyTasksList');
  const completedList = document.getElementById('familyCompletedList');
  const emptyState = document.getElementById('emptyFamilyState');
  const completedCountElem = document.getElementById('familyCompletedCount');

  if (!container) return;

  // Filter tasks
  const activeTasks = familyTasks.filter(t => !t.completed);
  const completedTasks = familyTasks.filter(t => t.completed);

  let filtered = activeTasks.filter(t => {
    const matchMember = familyMemberFilter === 'all' || t.assignee === familyMemberFilter || t.assignee === 'Tutti';
    const matchCat = familyCategoryFilter === 'all' || t.category === familyCategoryFilter;
    return matchMember && matchCat;
  });

  container.innerHTML = '';
  if (filtered.length === 0) {
    emptyState.classList.remove('hidden');
  } else {
    emptyState.classList.add('hidden');
    filtered.forEach(t => {
      container.appendChild(createFamilyTaskCard(t));
    });
  }

  // Completed
  completedCountElem.textContent = completedTasks.length;
  completedList.innerHTML = '';
  completedTasks.forEach(t => {
    completedList.appendChild(createFamilyTaskCard(t));
  });

  document.getElementById('activeFamilyName').textContent = activeFamilyName;
  document.getElementById('activeFamilyCodeDisplay').textContent = `#${currentFamilyCode}`;
}

function createFamilyTaskCard(task) {
  const cat = CATEGORY_MAP[task.category] || CATEGORY_MAP.altro;
  const card = document.createElement('div');
  card.className = `metro-task-card ${task.isUrgent ? 'is-urgent' : ''} ${task.completed ? 'is-completed' : ''}`;
  card.id = `ftask_${task.id}`;

  card.innerHTML = `
    <button class="metro-checkbox-btn" aria-label="Completa compito" title="Segna come fatto">
      ${task.completed ? '<i class="fa-solid fa-check"></i>' : ''}
    </button>
    <div class="task-content-group">
      <div class="task-title">${escapeHTML(task.title)}</div>
      <div class="task-meta-row">
        <span class="task-badge">${cat.icon} ${cat.name}</span>
        ${task.assignee !== 'Tutti' ? `<span class="task-badge badge-member">👤 ${task.assignee}</span>` : ''}
        ${task.isUrgent ? `<span class="task-badge badge-urgent"><i class="fa-solid fa-fire"></i> Urgente</span>` : ''}
        <span class="task-badge" style="opacity:0.75;">Di: ${escapeHTML(task.addedBy || 'Famiglia')}</span>
        ${task.completed && task.completedBy ? `<span class="task-badge" style="color:#107c41;">Fatto da ${escapeHTML(task.completedBy)}</span>` : ''}
      </div>
    </div>
    <div class="task-actions-group">
      <button class="task-action-btn delete-btn" title="Elimina compito">
        <i class="fa-solid fa-trash-can"></i>
      </button>
    </div>
  `;

  // Toggle complete
  card.querySelector('.metro-checkbox-btn').addEventListener('click', () => {
    task.completed = !task.completed;
    if (task.completed) {
      task.completedBy = `${userProfile.name} ${userProfile.avatar}`;
      task.completedAt = Date.now();
      SoundFX.complete();
      showToast(`Completato da ${userProfile.name}! 🎉`, '✅');
    } else {
      task.completedBy = null;
      task.completedAt = null;
      SoundFX.click();
    }
    pushFamilyTasksToCloud();
    renderFamilyTasks();
    updateBadges();
  });

  // Delete
  card.querySelector('.delete-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    familyTasks = familyTasks.filter(item => item.id !== task.id);
    SoundFX.click();
    pushFamilyTasksToCloud();
    renderFamilyTasks();
    updateBadges();
    showToast("Compito eliminato", "🗑️");
  });

  return card;
}

function addFamilyTask() {
  const input = document.getElementById('familyTaskInput');
  const title = input.value.trim();
  if (!title) {
    showToast("Inserisci prima cosa c'è da fare!", "⚠️");
    return;
  }

  const category = document.getElementById('familyCategorySelect').value;
  const assignee = document.getElementById('familyAssigneeSelect').value;

  const newTask = {
    id: 'f_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    title,
    category,
    assignee,
    addedBy: `${userProfile.name} ${userProfile.avatar}`,
    isUrgent: isUrgentFamily,
    completed: false,
    createdAt: Date.now()
  };

  familyTasks.unshift(newTask);
  input.value = '';
  isUrgentFamily = false;
  document.getElementById('toggleUrgentFamilyBtn').classList.remove('active');

  SoundFX.pop();
  pushFamilyTasksToCloud();
  renderFamilyTasks();
  updateBadges();
  showToast("Aggiunto alla lista di Famiglia! 👨‍👩‍👧‍👦", "✨");
}

// =============================================================================
// 9. TAB 2: RENDERING PERSONALE (Privata)
// =============================================================================

function renderPersonalTasks() {
  const container = document.getElementById('personalTasksList');
  const completedList = document.getElementById('personalCompletedList');
  const emptyState = document.getElementById('emptyPersonalState');
  const completedCountElem = document.getElementById('personalCompletedCount');
  const activeCountElem = document.getElementById('personalActiveTotal');

  if (!container) return;

  const activeTasks = personalTasks.filter(t => !t.completed);
  const completedTasks = personalTasks.filter(t => t.completed);

  activeCountElem.textContent = activeTasks.length;
  completedCountElem.textContent = completedTasks.length;

  let filtered = activeTasks.filter(t => {
    if (personalCategoryFilter === 'all') return true;
    if (personalCategoryFilter === 'oggi') return t.dueDate === 'oggi';
    if (personalCategoryFilter === 'alta') return t.priority === 'alta';
    return t.category === personalCategoryFilter;
  });

  container.innerHTML = '';
  if (filtered.length === 0) {
    emptyState.classList.remove('hidden');
  } else {
    emptyState.classList.add('hidden');
    filtered.forEach(t => {
      container.appendChild(createPersonalTaskCard(t));
    });
  }

  completedList.innerHTML = '';
  completedTasks.forEach(t => {
    completedList.appendChild(createPersonalTaskCard(t));
  });
}

function createPersonalTaskCard(task) {
  const card = document.createElement('div');
  card.className = `metro-task-card ${task.priority === 'alta' ? 'is-urgent' : ''} ${task.completed ? 'is-completed' : ''}`;
  card.id = `ptask_${task.id}`;

  const dueLabel = task.dueDate === 'oggi' ? '📅 Oggi' : (task.dueDate === 'domani' ? '🌅 Domani' : (task.dueDate === 'settimana' ? '🗓️ Settimana' : ''));

  card.innerHTML = `
    <button class="metro-checkbox-btn" aria-label="Completa compito" title="Segna come fatto">
      ${task.completed ? '<i class="fa-solid fa-check"></i>' : ''}
    </button>
    <div class="task-content-group">
      <div class="task-title">${escapeHTML(task.title)}</div>
      <div class="task-meta-row">
        ${dueLabel ? `<span class="task-badge badge-date">${dueLabel}</span>` : ''}
        ${task.priority === 'alta' ? `<span class="task-badge badge-urgent">🔴 Alta</span>` : ''}
        <span class="task-badge">🏷️ ${escapeHTML(task.category || 'Personale')}</span>
      </div>
    </div>
    <div class="task-actions-group">
      ${!task.completed ? `
        <button class="move-to-family-btn" title="Copia/Sposta in Famiglia">
          <i class="fa-solid fa-share-nodes"></i>
          <span>Famiglia</span>
        </button>
      ` : ''}
      <button class="task-action-btn delete-btn" title="Elimina compito">
        <i class="fa-solid fa-trash-can"></i>
      </button>
    </div>
  `;

  // Toggle complete
  card.querySelector('.metro-checkbox-btn').addEventListener('click', () => {
    task.completed = !task.completed;
    if (task.completed) {
      SoundFX.complete();
      showToast("Compito personale completato! 🎯", "✅");
    } else {
      SoundFX.click();
    }
    saveLocalData();
    renderPersonalTasks();
    updateBadges();
  });

  // Move to family
  const moveBtn = card.querySelector('.move-to-family-btn');
  if (moveBtn) {
    moveBtn.addEventListener('click', () => {
      const familyCopy = {
        id: 'f_' + Date.now(),
        title: task.title,
        category: autoDetectCategory(task.title) || 'altro',
        assignee: userProfile.name,
        addedBy: `${userProfile.name} ${userProfile.avatar}`,
        isUrgent: task.priority === 'alta',
        completed: false,
        createdAt: Date.now()
      };
      familyTasks.unshift(familyCopy);
      pushFamilyTasksToCloud();
      SoundFX.pop();
      showToast("Compito condiviso sulla bacheca di Famiglia! 👨‍👩‍👧‍👦", "🚀");
    });
  }

  // Delete
  card.querySelector('.delete-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    personalTasks = personalTasks.filter(item => item.id !== task.id);
    SoundFX.click();
    saveLocalData();
    renderPersonalTasks();
    updateBadges();
    showToast("Compito personale rimosso", "🗑️");
  });

  return card;
}

function addPersonalTask() {
  const input = document.getElementById('personalTaskInput');
  const title = input.value.trim();
  if (!title) {
    showToast("Scrivi prima cosa devi fare!", "⚠️");
    return;
  }

  const priority = document.getElementById('personalPrioritySelect').value;
  const dueDate = document.getElementById('personalDueDateSelect').value;
  const category = document.getElementById('personalCategorySelect').value;

  const newTask = {
    id: 'p_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    title,
    priority,
    dueDate,
    category,
    completed: false,
    createdAt: Date.now()
  };

  personalTasks.unshift(newTask);
  input.value = '';

  SoundFX.pop();
  saveLocalData();
  renderPersonalTasks();
  updateBadges();
  showToast("Aggiunto alle tue cose personali!", "✨");
}

// =============================================================================
// 10. TAB 3: RENDERING IDEE & NOTE (Scratchpad)
// =============================================================================

function renderIdeasList() {
  const grid = document.getElementById('ideasListGrid');
  const emptyState = document.getElementById('emptyIdeasState');
  const countElem = document.getElementById('ideasTotalCount');
  if (!grid) return;

  countElem.textContent = ideasList.length;

  let filtered = [...ideasList];
  if (ideasActiveFilter === 'pinned') {
    filtered = filtered.filter(i => i.isPinned);
  } else if (ideasActiveFilter !== 'all') {
    filtered = filtered.filter(i => i.color === ideasActiveFilter);
  }

  // Sort pinned first
  filtered.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));

  grid.innerHTML = '';
  if (filtered.length === 0) {
    emptyState.classList.remove('hidden');
  } else {
    emptyState.classList.add('hidden');
    filtered.forEach(idea => {
      grid.appendChild(createIdeaCard(idea));
    });
  }
}

function createIdeaCard(idea) {
  const card = document.createElement('div');
  card.className = `metro-idea-card tile-${idea.color || 'yellow'} ${idea.isPinned ? 'is-pinned' : ''}`;
  card.id = `idea_${idea.id}`;

  const formattedDate = new Date(idea.createdAt).toLocaleDateString([], { day: 'numeric', month: 'short' });

  card.innerHTML = `
    <div class="idea-card-header">
      <h4 class="idea-card-title">${escapeHTML(idea.title)}</h4>
      ${idea.isPinned ? '<span class="idea-pin-badge" title="Fissata in alto"><i class="fa-solid fa-thumbtack"></i></span>' : ''}
    </div>
    ${idea.content ? `<div class="idea-card-body">${escapeHTML(idea.content)}</div>` : ''}
    <div class="idea-card-footer">
      <span class="idea-date-tag">${formattedDate}</span>
      <div class="idea-actions-group">
        <button class="btn-convert-todo" title="Trasforma in To-Do">
          <i class="fa-solid fa-arrow-right-to-bracket"></i>
          <span>To-Do</span>
        </button>
        <button class="task-action-btn pin-btn" title="${idea.isPinned ? 'Sblocca' : 'Fissa'}">
          <i class="fa-solid fa-thumbtack"></i>
        </button>
        <button class="task-action-btn delete-btn" title="Elimina appunto">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
    </div>
  `;

  // Convert to todo
  card.querySelector('.btn-convert-todo').addEventListener('click', () => {
    ideaPendingConversion = idea;
    document.getElementById('convertIdeaPreviewText').textContent = `"${idea.title}"`;
    document.getElementById('convertIdeaModal').classList.remove('hidden');
  });

  // Pin
  card.querySelector('.pin-btn').addEventListener('click', () => {
    idea.isPinned = !idea.isPinned;
    SoundFX.click();
    saveLocalData();
    renderIdeasList();
    updateBadges();
    showToast(idea.isPinned ? "Nota fissata in alto! 📌" : "Nota sbloccata", "📌");
  });

  // Delete
  card.querySelector('.delete-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    ideasList = ideasList.filter(item => item.id !== idea.id);
    SoundFX.click();
    saveLocalData();
    renderIdeasList();
    updateBadges();
    showToast("Nota eliminata", "🗑️");
  });

  return card;
}

function addIdeaNote() {
  const titleInput = document.getElementById('ideaTitleInput');
  const contentInput = document.getElementById('ideaContentInput');
  const title = titleInput.value.trim();
  const content = contentInput.value.trim();

  if (!title && !content) {
    showToast("Scrivi un titolo o il testo dell'idea!", "⚠️");
    return;
  }

  const newIdea = {
    id: 'idea_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    title: title || content.substring(0, 30) + '...',
    content: title ? content : '',
    color: selectedIdeaColor,
    isPinned: isIdeaPinned,
    createdAt: Date.now()
  };

  ideasList.unshift(newIdea);
  titleInput.value = '';
  contentInput.value = '';
  isIdeaPinned = false;
  document.getElementById('togglePinIdeaBtn').classList.remove('active');

  SoundFX.pop();
  saveLocalData();
  renderIdeasList();
  updateBadges();
  showToast("Idea salvata nella bacheca! 💡", "✨");
}

// =============================================================================
// 11. BADGES & UI STATS
// =============================================================================

function updateBadges() {
  const familyActiveCount = familyTasks.filter(t => !t.completed).length;
  const personalActiveCount = personalTasks.filter(t => !t.completed).length;
  const ideasCount = ideasList.length;

  document.getElementById('badgeFamilyCount').textContent = familyActiveCount;
  document.getElementById('badgePersonalCount').textContent = personalActiveCount;
  document.getElementById('badgeIdeasCount').textContent = ideasCount;
  document.getElementById('currentMemberAvatarHeader').textContent = userProfile.avatar;
}

function showToast(message, icon = '✨') {
  const toast = document.getElementById('metroToast');
  if (!toast) return;
  document.getElementById('metroToastIcon').textContent = icon;
  document.getElementById('metroToastMessage').textContent = message;
  toast.classList.remove('hidden');

  setTimeout(() => {
    toast.classList.add('hidden');
  }, 2600);
}

function escapeHTML(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// =============================================================================
// 12. MODALS & EVENT LISTENERS
// =============================================================================

function applyTheme() {
  document.body.className = themeSettings.mode === 'light' ? 'theme-light' : 'theme-dark';
  document.documentElement.style.setProperty('--accent-color', themeSettings.accent || '#0078d7');

  // Update theme modal buttons
  document.getElementById('btnDarkMode').classList.toggle('active', themeSettings.mode === 'dark');
  document.getElementById('btnLightMode').classList.toggle('active', themeSettings.mode === 'light');

  document.querySelectorAll('#accentPaletteGrid .accent-choice').forEach(b => {
    b.classList.toggle('active', b.dataset.accent === themeSettings.accent);
  });

  const soundIcon = document.getElementById('soundStatusIcon');
  const soundText = document.getElementById('soundStatusText');
  if (soundIcon) soundIcon.className = themeSettings.sound ? 'fa-solid fa-volume-high' : 'fa-solid fa-volume-xmark';
  if (soundText) soundText.textContent = themeSettings.sound ? 'Audio Attivo (Click e Chimes)' : 'Audio Disattivato';
}

function setupEventListeners() {
  // Pivot navigation clicks
  document.querySelectorAll('#metroPivotNav .pivot-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.index, 10);
      goToSlide(idx);
    });
  });

  // Global header buttons
  document.getElementById('themeToggleBtn').addEventListener('click', () => {
    document.getElementById('themeModal').classList.remove('hidden');
  });
  document.getElementById('closeThemeModalBtn').addEventListener('click', () => {
    document.getElementById('themeModal').classList.add('hidden');
  });
  document.getElementById('closeThemeModalFooterBtn').addEventListener('click', () => {
    document.getElementById('themeModal').classList.add('hidden');
  });

  document.getElementById('familyProfileBtn').addEventListener('click', () => {
    document.getElementById('familySettingsModal').classList.remove('hidden');
  });
  document.getElementById('openFamilySettingsBtn').addEventListener('click', () => {
    document.getElementById('familySettingsModal').classList.remove('hidden');
  });
  document.getElementById('closeFamilyModalBtn').addEventListener('click', () => {
    document.getElementById('familySettingsModal').classList.add('hidden');
  });
  document.getElementById('closeFamilyModalFooterBtn').addEventListener('click', () => {
    document.getElementById('familySettingsModal').classList.add('hidden');
  });

  // Voice buttons
  document.getElementById('globalVoiceBtn').addEventListener('click', () => {
    if (activeTabSlide === 0) startVoiceDictation(document.getElementById('familyTaskInput'));
    else if (activeTabSlide === 1) startVoiceDictation(document.getElementById('personalTaskInput'));
    else startVoiceDictation(document.getElementById('ideaTitleInput'));
  });

  document.getElementById('voiceFamilyTaskBtn').addEventListener('click', () => {
    startVoiceDictation(document.getElementById('familyTaskInput'));
  });
  document.getElementById('voicePersonalTaskBtn').addEventListener('click', () => {
    startVoiceDictation(document.getElementById('personalTaskInput'));
  });
  document.getElementById('voiceIdeaBtn').addEventListener('click', () => {
    startVoiceDictation(document.getElementById('ideaTitleInput'));
  });

  // Auto-detect category while typing in family input
  const familyInput = document.getElementById('familyTaskInput');
  familyInput.addEventListener('input', (e) => {
    const detected = autoDetectCategory(e.target.value);
    if (detected) {
      document.getElementById('familyCategorySelect').value = detected;
    }
  });

  // Enter keys to submit
  familyInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addFamilyTask();
  });
  document.getElementById('personalTaskInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addPersonalTask();
  });

  // Add buttons
  document.getElementById('addFamilyTaskBtn').addEventListener('click', addFamilyTask);
  document.getElementById('addPersonalTaskBtn').addEventListener('click', addPersonalTask);
  document.getElementById('addIdeaBtn').addEventListener('click', addIdeaNote);

  // Urgent toggle for Family
  const urgentBtn = document.getElementById('toggleUrgentFamilyBtn');
  urgentBtn.addEventListener('click', () => {
    isUrgentFamily = !isUrgentFamily;
    urgentBtn.classList.toggle('active', isUrgentFamily);
    SoundFX.click();
  });

  // Family Member Filter Chips
  document.querySelectorAll('#familyMemberFilterBar .member-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#familyMemberFilterBar .member-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      familyMemberFilter = chip.dataset.member;
      SoundFX.click();
      renderFamilyTasks();
    });
  });

  // Family Category Filter Chips
  document.querySelectorAll('#familyCategoryFilterBar .cat-filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#familyCategoryFilterBar .cat-filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      familyCategoryFilter = chip.dataset.cat;
      SoundFX.click();
      renderFamilyTasks();
    });
  });

  // Personal Filter Chips
  document.querySelectorAll('#personalFilterBar .cat-filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#personalFilterBar .cat-filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      personalCategoryFilter = chip.dataset.filter;
      SoundFX.click();
      renderPersonalTasks();
    });
  });

  // Ideas Filter Chips
  document.querySelectorAll('#ideasFilterBar .cat-filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#ideasFilterBar .cat-filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      ideasActiveFilter = chip.dataset.filter;
      SoundFX.click();
      renderIdeasList();
    });
  });

  // Idea Color Selector
  document.querySelectorAll('#ideaColorSelector .color-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      document.querySelectorAll('#ideaColorSelector .color-dot').forEach(d => d.classList.remove('active'));
      dot.classList.add('active');
      selectedIdeaColor = dot.dataset.color;
      SoundFX.click();
    });
  });

  // Idea Pin Toggle
  const pinIdeaBtn = document.getElementById('togglePinIdeaBtn');
  pinIdeaBtn.addEventListener('click', () => {
    isIdeaPinned = !isIdeaPinned;
    pinIdeaBtn.classList.toggle('active', isIdeaPinned);
    SoundFX.click();
  });

  // Accordion Toggles
  document.getElementById('toggleFamilyCompleted').addEventListener('click', () => {
    const list = document.getElementById('familyCompletedList');
    list.classList.toggle('hidden');
  });
  document.getElementById('clearFamilyCompletedBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    familyTasks = familyTasks.filter(t => !t.completed);
    pushFamilyTasksToCloud();
    renderFamilyTasks();
    updateBadges();
    showToast("Completati di Famiglia rimossi", "🗑️");
  });

  document.getElementById('togglePersonalCompleted').addEventListener('click', () => {
    const list = document.getElementById('personalCompletedList');
    list.classList.toggle('hidden');
  });
  document.getElementById('clearPersonalCompletedBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    personalTasks = personalTasks.filter(t => !t.completed);
    saveLocalData();
    renderPersonalTasks();
    updateBadges();
    showToast("Completati personali rimossi", "🗑️");
  });

  // Profile Avatar Picker in Modal
  document.querySelectorAll('#profilePickerGrid .profile-choice').forEach(choice => {
    choice.addEventListener('click', () => {
      document.querySelectorAll('#profilePickerGrid .profile-choice').forEach(c => c.classList.remove('active'));
      choice.classList.add('active');
      userProfile.name = choice.dataset.name;
      userProfile.avatar = choice.dataset.avatar;
      document.getElementById('customMemberNameInput').value = userProfile.name;
      saveLocalData();
      updateBadges();
      SoundFX.click();
    });
  });

  document.getElementById('customMemberNameInput').addEventListener('input', (e) => {
    const custom = e.target.value.trim();
    if (custom) {
      userProfile.name = custom;
      saveLocalData();
    }
  });

  // Family Code in Modal
  document.getElementById('saveFamilyCodeBtn').addEventListener('click', () => {
    const code = document.getElementById('familyCodeInput').value.trim().toUpperCase();
    if (!code) {
      showToast("Inserisci un codice valido", "⚠️");
      return;
    }
    currentFamilyCode = code;
    saveLocalData();
    initFirebaseSync();
    document.getElementById('familySettingsModal').classList.add('hidden');
    SoundFX.pop();
    showToast(`Collegato a ${code}! ☁️`, "🔗");
  });

  document.getElementById('generateRandomCodeBtn').addEventListener('click', () => {
    const randomCode = 'FAM-' + Math.floor(1000 + Math.random() * 9000);
    document.getElementById('familyCodeInput').value = randomCode;
    SoundFX.click();
  });

  document.querySelectorAll('.code-preset-btn[data-code]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('familyCodeInput').value = btn.dataset.code;
      SoundFX.click();
    });
  });

  // Theme Switches
  document.getElementById('btnDarkMode').addEventListener('click', () => {
    themeSettings.mode = 'dark';
    saveLocalData();
    applyTheme();
    SoundFX.click();
  });

  document.getElementById('btnLightMode').addEventListener('click', () => {
    themeSettings.mode = 'light';
    saveLocalData();
    applyTheme();
    SoundFX.click();
  });

  document.querySelectorAll('#accentPaletteGrid .accent-choice').forEach(choice => {
    choice.addEventListener('click', () => {
      themeSettings.accent = choice.dataset.accent;
      saveLocalData();
      applyTheme();
      SoundFX.click();
    });
  });

  document.getElementById('toggleSoundBtn').addEventListener('click', () => {
    themeSettings.sound = !themeSettings.sound;
    saveLocalData();
    applyTheme();
    if (themeSettings.sound) SoundFX.click();
    showToast(themeSettings.sound ? "Audio attivato 🔊" : "Audio disattivato 🔇");
  });

  // Convert Idea Modal Actions
  document.getElementById('closeConvertModalBtn').addEventListener('click', () => {
    document.getElementById('convertIdeaModal').classList.add('hidden');
    ideaPendingConversion = null;
  });

  document.getElementById('convertDestFamilyBtn').addEventListener('click', () => {
    if (!ideaPendingConversion) return;
    const newTask = {
      id: 'f_' + Date.now(),
      title: `${ideaPendingConversion.title}${ideaPendingConversion.content ? ': ' + ideaPendingConversion.content : ''}`,
      category: autoDetectCategory(ideaPendingConversion.title) || 'altro',
      assignee: 'Tutti',
      addedBy: `${userProfile.name} ${userProfile.avatar}`,
      isUrgent: false,
      completed: false,
      createdAt: Date.now()
    };
    familyTasks.unshift(newTask);
    pushFamilyTasksToCloud();
    document.getElementById('convertIdeaModal').classList.add('hidden');
    ideaPendingConversion = null;
    SoundFX.complete();
    showToast("Idea convertita in To-Do di Famiglia! 👨‍👩‍👧‍👦", "✨");
    goToSlide(0);
    renderFamilyTasks();
    updateBadges();
  });

  document.getElementById('convertDestPersonalBtn').addEventListener('click', () => {
    if (!ideaPendingConversion) return;
    const newTask = {
      id: 'p_' + Date.now(),
      title: `${ideaPendingConversion.title}${ideaPendingConversion.content ? ': ' + ideaPendingConversion.content : ''}`,
      priority: 'media',
      dueDate: 'oggi',
      category: 'personale',
      completed: false,
      createdAt: Date.now()
    };
    personalTasks.unshift(newTask);
    saveLocalData();
    document.getElementById('convertIdeaModal').classList.add('hidden');
    ideaPendingConversion = null;
    SoundFX.complete();
    showToast("Idea convertita in To-Do Personale! 🎯", "✨");
    goToSlide(1);
    renderPersonalTasks();
    updateBadges();
  });
}

// =============================================================================
// 13. INITIALIZATION
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {
  loadLocalData();
  applyTheme();
  setupSpeechRecognition();
  setupTouchSwipe();
  setupEventListeners();

  // Populate modals with loaded data
  document.getElementById('familyCodeInput').value = currentFamilyCode;
  document.getElementById('customMemberNameInput').value = userProfile.name;
  
  // Highlight active profile
  document.querySelectorAll('#profilePickerGrid .profile-choice').forEach(choice => {
    choice.classList.toggle('active', choice.dataset.name === userProfile.name);
  });

  // Render all tabs
  renderFamilyTasks();
  renderPersonalTasks();
  renderIdeasList();
  updateBadges();

  // Connect Firebase
  initFirebaseSync();

  // PWA Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(err => {
      console.log('SW registration note:', err);
    });
  }
});
