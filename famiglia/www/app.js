/**
 * Tribù - Authentic Windows Phone 8.1 Metro UI Engine
 * Features:
 * - Brand 'tribù' Home Reset Button (Segoe UI Light Typography)
 * - 3 Centered Application Bar Buttons
 * - Perfectly Symmetrical Add Submenu with Bottom-Right 'Salva'
 * - Native & Web Speech Dictation with Live Audio Analyzer
 * - Dynamic Live Tile Icon Background Color Customization
 * - App Icon & Theme Accent Synchronization
 */

// =============================================================================
// 1. FIREBASE CONFIGURATION (AppTito Cloud Backend)
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
  console.warn("Firebase warning:", err);
}

// =============================================================================
// 2. STATE STORAGE & DEFAULTS
// =============================================================================

let userProfile = {
  name: 'Papà'
};

let themeSettings = {
  mode: 'dark',
  accent: '#0050ef', // Official Lumia Cobalt
  sound: true,
  notifications: true // Enabled by default
};

let currentFamilyCode = 'FAM-TITO';
let activeFamilyName = 'Tribù';
let dynamicFamilyMembers = ['Papà'];

let customCategories = ['spesa', 'casa', 'bollette', 'figli', 'salute', 'urgente', 'altro'];

let categoryColors = {
  spesa: '#008a00',
  casa: '#0050ef',
  bollette: '#f09609',
  figli: '#6a00ff',
  salute: '#a20025',
  urgente: '#e81123',
  altro: '#4390df'
};

let familyTasks = [
  {
    id: 'f_task_1',
    title: 'Comprare latte parzialmente scremato e pane fresco',
    category: 'spesa',
    assignee: 'Tutti',
    addedBy: 'Mamma',
    priority: 'normale',
    dueDate: '',
    dueTime: '',
    reminder: 'none',
    completed: false,
    createdAt: Date.now() - 3600000
  },
  {
    id: 'f_task_2',
    title: 'Pagare bolletta luce entro giovedì',
    category: 'bollette',
    assignee: 'Papà',
    addedBy: 'Papà',
    priority: 'urgente',
    dueDate: '2026-08-20',
    dueTime: '18:00',
    reminder: '1h',
    completed: false,
    createdAt: Date.now() - 7200000
  }
];

let personalTasks = [
  {
    id: 'p_task_1',
    title: 'Revisionare documento di lavoro e inviare mail',
    priority: 'alta',
    dueDate: '2026-08-15',
    dueTime: '11:00',
    category: 'casa',
    reminder: '15m',
    completed: false,
    createdAt: Date.now() - 5400000
  },
  {
    id: 'p_task_2',
    title: '30 minuti di allenamento o camminata',
    priority: 'media',
    dueDate: '',
    dueTime: '',
    category: 'salute',
    reminder: 'none',
    completed: false,
    createdAt: Date.now() - 10800000
  }
];

let ideasList = [
  {
    id: 'idea_1',
    title: 'Idea Regalo Compleanno Mamma',
    content: 'Cofanetto terme relax oppure la borsa in pelle che ha visto in vetrina.',
    color: 'yellow',
    isPinned: true,
    createdAt: Date.now() - 86400000
  },
  {
    id: 'idea_2',
    title: 'Gita fuori porta nel weekend',
    content: 'Passeggiata al lago con pranzo al sacco se c\'è bel tempo.',
    color: 'green',
    isPinned: false,
    createdAt: Date.now() - 43200000
  }
];

// Active Filters & State
let activeTabSlide = 0; // 0: Famiglia, 1: Personale, 2: Idee
let familyMemberFilter = 'all';
let familyCategoryFilter = 'all';
let personalCategoryFilter = 'all';
let ideasActiveFilter = 'all';

let selectedIdeaColor = 'yellow';
let isIdeaPinned = false;
let ideaPendingConversion = null;
let lastKnownTaskCount = 0;
let categoryBeingCustomized = null;

// =============================================================================
// 3. PERSISTENCE & CLOUD SYNC ENGINE
// =============================================================================

function loadLocalData() {
  try {
    const savedProfile = localStorage.getItem('tribu_profile');
    if (savedProfile) userProfile = JSON.parse(savedProfile);

    const savedTheme = localStorage.getItem('tribu_theme');
    if (savedTheme) themeSettings = JSON.parse(savedTheme);

    const savedCode = localStorage.getItem('tribu_family_code');
    if (savedCode) currentFamilyCode = savedCode;

    const savedCats = localStorage.getItem('tribu_custom_cats');
    if (savedCats) customCategories = JSON.parse(savedCats);

    const savedCatColors = localStorage.getItem('tribu_category_colors');
    if (savedCatColors) categoryColors = JSON.parse(savedCatColors);

    const savedMembers = localStorage.getItem('tribu_family_members_' + currentFamilyCode);
    if (savedMembers) {
      dynamicFamilyMembers = JSON.parse(savedMembers);
    } else {
      dynamicFamilyMembers = [userProfile.name];
    }

    const savedPersonal = localStorage.getItem('tribu_personal_tasks');
    if (savedPersonal) personalTasks = JSON.parse(savedPersonal);

    const savedIdeas = localStorage.getItem('tribu_ideas');
    if (savedIdeas) ideasList = JSON.parse(savedIdeas);

    const savedFamily = localStorage.getItem('tribu_family_tasks_' + currentFamilyCode);
    if (savedFamily) familyTasks = JSON.parse(savedFamily);
  } catch (e) {
    console.error("Errore lettura localStorage:", e);
  }
}

function saveLocalData() {
  try {
    localStorage.setItem('tribu_profile', JSON.stringify(userProfile));
    localStorage.setItem('tribu_theme', JSON.stringify(themeSettings));
    localStorage.setItem('tribu_family_code', currentFamilyCode);
    localStorage.setItem('tribu_custom_cats', JSON.stringify(customCategories));
    localStorage.setItem('tribu_category_colors', JSON.stringify(categoryColors));
    localStorage.setItem('tribu_family_members_' + currentFamilyCode, JSON.stringify(dynamicFamilyMembers));
    localStorage.setItem('tribu_personal_tasks', JSON.stringify(personalTasks));
    localStorage.setItem('tribu_ideas', JSON.stringify(ideasList));
    localStorage.setItem('tribu_family_tasks_' + currentFamilyCode, JSON.stringify(familyTasks));
  } catch (e) {
    console.error("Errore salvataggio localStorage:", e);
  }
}

function initFirebaseSync() {
  if (!db) {
    updateCloudStatus(false);
    return;
  }

  if (unsubscribeFamilyListener) {
    unsubscribeFamilyListener();
  }

  updateCloudStatus(true);
  familyDocRef = db.collection("tribu_family_todos").doc(currentFamilyCode);

  unsubscribeFamilyListener = familyDocRef.onSnapshot((doc) => {
    if (doc.exists) {
      const data = doc.data();
      
      if (Array.isArray(data.tasks)) {
        if (data.tasks.length > lastKnownTaskCount && lastKnownTaskCount > 0) {
          const newest = data.tasks[0];
          if (newest && newest.addedBy !== userProfile.name) {
            triggerTribNotification(`Nuova attività da ${newest.addedBy}`, newest.title);
          }
        }
        familyTasks = data.tasks;
        lastKnownTaskCount = familyTasks.length;
      }

      if (Array.isArray(data.members) && data.members.length > 0) {
        dynamicFamilyMembers = data.members;
        if (!dynamicFamilyMembers.includes(userProfile.name)) {
          dynamicFamilyMembers.push(userProfile.name);
          pushFamilyTasksToCloud();
        }
      } else {
        dynamicFamilyMembers = [userProfile.name];
        pushFamilyTasksToCloud();
      }

      if (Array.isArray(data.customCategories)) {
        customCategories = Array.from(new Set([...customCategories, ...data.customCategories]));
      }
      if (data.categoryColors && typeof data.categoryColors === 'object') {
        categoryColors = { ...categoryColors, ...data.categoryColors };
      }

      saveLocalData();
      renderMemberFilterBar();
      renderCategoryOptions();
      renderFamilyTasks();
      renderPersonalTasks();
      updateCloudStatus(true);
    } else {
      pushFamilyTasksToCloud();
      updateCloudStatus(true);
    }
  }, (error) => {
    console.warn("Sync error:", error);
    updateCloudStatus(false);
  });
}

function pushFamilyTasksToCloud() {
  saveLocalData();
  if (db && familyDocRef) {
    if (!dynamicFamilyMembers.includes(userProfile.name)) {
      dynamicFamilyMembers.push(userProfile.name);
    }

    familyDocRef.set({
      familyName: activeFamilyName,
      familyCode: currentFamilyCode,
      members: dynamicFamilyMembers,
      customCategories: customCategories,
      categoryColors: categoryColors,
      lastUpdated: Date.now(),
      updatedBy: userProfile.name,
      tasks: familyTasks
    }, { merge: true }).catch(err => {
      console.warn("Push error:", err);
    });
  }
}

function updateCloudStatus(isOnline) {
  // Silent indicator
}

// =============================================================================
// 4. NOTIFICATIONS & BELL TOGGLE ENGINE
// =============================================================================

function toggleNotifications() {
  themeSettings.notifications = !themeSettings.notifications;
  saveLocalData();
  updateNotificationUI();

  if (themeSettings.notifications) {
    SoundFX.pop();
    if ('Notification' in window) {
      Notification.requestPermission().then((perm) => console.log("Notif perm:", perm));
    }
    triggerTribNotification("🔔 Notifiche Attivate", "Riceverai avvisi su compiti urgenti, scadenze e note!");
    showToast("notifiche attivate");
  } else {
    SoundFX.click();
    showToast("notifiche disattivate");
  }
}

function triggerTribNotification(title, body) {
  if (!themeSettings.notifications) return;

  if (themeSettings.sound) SoundFX.pop();
  if (navigator.vibrate) navigator.vibrate([120, 60, 120]);

  showInAppBanner(title, body);

  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body: body,
        icon: 'icon_silhouette.svg',
        badge: 'icon_silhouette.svg'
      });
    } catch (e) {
      console.log("System notification note:", e);
    }
  }
}

function showInAppBanner(title, body) {
  const banner = document.getElementById('inAppNotificationBanner');
  if (!banner) return;
  document.getElementById('inAppNotifTitle').textContent = title;
  document.getElementById('inAppNotifBody').textContent = body;
  banner.classList.remove('hidden');

  setTimeout(() => {
    banner.classList.add('hidden');
  }, 4000);
}

function updateNotificationUI() {
  const headerIcon = document.getElementById('headerNotifIcon');
  const modalIcon = document.getElementById('notifStatusIcon');
  const modalText = document.getElementById('notifStatusText');

  const isEnabled = themeSettings.notifications;

  if (headerIcon) {
    headerIcon.className = isEnabled ? 'fa-solid fa-bell' : 'fa-solid fa-bell-slash';
  }
  if (modalIcon) {
    modalIcon.className = isEnabled ? 'fa-solid fa-bell' : 'fa-solid fa-bell-slash';
  }
  if (modalText) {
    modalText.textContent = isEnabled ? 'notifiche push & avvisi attivi' : 'notifiche disattivate (tocca per attivare)';
  }
}

// Check scheduled reminders periodically
setInterval(() => {
  const now = Date.now();
  [...familyTasks, ...personalTasks].forEach(task => {
    if (!task.completed && task.dueDate && task.reminder && task.reminder !== 'none' && !task.reminderFired) {
      const dueDateTime = new Date(`${task.dueDate}T${task.dueTime || '09:00'}`).getTime();
      let reminderOffset = 0;
      if (task.reminder === '15m') reminderOffset = 15 * 60 * 1000;
      else if (task.reminder === '1h') reminderOffset = 60 * 60 * 1000;
      else if (task.reminder === '1d') reminderOffset = 24 * 60 * 60 * 1000;

      if (now >= (dueDateTime - reminderOffset) && now < (dueDateTime + 1800000)) {
        task.reminderFired = true;
        triggerTribNotification(`⏰ Scadenza: ${task.title}`, `(Scadenza: ${task.dueDate} ${task.dueTime || ''})`);
        pushFamilyTasksToCloud();
      }
    }
  });
}, 30000);

// =============================================================================
// 5. WEB AUDIO SYNTHESIZER
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
    osc.frequency.setValueAtTime(540, ctx.currentTime);
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.035);
  },

  complete() {
    if (!themeSettings.sound) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    const notes = [587.33, 880];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      const startTime = ctx.currentTime + (idx * 0.07);
      gain.gain.setValueAtTime(0.18, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.3);
    });
  },

  pop() {
    if (!themeSettings.sound) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.07);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.07);
  }
};

// =============================================================================
// 6. CATEGORIES, BORDER COLORS & LONG-PRESS CUSTOMIZER
// =============================================================================

const CATEGORY_MAP = {
  spesa:    { name: 'spesa',    icon: 'fa-cart-shopping' },
  casa:     { name: 'casa',     icon: 'fa-house' },
  bollette: { name: 'bollette', icon: 'fa-file-invoice' },
  figli:    { name: 'figli',    icon: 'fa-graduation-cap' },
  salute:   { name: 'salute',   icon: 'fa-kit-medical' },
  urgente:  { name: 'urgente',  icon: 'fa-bolt' },
  altro:    { name: 'altro',    icon: 'fa-tag' }
};

const CATEGORY_KEYWORDS = {
  spesa: ['latte', 'pane', 'uova', 'burro', 'pasta', 'riso', 'formaggio', 'mela', 'mele', 'frutta', 'verdura', 'carne', 'pesce', 'biscotti', 'acqua', 'olio', 'caffè', 'caffe', 'supermercato', 'pomodori', 'insalata', 'zucchero', 'farina', 'yogurt', 'prosciutto', 'spesa', 'detersivo', 'sapone'],
  bollette: ['luce', 'gas', 'enel', 'bolletta', 'bollette', 'affitto', 'condominio', 'assicurazione', 'wifi', 'internet', 'rata', 'tributi', 'tari', 'fattura', 'f24', 'mutuo'],
  casa: ['lampadina', 'pulizie', 'bucato', 'lavatrice', 'lavastoviglie', 'piatti', 'riparare', 'rubinetto', 'balcone', 'cantina', 'garage', 'letto', 'mobili', 'aspirapolvere'],
  figli: ['scuola', 'compiti', 'libri', 'quaderno', 'zaino', 'mensa', 'palestra', 'catechismo', 'pediatra', 'vestiti', 'maestra', 'chiara', 'marco'],
  salute: ['farmacia', 'medicine', 'tachipirina', 'sciroppo', 'visita', 'dentista', 'dottore', 'ricetta', 'analisi', 'termometro']
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

function renderCategoryOptions() {
  const familySelect = document.getElementById('familyCategorySelect');
  const personalSelect = document.getElementById('personalCategorySelect');
  const familyFilterBar = document.getElementById('familyCategoryFilterBar');
  const personalFilterBar = document.getElementById('personalCategoryFilterBar');

  let selectHtml = '';
  customCategories.forEach(cat => {
    const meta = CATEGORY_MAP[cat] || { name: cat, icon: 'fa-tag' };
    selectHtml += `<option value="${escapeHTML(cat)}">${escapeHTML(meta.name)}</option>`;
  });
  selectHtml += `<option value="__new__">+ nuova categoria...</option>`;

  if (familySelect) familySelect.innerHTML = selectHtml;
  if (personalSelect) personalSelect.innerHTML = selectHtml;

  if (familyFilterBar) {
    let chipsHtml = `
      <button id="toggleFamilyAddBoxBtn" class="cat-chip-plus-first" title="Nuova attività per la tribù">
        <i class="fa-solid fa-plus"></i>
      </button>
      <button class="cat-chip ${familyCategoryFilter === 'all' ? 'active' : ''}" data-cat="all">tutte</button>
    `;
    customCategories.forEach(cat => {
      const meta = CATEGORY_MAP[cat] || { name: cat, icon: 'fa-tag' };
      const isAct = familyCategoryFilter === cat;
      const borderCol = categoryColors[cat] || '';
      const styleAttr = borderCol ? `style="border-color:${borderCol};"` : '';
      chipsHtml += `<button class="cat-chip ${isAct ? 'active' : ''}" data-cat="${escapeHTML(cat)}" ${styleAttr} title="Tocca per filtrare, tieni premuto per cambiare colore"><i class="fa-solid ${meta.icon}"></i> ${escapeHTML(meta.name)}</button>`;
    });
    familyFilterBar.innerHTML = chipsHtml;
    attachCategoryChipListeners(familyFilterBar, 'family');
  }

  if (personalFilterBar) {
    let chipsHtml = `
      <button id="togglePersonalAddBoxBtn" class="cat-chip-plus-first" title="Nuova attività personale">
        <i class="fa-solid fa-plus"></i>
      </button>
      <button class="cat-chip ${personalCategoryFilter === 'all' ? 'active' : ''}" data-cat="all">tutte</button>
    `;
    customCategories.forEach(cat => {
      const meta = CATEGORY_MAP[cat] || { name: cat, icon: 'fa-tag' };
      const isAct = personalCategoryFilter === cat;
      const borderCol = categoryColors[cat] || '';
      const styleAttr = borderCol ? `style="border-color:${borderCol};"` : '';
      chipsHtml += `<button class="cat-chip ${isAct ? 'active' : ''}" data-cat="${escapeHTML(cat)}" ${styleAttr} title="Tocca per filtrare, tieni premuto per cambiare colore"><i class="fa-solid ${meta.icon}"></i> ${escapeHTML(meta.name)}</button>`;
    });
    personalFilterBar.innerHTML = chipsHtml;
    attachCategoryChipListeners(personalFilterBar, 'personal');
  }
}

function attachCategoryChipListeners(container, type) {
  const plusBtn = container.querySelector('.cat-chip-plus-first');
  if (plusBtn) {
    plusBtn.addEventListener('click', () => {
      SoundFX.click();
      if (type === 'family') {
        const card = document.getElementById('familyInputCard');
        card.classList.toggle('hidden');
        if (!card.classList.contains('hidden')) {
          document.getElementById('familyTaskInput').focus();
        }
      } else {
        const card = document.getElementById('personalInputCard');
        card.classList.toggle('hidden');
        if (!card.classList.contains('hidden')) {
          document.getElementById('personalTaskInput').focus();
        }
      }
    });
  }

  container.querySelectorAll('.cat-chip').forEach(chip => {
    let pressTimer = null;
    let isLongPress = false;

    const startPress = () => {
      isLongPress = false;
      pressTimer = setTimeout(() => {
        isLongPress = true;
        const cat = chip.dataset.cat;
        if (cat && cat !== 'all') {
          openCategoryColorModal(cat);
        }
      }, 550);
    };

    const cancelPress = () => {
      clearTimeout(pressTimer);
    };

    chip.addEventListener('mousedown', startPress);
    chip.addEventListener('touchstart', startPress, { passive: true });
    chip.addEventListener('mouseup', cancelPress);
    chip.addEventListener('mouseleave', cancelPress);
    chip.addEventListener('touchend', cancelPress);

    chip.addEventListener('click', () => {
      if (isLongPress) return;
      container.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      if (type === 'family') {
        familyCategoryFilter = chip.dataset.cat;
        SoundFX.click();
        renderFamilyTasks();
      } else {
        personalCategoryFilter = chip.dataset.cat;
        SoundFX.click();
        renderPersonalTasks();
      }
    });
  });
}

function openCategoryColorModal(cat) {
  categoryBeingCustomized = cat;
  document.getElementById('customizingCategoryName').textContent = cat;
  document.getElementById('categoryColorModal').classList.remove('hidden');
  SoundFX.pop();
}

function addCustomCategory(name) {
  const clean = name.trim().toLowerCase();
  if (!clean) return;
  if (!customCategories.includes(clean)) {
    customCategories.push(clean);
    CATEGORY_MAP[clean] = { name: clean, icon: 'fa-tag' };
    categoryColors[clean] = '#4390df';
    saveLocalData();
    pushFamilyTasksToCloud();
    renderCategoryOptions();
    document.getElementById('familyCategorySelect').value = clean;
    showToast(`categoria "${clean}" aggiunta`);
    SoundFX.pop();
  }
}

// =============================================================================
// 7. ROBUST NATIVE & WEB SPEECH DICTATION
// =============================================================================

let recognition = null;
let activeVoiceTargetInput = null;
let liveAudioStream = null;

function setupSpeechRecognition() {
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRec) return;

  recognition = new SpeechRec();
  recognition.lang = 'it-IT';
  recognition.continuous = false;
  recognition.interimResults = true;

  recognition.onstart = () => {
    document.querySelectorAll('.wp8-inline-btn, #appbarVoiceBtn').forEach(b => b.classList.add('recording'));
    document.getElementById('voiceStatusPrompt').textContent = "In ascolto... Parla ora!";
  };

  recognition.onresult = (event) => {
    let interim = '';
    let final = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        final += event.results[i][0].transcript;
      } else {
        interim += event.results[i][0].transcript;
      }
    }
    const current = final || interim;
    if (current) {
      document.getElementById('voiceTranscriptionResult').value = current;
    }
  };

  recognition.onerror = (err) => {
    console.warn("Speech error:", err);
    document.getElementById('voiceStatusPrompt').textContent = "Puoi anche modificare o scrivere qui sotto:";
  };

  recognition.onend = () => {
    document.querySelectorAll('.wp8-inline-btn, #appbarVoiceBtn').forEach(b => b.classList.remove('recording'));
  };
}

async function startVoiceDictation(targetInput) {
  activeVoiceTargetInput = targetInput;

  document.getElementById('voiceModal').classList.remove('hidden');
  document.getElementById('voiceStatusPrompt').textContent = "In ascolto... Parla ora!";
  const txtArea = document.getElementById('voiceTranscriptionResult');
  txtArea.value = targetInput.value || '';
  txtArea.focus();

  // Try Native Capacitor Speech Recognition if available on Android
  const NativeSpeech = window.Capacitor?.Plugins?.SpeechRecognition;
  if (NativeSpeech) {
    try {
      const hasPerm = await NativeSpeech.hasPermission();
      if (!hasPerm.permission) {
        await NativeSpeech.requestPermission();
      }
      const result = await NativeSpeech.start({
        language: "it-IT",
        maxResults: 1,
        prompt: "Cosa c'è da fare per la tribù?",
        popup: true
      });
      if (result && result.matches && result.matches.length > 0) {
        txtArea.value = result.matches[0];
      }
      return;
    } catch (nativeErr) {
      console.log("Native speech note:", nativeErr);
    }
  }

  // Fallback to Web Speech API & getUserMedia
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    try {
      liveAudioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      console.log("Microphone access handled:", e);
    }
  }

  if (recognition) {
    try {
      recognition.start();
    } catch (e) {
      try { recognition.stop(); } catch(err){}
      setTimeout(() => { try { recognition.start(); } catch(err){} }, 180);
    }
  }
}

function stopVoiceDictation() {
  if (recognition) {
    try { recognition.stop(); } catch(e){}
  }
  if (liveAudioStream) {
    liveAudioStream.getTracks().forEach(t => t.stop());
    liveAudioStream = null;
  }
  document.querySelectorAll('.wp8-inline-btn, #appbarVoiceBtn').forEach(b => b.classList.remove('recording'));
}

// =============================================================================
// 8. HORIZONTAL SWIPE & GIANT WP8 PIVOT ENGINE
// =============================================================================

function goToSlide(index) {
  if (index < 0) index = 0;
  if (index > 2) index = 2;
  activeTabSlide = index;

  const track = document.getElementById('carouselTrack');
  if (track) {
    track.style.transform = `translateX(-${index * 33.3333}%)`;
  }

  const pivotButtons = document.querySelectorAll('#pivotTitlesTrack .pivot-title-btn');
  pivotButtons.forEach((btn, i) => {
    btn.classList.toggle('active', i === index);
  });

  const scroller = document.getElementById('pivotTitlesScroller');
  if (scroller) {
    if (index === 0) scroller.scrollTo({ left: 0, behavior: 'smooth' });
    else if (index === 1) scroller.scrollTo({ left: 140, behavior: 'smooth' });
    else if (index === 2) scroller.scrollTo({ left: 320, behavior: 'smooth' });
  }

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

    if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY) * 1.3) {
      if (diffX < 0 && activeTabSlide < 2) {
        goToSlide(activeTabSlide + 1);
      } else if (diffX > 0 && activeTabSlide > 0) {
        goToSlide(activeTabSlide - 1);
      }
    }
  }, { passive: true });
}

// =============================================================================
// 9. DYNAMIC MEMBERS SYSTEM
// =============================================================================

function renderMemberFilterBar() {
  const container = document.getElementById('familyMemberFilterBar');
  const assigneeSelect = document.getElementById('familyAssigneeSelect');
  const modalMemberList = document.getElementById('dynamicFamilyMembersList');

  if (!container) return;

  let html = `<button class="filter-link ${familyMemberFilter === 'all' ? 'active' : ''}" data-member="all">tutti</button>`;
  dynamicFamilyMembers.forEach(member => {
    const isAct = familyMemberFilter === member;
    html += `<button class="filter-link ${isAct ? 'active' : ''}" data-member="${escapeHTML(member)}">${escapeHTML(member.toLowerCase())}</button>`;
  });
  container.innerHTML = html;

  container.querySelectorAll('.filter-link').forEach(link => {
    link.addEventListener('click', () => {
      container.querySelectorAll('.filter-link').forEach(c => c.classList.remove('active'));
      link.classList.add('active');
      familyMemberFilter = link.dataset.member;
      SoundFX.click();
      renderFamilyTasks();
    });
  });

  if (assigneeSelect) {
    let selectHtml = `<option value="Tutti">chiunque</option>`;
    dynamicFamilyMembers.forEach(member => {
      selectHtml += `<option value="${escapeHTML(member)}">${escapeHTML(member)}</option>`;
    });
    assigneeSelect.innerHTML = selectHtml;
  }

  if (modalMemberList) {
    modalMemberList.innerHTML = '';
    dynamicFamilyMembers.forEach(member => {
      const row = document.createElement('div');
      row.className = 'member-row-item';
      row.innerHTML = `
        <div class="member-row-left">
          <i class="fa-solid fa-user"></i>
          <strong>${escapeHTML(member)}</strong>
          ${member === userProfile.name ? '<small style="opacity:0.65;">(tu)</small>' : ''}
        </div>
        <div class="member-row-actions">
          ${member !== userProfile.name ? `
            <button class="wp8-icon-action delete-member-btn" title="Rimuovi dalla tribù">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          ` : ''}
        </div>
      `;

      const delBtn = row.querySelector('.delete-member-btn');
      if (delBtn) {
        delBtn.addEventListener('click', () => {
          dynamicFamilyMembers = dynamicFamilyMembers.filter(m => m !== member);
          pushFamilyTasksToCloud();
          renderMemberFilterBar();
          showToast(`rimosso ${member} dalla tribù`);
        });
      }

      modalMemberList.appendChild(row);
    });
  }
}

function addFamilyMember(name) {
  const cleanName = name.trim();
  if (!cleanName) return;

  if (!dynamicFamilyMembers.includes(cleanName)) {
    dynamicFamilyMembers.push(cleanName);
    pushFamilyTasksToCloud();
    renderMemberFilterBar();
    showToast(`aggiunto ${cleanName} alla tribù!`);
    SoundFX.pop();
  } else {
    showToast(`${cleanName} è già nella tribù`);
  }
}

// =============================================================================
// 10. TAB 1: RENDERING FAMIGLIA
// =============================================================================

function renderFamilyTasks() {
  const container = document.getElementById('familyTasksList');
  const completedList = document.getElementById('familyCompletedList');
  const emptyState = document.getElementById('emptyFamilyState');
  const completedCountElem = document.getElementById('familyCompletedCount');

  if (!container) return;

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
      container.appendChild(createTaskItem(t, 'family'));
    });
  }

  completedCountElem.textContent = completedTasks.length;
  completedList.innerHTML = '';
  completedTasks.forEach(t => {
    completedList.appendChild(createTaskItem(t, 'family'));
  });
}

function addFamilyTask() {
  const input = document.getElementById('familyTaskInput');
  const title = input.value.trim();
  if (!title) {
    showToast("inserisci cosa c'è da fare");
    return;
  }

  const category = document.getElementById('familyCategorySelect').value;
  const assignee = document.getElementById('familyAssigneeSelect').value;
  const priority = document.getElementById('familyPrioritySelect').value;
  const dueDate = document.getElementById('familyDueDateInput').value;
  const dueTime = document.getElementById('familyDueTimeInput').value;
  const reminder = document.getElementById('familyReminderSelect').value;

  const newTask = {
    id: 'f_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    title,
    category: category === '__new__' ? 'altro' : category,
    assignee,
    priority,
    dueDate,
    dueTime,
    reminder,
    reminderFired: false,
    addedBy: userProfile.name,
    completed: false,
    createdAt: Date.now()
  };

  familyTasks.unshift(newTask);
  input.value = '';
  document.getElementById('familyDueDateInput').value = '';
  document.getElementById('familyDueTimeInput').value = '';
  document.getElementById('familyReminderSelect').value = 'none';

  document.getElementById('familyInputCard').classList.add('hidden');

  SoundFX.pop();
  pushFamilyTasksToCloud();
  renderFamilyTasks();
  showToast("salvato nella tribù");

  if (newTask.priority === 'urgente' || newTask.priority === 'alta') {
    triggerTribNotification(`🚨 Attività Urgente da ${userProfile.name}`, newTask.title);
  }
}

// =============================================================================
// 11. TAB 2: RENDERING PERSONALE
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
    const matchCat = personalCategoryFilter === 'all' || t.category === personalCategoryFilter;
    return matchCat;
  });

  container.innerHTML = '';
  if (filtered.length === 0) {
    emptyState.classList.remove('hidden');
  } else {
    emptyState.classList.add('hidden');
    filtered.forEach(t => {
      container.appendChild(createTaskItem(t, 'personal'));
    });
  }

  completedList.innerHTML = '';
  completedTasks.forEach(t => {
    completedList.appendChild(createTaskItem(t, 'personal'));
  });
}

function addPersonalTask() {
  const input = document.getElementById('personalTaskInput');
  const title = input.value.trim();
  if (!title) {
    showToast("scrivi cosa devi fare");
    return;
  }

  const priority = document.getElementById('personalPrioritySelect').value;
  const dueDate = document.getElementById('personalDueDateInput').value;
  const dueTime = document.getElementById('personalDueTimeInput').value;
  const category = document.getElementById('personalCategorySelect').value;
  const reminder = document.getElementById('personalReminderSelect').value;

  const newTask = {
    id: 'p_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    title,
    priority,
    dueDate,
    dueTime,
    category: category === '__new__' ? 'altro' : category,
    reminder,
    reminderFired: false,
    completed: false,
    createdAt: Date.now()
  };

  personalTasks.unshift(newTask);
  input.value = '';
  document.getElementById('personalDueDateInput').value = '';
  document.getElementById('personalDueTimeInput').value = '';
  document.getElementById('personalReminderSelect').value = 'none';

  document.getElementById('personalInputCard').classList.add('hidden');

  SoundFX.pop();
  saveLocalData();
  renderPersonalTasks();
  showToast("salvato nella lista personale");
}

function createTaskItem(task, scope) {
  const catMeta = CATEGORY_MAP[task.category] || { name: task.category, icon: 'fa-tag' };
  const catColor = categoryColors[task.category] || varAccentColor();
  const isUrgent = task.priority === 'urgente' || task.priority === 'alta';
  
  const item = document.createElement('div');
  item.className = `wp8-task-item ${isUrgent ? 'is-urgent' : ''} ${task.completed ? 'is-completed' : ''}`;
  item.id = `${scope === 'family' ? 'ftask' : 'ptask'}_${task.id}`;

  if (!isUrgent && catColor) {
    item.style.borderLeftColor = catColor;
  }

  const scheduleInfo = task.dueDate ? `${task.dueDate}${task.dueTime ? ' ore ' + task.dueTime : ''}` : '';

  item.innerHTML = `
    <button class="wp8-checkbox" aria-label="Completa" title="Segna come fatto">
      ${task.completed ? '<i class="fa-solid fa-check"></i>' : ''}
    </button>
    <div class="task-body-col">
      <div class="task-text">${escapeHTML(task.title)}</div>
      <div class="task-info-meta">
        <span class="meta-tag" style="color:${catColor};"><i class="fa-solid ${catMeta.icon}"></i> ${escapeHTML(catMeta.name)}</span>
        ${task.assignee && task.assignee !== 'Tutti' ? `<span class="meta-tag tag-member"><i class="fa-solid fa-user"></i> ${escapeHTML(task.assignee)}</span>` : ''}
        ${isUrgent ? `<span class="meta-tag tag-urgent"><i class="fa-solid fa-bolt"></i> ${task.priority}</span>` : ''}
        ${scheduleInfo ? `<span class="meta-tag tag-schedule"><i class="fa-solid fa-clock"></i> ${scheduleInfo}</span>` : ''}
        ${scope === 'family' ? `<span class="meta-tag" style="opacity:0.65;">di ${escapeHTML(task.addedBy || 'Tribù')}</span>` : ''}
        ${task.completed && task.completedBy ? `<span class="meta-tag" style="color:#008a00;">fatto da ${escapeHTML(task.completedBy)}</span>` : ''}
      </div>
    </div>
    <div class="task-side-actions">
      ${scope === 'personal' && !task.completed ? `
        <button class="share-to-family-link" title="Condividi con la tribù">
          <i class="fa-solid fa-share-nodes"></i>
          <span>tribù</span>
        </button>
      ` : ''}
      <button class="wp8-icon-action delete-action" title="Elimina">
        <i class="fa-solid fa-trash-can"></i>
      </button>
    </div>
  `;

  item.querySelector('.wp8-checkbox').addEventListener('click', () => {
    task.completed = !task.completed;
    if (task.completed) {
      task.completedBy = userProfile.name;
      task.completedAt = Date.now();
      SoundFX.complete();
      showToast("completato!");
    } else {
      task.completedBy = null;
      task.completedAt = null;
      SoundFX.click();
    }

    if (scope === 'family') {
      pushFamilyTasksToCloud();
      renderFamilyTasks();
    } else {
      saveLocalData();
      renderPersonalTasks();
    }
  });

  const shareBtn = item.querySelector('.share-to-family-link');
  if (shareBtn) {
    shareBtn.addEventListener('click', () => {
      const familyCopy = {
        id: 'f_' + Date.now(),
        title: task.title,
        category: task.category || 'altro',
        assignee: userProfile.name,
        addedBy: userProfile.name,
        priority: task.priority || 'normale',
        dueDate: task.dueDate || '',
        dueTime: task.dueTime || '',
        reminder: task.reminder || 'none',
        completed: false,
        createdAt: Date.now()
      };
      familyTasks.unshift(familyCopy);
      pushFamilyTasksToCloud();
      SoundFX.pop();
      showToast("spostato nella tribù");
    });
  }

  item.querySelector('.delete-action').addEventListener('click', (e) => {
    e.stopPropagation();
    if (scope === 'family') {
      familyTasks = familyTasks.filter(item => item.id !== task.id);
      pushFamilyTasksToCloud();
      renderFamilyTasks();
    } else {
      personalTasks = personalTasks.filter(item => item.id !== task.id);
      saveLocalData();
      renderPersonalTasks();
    }
    SoundFX.click();
    showToast("attività eliminata");
  });

  return item;
}

function varAccentColor() {
  return themeSettings.accent || '#0050ef';
}

// =============================================================================
// 12. TAB 3: RENDERING IDEE & NOTE
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

  filtered.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));

  grid.innerHTML = '';
  if (filtered.length === 0) {
    emptyState.classList.remove('hidden');
  } else {
    emptyState.classList.add('hidden');
    filtered.forEach(idea => {
      grid.appendChild(createIdeaMetroTile(idea));
    });
  }
}

function createIdeaMetroTile(idea) {
  const tile = document.createElement('div');
  tile.className = `wp8-metro-tile tile-${idea.color || 'yellow'} ${idea.isPinned ? 'is-pinned' : ''}`;
  tile.id = `idea_${idea.id}`;

  const formattedDate = new Date(idea.createdAt).toLocaleDateString([], { day: 'numeric', month: 'short' });

  tile.innerHTML = `
    <div class="tile-top-row">
      <h4 class="tile-headline">${escapeHTML(idea.title)}</h4>
      ${idea.isPinned ? '<span class="tile-pin-icon"><i class="fa-solid fa-thumbtack"></i></span>' : ''}
    </div>
    ${idea.content ? `<div class="tile-content-text">${escapeHTML(idea.content)}</div>` : ''}
    <div class="tile-footer-row">
      <span class="tile-date-label">${formattedDate}</span>
      <div class="tile-actions">
        <button class="btn-convert-pill" title="Converti in to-do">
          <i class="fa-solid fa-arrow-right"></i>
          <span>to-do</span>
        </button>
        <button class="wp8-icon-action pin-action" title="${idea.isPinned ? 'Sblocca' : 'Fissa'}">
          <i class="fa-solid fa-thumbtack"></i>
        </button>
        <button class="wp8-icon-action delete-action" title="Elimina">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
    </div>
  `;

  tile.querySelector('.btn-convert-pill').addEventListener('click', () => {
    ideaPendingConversion = idea;
    document.getElementById('convertIdeaPreviewText').textContent = `"${idea.title}"`;
    document.getElementById('convertIdeaModal').classList.remove('hidden');
  });

  tile.querySelector('.pin-action').addEventListener('click', () => {
    idea.isPinned = !idea.isPinned;
    SoundFX.click();
    saveLocalData();
    renderIdeasList();
    showToast(idea.isPinned ? "fissata in alto" : "sbloccata");
  });

  tile.querySelector('.delete-action').addEventListener('click', (e) => {
    e.stopPropagation();
    ideasList = ideasList.filter(item => item.id !== idea.id);
    SoundFX.click();
    saveLocalData();
    renderIdeasList();
    showToast("idea eliminata");
  });

  return tile;
}

function addIdeaNote() {
  const titleInput = document.getElementById('ideaTitleInput');
  const contentInput = document.getElementById('ideaContentInput');
  const title = titleInput.value.trim();
  const content = contentInput.value.trim();

  if (!title && !content) {
    showToast("scrivi un titolo o il testo");
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
  document.getElementById('ideasInputCard').classList.add('hidden');

  SoundFX.pop();
  saveLocalData();
  renderIdeasList();
  showToast("idea salvata");
}

// =============================================================================
// 13. TOAST & UTILS
// =============================================================================

function showToast(message) {
  const toast = document.getElementById('metroToast');
  if (!toast) return;
  document.getElementById('metroToastMessage').textContent = message;
  toast.classList.remove('hidden');

  setTimeout(() => {
    toast.classList.add('hidden');
  }, 2400);
}

function escapeHTML(str) {
  if (!str) return '';
  const cleanStr = String(str).replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();
  const div = document.createElement('div');
  div.textContent = cleanStr;
  return div.innerHTML;
}

// =============================================================================
// 14. THEME, HOME & EVENT LISTENERS
// =============================================================================

function applyTheme() {
  document.body.className = themeSettings.mode === 'light' ? 'theme-light' : 'theme-dark';
  document.documentElement.style.setProperty('--accent-color', themeSettings.accent || '#0050ef');

  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) metaTheme.setAttribute('content', themeSettings.accent || '#000000');

  document.getElementById('btnDarkMode').classList.toggle('active', themeSettings.mode === 'dark');
  document.getElementById('btnLightMode').classList.toggle('active', themeSettings.mode === 'light');

  // Dynamically update Live Tile Preview Background Color
  const liveTile = document.getElementById('liveTilePreview');
  if (liveTile) {
    liveTile.style.backgroundColor = themeSettings.accent || '#0050ef';
  }

  document.querySelectorAll('#accentPaletteGrid .palette-tile').forEach(b => {
    b.classList.toggle('active', b.dataset.accent === themeSettings.accent);
  });

  const soundIcon = document.getElementById('soundStatusIcon');
  const soundText = document.getElementById('soundStatusText');
  if (soundIcon) soundIcon.className = themeSettings.sound ? 'fa-solid fa-volume-high' : 'fa-solid fa-volume-xmark';
  if (soundText) soundText.textContent = themeSettings.sound ? 'effetti sonori attivi' : 'audio disattivato';

  updateNotificationUI();
}

function setupEventListeners() {
  // Brand Home Button (Clicking 'tribù' returns to home)
  const homeBtn = document.getElementById('brandHomeBtn');
  if (homeBtn) {
    homeBtn.addEventListener('click', () => {
      goToSlide(0);
      familyMemberFilter = 'all';
      familyCategoryFilter = 'all';
      document.querySelectorAll('#familyMemberFilterBar .filter-link').forEach(l => l.classList.remove('active'));
      const firstMember = document.querySelector('#familyMemberFilterBar .filter-link');
      if (firstMember) firstMember.classList.add('active');

      document.querySelectorAll('#familyCategoryFilterBar .cat-chip').forEach(c => c.classList.remove('active'));
      const firstCat = document.querySelector('#familyCategoryFilterBar .cat-chip');
      if (firstCat) firstCat.classList.add('active');

      document.getElementById('familyInputCard').classList.add('hidden');
      document.getElementById('personalInputCard').classList.add('hidden');
      document.getElementById('ideasInputCard').classList.add('hidden');

      const slideFam = document.getElementById('slideFamiglia');
      if (slideFam) slideFam.scrollTo({ top: 0, behavior: 'smooth' });

      renderFamilyTasks();
      SoundFX.click();
      showToast("tribù - inizio");
    });
  }

  // Pivot Tabs
  document.querySelectorAll('#pivotTitlesTrack .pivot-title-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.index, 10);
      goToSlide(idx);
    });
  });

  // Bell Toggle in Header
  document.getElementById('headerNotifBtn').addEventListener('click', toggleNotifications);

  // Gear Icon for Settings / Colors
  document.getElementById('themeToggleBtn').addEventListener('click', () => {
    document.getElementById('themeModal').classList.remove('hidden');
  });
  document.getElementById('closeThemeModalBtn').addEventListener('click', () => {
    document.getElementById('themeModal').classList.add('hidden');
  });
  document.getElementById('closeThemeModalFooterBtn').addEventListener('click', () => {
    document.getElementById('themeModal').classList.add('hidden');
  });

  document.getElementById('familySettingsBtn').addEventListener('click', () => {
    document.getElementById('familySettingsModal').classList.remove('hidden');
  });
  document.getElementById('closeFamilyModalBtn').addEventListener('click', () => {
    document.getElementById('familySettingsModal').classList.add('hidden');
  });
  document.getElementById('closeFamilyModalFooterBtn').addEventListener('click', () => {
    document.getElementById('familySettingsModal').classList.add('hidden');
  });

  // Category Color Customizer Modal Listeners
  document.querySelectorAll('#categoryColorPaletteGrid .palette-tile').forEach(tile => {
    tile.addEventListener('click', () => {
      if (categoryBeingCustomized) {
        const color = tile.dataset.catcolor;
        categoryColors[categoryBeingCustomized] = color;
        saveLocalData();
        pushFamilyTasksToCloud();
        renderCategoryOptions();
        renderFamilyTasks();
        renderPersonalTasks();
        document.getElementById('categoryColorModal').classList.add('hidden');
        showToast(`colore impostato per ${categoryBeingCustomized}`);
        SoundFX.pop();
      }
    });
  });

  document.getElementById('closeCategoryColorModalBtn').addEventListener('click', () => {
    document.getElementById('categoryColorModal').classList.add('hidden');
  });
  document.getElementById('closeCategoryColorModalFooterBtn').addEventListener('click', () => {
    document.getElementById('categoryColorModal').classList.add('hidden');
  });
  document.getElementById('resetCategoryColorBtn').addEventListener('click', () => {
    if (categoryBeingCustomized) {
      delete categoryColors[categoryBeingCustomized];
      saveLocalData();
      pushFamilyTasksToCloud();
      renderCategoryOptions();
      renderFamilyTasks();
      renderPersonalTasks();
      document.getElementById('categoryColorModal').classList.add('hidden');
      showToast(`colore predefinito ripristinato`);
      SoundFX.click();
    }
  });

  // Toggle Ideas Add Card
  const toggleIdeasBtn = document.getElementById('toggleIdeasAddBoxBtn');
  if (toggleIdeasBtn) {
    toggleIdeasBtn.addEventListener('click', () => {
      const card = document.getElementById('ideasInputCard');
      card.classList.toggle('hidden');
      if (!card.classList.contains('hidden')) {
        document.getElementById('ideaTitleInput').focus();
      }
      SoundFX.click();
    });
  }

  // Cancel buttons in Submenus
  document.getElementById('cancelFamilyTaskBtn').addEventListener('click', () => {
    document.getElementById('familyInputCard').classList.add('hidden');
    SoundFX.click();
  });
  document.getElementById('cancelPersonalTaskBtn').addEventListener('click', () => {
    document.getElementById('personalInputCard').classList.add('hidden');
    SoundFX.click();
  });
  document.getElementById('cancelIdeaBtn').addEventListener('click', () => {
    document.getElementById('ideasInputCard').classList.add('hidden');
    SoundFX.click();
  });

  // Ideas filter chips
  document.querySelectorAll('#ideasCategoryFilterBar .cat-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#ideasCategoryFilterBar .cat-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      ideasActiveFilter = chip.dataset.color;
      SoundFX.click();
      renderIdeasList();
    });
  });

  // Add member buttons
  document.getElementById('addMemberFilterBtn').addEventListener('click', () => {
    document.getElementById('addMemberModal').classList.remove('hidden');
    document.getElementById('newMemberNameInput').focus();
  });
  document.getElementById('openAddMemberDialogBtn').addEventListener('click', () => {
    document.getElementById('addMemberModal').classList.remove('hidden');
    document.getElementById('newMemberNameInput').focus();
  });
  document.getElementById('closeAddMemberModalBtn').addEventListener('click', () => {
    document.getElementById('addMemberModal').classList.add('hidden');
  });
  document.getElementById('cancelAddMemberBtn').addEventListener('click', () => {
    document.getElementById('addMemberModal').classList.add('hidden');
  });

  document.getElementById('confirmAddMemberBtn').addEventListener('click', () => {
    const input = document.getElementById('newMemberNameInput');
    if (input.value.trim()) {
      addFamilyMember(input.value);
      input.value = '';
      document.getElementById('addMemberModal').classList.add('hidden');
    }
  });

  document.querySelectorAll('#quickRoleChips .role-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.getElementById('newMemberNameInput').value = chip.dataset.role;
    });
  });

  // Custom Category trigger
  document.getElementById('familyCategorySelect').addEventListener('change', (e) => {
    if (e.target.value === '__new__') {
      document.getElementById('customCategoryModal').classList.remove('hidden');
      document.getElementById('newCategoryNameInput').focus();
    }
  });
  document.getElementById('personalCategorySelect').addEventListener('change', (e) => {
    if (e.target.value === '__new__') {
      document.getElementById('customCategoryModal').classList.remove('hidden');
      document.getElementById('newCategoryNameInput').focus();
    }
  });

  document.getElementById('closeCustomCategoryModalBtn').addEventListener('click', () => {
    document.getElementById('customCategoryModal').classList.add('hidden');
  });
  document.getElementById('cancelCustomCategoryBtn').addEventListener('click', () => {
    document.getElementById('customCategoryModal').classList.add('hidden');
  });
  document.getElementById('confirmCustomCategoryBtn').addEventListener('click', () => {
    const input = document.getElementById('newCategoryNameInput');
    if (input.value.trim()) {
      addCustomCategory(input.value);
      input.value = '';
      document.getElementById('customCategoryModal').classList.add('hidden');
    }
  });

  // Bottom 3 Centered Application Bar Buttons
  document.getElementById('appbarAddBtn').addEventListener('click', () => {
    SoundFX.click();
    if (activeTabSlide === 0) {
      const card = document.getElementById('familyInputCard');
      card.classList.remove('hidden');
      document.getElementById('familyTaskInput').focus();
    } else if (activeTabSlide === 1) {
      const card = document.getElementById('personalInputCard');
      card.classList.remove('hidden');
      document.getElementById('personalTaskInput').focus();
    } else {
      const card = document.getElementById('ideasInputCard');
      card.classList.remove('hidden');
      document.getElementById('ideaTitleInput').focus();
    }
  });

  document.getElementById('appbarVoiceBtn').addEventListener('click', () => {
    if (activeTabSlide === 0) {
      document.getElementById('familyInputCard').classList.remove('hidden');
      startVoiceDictation(document.getElementById('familyTaskInput'));
    } else if (activeTabSlide === 1) {
      document.getElementById('personalInputCard').classList.remove('hidden');
      startVoiceDictation(document.getElementById('personalTaskInput'));
    } else {
      document.getElementById('ideasInputCard').classList.remove('hidden');
      startVoiceDictation(document.getElementById('ideaTitleInput'));
    }
  });

  document.getElementById('appbarSyncBtn').addEventListener('click', () => {
    SoundFX.pop();
    initFirebaseSync();
    showToast("sincronizzazione in corso...");
  });

  // Voice buttons
  document.getElementById('voiceFamilyTaskBtn').addEventListener('click', () => {
    startVoiceDictation(document.getElementById('familyTaskInput'));
  });
  document.getElementById('voicePersonalTaskBtn').addEventListener('click', () => {
    startVoiceDictation(document.getElementById('personalTaskInput'));
  });
  document.getElementById('voiceIdeaBtn').addEventListener('click', () => {
    startVoiceDictation(document.getElementById('ideaTitleInput'));
  });

  // Voice modal confirm/cancel
  document.getElementById('closeVoiceModalBtn').addEventListener('click', () => {
    stopVoiceDictation();
    document.getElementById('voiceModal').classList.add('hidden');
  });
  document.getElementById('cancelVoiceBtn').addEventListener('click', () => {
    stopVoiceDictation();
    document.getElementById('voiceModal').classList.add('hidden');
  });
  document.getElementById('confirmVoiceBtn').addEventListener('click', () => {
    stopVoiceDictation();
    const transcribedText = document.getElementById('voiceTranscriptionResult').value.trim();
    if (transcribedText && activeVoiceTargetInput) {
      activeVoiceTargetInput.value = transcribedText;
      const detected = autoDetectCategory(transcribedText);
      if (detected) {
        if (activeVoiceTargetInput.id === 'familyTaskInput') {
          document.getElementById('familyCategorySelect').value = detected;
        } else if (activeVoiceTargetInput.id === 'personalTaskInput') {
          document.getElementById('personalCategorySelect').value = detected;
        }
      }
    }
    document.getElementById('voiceModal').classList.add('hidden');
    SoundFX.pop();
  });

  // Enter keys
  document.getElementById('familyTaskInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addFamilyTask();
  });
  document.getElementById('personalTaskInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addPersonalTask();
  });

  // Add buttons
  document.getElementById('addFamilyTaskBtn').addEventListener('click', addFamilyTask);
  document.getElementById('addPersonalTaskBtn').addEventListener('click', addPersonalTask);
  document.getElementById('addIdeaBtn').addEventListener('click', addIdeaNote);

  // Personal sub filter links
  document.querySelectorAll('#personalFilterBar .filter-link').forEach(link => {
    link.addEventListener('click', () => {
      document.querySelectorAll('#personalFilterBar .filter-link').forEach(c => c.classList.remove('active'));
      link.classList.add('active');
      SoundFX.click();
      renderPersonalTasks();
    });
  });

  // Color picker dots for ideas
  document.querySelectorAll('#ideaColorSelector .color-picker-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      document.querySelectorAll('#ideaColorSelector .color-picker-dot').forEach(d => d.classList.remove('active'));
      dot.classList.add('active');
      selectedIdeaColor = dot.dataset.color;
      SoundFX.click();
    });
  });

  // Pin toggle for idea
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
    showToast("completati rimossi");
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
    showToast("completati rimossi");
  });

  // Save member profile name in modal
  document.getElementById('saveMemberNameBtn').addEventListener('click', () => {
    const newName = document.getElementById('customMemberNameInput').value.trim();
    if (newName) {
      userProfile.name = newName;
      if (!dynamicFamilyMembers.includes(newName)) {
        dynamicFamilyMembers.push(newName);
      }
      saveLocalData();
      pushFamilyTasksToCloud();
      renderMemberFilterBar();
      showToast(`profilo salvato: ${newName}`);
      SoundFX.click();
    }
  });

  // Family code
  document.getElementById('saveFamilyCodeBtn').addEventListener('click', () => {
    const code = document.getElementById('familyCodeInput').value.trim().toUpperCase();
    if (!code) {
      showToast("inserisci un codice valido");
      return;
    }
    currentFamilyCode = code;
    saveLocalData();
    initFirebaseSync();
    document.getElementById('familySettingsModal').classList.add('hidden');
    SoundFX.pop();
    showToast(`collegato a ${code}`);
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

  // Themes
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

  // 15-Color WP8.1 Palette selection
  document.querySelectorAll('#accentPaletteGrid .palette-tile').forEach(tile => {
    tile.addEventListener('click', () => {
      themeSettings.accent = tile.dataset.accent;
      saveLocalData();
      applyTheme();
      SoundFX.click();
      showToast(`colore icona & app: ${tile.textContent}`);
    });
  });

  document.getElementById('toggleSoundBtn').addEventListener('click', () => {
    themeSettings.sound = !themeSettings.sound;
    saveLocalData();
    applyTheme();
    if (themeSettings.sound) SoundFX.click();
    showToast(themeSettings.sound ? "audio attivato" : "audio disattivato");
  });

  document.getElementById('toggleNotifBtn').addEventListener('click', toggleNotifications);

  // Convert Idea Modal
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
      priority: 'normale',
      addedBy: userProfile.name,
      completed: false,
      createdAt: Date.now()
    };
    familyTasks.unshift(newTask);
    pushFamilyTasksToCloud();
    document.getElementById('convertIdeaModal').classList.add('hidden');
    ideaPendingConversion = null;
    SoundFX.complete();
    showToast("convertito in attività della tribù");
    goToSlide(0);
    renderFamilyTasks();
  });

  document.getElementById('convertDestPersonalBtn').addEventListener('click', () => {
    if (!ideaPendingConversion) return;
    const newTask = {
      id: 'p_' + Date.now(),
      title: `${ideaPendingConversion.title}${ideaPendingConversion.content ? ': ' + ideaPendingConversion.content : ''}`,
      priority: 'media',
      dueDate: '',
      category: 'altro',
      completed: false,
      createdAt: Date.now()
    };
    personalTasks.unshift(newTask);
    saveLocalData();
    document.getElementById('convertIdeaModal').classList.add('hidden');
    ideaPendingConversion = null;
    SoundFX.complete();
    showToast("convertito in attività personale");
    goToSlide(1);
    renderPersonalTasks();
  });
}

// =============================================================================
// 15. INITIALIZATION
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {
  loadLocalData();
  applyTheme();
  setupSpeechRecognition();
  setupTouchSwipe();
  setupEventListeners();

  document.getElementById('familyCodeInput').value = currentFamilyCode;
  document.getElementById('customMemberNameInput').value = userProfile.name;

  renderMemberFilterBar();
  renderCategoryOptions();
  renderFamilyTasks();
  renderPersonalTasks();
  renderIdeasList();

  initFirebaseSync();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(err => {
      console.log('SW note:', err);
    });
  }
});
