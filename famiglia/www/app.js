/**
 * Tribù - Authentic Windows Phone 8.1 Metro UI Engine
 * Features:
 * - Multi-Tribe Switcher & Dynamic Home Brand Name
 * - QR Code Instant Family Sharing (Camera Scan)
 * - Private Member Aliases (Local Device-Only Nicknames)
 * - Custom Photo Uploads & Metro Emoji Avatars
 * - On-Demand Location Sharing with WhatsApp Ping & Cloud Request
 * - Pitch Black OLED & Official Lumia Smeraldo Accent
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
  name: 'Papà',
  avatar: '👨‍🦱'
};

let themeSettings = {
  mode: 'dark',
  accent: '#008a00', // Default Lumia Smeraldo
  sound: true,
  notifications: true
};

let currentFamilyCode = 'FAM-TITO';
let activeTribeName = 'tribù';

let savedTribes = [
  { name: 'Tribù Principale', code: 'FAM-TITO' }
];

let dynamicFamilyMembers = ['Papà'];
let memberAliases = {}; // Private nicknames on this smartphone
let memberAvatars = { 'Papà': '👨‍🦱' }; // Cloud avatars

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
let pingRequests = {};

// Filter States
let activeFamilyCategory = 'all';
let activeFamilyMember = 'all';
let activePersonalCategory = 'all';
let activePersonalFilter = 'all';
let activeIdeaColorFilter = 'all';
let activeTabSlide = 0; // 0: Famiglia, 1: Personale, 2: Idee, 3: Mappa
let customizingCatName = null;
let targetAliasMember = null;
let avatarTargetType = 'my'; // 'my' or specific member

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
// 3. STORAGE & ALIAS ENGINE
// =============================================================================

function loadLocalState() {
  try {
    const savedUser = localStorage.getItem('tribu_user_profile');
    if (savedUser) userProfile = JSON.parse(savedUser);

    const savedTheme = localStorage.getItem('tribu_theme_settings');
    if (savedTheme) themeSettings = JSON.parse(savedTheme);

    const savedCode = localStorage.getItem('tribu_family_code');
    if (savedCode) currentFamilyCode = savedCode;

    const savedTribeName = localStorage.getItem('tribu_active_name');
    if (savedTribeName) activeTribeName = savedTribeName;

    const savedTribesList = localStorage.getItem('tribu_saved_tribes_list');
    if (savedTribesList) savedTribes = JSON.parse(savedTribesList);

    const savedAliases = localStorage.getItem('tribu_member_aliases');
    if (savedAliases) memberAliases = JSON.parse(savedAliases);

    const savedAvatars = localStorage.getItem('tribu_member_avatars');
    if (savedAvatars) memberAvatars = JSON.parse(savedAvatars);

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
    localStorage.setItem('tribu_active_name', activeTribeName);
    localStorage.setItem('tribu_saved_tribes_list', JSON.stringify(savedTribes));
    localStorage.setItem('tribu_member_aliases', JSON.stringify(memberAliases));
    localStorage.setItem('tribu_member_avatars', JSON.stringify(memberAvatars));
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

function getMemberDisplayName(rawName) {
  if (!rawName) return '';
  return memberAliases[rawName] || rawName;
}

function getMemberAvatarHtml(memberName, size = 32) {
  const avatar = memberAvatars[memberName] || (memberName === userProfile.name ? userProfile.avatar : null) || '👤';
  if (avatar && avatar.startsWith('data:image')) {
    return `<div class="member-avatar-badge" style="width:${size}px; height:${size}px;"><img src="${avatar}" alt="${memberName}"></div>`;
  }
  return `<div class="member-avatar-badge" style="width:${size}px; height:${size}px;">${avatar || memberName.charAt(0).toUpperCase()}</div>`;
}

// =============================================================================
// 4. FIREBASE CLOUD SYNC & MULTI-TRIBE ENGINE
// =============================================================================

function checkUrlParamsForCode() {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  if (code) {
    const cleanCode = code.toUpperCase().trim();
    currentFamilyCode = cleanCode;
    activeTribeName = 'tribù ' + cleanCode;
    if (!savedTribes.find(t => t.code === cleanCode)) {
      savedTribes.push({ name: activeTribeName, code: cleanCode });
    }
    saveLocalState();
    showToast(`Connesso alla tribù ${cleanCode}!`);
  }
}

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
      if (data.tribeName && (!activeTribeName || activeTribeName === 'tribù')) {
        activeTribeName = data.tribeName;
      }
      if (data.tasks) {
        familyTasks = data.tasks;
      }
      if (data.members && Array.isArray(data.members)) {
        dynamicFamilyMembers = data.members;
      }
      if (data.avatars) {
        memberAvatars = Object.assign({}, memberAvatars, data.avatars);
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
      if (data.pings && data.pings[userProfile.name]) {
        const lastPing = data.pings[userProfile.name];
        if (Date.now() - lastPing.time < 300000) { // If pinged in last 5 mins
          updateMyGPSLocation(true);
        }
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
    tribeName: activeTribeName,
    updatedAt: Date.now(),
    updatedBy: userProfile.name,
    tasks: familyTasks,
    members: dynamicFamilyMembers,
    avatars: memberAvatars,
    categories: customCategories,
    categoryColors: categoryColors,
    locations: familyLocations
  }, { merge: true }).catch(err => {
    console.warn("Firestore write error:", err);
  });
}

// =============================================================================
// 5. THEME & HEADER BRAND
// =============================================================================

function applyTheme() {
  document.body.className = themeSettings.mode === 'light' ? 'theme-light' : 'theme-dark';
  document.documentElement.style.setProperty('--accent-color', themeSettings.accent);

  const brandEl = document.getElementById('appBrandKicker');
  if (brandEl) {
    brandEl.textContent = activeTribeName || 'tribù';
  }

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
// 6. GIANT WP8 PIVOT ENGINE (4 Slides)
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
// 7. TAB 1: FAMIGLIA (Rendering & CRUD with Aliases)
// =============================================================================

function renderFamilyMembersFilterBar() {
  const container = document.getElementById('familyMemberFilterBar');
  if (!container) return;

  let html = `<button class="filter-link ${activeFamilyMember === 'all' ? 'active' : ''}" data-member="all">tutti</button>`;
  dynamicFamilyMembers.forEach(mem => {
    const dispName = getMemberDisplayName(mem);
    const avatarHtml = getMemberAvatarHtml(mem, 20);
    html += `
      <button class="filter-link ${activeFamilyMember === mem ? 'active' : ''}" data-member="${mem}">
        ${avatarHtml}
        ${dispName.toLowerCase()}
      </button>
    `;
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
      const dispName = getMemberDisplayName(mem);
      selectHtml += `<option value="${mem}">${dispName}</option>`;
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
    const dispName = getMemberDisplayName(task.assignee);
    assigneeBadge = `<span class="meta-tag tag-member"><i class="fa-regular fa-user"></i> ${dispName}</span>`;
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
  showToast("attività salvata");
}

// =============================================================================
// 8. TAB 2: PERSONALE & TAB 3: IDEE
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
// 9. TAB 4: MAPPA & LOCATION REQUEST / WHATSAPP PING
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

  familyLeafletMap = L.map('familyLeafletMap', {
    zoomControl: true,
    attributionControl: false
  }).setView([41.9028, 12.4964], 6);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19
  }).addTo(familyLeafletMap);

  renderFamilyMapMarkers();
}

function updateMyGPSLocation(silent = false) {
  const statusLabel = document.getElementById('myLocationStatusLabel');
  if (!silent) {
    if (statusLabel) statusLabel.textContent = "rilevamento GPS...";
    showToast("rilevamento posizione GPS...");
    SoundFX.click();
  }

  if (!navigator.geolocation) {
    if (statusLabel) statusLabel.textContent = "GPS non supportato";
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

      if (!silent) {
        SoundFX.complete();
        showToast("posizione aggiornata e condivisa!");
      }
    },
    (error) => {
      console.warn("GPS Error:", error);
      if (statusLabel) statusLabel.textContent = "impossibile rilevare";
      if (!silent) showToast("Attiva il GPS per condividere dove sei");
    },
    { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
  );
}

let targetRequestMember = null;
function openRequestLocationModal(member) {
  targetRequestMember = member;
  const dispName = getMemberDisplayName(member);
  document.getElementById('requestLocMemberName').textContent = dispName;
  document.getElementById('requestLocationModal').classList.remove('hidden');
}

function renderFamilyMapMarkers() {
  const membersListContainer = document.getElementById('mapFamilyMembersList');
  if (!membersListContainer) return;

  let membersHtml = '';
  const bounds = [];

  dynamicFamilyMembers.forEach(member => {
    const loc = familyLocations[member];
    const isMe = (member === userProfile.name);
    const dispName = getMemberDisplayName(member);
    const avatarHtml = getMemberAvatarHtml(member, 38);

    if (loc && loc.lat && loc.lng) {
      const timeStr = formatTimeAgo(loc.updatedAt);
      const coordsStr = `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`;

      membersHtml += `
        <div class="map-member-card" data-member="${member}" data-lat="${loc.lat}" data-lng="${loc.lng}">
          <div class="map-member-left">
            ${avatarHtml}
            <div class="map-member-info">
              <span class="map-member-name">${dispName} ${isMe ? '(tu)' : ''}</span>
              <span class="map-member-loc"><i class="fa-solid fa-location-dot"></i> ${coordsStr}</span>
              <span class="map-member-time">ultimo agg: ${timeStr}</span>
            </div>
          </div>
          <div class="map-member-right">
            ${!isMe ? `
              <button type="button" class="btn-request-loc-pill request-ping-btn" data-member="${member}">
                richiedi
              </button>
            ` : ''}
            <i class="fa-solid fa-crosshairs"></i>
          </div>
        </div>
      `;

      bounds.push([loc.lat, loc.lng]);

      // Add or update marker on Leaflet map
      if (familyLeafletMap && typeof L !== 'undefined') {
        const customIcon = L.divIcon({
          className: 'wp8-leaflet-marker',
          html: `<div style="background:var(--accent-color); color:#fff; width:36px; height:36px; border:2px solid #fff; display:flex; align-items:center; justify-content:center; font-size:1.2rem; box-shadow:0 3px 10px rgba(0,0,0,0.6);">${memberAvatars[member] || dispName.charAt(0).toUpperCase()}</div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 18]
        });

        if (mapMarkers[member]) {
          mapMarkers[member].setLatLng([loc.lat, loc.lng]);
        } else {
          const marker = L.marker([loc.lat, loc.lng], { icon: customIcon }).addTo(familyLeafletMap);
          marker.bindPopup(`<strong>${dispName}</strong><br><small>Ultimo agg: ${timeStr}</small>`);
          mapMarkers[member] = marker;
        }
      }
    } else {
      membersHtml += `
        <div class="map-member-card" data-member="${member}">
          <div class="map-member-left">
            ${avatarHtml}
            <div class="map-member-info">
              <span class="map-member-name">${dispName} ${isMe ? '(tu)' : ''}</span>
              <span class="map-member-loc" style="color:var(--text-dim);">posizione non ancora aggiornata</span>
            </div>
          </div>
          <div class="map-member-right">
            ${!isMe ? `
              <button type="button" class="btn-request-loc-pill request-ping-btn" data-member="${member}">
                richiedi
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }
  });

  membersListContainer.innerHTML = membersHtml;

  membersListContainer.querySelectorAll('.request-ping-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const target = btn.getAttribute('data-member');
      openRequestLocationModal(target);
    });
  });

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
// 10. MULTI-TRIBE & MEMBER PROFILE MANAGEMENT
// =============================================================================

function renderFamilySettingsModal() {
  const container = document.getElementById('dynamicFamilyMembersList');
  const codeInput = document.getElementById('familyCodeInput');
  const nameInput = document.getElementById('customMemberNameInput');
  const activeTribeInput = document.getElementById('activeTribeNameInput');
  const myAvatarDisplay = document.getElementById('myAvatarDisplay');
  const tribesListContainer = document.getElementById('savedTribesList');
  if (!container) return;

  if (codeInput) codeInput.value = currentFamilyCode;
  if (nameInput) nameInput.value = userProfile.name;
  if (activeTribeInput) activeTribeInput.value = activeTribeName;

  if (myAvatarDisplay) {
    const av = userProfile.avatar || '👨‍🦱';
    if (av.startsWith('data:image')) {
      myAvatarDisplay.innerHTML = `<img src="${av}" style="width:100%;height:100%;object-fit:cover;">`;
    } else {
      myAvatarDisplay.textContent = av;
    }
  }

  // Render Saved Tribes List
  if (tribesListContainer) {
    tribesListContainer.innerHTML = savedTribes.map(tr => `
      <div class="tribe-item-card ${tr.code === currentFamilyCode ? 'is-active' : ''}" data-code="${tr.code}">
        <div>
          <span class="tribe-item-name">${tr.name}</span>
          <span class="tribe-item-code">(${tr.code})</span>
        </div>
        ${tr.code === currentFamilyCode ? '<span style="color:var(--accent-color);font-weight:700;">● attiva</span>' : '<button type="button" class="wp8-link-btn switch-tribe-btn" data-code="'+tr.code+'" data-name="'+tr.name+'">passa qui</button>'}
      </div>
    `).join('');

    tribesListContainer.querySelectorAll('.switch-tribe-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const code = btn.getAttribute('data-code');
        const name = btn.getAttribute('data-name');
        switchActiveTribe(code, name);
      });
    });
  }

  // Render Members List
  container.innerHTML = dynamicFamilyMembers.map(m => {
    const isMe = (m === userProfile.name);
    const alias = memberAliases[m];
    const avatarHtml = getMemberAvatarHtml(m, 28);

    return `
      <div class="member-row-item">
        <div class="member-row-left">
          ${avatarHtml}
          <div>
            <span>${m} ${isMe ? '<strong>(tu)</strong>' : ''}</span>
            ${alias ? `<div class="member-alias-tag">Soprannome tuo: "${alias}"</div>` : ''}
          </div>
        </div>
        <div class="member-row-actions">
          <button type="button" class="wp8-icon-action edit-alias-btn" data-name="${m}" title="Personalizza nome per te">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button type="button" class="wp8-icon-action change-member-avatar-btn" data-name="${m}" title="Cambia avatar/foto">
            <i class="fa-solid fa-face-smile"></i>
          </button>
          ${dynamicFamilyMembers.length > 1 && !isMe ? `
            <button type="button" class="wp8-icon-action remove-dyn-member-btn" data-name="${m}" title="Rimuovi">
              <i class="fa-solid fa-xmark"></i>
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.edit-alias-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      targetAliasMember = btn.getAttribute('data-name');
      document.getElementById('aliasTargetCloudName').textContent = targetAliasMember;
      document.getElementById('memberAliasInput').value = memberAliases[targetAliasMember] || '';
      document.getElementById('memberAliasModal').classList.remove('hidden');
    });
  });

  container.querySelectorAll('.change-member-avatar-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      avatarTargetType = btn.getAttribute('data-name');
      document.getElementById('avatarPickerModal').classList.remove('hidden');
    });
  });

  container.querySelectorAll('.remove-dyn-member-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-name');
      dynamicFamilyMembers = dynamicFamilyMembers.filter(x => x !== target);
      delete memberAvatars[target];
      delete memberAliases[target];
      saveLocalState();
      pushFamilyStateToCloud();
      renderFamilySettingsModal();
      renderFamilyMembersFilterBar();
      renderFamilyMapMarkers();
      SoundFX.pop();
    });
  });
}

function switchActiveTribe(code, name) {
  currentFamilyCode = code;
  activeTribeName = name;
  saveLocalState();
  applyTheme();
  initFirebaseSync();
  renderFamilySettingsModal();
  renderAllViews();
  SoundFX.complete();
  showToast(`Passato a: ${name}`);
}

function openCategoryColorModal(cat) {
  customizingCatName = cat;
  document.getElementById('customizingCategoryName').textContent = cat;
  const current = categoryColors[cat] || themeSettings.accent;

  document.querySelectorAll('#categoryColorPaletteGrid .palette-tile').forEach(tile => {
    tile.classList.toggle('active', tile.getAttribute('data-catcolor') === current);
  });

  document.getElementById('categoryColorModal')?.classList.remove('hidden');
}

// =============================================================================
// 10.5. AUTOMATIC GPS SHARING ENGINE (Every 15 Minutes / On Motion)
// =============================================================================

let autoGpsTimer = null;
let autoGpsWatchId = null;
let autoGpsEnabled = false;

function loadAutoGpsState() {
  try {
    autoGpsEnabled = (localStorage.getItem('tribu_auto_gps') === 'true');
    updateAutoGpsUi();
    if (autoGpsEnabled) {
      startAutoGpsSharing();
    }
  } catch (e) {}
}

function updateAutoGpsUi() {
  const statusEl = document.getElementById('autoGpsStatusText');
  const btn = document.getElementById('toggleAutoGpsBtn');
  if (statusEl) {
    statusEl.textContent = autoGpsEnabled ? 'ATTIVO' : 'NO';
    statusEl.style.color = autoGpsEnabled ? 'var(--accent-color)' : 'var(--text-dim)';
  }
  if (btn) {
    btn.classList.toggle('active', autoGpsEnabled);
  }
}

function toggleAutoGpsSharing() {
  autoGpsEnabled = !autoGpsEnabled;
  try {
    localStorage.setItem('tribu_auto_gps', autoGpsEnabled ? 'true' : 'false');
  } catch (e) {}
  updateAutoGpsUi();

  if (autoGpsEnabled) {
    startAutoGpsSharing();
    SoundFX.complete();
    showToast("condivisione GPS ogni 15 min attiva");
  } else {
    stopAutoGpsSharing();
    SoundFX.pop();
    showToast("condivisione automatica disattivata");
  }
}

function startAutoGpsSharing() {
  stopAutoGpsSharing();
  updateMyGPSLocation(true); // First silent GPS read

  // Timer interval: 15 minutes = 900000ms
  autoGpsTimer = setInterval(() => {
    updateMyGPSLocation(true);
  }, 15 * 60 * 1000);

  if (navigator.geolocation && navigator.geolocation.watchPosition) {
    autoGpsWatchId = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const last = familyLocations[userProfile.name];
        // If moved more than ~80 meters
        if (!last || Math.abs(last.lat - lat) > 0.0008 || Math.abs(last.lng - lng) > 0.0008) {
          updateMyGPSLocation(true);
        }
      },
      (err) => {
        console.warn("WatchPosition info:", err);
      },
      { enableHighAccuracy: false, maximumAge: 60000, timeout: 20000 }
    );
  }
}

function stopAutoGpsSharing() {
  if (autoGpsTimer) {
    clearInterval(autoGpsTimer);
    autoGpsTimer = null;
  }
  if (autoGpsWatchId !== null && navigator.geolocation) {
    navigator.geolocation.clearWatch(autoGpsWatchId);
    autoGpsWatchId = null;
  }
}

function openShareQRModal() {
  const qrBox = document.getElementById('qrCodeContainer');
  const qrName = document.getElementById('qrTribeName');
  const qrCode = document.getElementById('qrTribeCode');

  if (qrName) qrName.textContent = activeTribeName;
  if (qrCode) qrCode.textContent = currentFamilyCode;

  const appShareUrl = `https://feiluca85-svg.github.io/InfoHub/famiglia/?code=${encodeURIComponent(currentFamilyCode)}`;
  
  if (qrBox) {
    qrBox.innerHTML = '';
    let rendered = false;

    // 1) Try standard client-side vector QRCodeJS
    if (typeof QRCode !== 'undefined') {
      try {
        new QRCode(qrBox, {
          text: appShareUrl,
          width: 220,
          height: 220,
          colorDark: "#000000",
          colorLight: "#ffffff",
          correctLevel: QRCode.CorrectLevel.M
        });
        rendered = true;
      } catch (err) {
        console.warn("QRCodeJS generation error:", err);
      }
    }

    // 2) Fallback to direct QR image renderer
    if (!rendered || qrBox.children.length === 0) {
      const qrImg = document.createElement('img');
      qrImg.id = 'qrCodeImage';
      qrImg.alt = 'QR Code Condivisione Tribù';
      qrImg.style.width = '220px';
      qrImg.style.height = '220px';
      qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(appShareUrl)}`;
      qrBox.appendChild(qrImg);
    }
  }

  document.getElementById('shareQRModal')?.classList.remove('hidden');
  SoundFX.click();
}

// =============================================================================
// 11. GENERAL HELPERS & TOASTS
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
// 12. DOM INITIALIZATION & EVENT WIRING (NULL-SAFE)
// =============================================================================

function safeListen(id, event, callback) {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener(event, callback);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadLocalState();
  checkUrlParamsForCode();
  applyTheme();
  initFirebaseSync();
  loadAutoGpsState();
  renderAllViews();
  setupTouchSwipe();

  // 1) Brand Home Reset Button
  safeListen('brandHomeBtn', 'click', resetToHome);

  // 2) Header Buttons
  safeListen('headerNotifBtn', 'click', toggleNotifications);
  safeListen('themeToggleBtn', 'click', () => {
    document.getElementById('themeModal')?.classList.remove('hidden');
  });
  safeListen('closeThemeModalBtn', 'click', () => {
    document.getElementById('themeModal')?.classList.add('hidden');
  });
  safeListen('closeThemeModalFooterBtn', 'click', () => {
    document.getElementById('themeModal')?.classList.add('hidden');
  });

  // Auto GPS Sharing
  safeListen('toggleAutoGpsBtn', 'click', toggleAutoGpsSharing);

  // QR Code Share
  safeListen('btnOpenShareQRModal', 'click', () => {
    document.getElementById('themeModal')?.classList.add('hidden');
    openShareQRModal();
  });
  safeListen('closeShareQRModalBtn', 'click', () => {
    document.getElementById('shareQRModal')?.classList.add('hidden');
  });
  safeListen('closeShareQRFooterBtn', 'click', () => {
    document.getElementById('shareQRModal')?.classList.add('hidden');
  });
  safeListen('btnCopyShareLink', 'click', () => {
    const link = `https://feiluca85-svg.github.io/InfoHub/famiglia/?code=${encodeURIComponent(currentFamilyCode)}`;
    navigator.clipboard.writeText(link).then(() => {
      showToast("link copiato negli appunti!");
      SoundFX.complete();
    }).catch(() => {
      showToast(link);
    });
  });

  // Family / Multi-Tribe Settings Modal
  safeListen('familySettingsBtn', 'click', () => {
    renderFamilySettingsModal();
    document.getElementById('familySettingsModal')?.classList.remove('hidden');
  });
  safeListen('closeFamilyModalBtn', 'click', () => {
    document.getElementById('familySettingsModal')?.classList.add('hidden');
  });
  safeListen('closeFamilyModalFooterBtn', 'click', () => {
    document.getElementById('familySettingsModal')?.classList.add('hidden');
  });

  // Save Tribe Name
  safeListen('saveTribeNameBtn', 'click', () => {
    const input = document.getElementById('activeTribeNameInput');
    const val = input ? input.value.trim() : '';
    if (val) {
      activeTribeName = val;
      const tObj = savedTribes.find(t => t.code === currentFamilyCode);
      if (tObj) tObj.name = val;
      saveLocalState();
      pushFamilyStateToCloud();
      applyTheme();
      renderFamilySettingsModal();
      SoundFX.complete();
      showToast(`nome tribù aggiornato in: ${val}`);
    }
  });

  // Create New Tribe Modal
  safeListen('btnOpenCreateTribeModal', 'click', () => {
    const nameInput = document.getElementById('newTribeNameInput');
    const codeInput = document.getElementById('newTribeCodeInput');
    if (nameInput) nameInput.value = '';
    if (codeInput) codeInput.value = 'TRIBU-' + Math.floor(1000 + Math.random()*9000);
    document.getElementById('createTribeModal')?.classList.remove('hidden');
  });
  safeListen('closeCreateTribeModalBtn', 'click', () => {
    document.getElementById('createTribeModal')?.classList.add('hidden');
  });
  safeListen('cancelCreateTribeBtn', 'click', () => {
    document.getElementById('createTribeModal')?.classList.add('hidden');
  });
  safeListen('confirmCreateTribeBtn', 'click', () => {
    const nameInput = document.getElementById('newTribeNameInput');
    const codeInput = document.getElementById('newTribeCodeInput');
    const name = nameInput ? nameInput.value.trim() || 'Nuova Tribù' : 'Nuova Tribù';
    const code = codeInput ? codeInput.value.trim().toUpperCase() || ('TRIBU-' + Math.floor(1000 + Math.random()*9000)) : ('TRIBU-' + Math.floor(1000 + Math.random()*9000));

    if (!savedTribes.find(t => t.code === code)) {
      savedTribes.push({ name: name, code: code });
    }
    document.getElementById('createTribeModal')?.classList.add('hidden');
    switchActiveTribe(code, name);
  });

  // Save User Profile Name
  safeListen('saveMemberNameBtn', 'click', () => {
    const input = document.getElementById('customMemberNameInput');
    const val = input ? input.value.trim() : '';
    if (val) {
      userProfile.name = val;
      if (!dynamicFamilyMembers.includes(val)) {
        dynamicFamilyMembers.push(val);
      }
      memberAvatars[val] = userProfile.avatar || '👨‍🦱';
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
  safeListen('saveFamilyCodeBtn', 'click', () => {
    const input = document.getElementById('familyCodeInput');
    const val = input ? input.value.trim().toUpperCase() : '';
    if (val) {
      currentFamilyCode = val;
      const found = savedTribes.find(t => t.code === val);
      if (!found) {
        savedTribes.push({ name: 'Tribù ' + val, code: val });
        activeTribeName = 'tribù ' + val;
      }
      saveLocalState();
      applyTheme();
      initFirebaseSync();
      renderFamilySettingsModal();
      SoundFX.complete();
      showToast(`collegato al codice: ${val}`);
    }
  });

  // Alias Modal
  safeListen('closeMemberAliasModalBtn', 'click', () => {
    document.getElementById('memberAliasModal')?.classList.add('hidden');
  });
  safeListen('saveMemberAliasBtn', 'click', () => {
    const input = document.getElementById('memberAliasInput');
    const val = input ? input.value.trim() : '';
    if (targetAliasMember) {
      if (val) {
        memberAliases[targetAliasMember] = val;
      } else {
        delete memberAliases[targetAliasMember];
      }
      saveLocalState();
      renderFamilySettingsModal();
      renderFamilyMembersFilterBar();
      renderFamilyTasks();
      renderFamilyMapMarkers();
      document.getElementById('memberAliasModal')?.classList.add('hidden');
      SoundFX.complete();
      showToast("soprannome privato salvato");
    }
  });
  safeListen('resetMemberAliasBtn', 'click', () => {
    if (targetAliasMember) {
      delete memberAliases[targetAliasMember];
      saveLocalState();
      renderFamilySettingsModal();
      renderFamilyMembersFilterBar();
      renderFamilyTasks();
      renderFamilyMapMarkers();
      document.getElementById('memberAliasModal')?.classList.add('hidden');
      SoundFX.pop();
    }
  });

  // Avatar Picker Modal
  safeListen('btnChangeMyAvatar', 'click', () => {
    avatarTargetType = 'my';
    document.getElementById('avatarPickerModal')?.classList.remove('hidden');
  });
  safeListen('closeAvatarPickerModalBtn', 'click', () => {
    document.getElementById('avatarPickerModal')?.classList.add('hidden');
  });
  safeListen('cancelAvatarPickerBtn', 'click', () => {
    document.getElementById('avatarPickerModal')?.classList.add('hidden');
  });

  document.querySelectorAll('#avatarEmojisGrid .avatar-emoji-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const emoji = btn.getAttribute('data-avatar');
      if (avatarTargetType === 'my') {
        userProfile.avatar = emoji;
        memberAvatars[userProfile.name] = emoji;
      } else {
        memberAvatars[avatarTargetType] = emoji;
      }
      saveLocalState();
      pushFamilyStateToCloud();
      renderFamilySettingsModal();
      renderFamilyMembersFilterBar();
      renderFamilyMapMarkers();
      document.getElementById('avatarPickerModal')?.classList.add('hidden');
      SoundFX.complete();
      showToast("avatar aggiornato!");
    });
  });

  // Photo Upload Handler (compresses image to thumbnail for lightweight cloud sync)
  safeListen('btnUploadPhotoAvatar', 'click', () => {
    document.getElementById('avatarPhotoFileInput')?.click();
  });
  const fileInput = document.getElementById('avatarPhotoFileInput');
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 96;
          let w = img.width;
          let h = img.height;
          if (w > h) {
            h = Math.round(h * maxDim / w);
            w = maxDim;
          } else {
            w = Math.round(w * maxDim / h);
            h = maxDim;
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

          if (avatarTargetType === 'my') {
            userProfile.avatar = dataUrl;
            memberAvatars[userProfile.name] = dataUrl;
          } else {
            memberAvatars[avatarTargetType] = dataUrl;
          }

          saveLocalState();
          pushFamilyStateToCloud();
          renderFamilySettingsModal();
          renderFamilyMembersFilterBar();
          renderFamilyMapMarkers();
          document.getElementById('avatarPickerModal')?.classList.add('hidden');
          SoundFX.complete();
          showToast("foto caricata con successo!");
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  // Request Location / Ping Modal
  safeListen('closeRequestLocationModalBtn', 'click', () => {
    document.getElementById('requestLocationModal')?.classList.add('hidden');
  });
  safeListen('closeRequestLocationFooterBtn', 'click', () => {
    document.getElementById('requestLocationModal')?.classList.add('hidden');
  });
  safeListen('btnSendCloudPing', 'click', () => {
    if (targetRequestMember) {
      if (!pingRequests) pingRequests = {};
      pingRequests[targetRequestMember] = { from: userProfile.name, time: Date.now() };
      if (db && familyDocRef) {
        familyDocRef.set({ pings: pingRequests }, { merge: true });
      }
      document.getElementById('requestLocationModal')?.classList.add('hidden');
      SoundFX.complete();
      showToast(`notifica inviata a ${getMemberDisplayName(targetRequestMember)}!`);
    }
  });
  safeListen('btnSendWhatsAppReminder', 'click', () => {
    if (targetRequestMember) {
      const dispName = getMemberDisplayName(targetRequestMember);
      const appUrl = `https://feiluca85-svg.github.io/InfoHub/famiglia/?code=${encodeURIComponent(currentFamilyCode)}`;
      const msg = `Ciao ${dispName}! Apri Tribù per aggiornare la tua posizione sulla mappa di famiglia: ${appUrl}`;
      const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
      window.open(waUrl, '_blank');
      document.getElementById('requestLocationModal')?.classList.add('hidden');
      SoundFX.complete();
    }
  });

  // Quick Add Member
  safeListen('openAddMemberDialogBtn', 'click', () => {
    document.getElementById('addMemberModal')?.classList.remove('hidden');
    document.getElementById('newMemberNameInput')?.focus();
  });
  safeListen('addMemberFilterBtn', 'click', () => {
    document.getElementById('addMemberModal')?.classList.remove('hidden');
    document.getElementById('newMemberNameInput')?.focus();
  });
  safeListen('closeAddMemberModalBtn', 'click', () => {
    document.getElementById('addMemberModal')?.classList.add('hidden');
  });
  safeListen('cancelAddMemberBtn', 'click', () => {
    document.getElementById('addMemberModal')?.classList.add('hidden');
  });
  safeListen('confirmAddMemberBtn', 'click', () => {
    const input = document.getElementById('newMemberNameInput');
    const val = input ? input.value.trim() : '';
    if (val) {
      if (!dynamicFamilyMembers.includes(val)) {
        dynamicFamilyMembers.push(val);
        memberAvatars[val] = '👤';
        saveLocalState();
        pushFamilyStateToCloud();
        renderFamilyMembersFilterBar();
        renderFamilySettingsModal();
        renderFamilyMapMarkers();
      }
      if (input) input.value = '';
      document.getElementById('addMemberModal')?.classList.add('hidden');
      SoundFX.complete();
      showToast(`${val} aggiunto alla tribù`);
    }
  });

  document.querySelectorAll('#quickRoleChips .role-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const input = document.getElementById('newMemberNameInput');
      if (input) input.value = chip.getAttribute('data-role');
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
  safeListen('appbarAddBtn', 'click', () => {
    if (activeTabSlide === 0) {
      const card = document.getElementById('familyInputCard');
      if (card) {
        card.classList.toggle('hidden');
        if (!card.classList.contains('hidden')) document.getElementById('familyTaskInput')?.focus();
      }
    } else if (activeTabSlide === 1) {
      const card = document.getElementById('personalInputCard');
      if (card) {
        card.classList.toggle('hidden');
        if (!card.classList.contains('hidden')) document.getElementById('personalTaskInput')?.focus();
      }
    } else if (activeTabSlide === 2) {
      const card = document.getElementById('ideasInputCard');
      if (card) {
        card.classList.toggle('hidden');
        if (!card.classList.contains('hidden')) document.getElementById('ideaTitleInput')?.focus();
      }
    } else if (activeTabSlide === 3) {
      updateMyGPSLocation();
    }
    SoundFX.click();
  });

  safeListen('appbarSyncBtn', 'click', () => {
    SoundFX.pop();
    showToast("sincronizzazione in corso...");
    initFirebaseSync();
    if (activeTabSlide === 3) {
      renderFamilyMapMarkers();
    }
  });

  // Form Submissions
  safeListen('addFamilyTaskBtn', 'click', addFamilyTaskFromForm);
  safeListen('cancelFamilyTaskBtn', 'click', () => {
    document.getElementById('familyInputCard')?.classList.add('hidden');
  });
  const fTaskInp = document.getElementById('familyTaskInput');
  if (fTaskInp) {
    fTaskInp.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') addFamilyTaskFromForm();
    });
  }

  safeListen('addPersonalTaskBtn', 'click', addPersonalTaskFromForm);
  safeListen('cancelPersonalTaskBtn', 'click', () => {
    document.getElementById('personalInputCard')?.classList.add('hidden');
  });
  const pTaskInp = document.getElementById('personalTaskInput');
  if (pTaskInp) {
    pTaskInp.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') addPersonalTaskFromForm();
    });
  }

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

  // Ideas Form & Actions
  safeListen('toggleIdeasAddBoxBtn', 'click', () => {
    const card = document.getElementById('ideasInputCard');
    if (card) {
      card.classList.toggle('hidden');
      if (!card.classList.contains('hidden')) document.getElementById('ideaTitleInput')?.focus();
    }
    SoundFX.click();
  });
  safeListen('addIdeaBtn', 'click', addIdeaFromForm);
  safeListen('cancelIdeaBtn', 'click', () => {
    document.getElementById('ideasInputCard')?.classList.add('hidden');
  });

  document.querySelectorAll('#ideaColorSelector .color-picker-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      document.querySelectorAll('#ideaColorSelector .color-picker-dot').forEach(d => d.classList.remove('active'));
      dot.classList.add('active');
      SoundFX.click();
    });
  });

  safeListen('togglePinIdeaBtn', 'click', (e) => {
    e.currentTarget?.classList.toggle('active');
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
  safeListen('btnUpdateMyGPS', 'click', () => updateMyGPSLocation(false));

  // Convert Idea Modal
  safeListen('closeConvertModalBtn', 'click', () => {
    document.getElementById('convertIdeaModal')?.classList.add('hidden');
  });
  safeListen('convertDestFamilyBtn', 'click', () => convertIdeaToTask('family'));
  safeListen('convertDestPersonalBtn', 'click', () => convertIdeaToTask('personal'));

  // Toggle Completed
  safeListen('toggleFamilyCompleted', 'click', (e) => {
    if (e.target.closest('#clearFamilyCompletedBtn')) return;
    document.getElementById('familyCompletedList')?.classList.toggle('hidden');
    SoundFX.click();
  });
  safeListen('clearFamilyCompletedBtn', 'click', () => {
    familyTasks = familyTasks.filter(x => !x.completed);
    saveLocalState();
    pushFamilyStateToCloud();
    renderFamilyTasks();
    showToast("completate eliminate");
  });

  safeListen('togglePersonalCompleted', 'click', (e) => {
    if (e.target.closest('#clearPersonalCompletedBtn')) return;
    document.getElementById('personalCompletedList')?.classList.toggle('hidden');
    SoundFX.click();
  });
  safeListen('clearPersonalCompletedBtn', 'click', () => {
    personalTasks = personalTasks.filter(x => !x.completed);
    saveLocalState();
    renderPersonalTasks();
    showToast("completate personali eliminate");
  });

  // Category Colors
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
        document.getElementById('categoryColorModal')?.classList.add('hidden');
        SoundFX.complete();
        showToast(`colore salvato`);
      }
    });
  });
  safeListen('closeCategoryColorModalBtn', 'click', () => {
    document.getElementById('categoryColorModal')?.classList.add('hidden');
  });
  safeListen('closeCategoryColorModalFooterBtn', 'click', () => {
    document.getElementById('categoryColorModal')?.classList.add('hidden');
  });
  safeListen('resetCategoryColorBtn', 'click', () => {
    if (customizingCatName) {
      delete categoryColors[customizingCatName];
      saveLocalState();
      pushFamilyStateToCloud();
      renderFamilyCategoriesBar();
      renderFamilyTasks();
      renderPersonalCategoriesBar();
      renderPersonalTasks();
      document.getElementById('categoryColorModal')?.classList.add('hidden');
      SoundFX.pop();
    }
  });

  // Theme Accent Swatches
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

  safeListen('btnDarkMode', 'click', () => {
    themeSettings.mode = 'dark';
    saveLocalState();
    applyTheme();
    SoundFX.click();
  });
  safeListen('btnLightMode', 'click', () => {
    themeSettings.mode = 'light';
    saveLocalState();
    applyTheme();
    SoundFX.click();
  });
  safeListen('toggleNotifBtn', 'click', toggleNotifications);
  safeListen('toggleSoundBtn', 'click', toggleSound);
});

