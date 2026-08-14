/**
 * Tribù - Authentic Windows Phone 8.1 Metro UI Engine
 * Features:
 * - Brand 'tribù' Home Reset Button
 * - 2 Centered Application Bar Buttons ([+] & [🔄])
 * - 4 Horizontal Pivot Panorama Slides: [famiglia], [personale], [idee & note], [mappa]
 * - Privacy-First On-Demand GPS Location Sharing (Zero Background Battery Drain)
 * - Symmetrical Form Grid & Custom Category Border Colors
 * - Real-Time AppTito Cloud Backend & Multi-Device Sync
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

const APP_VERSION = "1.2.0";

let userProfile = {
  name: 'Papà'
};

let themeSettings = {
  mode: 'dark',
  accent: '#0050ef', // Official Lumia Cobalt
  sound: true,
  notifications: true
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
    title: 'Revisione tagliando auto',
    category: 'personale',
    priority: 'media',
    dueDate: '2026-08-25',
    dueTime: '09:30',
    reminder: '1d',
    completed: false,
    createdAt: Date.now() - 14400000
  },
  {
    id: 'p_task_2',
    title: 'Comprare regalo per anniversario',
    category: 'personale',
    priority: 'alta',
    dueDate: '',
    dueTime: '',
    reminder: 'none',
    completed: false,
    createdAt: Date.now() - 28800000
  }
];

let personalCategories = ['personale', 'lavoro', 'studio', 'sport', 'hobby'];

let ideasList = [
  {
    id: 'idea_1',
    title: 'Gita in montagna domenica',
    content: 'Andare al rifugio per pranzo, portare scarponcini e giacca a vento.',
    color: 'yellow',
    pinned: true,
    createdAt: Date.now() - 86400000
  },
  {
    id: 'idea_2',
    title: 'Film da vedere insieme',
    content: 'Inside Out 2, Dune Parte 2, Il Gladiatore 2',
    color: 'blue',
    pinned: false,
    createdAt: Date.now() - 172800000
  }
];

let familyLocations = {};

// Filter States
let activeFamilyCategory = 'all';
let activeFamilyMember = 'all';
let activePersonalCategory = 'all';
let activePersonalFilter = 'all';
let activeIdeaColorFilter = 'all';
let activeTabSlide = 0; // 0: Famiglia, 1: Personale, 2: Idee, 3: Mappa
let customizingCatName = null;

// Audio Synthesizer for Authentic Metro Clicks & Chimes
const SoundFX = {
  ctx: null,
  init() {
    if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
  },
  click() {
    if (!themeSettings.sound) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    } catch (e) {}
  },
  complete() {
    if (!themeSettings.sound) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, this.ctx.currentTime);
      osc.frequency.setValueAtTime(659.25, this.ctx.currentTime + 0.07);
      osc.frequency.setValueAtTime(783.99, this.ctx.currentTime + 0.14);
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.28);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.28);
    } catch (e) {}
  },
  pop() {
    if (!themeSettings.sound) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch (e) {}
  }
};

// =============================================================================
// 3. STORAGE ENGINE (Local & Cloud Sync)
// =============================================================================

function loadLocalState() {
  try {
    const savedUser = localStorage.getItem('tribu_user_profile');
    if (savedUser) userProfile = JSON.parse(savedUser);

    const savedTheme = localStorage.getItem('tribu_theme_settings');
    if (savedTheme) themeSettings = JSON.parse(savedTheme);

    const savedCode = localStorage.getItem('tribu_family_code');
    if (savedCode) currentFamilyCode = savedCode;

    const savedMembers = localStorage.getItem('tribu_dynamic_members');
    if (savedMembers) dynamicFamilyMembers = JSON.parse(savedMembers);

    const savedCatColors = localStorage.getItem('tribu_category_colors');
    if (savedCatColors) categoryColors = JSON.parse(savedCatColors);

    const savedCategories = localStorage.getItem('tribu_custom_categories');
    if (savedCategories) customCategories = JSON.parse(savedCategories);

    const savedFamily = localStorage.getItem('tribu_family_tasks');
    if (savedFamily) familyTasks = JSON.parse(savedFamily);

    const savedPersonal = localStorage.getItem('tribu_personal_tasks');
    if (savedPersonal) personalTasks = JSON.parse(savedPersonal);

    const savedIdeas = localStorage.getItem('tribu_ideas_list');
    if (savedIdeas) ideasList = JSON.parse(savedIdeas);

    const savedLocs = localStorage.getItem('tribu_family_locations');
    if (savedLocs) familyLocations = JSON.parse(savedLocs);
  } catch (e) {
    console.error("Local storage load error:", e);
  }
}

function saveLocalState() {
  try {
    localStorage.setItem('tribu_user_profile', JSON.stringify(userProfile));
    localStorage.setItem('tribu_theme_settings', JSON.stringify(themeSettings));
    localStorage.setItem('tribu_family_code', currentFamilyCode);
    localStorage.setItem('tribu_dynamic_members', JSON.stringify(dynamicFamilyMembers));
    localStorage.setItem('tribu_category_colors', JSON.stringify(categoryColors));
    localStorage.setItem('tribu_custom_categories', JSON.stringify(customCategories));
    localStorage.setItem('tribu_family_tasks', JSON.stringify(familyTasks));
    localStorage.setItem('tribu_personal_tasks', JSON.stringify(personalTasks));
    localStorage.setItem('tribu_ideas_list', JSON.stringify(ideasList));
    localStorage.setItem('tribu_family_locations', JSON.stringify(familyLocations));
  } catch (e) {
    console.error("Local storage save error:", e);
  }
}

// =============================================================================
// 4. FIREBASE CLOUD SYNC (AppTito Backend)
// =============================================================================

function initFirebaseSync() {
  if (!db) {
    console.log("Offline mode - using LocalStorage");
    return;
  }

  if (unsubscribeFamilyListener) {
    unsubscribeFamilyListener();
  }

  const docId = currentFamilyCode.toUpperCase().trim() || 'FAM-TITO';
  familyDocRef = db.collection('tribu_family_todos').doc(docId);

  unsubscribeFamilyListener = familyDocRef.onSnapshot(docSnap => {
    if (docSnap.exists) {
      const data = docSnap.data();
      if (data.tasks) {
        familyTasks = data.tasks;
      }
      if (data.members && Array.isArray(data.members)) {
        dynamicFamilyMembers = data.members;
      }
      if (data.categories && Array.isArray(data.categories)) {
        customCategories = data.categories;
      }
      if (data.categoryColors) {
        categoryColors = Object.assign({}, categoryColors, data.categoryColors);
      }
      if (data.locations) {
        familyLocations = Object.assign({}, familyLocations, data.locations);
      }
      saveLocalState();
      renderAllViews();
    } else {
      pushFamilyStateToCloud();
    }
  }, err => {
    console.warn("Firestore sync warning:", err);
  });
}

function pushFamilyStateToCloud() {
  if (!db || !familyDocRef) return;
  familyDocRef.set({
    familyCode: currentFamilyCode,
    updatedAt: Date.now(),
    updatedBy: userProfile.name,
    tasks: familyTasks,
    members: dynamicFamilyMembers,
    categories: customCategories,
    categoryColors: categoryColors,
    locations: familyLocations
  }, { merge: true }).catch(err => {
    console.warn("Firestore write error:", err);
  });
}

// =============================================================================
// 5. THEME & PALETTE SYSTEM
// =============================================================================

function applyTheme() {
  document.body.className = themeSettings.mode === 'light' ? 'theme-light' : 'theme-dark';
  document.documentElement.style.setProperty('--accent-color', themeSettings.accent);

  document.querySelectorAll('#accentPaletteGrid .palette-tile').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-accent') === themeSettings.accent);
  });

  const btnDark = document.getElementById('btnDarkMode');
  const btnLight = document.getElementById('btnLightMode');
  if (btnDark && btnLight) {
    btnDark.classList.toggle('active', themeSettings.mode === 'dark');
    btnLight.classList.toggle('active', themeSettings.mode === 'light');
  }

  const notifIcon = document.getElementById('headerNotifIcon');
  if (notifIcon) {
    notifIcon.className = themeSettings.notifications ? 'fa-solid fa-bell' : 'fa-solid fa-bell-slash';
  }

  const notifSheetIcon = document.getElementById('notifStatusIcon');
  const notifSheetText = document.getElementById('notifStatusText');
  if (notifSheetIcon && notifSheetText) {
    notifSheetIcon.className = themeSettings.notifications ? 'fa-solid fa-bell' : 'fa-solid fa-bell-slash';
    notifSheetText.textContent = themeSettings.notifications ? 'notifiche push & avvisi attivi' : 'notifiche disattivate';
  }

  const soundSheetIcon = document.getElementById('soundStatusIcon');
  const soundSheetText = document.getElementById('soundStatusText');
  if (soundSheetIcon && soundSheetText) {
    soundSheetIcon.className = themeSettings.sound ? 'fa-solid fa-volume-high' : 'fa-solid fa-volume-xmark';
    soundSheetText.textContent = themeSettings.sound ? 'effetti sonori attivi' : 'effetti sonori disattivati';
  }
}

// =============================================================================
// 6. GIANT WP8 PIVOT ENGINE & TOUCH SWIPE (4 Slides)
// =============================================================================

function goToSlide(index) {
  if (index < 0) index = 0;
  if (index > 3) index = 3;
  activeTabSlide = index;

  const track = document.getElementById('carouselTrack');
  if (track) {
    track.style.transform = `translateX(-${index * 25}%)`;
  }

  const pivotButtons = document.querySelectorAll('#pivotTitlesTrack .pivot-title-btn');
  pivotButtons.forEach((btn, i) => {
    btn.classList.toggle('active', i === index);
  });

  const scroller = document.getElementById('pivotTitlesScroller');
  if (scroller) {
    if (index === 0) scroller.scrollTo({ left: 0, behavior: 'smooth' });
    else if (index === 1) scroller.scrollTo({ left: 140, behavior: 'smooth' });
    else if (index === 2) scroller.scrollTo({ left: 280, behavior: 'smooth' });
    else if (index === 3) scroller.scrollTo({ left: 450, behavior: 'smooth' });
  }

  if (index === 3) {
    setTimeout(initLeafletMapIfNeeded, 200);
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
    // If touching inside map container, don't trigger carousel swipe
    if (e.target.closest('#wp8MapContainer')) return;
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
      if (diffX < 0 && activeTabSlide < 3) {
        goToSlide(activeTabSlide + 1);
      } else if (diffX > 0 && activeTabSlide > 0) {
        goToSlide(activeTabSlide - 1);
      }
    }
  }, { passive: true });
}

// =============================================================================
// 7. TAB 1: FAMIGLIA (Rendering & CRUD)
// =============================================================================

function renderFamilyMembersFilterBar() {
  const container = document.getElementById('familyMemberFilterBar');
  if (!container) return;

  let html = `<button class="filter-link ${activeFamilyMember === 'all' ? 'active' : ''}" data-member="all">tutti</button>`;
  dynamicFamilyMembers.forEach(mem => {
    html += `<button class="filter-link ${activeFamilyMember === mem ? 'active' : ''}" data-member="${mem}">${mem.toLowerCase()}</button>`;
  });
  container.innerHTML = html;

  container.querySelectorAll('.filter-link').forEach(btn => {
    btn.addEventListener('click', () => {
      activeFamilyMember = btn.getAttribute('data-member');
      renderFamilyMembersFilterBar();
      renderFamilyTasks();
      SoundFX.click();
    });
  });

  const select = document.getElementById('familyAssigneeSelect');
  if (select) {
    let selectHtml = `<option value="Tutti">chiunque</option>`;
    dynamicFamilyMembers.forEach(mem => {
      selectHtml += `<option value="${mem}">${mem}</option>`;
    });
    select.innerHTML = selectHtml;
  }
}

function renderFamilyCategoriesBar() {
  const container = document.getElementById('familyCategoryFilterBar');
  if (!container) return;

  let chipsHtml = `
    <button id="toggleFamilyAddBoxBtn" class="cat-chip-plus-first" title="Nuova attività per la tribù">
      <i class="fa-solid fa-plus"></i>
    </button>
    <button class="cat-chip ${activeFamilyCategory === 'all' ? 'active' : ''}" data-cat="all">tutte</button>
  `;

  customCategories.forEach(cat => {
    const color = categoryColors[cat] || 'var(--accent-color)';
    chipsHtml += `
      <button class="cat-chip ${activeFamilyCategory === cat ? 'active' : ''}" data-cat="${cat}" style="border-left: 3px solid ${color};">
        <span class="chip-color-dot" style="background:${color};"></span>
        ${cat}
      </button>
    `;
  });

  container.innerHTML = chipsHtml;

  document.getElementById('toggleFamilyAddBoxBtn').addEventListener('click', () => {
    const card = document.getElementById('familyInputCard');
    card.classList.toggle('hidden');
    if (!card.classList.contains('hidden')) {
      document.getElementById('familyTaskInput').focus();
    }
    SoundFX.click();
  });

  container.querySelectorAll('.cat-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      activeFamilyCategory = chip.getAttribute('data-cat');
      renderFamilyCategoriesBar();
      renderFamilyTasks();
      SoundFX.click();
    });

    let pressTimer = null;
    chip.addEventListener('touchstart', (e) => {
      const cat = chip.getAttribute('data-cat');
      if (cat === 'all') return;
      pressTimer = setTimeout(() => {
        openCategoryColorModal(cat);
      }, 600);
    }, { passive: true });

    chip.addEventListener('touchend', () => {
      clearTimeout(pressTimer);
    });

    chip.addEventListener('contextmenu', (e) => {
      const cat = chip.getAttribute('data-cat');
      if (cat !== 'all') {
        e.preventDefault();
        openCategoryColorModal(cat);
      }
    });
  });

  const select = document.getElementById('familyCategorySelect');
  if (select) {
    let selectHtml = '';
    customCategories.forEach(cat => {
      selectHtml += `<option value="${cat}">${cat}</option>`;
    });
    select.innerHTML = selectHtml;
  }
}

function renderFamilyTasks() {
  const list = document.getElementById('familyTasksList');
  const completedList = document.getElementById('familyCompletedList');
  const emptyState = document.getElementById('emptyFamilyState');
  const countEl = document.getElementById('familyCompletedCount');
  if (!list || !completedList) return;

  const active = [];
  const completed = [];

  familyTasks.forEach(task => {
    const matchCat = (activeFamilyCategory === 'all' || task.category === activeFamilyCategory);
    const matchMember = (activeFamilyMember === 'all' || task.assignee === 'Tutti' || task.assignee === activeFamilyMember);
    if (!matchCat || !matchMember) return;

    if (task.completed) completed.push(task);
    else active.push(task);
  });

  if (countEl) countEl.textContent = completed.length;

  if (active.length === 0 && completed.length === 0) {
    list.innerHTML = '';
    completedList.innerHTML = '';
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  }
  if (emptyState) emptyState.classList.add('hidden');

  list.innerHTML = active.map(task => buildTaskItemHTML(task, 'family')).join('');
  completedList.innerHTML = completed.map(task => buildTaskItemHTML(task, 'family')).join('');

  attachTaskEventHandlers('family');
}

function buildTaskItemHTML(task, type) {
  const catColor = categoryColors[task.category] || 'var(--accent-color)';
  const isUrgent = task.priority === 'urgente';

  let dateInfo = '';
  if (task.dueDate) {
    dateInfo = `<span class="meta-tag tag-schedule"><i class="fa-regular fa-clock"></i> ${task.dueDate} ${task.dueTime || ''}</span>`;
  }

  let assigneeBadge = '';
  if (type === 'family' && task.assignee) {
    assigneeBadge = `<span class="meta-tag tag-member"><i class="fa-regular fa-user"></i> ${task.assignee}</span>`;
  }

  return `
    <div class="wp8-task-item ${task.completed ? 'is-completed' : ''} ${isUrgent ? 'is-urgent' : ''}" data-id="${task.id}" style="border-left-color: ${catColor};">
      <button type="button" class="wp8-checkbox" aria-label="Completa compito">
        ${task.completed ? '<i class="fa-solid fa-check"></i>' : ''}
      </button>

      <div class="task-body-col">
        <div class="task-text">${escapeHtml(task.title)}</div>
        <div class="task-info-meta">
          <span class="meta-tag" style="color:${catColor}; font-weight:600;">● ${task.category}</span>
          ${assigneeBadge}
          ${isUrgent ? '<span class="meta-tag tag-urgent">🚨 urgente</span>' : ''}
          ${dateInfo}
        </div>
      </div>

      <div class="task-side-actions">
        ${type === 'personal' ? `
          <button type="button" class="share-to-family-link" title="Condividi con la tribù">
            <i class="fa-solid fa-share-nodes"></i> tribù
          </button>
        ` : ''}
        <button type="button" class="wp8-icon-action delete-action" title="Elimina">
          <i class="fa-regular fa-trash-can"></i>
        </button>
      </div>
    </div>
  `;
}

function attachTaskEventHandlers(type) {
  const root = type === 'family' ? document.getElementById('slideFamiglia') : document.getElementById('slidePersonale');
  if (!root) return;

  root.querySelectorAll('.wp8-task-item').forEach(item => {
    const taskId = item.getAttribute('data-id');

    const checkbox = item.querySelector('.wp8-checkbox');
    if (checkbox) {
      checkbox.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleTaskCompletion(taskId, type);
      });
    }

    const delBtn = item.querySelector('.delete-action');
    if (delBtn) {
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteTask(taskId, type);
      });
    }

    const shareBtn = item.querySelector('.share-to-family-link');
    if (shareBtn) {
      shareBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        sharePersonalTaskToFamily(taskId);
      });
    }
  });
}

function toggleTaskCompletion(taskId, type) {
  if (type === 'family') {
    const t = familyTasks.find(x => x.id === taskId);
    if (t) {
      t.completed = !t.completed;
      if (t.completed) SoundFX.complete();
      else SoundFX.click();
      saveLocalState();
      pushFamilyStateToCloud();
      renderFamilyTasks();
    }
  } else {
    const t = personalTasks.find(x => x.id === taskId);
    if (t) {
      t.completed = !t.completed;
      if (t.completed) SoundFX.complete();
      else SoundFX.click();
      saveLocalState();
      renderPersonalTasks();
    }
  }
}

function deleteTask(taskId, type) {
  if (type === 'family') {
    familyTasks = familyTasks.filter(x => x.id !== taskId);
    saveLocalState();
    pushFamilyStateToCloud();
    renderFamilyTasks();
  } else {
    personalTasks = personalTasks.filter(x => x.id !== taskId);
    saveLocalState();
    renderPersonalTasks();
  }
  SoundFX.pop();
  showToast("attività eliminata");
}

function addFamilyTaskFromForm() {
  const input = document.getElementById('familyTaskInput');
  const catSelect = document.getElementById('familyCategorySelect');
  const assigneeSelect = document.getElementById('familyAssigneeSelect');
  const prioritySelect = document.getElementById('familyPrioritySelect');
  const dateInput = document.getElementById('familyDueDateInput');
  const timeInput = document.getElementById('familyDueTimeInput');
  const reminderSelect = document.getElementById('familyReminderSelect');

  const text = input.value.trim();
  if (!text) {
    input.focus();
    return;
  }

  const newTask = {
    id: 'f_' + Date.now() + '_' + Math.floor(Math.random()*1000),
    title: text,
    category: catSelect ? catSelect.value : 'spesa',
    assignee: assigneeSelect ? assigneeSelect.value : 'Tutti',
    addedBy: userProfile.name,
    priority: prioritySelect ? prioritySelect.value : 'normale',
    dueDate: dateInput ? dateInput.value : '',
    dueTime: timeInput ? timeInput.value : '',
    reminder: reminderSelect ? reminderSelect.value : 'none',
    completed: false,
    createdAt: Date.now()
  };

  familyTasks.unshift(newTask);
  saveLocalState();
  pushFamilyStateToCloud();

  input.value = '';
  if (dateInput) dateInput.value = '';
  if (timeInput) timeInput.value = '';

  document.getElementById('familyInputCard').classList.add('hidden');
  renderFamilyTasks();
  SoundFX.complete();
  showToast("attività salvata per la tribù");
}

// =============================================================================
// 8. TAB 2: PERSONALE (Rendering & CRUD)
// =============================================================================

function renderPersonalCategoriesBar() {
  const container = document.getElementById('personalCategoryFilterBar');
  if (!container) return;

  let chipsHtml = `
    <button id="togglePersonalAddBoxBtn" class="cat-chip-plus-first" title="Nuova attività personale">
      <i class="fa-solid fa-plus"></i>
    </button>
    <button class="cat-chip ${activePersonalCategory === 'all' ? 'active' : ''}" data-cat="all">tutte</button>
  `;

  personalCategories.forEach(cat => {
    const color = categoryColors[cat] || 'var(--accent-color)';
    chipsHtml += `
      <button class="cat-chip ${activePersonalCategory === cat ? 'active' : ''}" data-cat="${cat}" style="border-left: 3px solid ${color};">
        <span class="chip-color-dot" style="background:${color};"></span>
        ${cat}
      </button>
    `;
  });

  container.innerHTML = chipsHtml;

  document.getElementById('togglePersonalAddBoxBtn').addEventListener('click', () => {
    const card = document.getElementById('personalInputCard');
    card.classList.toggle('hidden');
    if (!card.classList.contains('hidden')) {
      document.getElementById('personalTaskInput').focus();
    }
    SoundFX.click();
  });

  container.querySelectorAll('.cat-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      activePersonalCategory = chip.getAttribute('data-cat');
      renderPersonalCategoriesBar();
      renderPersonalTasks();
      SoundFX.click();
    });
  });

  const select = document.getElementById('personalCategorySelect');
  if (select) {
    let selectHtml = '';
    personalCategories.forEach(cat => {
      selectHtml += `<option value="${cat}">${cat}</option>`;
    });
    select.innerHTML = selectHtml;
  }
}

function renderPersonalTasks() {
  const list = document.getElementById('personalTasksList');
  const completedList = document.getElementById('personalCompletedList');
  const emptyState = document.getElementById('emptyPersonalState');
  const countEl = document.getElementById('personalCompletedCount');
  const activeCountEl = document.getElementById('personalActiveTotal');
  if (!list || !completedList) return;

  const todayStr = new Date().toISOString().split('T')[0];

  const active = [];
  const completed = [];

  personalTasks.forEach(task => {
    const matchCat = (activePersonalCategory === 'all' || task.category === activePersonalCategory);
    if (!matchCat) return;

    if (activePersonalFilter === 'oggi' && task.dueDate !== todayStr) return;
    if (activePersonalFilter === 'alta' && (task.priority !== 'alta' && task.priority !== 'urgente')) return;

    if (task.completed) completed.push(task);
    else active.push(task);
  });

  if (countEl) countEl.textContent = completed.length;
  if (activeCountEl) activeCountEl.textContent = personalTasks.filter(x => !x.completed).length;

  if (active.length === 0 && completed.length === 0) {
    list.innerHTML = '';
    completedList.innerHTML = '';
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  }
  if (emptyState) emptyState.classList.add('hidden');

  list.innerHTML = active.map(task => buildTaskItemHTML(task, 'personal')).join('');
  completedList.innerHTML = completed.map(task => buildTaskItemHTML(task, 'personal')).join('');

  attachTaskEventHandlers('personal');
}

function addPersonalTaskFromForm() {
  const input = document.getElementById('personalTaskInput');
  const catSelect = document.getElementById('personalCategorySelect');
  const prioritySelect = document.getElementById('personalPrioritySelect');
  const dateInput = document.getElementById('personalDueDateInput');
  const timeInput = document.getElementById('personalDueTimeInput');
  const reminderSelect = document.getElementById('personalReminderSelect');

  const text = input.value.trim();
  if (!text) {
    input.focus();
    return;
  }

  const newTask = {
    id: 'p_' + Date.now() + '_' + Math.floor(Math.random()*1000),
    title: text,
    category: catSelect ? catSelect.value : 'personale',
    priority: prioritySelect ? prioritySelect.value : 'normale',
    dueDate: dateInput ? dateInput.value : '',
    dueTime: timeInput ? timeInput.value : '',
    reminder: reminderSelect ? reminderSelect.value : 'none',
    completed: false,
    createdAt: Date.now()
  };

  personalTasks.unshift(newTask);
  saveLocalState();

  input.value = '';
  if (dateInput) dateInput.value = '';
  if (timeInput) timeInput.value = '';

  document.getElementById('personalInputCard').classList.add('hidden');
  renderPersonalTasks();
  SoundFX.complete();
  showToast("attività personale salvata");
}

function sharePersonalTaskToFamily(taskId) {
  const p = personalTasks.find(x => x.id === taskId);
  if (!p) return;

  const newFamilyTask = {
    id: 'f_' + Date.now() + '_' + Math.floor(Math.random()*1000),
    title: p.title,
    category: 'altro',
    assignee: 'Tutti',
    addedBy: userProfile.name,
    priority: p.priority || 'normale',
    dueDate: p.dueDate || '',
    dueTime: p.dueTime || '',
    reminder: p.reminder || 'none',
    completed: false,
    createdAt: Date.now()
  };

  familyTasks.unshift(newFamilyTask);
  saveLocalState();
  pushFamilyStateToCloud();
  renderFamilyTasks();
  SoundFX.complete();
  showToast("condivisa con la tribù!");
}

// =============================================================================
// 9. TAB 3: IDEE & NOTE (Rendering & CRUD)
// =============================================================================

function renderIdeas() {
  const grid = document.getElementById('ideasListGrid');
  const emptyState = document.getElementById('emptyIdeasState');
  const totalCountEl = document.getElementById('ideasTotalCount');
  if (!grid) return;

  let filtered = ideasList.filter(item => {
    if (activeIdeaColorFilter === 'all') return true;
    if (activeIdeaColorFilter === 'pinned') return item.pinned;
    return item.color === activeIdeaColorFilter;
  });

  filtered.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  if (totalCountEl) totalCountEl.textContent = ideasList.length;

  if (filtered.length === 0) {
    grid.innerHTML = '';
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  }
  if (emptyState) emptyState.classList.add('hidden');

  grid.innerHTML = filtered.map(idea => `
    <div class="wp8-metro-tile tile-${idea.color || 'yellow'} ${idea.pinned ? 'is-pinned' : ''}" data-id="${idea.id}">
      <div class="tile-top-row">
        <h4 class="tile-headline">${escapeHtml(idea.title || 'Appunto')}</h4>
        <button type="button" class="wp8-icon-action pin-idea-btn" title="${idea.pinned ? 'Sblocca' : 'Fissa'}">
          <i class="fa-solid fa-thumbtack tile-pin-icon" style="${idea.pinned ? 'opacity:1;' : 'opacity:0.25;'}"></i>
        </button>
      </div>

      <p class="tile-content-text">${escapeHtml(idea.content || '')}</p>

      <div class="tile-footer-row">
        <span class="tile-date-label">${formatDateShort(idea.createdAt)}</span>
        <div class="tile-actions">
          <button type="button" class="btn-convert-pill" title="Trasforma in To-Do">
            <i class="fa-solid fa-arrow-right"></i> to-do
          </button>
          <button type="button" class="wp8-icon-action delete-idea-btn" title="Elimina">
            <i class="fa-regular fa-trash-can"></i>
          </button>
        </div>
      </div>
    </div>
  `).join('');

  grid.querySelectorAll('.wp8-metro-tile').forEach(tile => {
    const id = tile.getAttribute('data-id');

    tile.querySelector('.pin-idea-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      togglePinIdea(id);
    });

    tile.querySelector('.delete-idea-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      deleteIdea(id);
    });

    tile.querySelector('.btn-convert-pill').addEventListener('click', (e) => {
      e.stopPropagation();
      openConvertIdeaModal(id);
    });
  });
}

function addIdeaFromForm() {
  const titleInput = document.getElementById('ideaTitleInput');
  const textInput = document.getElementById('ideaContentInput');
  const activeColorDot = document.querySelector('#ideaColorSelector .color-picker-dot.active');
  const pinBtn = document.getElementById('togglePinIdeaBtn');

  const title = titleInput.value.trim();
  const content = textInput.value.trim();
  if (!title && !content) {
    titleInput.focus();
    return;
  }

  const newIdea = {
    id: 'idea_' + Date.now(),
    title: title || 'Nuova idea',
    content: content,
    color: activeColorDot ? activeColorDot.getAttribute('data-color') : 'yellow',
    pinned: pinBtn.classList.contains('active'),
    createdAt: Date.now()
  };

  ideasList.unshift(newIdea);
  saveLocalState();

  titleInput.value = '';
  textInput.value = '';
  document.getElementById('ideasInputCard').classList.add('hidden');
  renderIdeas();
  SoundFX.complete();
  showToast("idea salvata");
}

function togglePinIdea(id) {
  const idea = ideasList.find(x => x.id === id);
  if (idea) {
    idea.pinned = !idea.pinned;
    saveLocalState();
    renderIdeas();
    SoundFX.click();
  }
}

function deleteIdea(id) {
  ideasList = ideasList.filter(x => x.id !== id);
  saveLocalState();
  renderIdeas();
  SoundFX.pop();
  showToast("idea eliminata");
}

let convertingIdeaId = null;
function openConvertIdeaModal(id) {
  convertingIdeaId = id;
  const idea = ideasList.find(x => x.id === id);
  if (!idea) return;

  document.getElementById('convertIdeaPreviewText').textContent = `"${idea.title} - ${idea.content}"`;
  document.getElementById('convertIdeaModal').classList.remove('hidden');
}

function convertIdeaToTask(target) {
  const idea = ideasList.find(x => x.id === convertingIdeaId);
  if (!idea) return;

  const title = idea.title + (idea.content ? ` (${idea.content})` : '');

  if (target === 'family') {
    const newTask = {
      id: 'f_' + Date.now(),
      title: title,
      category: 'altro',
      assignee: 'Tutti',
      addedBy: userProfile.name,
      priority: 'normale',
      dueDate: '',
      dueTime: '',
      reminder: 'none',
      completed: false,
      createdAt: Date.now()
    };
    familyTasks.unshift(newTask);
    saveLocalState();
    pushFamilyStateToCloud();
    renderFamilyTasks();
    showToast("convertito in to-do per la tribù");
  } else {
    const newTask = {
      id: 'p_' + Date.now(),
      title: title,
      category: 'personale',
      priority: 'normale',
      dueDate: '',
      dueTime: '',
      reminder: 'none',
      completed: false,
      createdAt: Date.now()
    };
    personalTasks.unshift(newTask);
    saveLocalState();
    renderPersonalTasks();
    showToast("convertito in to-do personale");
  }

  document.getElementById('convertIdeaModal').classList.add('hidden');
  SoundFX.complete();
}

// =============================================================================
// 10. TAB 4: MAPPA & PRIVACY-FIRST ON-DEMAND GPS SHARING
// =============================================================================

let familyLeafletMap = null;
let mapMarkers = {};

function initLeafletMapIfNeeded() {
  if (familyLeafletMap) {
    familyLeafletMap.invalidateSize();
    return;
  }

  const mapContainer = document.getElementById('familyLeafletMap');
  if (!mapContainer || typeof L === 'undefined') return;

  // Center on Italy or default coordinates
  familyLeafletMap = L.map('familyLeafletMap', {
    zoomControl: true,
    attributionControl: false
  }).setView([41.9028, 12.4964], 6);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19
  }).addTo(familyLeafletMap);

  renderFamilyMapMarkers();
}

function updateMyGPSLocation() {
  const statusLabel = document.getElementById('myLocationStatusLabel');
  if (statusLabel) statusLabel.textContent = "rilevamento GPS in corso...";
  showToast("rilevamento posizione GPS...");
  SoundFX.click();

  if (!navigator.geolocation) {
    if (statusLabel) statusLabel.textContent = "GPS non supportato";
    showToast("Geolocalizzazione non supportata su questo browser");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const accuracy = Math.round(position.coords.accuracy || 0);

      const locEntry = {
        lat: lat,
        lng: lng,
        accuracy: accuracy,
        updatedAt: Date.now(),
        updatedBy: userProfile.name
      };

      familyLocations[userProfile.name] = locEntry;
      saveLocalState();
      pushFamilyStateToCloud();

      if (statusLabel) {
        statusLabel.textContent = `aggiornata (${formatTimeAgo(Date.now())})`;
      }

      initLeafletMapIfNeeded();
      renderFamilyMapMarkers();

      if (familyLeafletMap) {
        familyLeafletMap.flyTo([lat, lng], 15, { duration: 1.2 });
      }

      SoundFX.complete();
      showToast("posizione aggiornata e condivisa!");
    },
    (error) => {
      console.warn("GPS Error:", error);
      if (statusLabel) statusLabel.textContent = "impossibile rilevare";
      showToast("Attiva il GPS e autorizza la posizione per condividere dove sei");
    },
    { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
  );
}

function renderFamilyMapMarkers() {
  const membersListContainer = document.getElementById('mapFamilyMembersList');
  if (!membersListContainer) return;

  let membersHtml = '';
  const bounds = [];

  dynamicFamilyMembers.forEach(member => {
    const loc = familyLocations[member];
    const isMe = (member === userProfile.name);
    const initial = member.charAt(0).toUpperCase();

    if (loc && loc.lat && loc.lng) {
      const timeStr = formatTimeAgo(loc.updatedAt);
      const coordsStr = `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`;

      membersHtml += `
        <div class="map-member-card" data-member="${member}" data-lat="${loc.lat}" data-lng="${loc.lng}">
          <div class="map-member-left">
            <div class="map-member-avatar">${initial}</div>
            <div class="map-member-info">
              <span class="map-member-name">${member} ${isMe ? '(tu)' : ''}</span>
              <span class="map-member-loc"><i class="fa-solid fa-location-dot"></i> ${coordsStr}</span>
              <span class="map-member-time">ultimo agg: ${timeStr}</span>
            </div>
          </div>
          <div class="map-member-right">
            <i class="fa-solid fa-crosshairs"></i>
          </div>
        </div>
      `;

      bounds.push([loc.lat, loc.lng]);

      // Add or update marker on Leaflet map
      if (familyLeafletMap && typeof L !== 'undefined') {
        const customIcon = L.divIcon({
          className: 'wp8-leaflet-marker',
          html: `<div style="background:var(--accent-color); color:#fff; width:34px; height:34px; border:2px solid #fff; display:flex; align-items:center; justify-content:center; font-weight:700; box-shadow:0 3px 10px rgba(0,0,0,0.6);">${initial}</div>`,
          iconSize: [34, 34],
          iconAnchor: [17, 17]
        });

        if (mapMarkers[member]) {
          mapMarkers[member].setLatLng([loc.lat, loc.lng]);
        } else {
          const marker = L.marker([loc.lat, loc.lng], { icon: customIcon }).addTo(familyLeafletMap);
          marker.bindPopup(`<strong>${member}</strong><br><small>Ultimo agg: ${timeStr}</small>`);
          mapMarkers[member] = marker;
        }
      }
    } else {
      membersHtml += `
        <div class="map-member-card" data-member="${member}">
          <div class="map-member-left">
            <div class="map-member-avatar" style="background:#555;">${initial}</div>
            <div class="map-member-info">
              <span class="map-member-name">${member} ${isMe ? '(tu)' : ''}</span>
              <span class="map-member-loc" style="color:var(--text-dim);">posizione non ancora aggiornata</span>
            </div>
          </div>
        </div>
      `;
    }
  });

  membersListContainer.innerHTML = membersHtml;

  membersListContainer.querySelectorAll('.map-member-card').forEach(card => {
    card.addEventListener('click', () => {
      const lat = parseFloat(card.getAttribute('data-lat'));
      const lng = parseFloat(card.getAttribute('data-lng'));
      const member = card.getAttribute('data-member');
      if (lat && lng && familyLeafletMap) {
        familyLeafletMap.flyTo([lat, lng], 16, { duration: 1 });
        if (mapMarkers[member]) {
          mapMarkers[member].openPopup();
        }
        SoundFX.click();
      }
    });
  });

  if (familyLeafletMap && bounds.length > 0) {
    if (bounds.length === 1) {
      familyLeafletMap.setView(bounds[0], 15);
    } else {
      familyLeafletMap.fitBounds(bounds, { padding: [40, 40] });
    }
  }
}

// =============================================================================
// 11. DYNAMIC MEMBERS & CLOUD CODE
// =============================================================================

function renderFamilySettingsModal() {
  const container = document.getElementById('dynamicFamilyMembersList');
  const codeInput = document.getElementById('familyCodeInput');
  const nameInput = document.getElementById('customMemberNameInput');
  if (!container) return;

  if (codeInput) codeInput.value = currentFamilyCode;
  if (nameInput) nameInput.value = userProfile.name;

  container.innerHTML = dynamicFamilyMembers.map(m => `
    <div class="member-row-item">
      <div class="member-row-left">
        <i class="fa-solid fa-user" style="color:var(--accent-color);"></i>
        <span>${m} ${m === userProfile.name ? '<strong>(tu)</strong>' : ''}</span>
      </div>
      <div class="member-row-actions">
        ${dynamicFamilyMembers.length > 1 ? `
          <button type="button" class="wp8-icon-action remove-dyn-member-btn" data-name="${m}" title="Rimuovi">
            <i class="fa-solid fa-xmark"></i>
          </button>
        ` : ''}
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.remove-dyn-member-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-name');
      dynamicFamilyMembers = dynamicFamilyMembers.filter(x => x !== target);
      saveLocalState();
      pushFamilyStateToCloud();
      renderFamilySettingsModal();
      renderFamilyMembersFilterBar();
      renderFamilyMapMarkers();
      SoundFX.pop();
    });
  });
}

function openCategoryColorModal(cat) {
  customizingCatName = cat;
  document.getElementById('customizingCategoryName').textContent = cat;
  const current = categoryColors[cat] || themeSettings.accent;

  document.querySelectorAll('#categoryColorPaletteGrid .palette-tile').forEach(tile => {
    tile.classList.toggle('active', tile.getAttribute('data-catcolor') === current);
  });

  document.getElementById('categoryColorModal').classList.remove('hidden');
}

// =============================================================================
// 12. GENERAL HELPERS & NOTIFICATIONS
// =============================================================================

function showToast(msg) {
  const toast = document.getElementById('metroToast');
  const text = document.getElementById('metroToastMessage');
  if (!toast || !text) return;

  text.textContent = msg;
  toast.classList.remove('hidden');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.classList.add('hidden');
  }, 2400);
}

function toggleNotifications() {
  themeSettings.notifications = !themeSettings.notifications;
  saveLocalState();
  applyTheme();
  SoundFX.click();
  showToast(themeSettings.notifications ? "notifiche attivate" : "notifiche disattivate");
}

function toggleSound() {
  themeSettings.sound = !themeSettings.sound;
  saveLocalState();
  applyTheme();
  SoundFX.click();
  showToast(themeSettings.sound ? "suoni attivati" : "suoni disattivati");
}

function resetToHome() {
  goToSlide(0);
  activeFamilyCategory = 'all';
  activeFamilyMember = 'all';
  document.getElementById('familyInputCard')?.classList.add('hidden');
  document.getElementById('personalInputCard')?.classList.add('hidden');
  document.getElementById('ideasInputCard')?.classList.add('hidden');
  renderFamilyCategoriesBar();
  renderFamilyMembersFilterBar();
  renderFamilyTasks();
  document.getElementById('slideFamiglia')?.scrollTo({ top: 0, behavior: 'smooth' });
  SoundFX.click();
}

function formatDateShort(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return `${d.getDate()}/${d.getMonth()+1}`;
}

function formatTimeAgo(ts) {
  if (!ts) return 'mai';
  const diffSec = Math.floor((Date.now() - ts) / 1000);
  if (diffSec < 60) return 'pochi secondi fa';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} min fa`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} ore fa`;
  return `${Math.floor(diffSec / 86400)} gg fa`;
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function renderAllViews() {
  renderFamilyMembersFilterBar();
  renderFamilyCategoriesBar();
  renderFamilyTasks();
  renderPersonalCategoriesBar();
  renderPersonalTasks();
  renderIdeas();
  renderFamilyMapMarkers();
}

// =============================================================================
// 13. DOM INITIALIZATION & EVENT WIRING
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {
  loadLocalState();
  applyTheme();
  initFirebaseSync();
  renderAllViews();
  setupTouchSwipe();

  // 1) 'tribù' Home Reset Button
  const brandHomeBtn = document.getElementById('brandHomeBtn');
  if (brandHomeBtn) {
    brandHomeBtn.addEventListener('click', resetToHome);
  }

  // 2) Header Action Buttons
  document.getElementById('headerNotifBtn').addEventListener('click', toggleNotifications);

  document.getElementById('themeToggleBtn').addEventListener('click', () => {
    document.getElementById('themeModal').classList.remove('hidden');
  });
  document.getElementById('closeThemeModalBtn').addEventListener('click', () => {
    document.getElementById('themeModal').classList.add('hidden');
  });
  document.getElementById('closeThemeModalFooterBtn').addEventListener('click', () => {
    document.getElementById('themeModal').classList.add('hidden');
  });

  // Check App Updates Button
  const updateBtn = document.getElementById('btnCheckAppUpdate');
  if (updateBtn) {
    updateBtn.addEventListener('click', () => {
      SoundFX.pop();
      showToast("verifica aggiornamenti...");
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => caches.delete(name));
        });
      }
      initFirebaseSync();
      setTimeout(() => {
        showToast(`Tribù v${APP_VERSION} - Versione più recente attiva!`);
      }, 900);
    });
  }

  // Family Members Modal
  document.getElementById('familySettingsBtn').addEventListener('click', () => {
    renderFamilySettingsModal();
    document.getElementById('familySettingsModal').classList.remove('hidden');
  });
  document.getElementById('closeFamilyModalBtn').addEventListener('click', () => {
    document.getElementById('familySettingsModal').classList.add('hidden');
  });
  document.getElementById('closeFamilyModalFooterBtn').addEventListener('click', () => {
    document.getElementById('familySettingsModal').classList.add('hidden');
  });

  // Save profile name
  document.getElementById('saveMemberNameBtn').addEventListener('click', () => {
    const input = document.getElementById('customMemberNameInput');
    const val = input.value.trim();
    if (val) {
      userProfile.name = val;
      if (!dynamicFamilyMembers.includes(val)) {
        dynamicFamilyMembers.push(val);
      }
      saveLocalState();
      pushFamilyStateToCloud();
      renderFamilySettingsModal();
      renderFamilyMembersFilterBar();
      renderFamilyMapMarkers();
      SoundFX.complete();
      showToast(`profilo salvato: ${val}`);
    }
  });

  // Save Cloud Code
  document.getElementById('saveFamilyCodeBtn').addEventListener('click', () => {
    const input = document.getElementById('familyCodeInput');
    const val = input.value.trim().toUpperCase();
    if (val) {
      currentFamilyCode = val;
      saveLocalState();
      initFirebaseSync();
      SoundFX.complete();
      showToast(`connesso al cloud: ${val}`);
    }
  });

  document.querySelectorAll('.code-preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const code = btn.getAttribute('data-code');
      document.getElementById('familyCodeInput').value = code;
      currentFamilyCode = code;
      saveLocalState();
      initFirebaseSync();
      SoundFX.complete();
      showToast(`codice impostato: ${code}`);
    });
  });

  document.getElementById('generateRandomCodeBtn').addEventListener('click', () => {
    const randomCode = 'TRIBU-' + Math.floor(1000 + Math.random() * 9000);
    document.getElementById('familyCodeInput').value = randomCode;
    currentFamilyCode = randomCode;
    saveLocalState();
    initFirebaseSync();
    SoundFX.complete();
    showToast(`nuovo codice: ${randomCode}`);
  });

  // Quick Add Member Modal
  document.getElementById('openAddMemberDialogBtn')?.addEventListener('click', () => {
    document.getElementById('addMemberModal').classList.remove('hidden');
    document.getElementById('newMemberNameInput').focus();
  });
  document.getElementById('addMemberFilterBtn')?.addEventListener('click', () => {
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
    const val = input.value.trim();
    if (val) {
      if (!dynamicFamilyMembers.includes(val)) {
        dynamicFamilyMembers.push(val);
        saveLocalState();
        pushFamilyStateToCloud();
        renderFamilyMembersFilterBar();
        renderFamilySettingsModal();
        renderFamilyMapMarkers();
      }
      input.value = '';
      document.getElementById('addMemberModal').classList.add('hidden');
      SoundFX.complete();
      showToast(`${val} aggiunto alla tribù`);
    }
  });

  document.querySelectorAll('#quickRoleChips .role-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.getElementById('newMemberNameInput').value = chip.getAttribute('data-role');
    });
  });

  // Pivot Tab Buttons
  document.querySelectorAll('#pivotTitlesTrack .pivot-title-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-index'), 10);
      goToSlide(idx);
    });
  });

  // Application Bar 2 Centered Buttons
  document.getElementById('appbarAddBtn').addEventListener('click', () => {
    if (activeTabSlide === 0) {
      const card = document.getElementById('familyInputCard');
      card.classList.toggle('hidden');
      if (!card.classList.contains('hidden')) document.getElementById('familyTaskInput').focus();
    } else if (activeTabSlide === 1) {
      const card = document.getElementById('personalInputCard');
      card.classList.toggle('hidden');
      if (!card.classList.contains('hidden')) document.getElementById('personalTaskInput').focus();
    } else if (activeTabSlide === 2) {
      const card = document.getElementById('ideasInputCard');
      card.classList.toggle('hidden');
      if (!card.classList.contains('hidden')) document.getElementById('ideaTitleInput').focus();
    } else if (activeTabSlide === 3) {
      updateMyGPSLocation();
    }
    SoundFX.click();
  });

  document.getElementById('appbarSyncBtn').addEventListener('click', () => {
    SoundFX.pop();
    showToast("sincronizzazione in corso...");
    initFirebaseSync();
    if (activeTabSlide === 3) {
      renderFamilyMapMarkers();
    }
  });

  // Family Tasks Add & Cancel
  document.getElementById('addFamilyTaskBtn').addEventListener('click', addFamilyTaskFromForm);
  document.getElementById('cancelFamilyTaskBtn').addEventListener('click', () => {
    document.getElementById('familyInputCard').classList.add('hidden');
  });
  document.getElementById('familyTaskInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addFamilyTaskFromForm();
  });

  // Personal Tasks Add & Cancel
  document.getElementById('addPersonalTaskBtn').addEventListener('click', addPersonalTaskFromForm);
  document.getElementById('cancelPersonalTaskBtn').addEventListener('click', () => {
    document.getElementById('personalInputCard').classList.add('hidden');
  });
  document.getElementById('personalTaskInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addPersonalTaskFromForm();
  });

  // Personal Filter Links
  document.querySelectorAll('#personalFilterBar .filter-link').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#personalFilterBar .filter-link').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activePersonalFilter = btn.getAttribute('data-filter');
      renderPersonalTasks();
      SoundFX.click();
    });
  });

  // Ideas Add & Cancel
  document.getElementById('toggleIdeasAddBoxBtn').addEventListener('click', () => {
    const card = document.getElementById('ideasInputCard');
    card.classList.toggle('hidden');
    if (!card.classList.contains('hidden')) document.getElementById('ideaTitleInput').focus();
    SoundFX.click();
  });
  document.getElementById('addIdeaBtn').addEventListener('click', addIdeaFromForm);
  document.getElementById('cancelIdeaBtn').addEventListener('click', () => {
    document.getElementById('ideasInputCard').classList.add('hidden');
  });

  document.querySelectorAll('#ideaColorSelector .color-picker-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      document.querySelectorAll('#ideaColorSelector .color-picker-dot').forEach(d => d.classList.remove('active'));
      dot.classList.add('active');
      SoundFX.click();
    });
  });

  document.getElementById('togglePinIdeaBtn').addEventListener('click', (e) => {
    e.currentTarget.classList.toggle('active');
    SoundFX.click();
  });

  document.querySelectorAll('#ideasCategoryFilterBar .cat-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#ideasCategoryFilterBar .cat-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeIdeaColorFilter = chip.getAttribute('data-color');
      renderIdeas();
      SoundFX.click();
    });
  });

  // GPS Map Buttons
  document.getElementById('btnUpdateMyGPS').addEventListener('click', updateMyGPSLocation);

  // Convert Idea Modal Listeners
  document.getElementById('closeConvertModalBtn').addEventListener('click', () => {
    document.getElementById('convertIdeaModal').classList.add('hidden');
  });
  document.getElementById('convertDestFamilyBtn').addEventListener('click', () => convertIdeaToTask('family'));
  document.getElementById('convertDestPersonalBtn').addEventListener('click', () => convertIdeaToTask('personal'));

  // Toggle Completed Sections
  document.getElementById('toggleFamilyCompleted').addEventListener('click', (e) => {
    if (e.target.closest('#clearFamilyCompletedBtn')) return;
    document.getElementById('familyCompletedList').classList.toggle('hidden');
    SoundFX.click();
  });
  document.getElementById('clearFamilyCompletedBtn').addEventListener('click', () => {
    familyTasks = familyTasks.filter(x => !x.completed);
    saveLocalState();
    pushFamilyStateToCloud();
    renderFamilyTasks();
    showToast("completate eliminate");
  });

  document.getElementById('togglePersonalCompleted').addEventListener('click', (e) => {
    if (e.target.closest('#clearPersonalCompletedBtn')) return;
    document.getElementById('personalCompletedList').classList.toggle('hidden');
    SoundFX.click();
  });
  document.getElementById('clearPersonalCompletedBtn').addEventListener('click', () => {
    personalTasks = personalTasks.filter(x => !x.completed);
    saveLocalState();
    renderPersonalTasks();
    showToast("completate personali eliminate");
  });

  // Category Color Modal
  document.querySelectorAll('#categoryColorPaletteGrid .palette-tile').forEach(tile => {
    tile.addEventListener('click', () => {
      const color = tile.getAttribute('data-catcolor');
      if (customizingCatName) {
        categoryColors[customizingCatName] = color;
        saveLocalState();
        pushFamilyStateToCloud();
        renderFamilyCategoriesBar();
        renderFamilyTasks();
        renderPersonalCategoriesBar();
        renderPersonalTasks();
        document.getElementById('categoryColorModal').classList.add('hidden');
        SoundFX.complete();
        showToast(`colore aggiornato per ${customizingCatName}`);
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
    if (customizingCatName) {
      delete categoryColors[customizingCatName];
      saveLocalState();
      pushFamilyStateToCloud();
      renderFamilyCategoriesBar();
      renderFamilyTasks();
      renderPersonalCategoriesBar();
      renderPersonalTasks();
      document.getElementById('categoryColorModal').classList.add('hidden');
      SoundFX.pop();
    }
  });

  // Theme Colors
  document.querySelectorAll('#accentPaletteGrid .palette-tile').forEach(tile => {
    tile.addEventListener('click', () => {
      themeSettings.accent = tile.getAttribute('data-accent');
      saveLocalState();
      applyTheme();
      renderFamilyTasks();
      renderPersonalTasks();
      SoundFX.click();
    });
  });

  document.getElementById('btnDarkMode').addEventListener('click', () => {
    themeSettings.mode = 'dark';
    saveLocalState();
    applyTheme();
    SoundFX.click();
  });
  document.getElementById('btnLightMode').addEventListener('click', () => {
    themeSettings.mode = 'light';
    saveLocalState();
    applyTheme();
    SoundFX.click();
  });
  document.getElementById('toggleNotifBtn').addEventListener('click', toggleNotifications);
  document.getElementById('toggleSoundBtn').addEventListener('click', toggleSound);
});
