// InfoHub - Application Logic

const DEFAULT_SITES = [
  {
    id: 'dday',
    name: 'DDay.it',
    category: 'tech',
    feedUrl: 'https://www.dday.it/rss',
    siteUrl: 'https://www.dday.it',
    color: '#38bdf8',
    icon: 'D'
  },
  {
    id: 'hdblog',
    name: 'HDblog.it',
    category: 'tech',
    feedUrl: 'https://www.hdblog.it/feed/',
    siteUrl: 'https://www.hdblog.it',
    color: '#06b6d4',
    icon: 'H'
  },
  {
    id: 'smartworld',
    name: 'SmartWorld.it',
    category: 'tech',
    feedUrl: 'https://www.smartworld.it/feed',
    siteUrl: 'https://www.smartworld.it',
    color: '#a855f7',
    icon: 'S'
  },
  {
    id: 'formulapassion',
    name: 'FormulaPassion.it',
    category: 'motorsport',
    feedUrl: 'https://www.formulapassion.it/feed',
    siteUrl: 'https://www.formulapassion.it',
    color: '#ef4444',
    icon: 'F'
  },
  {
    id: 'motorsport',
    name: 'Motorsport.it',
    category: 'motorsport',
    feedUrl: 'https://it.motorsport.com/rss/all/news/',
    siteUrl: 'https://it.motorsport.com',
    color: '#f97316',
    icon: 'M'
  }
];

let SITES_CONFIG = JSON.parse(localStorage.getItem('infohub_sites')) || DEFAULT_SITES;

function saveSitesConfig() {
  localStorage.setItem('infohub_sites', JSON.stringify(SITES_CONFIG));
}

// Weather State
const DEFAULT_WEATHER_CITIES = [
  { id: 'roma', name: 'Roma', lat: 41.9028, lon: 12.4964 }
];
let WEATHER_CITIES = JSON.parse(localStorage.getItem('infohub_weather_cities')) || DEFAULT_WEATHER_CITIES;
let activeWeatherCity = WEATHER_CITIES[0];

function saveWeatherCities() {
  localStorage.setItem('infohub_weather_cities', JSON.stringify(WEATHER_CITIES));
}

// WP8 Metro Start Screen Tiles Config with authentic SVG icons & Ochre Accent option
const DEFAULT_METRO_TILES = [
  { id: 'clock', type: 'clock', title: 'orologio', size: 'tile-wide', color: 'accent-orange' },
  { id: 'calendar', type: 'calendar', title: 'calendario', size: 'tile-medium', color: 'accent-green' },
  { id: 'weather', type: 'weather', title: 'meteo', size: 'tile-medium', color: 'accent-blue' },
  { id: 'news', type: 'news', title: 'ultime notizie', size: 'tile-wide', color: 'accent-purple' },
  { 
    id: 'phone', type: 'shortcut', title: 'telefono', action: 'tel:', size: 'tile-medium', color: 'accent-blue',
    iconSvg: `<svg viewBox="0 0 24 24" width="38" height="38" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>`
  },
  { 
    id: 'messages', type: 'shortcut', title: 'messaggi', action: 'sms:', size: 'tile-medium', color: 'accent-ochre',
    iconSvg: `<svg viewBox="0 0 24 24" width="38" height="38" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`
  },
  { 
    id: 'photos', type: 'shortcut', title: 'foto', action: 'photos', size: 'tile-medium', color: 'accent-yellow',
    iconSvg: `<svg viewBox="0 0 24 24" width="38" height="38" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`
  },
  { 
    id: 'people', type: 'shortcut', title: 'contatti', action: 'people', size: 'tile-medium', color: 'accent-magenta',
    iconSvg: `<svg viewBox="0 0 24 24" width="38" height="38" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`
  },
  { 
    id: 'browser', type: 'shortcut', title: 'internet', action: 'https://www.google.com', size: 'tile-medium', color: 'accent-teal',
    iconSvg: `<svg viewBox="0 0 24 24" width="38" height="38" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`
  },
  { 
    id: 'mail', type: 'shortcut', title: 'email', action: 'mailto:', size: 'tile-medium', color: 'accent-blue',
    iconSvg: `<svg viewBox="0 0 24 24" width="38" height="38" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>`
  },
  { 
    id: 'camera', type: 'shortcut', title: 'fotocamera', action: 'camera', size: 'tile-small', color: 'accent-dark',
    iconSvg: `<svg viewBox="0 0 24 24" width="28" height="28" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>`
  },
  { 
    id: 'settings', type: 'shortcut', title: 'impostazioni', action: 'settings', size: 'tile-small', color: 'accent-dark',
    iconSvg: `<svg viewBox="0 0 24 24" width="28" height="28" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`
  }
];

let METRO_TILES = JSON.parse(localStorage.getItem('GLANCE_TILES_CONFIG')) || DEFAULT_METRO_TILES;

function saveMetroTilesConfig() {
  localStorage.setItem('GLANCE_TILES_CONFIG', JSON.stringify(METRO_TILES));
}

// App State
let allArticles = [];
let filteredArticles = [];
let savedArticleUrls = new Set(JSON.parse(localStorage.getItem('infohub_bookmarks') || '[]'));
let activeCategory = 'all';
let activeSiteFilter = 'all';
let currentSearchQuery = '';
let currentOpenedArticle = null;
let currentNewsTileIndex = 0;

// CORS Proxies for robust browser fetching
const PROXIES = [
  url => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  url => `https://corsproxy.io/?${encodeURIComponent(url)}`
];

// DOM Elements
const feedGrid = document.getElementById('feedGrid');
const loadingState = document.getElementById('loadingState');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const siteChipsContainer = document.getElementById('siteChipsContainer');
const readerModal = document.getElementById('readerModal');
const refreshBtn = document.getElementById('refreshBtn');

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  renderStartScreenTiles();
  startLiveTileIntervals();
  renderSiteChips();
  setupEventListeners();
  setupSwipeNavigation();
  setupTileEditModalListeners();
  loadAllFeeds();
  loadWeather(false);
  updateSidebarContent('startView');
});

// Setup Event Listeners
function setupEventListeners() {
  // Navigation Tabs (Metro Pivot)
  document.querySelectorAll('.pivot-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.pivot-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-view').forEach(v => v.classList.remove('active'));
      btn.classList.add('active');
      const tabId = btn.getAttribute('data-tab');
      document.getElementById(tabId).classList.add('active');
      
      const searchContainer = document.querySelector('.search-container');
      if (tabId === 'feedView') {
        if (searchContainer) searchContainer.classList.remove('hidden');
      } else {
        if (searchContainer) searchContainer.classList.add('hidden');
      }

      if (tabId === 'weatherView') {
        renderWeatherCitiesList();
        loadWeather();
      }
      updateSidebarContent(tabId);
    });
  });

  function updateSidebarContent(tabId) {
    const sidebarTitle = document.getElementById('sidebarTitle');
    const startOptionsContainer = document.getElementById('startOptionsContainer');
    const siteChipsContainer = document.getElementById('siteChipsContainer');
    const addSiteBtn = document.getElementById('addSiteBtn');
    const citiesListContainer = document.getElementById('citiesListContainer');
    const addCityBtn = document.getElementById('addCityBtn');
    
    if (tabId === 'startView') {
      if (sidebarTitle) sidebarTitle.textContent = 'personalizza start';
      if (startOptionsContainer) startOptionsContainer.classList.remove('hidden');
      if (siteChipsContainer) siteChipsContainer.classList.add('hidden');
      if (addSiteBtn) addSiteBtn.classList.add('hidden');
      if (citiesListContainer) citiesListContainer.classList.add('hidden');
      if (addCityBtn) addCityBtn.classList.add('hidden');
    } else if (tabId === 'weatherView') {
      if (sidebarTitle) sidebarTitle.textContent = 'città salvate';
      if (startOptionsContainer) startOptionsContainer.classList.add('hidden');
      if (siteChipsContainer) siteChipsContainer.classList.add('hidden');
      if (addSiteBtn) addSiteBtn.classList.add('hidden');
      if (citiesListContainer) citiesListContainer.classList.remove('hidden');
      if (addCityBtn) addCityBtn.classList.remove('hidden');
    } else {
      if (sidebarTitle) sidebarTitle.textContent = 'filtri siti';
      if (startOptionsContainer) startOptionsContainer.classList.add('hidden');
      if (siteChipsContainer) siteChipsContainer.classList.remove('hidden');
      if (addSiteBtn) addSiteBtn.classList.remove('hidden');
      if (citiesListContainer) citiesListContainer.classList.add('hidden');
      if (addCityBtn) addCityBtn.classList.add('hidden');
    }
  }
  // Sidebar Controls
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
  
  function openSidebar() {
    sidebar.classList.add('open');
    sidebarOverlay.classList.remove('hidden');
    setTimeout(() => sidebarOverlay.classList.add('visible'), 10);
  }

  function closeSidebar() {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('visible');
    setTimeout(() => sidebarOverlay.classList.add('hidden'), 300);
  }

  function toggleSidebar() {
    if (sidebar.classList.contains('open')) {
      closeSidebar();
    } else {
      openSidebar();
    }
  }

  if (sidebarToggleBtn) sidebarToggleBtn.addEventListener('click', toggleSidebar);
  if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar);

  // Search Input
  searchInput.addEventListener('input', (e) => {
    currentSearchQuery = e.target.value.toLowerCase().trim();
    clearSearchBtn.classList.toggle('hidden', currentSearchQuery === '');
    applyFilters();
  });

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    currentSearchQuery = '';
    clearSearchBtn.classList.add('hidden');
    applyFilters();
  });

  // Refresh Button
  refreshBtn.addEventListener('click', () => {
    refreshBtn.classList.add('spinning');
    loadAllFeeds().then(() => refreshBtn.classList.remove('spinning'));
  });

  // Add Site Modal Controls
  const addSiteModal = document.getElementById('addSiteModal');
  const addSiteBtn = document.getElementById('addSiteBtn');
  
  // Reader Modal Controls
  const closeModalBtn = document.getElementById('closeModalBtn');
  if (closeModalBtn) closeModalBtn.addEventListener('click', () => readerModal.close());
  const closeAddSiteBtn = document.getElementById('closeAddSiteBtn');
  const saveNewSiteBtn = document.getElementById('saveNewSiteBtn');
  const newSiteUrlInput = document.getElementById('newSiteUrl');

  if (addSiteBtn) {
    addSiteBtn.addEventListener('click', () => {
      addSiteModal.showModal();
    });
  }
  if (closeAddSiteBtn) {
    closeAddSiteBtn.addEventListener('click', () => addSiteModal.close());
  }

  if (saveNewSiteBtn) {
    saveNewSiteBtn.addEventListener('click', () => {
      const url = newSiteUrlInput.value.trim();
      if (!url) return;
      
      const siteName = new URL(url).hostname.replace('www.', '');
      const initials = siteName.charAt(0).toUpperCase();
      const randomMetroColors = ['#1ba1e2', '#a05000', '#339933', '#e51400', '#f09609', '#e3c800', '#e51400', '#00aba9'];
      const randomColor = randomMetroColors[Math.floor(Math.random() * randomMetroColors.length)];

      const newSite = {
        id: siteName.toLowerCase().replace(/[^a-z0-9]/g, ''),
        name: siteName,
        category: 'custom',
        feedUrl: url,
        siteUrl: `https://${siteName}`,
        color: randomColor,
        icon: initials
      };

      SITES_CONFIG.push(newSite);
      saveSitesConfig();
      renderSiteChips();
      addSiteModal.close();
      newSiteUrlInput.value = '';
      
      // Reload feeds to include the new site
      loadAllFeeds();
    });
  }

  // Load weather when the weather tab is clicked
  const weatherTabBtn = document.querySelector('[data-tab="weatherView"]');
  if (weatherTabBtn) {
    weatherTabBtn.addEventListener('click', () => {
      renderWeatherCitiesList();
      loadWeather();
    });
  }

  // Setup Weather Add City Modal
  setupWeatherCityManagement();
  

  // Auto refresh every 1 hour (3600000 ms)
  setInterval(() => {
    loadAllFeeds();
    loadWeather(true);
  }, 3600000);

}



// Weather City Management
function setupWeatherCityManagement() {
  const addCityBtn = document.getElementById('addCityBtn');
  const addCityModal = document.getElementById('addCityModal');
  const closeAddCityBtn = document.getElementById('closeAddCityBtn');
  const searchCityBtn = document.getElementById('searchCityBtn');
  const newCityNameInput = document.getElementById('newCityName');
  const citySearchResults = document.getElementById('citySearchResults');

  if (addCityBtn) addCityBtn.addEventListener('click', () => {
    citySearchResults.innerHTML = '';
    newCityNameInput.value = '';
    addCityModal.showModal();
  });
  if (closeAddCityBtn) closeAddCityBtn.addEventListener('click', () => addCityModal.close());

  if (searchCityBtn) {
    searchCityBtn.addEventListener('click', async () => {
      const query = newCityNameInput.value.trim();
      if (!query) return;

      searchCityBtn.innerText = 'Ricerca...';
      try {
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=it&format=json`);
        const data = await res.json();
        
        if (data.results && data.results.length > 0) {
          citySearchResults.innerHTML = data.results.map(city => `
            <div class="city-search-item" data-id="${city.id}" data-name="${city.name}" data-lat="${city.latitude}" data-lon="${city.longitude}">
              ${city.name} (${city.admin1 || city.country})
            </div>
          `).join('');

          document.querySelectorAll('.city-search-item').forEach(el => {
            el.addEventListener('click', () => {
              const newCity = {
                id: el.dataset.id,
                name: el.dataset.name,
                lat: parseFloat(el.dataset.lat),
                lon: parseFloat(el.dataset.lon)
              };
              // Check if exists
              if (!WEATHER_CITIES.find(c => c.id === newCity.id)) {
                WEATHER_CITIES.push(newCity);
                saveWeatherCities();
              }
              activeWeatherCity = WEATHER_CITIES.find(c => c.id === newCity.id);
              renderWeatherCitiesList();
              loadWeather(true); // Force reload
              addCityModal.close();
            });
          });
        } else {
          citySearchResults.innerHTML = '<p style="padding:15px; color:#aaa;">Nessuna città trovata.</p>';
        }
      } catch (err) {
        citySearchResults.innerHTML = '<p style="padding:15px; color:red;">Errore di ricerca.</p>';
      }
      searchCityBtn.innerText = 'Cerca';
    });
  }
}

let deletingCitiesMode = false;

function renderWeatherCitiesList() {
  const container = document.getElementById('citiesListContainer');
  const currentCityEl = document.getElementById('currentWeatherCity');
  if (!container) return;

  currentCityEl.innerText = activeWeatherCity.name;

  container.innerHTML = WEATHER_CITIES
    .map(city => `
    <div class="weather-city-item ${city.id === activeWeatherCity.id ? 'active-city' : ''}" data-id="${city.id}">
      <span>${city.name}</span>
      ${deletingCitiesMode ? `<button class="city-minus-btn" data-delete-id="${city.id}" title="Elimina città">&minus;</button>` : ''}
    </div>
  `).join('');

  // Switch city or delete via minus button
  container.querySelectorAll('.weather-city-item').forEach(el => {
    el.addEventListener('click', (e) => {
      const deleteBtn = e.target.closest('.city-minus-btn');
      if (deleteBtn) {
        e.stopPropagation();
        const deleteId = deleteBtn.getAttribute('data-delete-id');
        if (WEATHER_CITIES.length <= 1) {
          alert("Non puoi eliminare l'unica città salvata.");
          return;
        }
        WEATHER_CITIES = WEATHER_CITIES.filter(c => c.id != deleteId);
        if (activeWeatherCity.id == deleteId) {
          activeWeatherCity = WEATHER_CITIES[0];
        }
        saveWeatherCities();
        renderWeatherCitiesList();
        loadWeather(true);
        return;
      }

      activeWeatherCity = WEATHER_CITIES.find(c => c.id == el.dataset.id);
      renderWeatherCitiesList();
      loadWeather(true);
    });
    
    // Long press / right click toggles minus buttons for deletion
    el.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      deletingCitiesMode = !deletingCitiesMode;
      renderWeatherCitiesList();
    });
  });

  // Initialize SortableJS for Drag & Drop
  if (typeof Sortable !== 'undefined') {
    if (window.weatherSortableInstance) window.weatherSortableInstance.destroy();
    window.weatherSortableInstance = new Sortable(container, {
      animation: 150,
      delay: 200, // Touch delay
      delayOnTouchOnly: true,
      onEnd: function () {
        const newOrder = [];
        container.querySelectorAll('.weather-city-item').forEach(item => {
          const cityId = item.getAttribute('data-id');
          if (cityId) {
            const cityObj = WEATHER_CITIES.find(c => c.id === cityId);
            if (cityObj) newOrder.push(cityObj);
          }
        });
        if (newOrder.length === WEATHER_CITIES.length) {
          WEATHER_CITIES = newOrder;
          saveWeatherCities();
        }
      }
    });
  }
}

// Render Site Chips (App List Layout)
let sortableInstance = null;
function renderSiteChips() {
  siteChipsContainer.innerHTML = `
    <div class="site-chip active" data-site="all">
      <div class="tile-icon" style="background: var(--accent-blue);">⚡</div>
      <span class="site-name">Tutte le news</span>
    </div>
    ${SITES_CONFIG.map(site => `
      <div class="site-chip" data-site="${site.id}">
        <div class="tile-icon" style="background: ${site.color};">${site.icon}</div>
        <span class="site-name">${site.name}</span>
      </div>
    `).join('')}
  `;

  // Filter click logic
  siteChipsContainer.querySelectorAll('.site-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      siteChipsContainer.querySelectorAll('.site-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeSiteFilter = chip.getAttribute('data-site');
      applyFilters();

      // Close sidebar after selection
      const sidebar = document.getElementById('sidebar');
      const sidebarOverlay = document.getElementById('sidebarOverlay');
      if (sidebar && sidebarOverlay) {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('visible');
        setTimeout(() => sidebarOverlay.classList.add('hidden'), 300);
      }
    });

    // Right click / Long press to delete
    chip.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const siteId = chip.getAttribute('data-site');
      if (siteId === 'all') return;
      
      const siteName = chip.querySelector('.site-name').innerText;
      if (confirm(`Vuoi eliminare il sito ${siteName}?`)) {
        SITES_CONFIG = SITES_CONFIG.filter(s => s.id !== siteId);
        saveSitesConfig();
        renderSiteChips();
        if (activeSiteFilter === siteId) {
          activeSiteFilter = 'all';
        }
        applyFilters();
      }
    });
  });

  // Initialize SortableJS for Drag & Drop
  if (typeof Sortable !== 'undefined') {
    if (sortableInstance) sortableInstance.destroy();
    sortableInstance = new Sortable(siteChipsContainer, {
      animation: 150,
      delay: 200, // Touch delay to allow normal scrolling
      delayOnTouchOnly: true,
      onEnd: function () {
        const newOrder = [];
        siteChipsContainer.querySelectorAll('.site-chip').forEach(chip => {
          const siteId = chip.getAttribute('data-site');
          if (siteId && siteId !== 'all') {
            const siteObj = SITES_CONFIG.find(s => s.id === siteId);
            if (siteObj) newOrder.push(siteObj);
          }
        });
        if (newOrder.length === SITES_CONFIG.length) {
          SITES_CONFIG = newOrder;
          saveSitesConfig();
        }
      }
    });
  }
}

// Open-Meteo API Fetch
async function loadWeather(force = false) {
  const tempEl = document.getElementById('weatherTemp');
  const iconEl = document.getElementById('weatherIcon');
  const descEl = document.getElementById('weatherDesc');
  const forecastList = document.getElementById('forecastList');

  // Skip if already loaded for this city and not forced
  if (!force && tempEl.dataset.cityId === activeWeatherCity.id && tempEl.innerText !== '--°') return; 

  tempEl.dataset.cityId = activeWeatherCity.id;
  tempEl.innerHTML = '--&deg;';
  descEl.innerText = 'caricamento...';
  forecastList.innerHTML = '';

  try {
    const lat = activeWeatherCity.lat;
    const lon = activeWeatherCity.lon;
    // Fetch current, daily, and hourly forecast for 7 days
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`);
    
    if (res.ok) {
      const data = await res.json();
      
      // Update Current
      const current = data.current;
      const temp = Math.round(current.temperature_2m);
      const code = current.weather_code;
      
      tempEl.innerHTML = `${temp}&deg;`;
      
      const currentMapping = getWmoIconAndDesc(code);
      iconEl.innerText = currentMapping.icon;
      descEl.innerText = currentMapping.desc;

      // Update 7-Day Forecast with Hourly
      const daily = data.daily;
      if (daily) {
        let forecastHTML = '';
        for (let i = 1; i < Math.min(7, daily.time.length); i++) { // Start from index 1 (tomorrow)
          const dateStr = daily.time[i];
          const date = new Date(dateStr);
          const dayName = new Intl.DateTimeFormat('it-IT', { weekday: 'long' }).format(date);
          const maxTemp = Math.round(daily.temperature_2m_max[i]);
          const minTemp = Math.round(daily.temperature_2m_min[i]);
          const mapping = getWmoIconAndDesc(daily.weather_code[i]);

          let hourlyHTML = `<div class="hourly-forecast-container hidden" id="hourly-${i}"><div class="hourly-forecast-scroll">`;
          if (data.hourly) {
            for(let h=0; h<data.hourly.time.length; h++) {
              if (data.hourly.time[h].startsWith(dateStr)) {
                const hDate = new Date(data.hourly.time[h]);
                const hourStr = hDate.getHours() + ':00';
                const hTemp = Math.round(data.hourly.temperature_2m[h]);
                const hMap = getWmoIconAndDesc(data.hourly.weather_code[h]);
                hourlyHTML += `
                  <div class="hourly-item">
                    <span class="hourly-time">${hourStr}</span>
                    <span class="hourly-icon">${hMap.icon}</span>
                    <span class="hourly-temp">${hTemp}&deg;</span>
                  </div>
                `;
              }
            }
          }
          hourlyHTML += `</div></div>`;

          forecastHTML += `
            <div class="forecast-day-wrapper">
              <div class="forecast-item" onclick="document.getElementById('hourly-${i}').classList.toggle('hidden')">
                <span class="forecast-day">${dayName}</span>
                <span class="forecast-icon">${mapping.icon}</span>
                <span class="forecast-temps">${maxTemp}&deg; / <span style="opacity:0.6">${minTemp}&deg;</span></span>
              </div>
              ${hourlyHTML}
            </div>
          `;
        }
        forecastList.innerHTML = forecastHTML;
      }

    }
  } catch (err) {
    console.error("Meteo load error:", err);
    descEl.innerText = "errore di caricamento";
  }
}

function getWmoIconAndDesc(code) {
  let icon = '☁️';
  let desc = 'nuvoloso';
  
  if (code === 0) { icon = '☀️'; desc = 'sereno'; }
  else if (code >= 1 && code <= 3) { icon = '⛅'; desc = 'poco nuvoloso'; }
  else if (code >= 51 && code <= 67) { icon = '🌧️'; desc = 'pioggia'; }
  else if (code >= 71 && code <= 77) { icon = '❄️'; desc = 'neve'; }
  else if (code >= 95) { icon = '⛈️'; desc = 'temporale'; }

  return { icon, desc };
}

// Load All RSS Feeds
async function loadAllFeeds() {
  if (allArticles.length === 0) {
    loadingState.classList.remove('hidden');
    emptyState.classList.add('hidden');
  }

  const promises = SITES_CONFIG.map(site => fetchSiteFeed(site));
  const results = await Promise.allSettled(promises);

  let newArticles = [];
  results.forEach(result => {
    if (result.status === 'fulfilled' && Array.isArray(result.value)) {
      newArticles.push(...result.value);
    }
  });

  if (newArticles.length > 0) {
    // Sort by date (newest first)
    newArticles.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    allArticles = newArticles;
  }

  loadingState.classList.add('hidden');
  applyFilters();
}

// Fetch single RSS feed with RSS2JSON API primary & XML proxy fallback
async function fetchSiteFeed(site) {
  // Method 1: RSS2JSON API (returns JSON, works on file:// and all origins)
  try {
    const rss2jsonUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(site.feedUrl)}`;
    const res = await fetch(rss2jsonUrl);
    if (res.ok) {
      const data = await res.json();
      if (data.status === 'ok' && Array.isArray(data.items) && data.items.length > 0) {
        return parseRss2JsonItems(data.items, site);
      }
    }
  } catch (err) {
    console.warn(`RSS2JSON failed for ${site.name}, falling back to proxies...`, err);
  }

  // Method 2: Fallback XML Proxies
  let xmlText = null;
  for (const proxyFn of PROXIES) {
    try {
      const response = await fetch(proxyFn(site.feedUrl));
      if (response.ok) {
        xmlText = await response.text();
        if (xmlText && xmlText.length > 50) break;
      }
    } catch (e) {
      console.warn(`Proxy failed for ${site.name}`, e);
    }
  }

  if (!xmlText) return [];
  return parseRSSXml(xmlText, site);
}

// Parse RSS2JSON items into unified article format
function parseRss2JsonItems(items, site) {
  return items.map(item => {
    let imageUrl = item.thumbnail || null;
    if (!imageUrl && item.enclosure && item.enclosure.link) {
      imageUrl = item.enclosure.link;
    }
    const htmlContent = item.content || item.description || '';
    if (!imageUrl && htmlContent) {
      const imgMatch = htmlContent.match(/<img[^>]+src=["']([^"']+)["']/i);
      if (imgMatch) imageUrl = imgMatch[1];
    }

    const snippet = htmlContent
      ? htmlContent.replace(/<[^>]+>/g, '').trim().substring(0, 150) + '...'
      : '';

    return {
      id: item.link || item.guid || Math.random().toString(),
      siteId: site.id,
      siteName: site.name,
      siteColor: site.color,
      category: site.category,
      title: (item.title || 'Senza titolo').trim(),
      link: item.link || site.siteUrl,
      pubDate: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
      description: htmlContent || snippet,
      snippet: snippet,
      imageUrl: imageUrl
    };
  });
}


// Parse RSS / Atom XML
function parseRSSXml(xmlText, site) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
  const items = xmlDoc.querySelectorAll('item, entry');
  const articles = [];

  items.forEach(item => {
    const title = getXmlTag(item, ['title']) || 'Senza titolo';
    let link = getXmlTag(item, ['link']);
    if (!link && item.querySelector('link')) {
      link = item.querySelector('link').getAttribute('href');
    }
    
    const pubDateStr = getXmlTag(item, ['pubDate', 'published', 'updated', 'dc:date']);
    const pubDate = pubDateStr ? new Date(pubDateStr).toISOString() : new Date().toISOString();
    
    const description = getXmlTag(item, ['description', 'summary', 'content:encoded']);
    
    // Extract cover image
    let imageUrl = null;
    const mediaContent = item.querySelector('media\\:content, content');
    if (mediaContent && mediaContent.getAttribute('url')) {
      imageUrl = mediaContent.getAttribute('url');
    }
    
    const enclosure = item.querySelector('enclosure');
    if (!imageUrl && enclosure && enclosure.getAttribute('url')) {
      imageUrl = enclosure.getAttribute('url');
    }

    if (!imageUrl && description) {
      const imgMatch = description.match(/<img[^>]+src=["']([^"']+)["']/i);
      if (imgMatch) imageUrl = imgMatch[1];
    }

    // Clean plain text snippet
    const snippet = description
      ? description.replace(/<[^>]+>/g, '').trim().substring(0, 150) + '...'
      : '';

    articles.push({
      id: link || title + Math.random(),
      siteId: site.id,
      siteName: site.name,
      siteColor: site.color,
      category: site.category,
      title: title.trim(),
      link: link || site.siteUrl,
      pubDate: pubDate,
      description: description || snippet,
      snippet: snippet,
      imageUrl: imageUrl
    });
  });

  return articles;
}

function getXmlTag(item, tags) {
  for (const tag of tags) {
    const el = item.querySelector(tag);
    if (el && el.textContent) return el.textContent;
  }
  return null;
}

// Apply Filters & Search
function applyFilters() {
  filteredArticles = allArticles.filter(article => {
    // Category Filter
    if (activeCategory === 'bookmarks') {
      if (!savedArticleUrls.has(article.link)) return false;
    } else if (activeCategory !== 'all' && article.category !== activeCategory) {
      return false;
    }

    // Site Filter
    if (activeSiteFilter !== 'all' && article.siteId !== activeSiteFilter) {
      return false;
    }

    // Search Filter
    if (currentSearchQuery) {
      const inTitle = article.title.toLowerCase().includes(currentSearchQuery);
      const inSnippet = article.snippet.toLowerCase().includes(currentSearchQuery);
      if (!inTitle && !inSnippet) return false;
    }

    return true;
  });

  renderFeedGrid();
}

// Render Feed Grid
function renderFeedGrid() {
  if (articleCountEl) {
    articleCountEl.textContent = `${filteredArticles.length} articoli`;
  }

  if (filteredArticles.length === 0) {
    emptyState.classList.remove('hidden');
    feedGrid.innerHTML = '';
    return;
  }

  emptyState.classList.add('hidden');

  feedGrid.innerHTML = filteredArticles.map(article => {
    const formattedDate = formatDate(article.pubDate);
    const isSaved = savedArticleUrls.has(article.link);

    return `
      <article class="article-card" onclick="openReaderModal('${escapeHtml(article.link)}')">
        <div class="card-img-wrapper">
          <img class="card-img" src="${article.imageUrl || getFallbackImage(article.category)}" alt="" loading="lazy" onerror="this.src='${getFallbackImage(article.category)}'">
        </div>
        <div class="card-content">
          <span class="source-badge" style="color: ${article.siteColor};">${article.siteName}</span>
          <h3 class="card-title">${escapeHtml(article.title)}</h3>
          <p class="card-snippet">${escapeHtml(article.snippet)}</p>
          <div class="card-footer">
            <span>${formattedDate}</span>
            <span>${isSaved ? '★' : ''}</span>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

// Open Reader Dialog Modal
function openReaderModal(articleLink) {
  const article = allArticles.find(a => a.link === articleLink);
  if (!article) return;

  currentOpenedArticle = article;
  
  document.getElementById('modalSource').textContent = article.siteName;
  document.getElementById('modalSource').style.background = article.siteColor;
  document.getElementById('modalDate').textContent = formatDate(article.pubDate);
  document.getElementById('modalTitle').textContent = article.title;
  
  const imgBox = document.getElementById('modalImageContainer');
  const modalImg = document.getElementById('modalImage');
  if (article.imageUrl) {
    modalImg.src = article.imageUrl;
    imgBox.classList.remove('hidden');
  } else {
    imgBox.classList.add('hidden');
  }

  // Initially show snippet and a loading message
  const cleanBody = cleanHtmlContent(article.description);
  const modalBody = document.getElementById('modalBody');
  modalBody.innerHTML = cleanBody || `<p>${escapeHtml(article.snippet)}</p>`;
  
  // Fetch full article content dynamically!
  fetchFullArticleContent(article.link, modalBody);
  
  document.getElementById('originalLinkBtn').href = article.link;
  updateBookmarkModalBtnState();

  readerModal.showModal();
}

async function fetchFullArticleContent(url, container) {
  const loadingId = 'loading-' + Math.random().toString(36).substr(2, 9);
  const loadingHtml = `<div id="${loadingId}" style="margin-top:20px; padding: 15px; background: rgba(56, 189, 248, 0.1); border-radius: 8px; color: #38bdf8; text-align: center;">
    ⏳ Estrazione articolo completo in corso...
  </div>`;
  container.insertAdjacentHTML('beforeend', loadingHtml);

  let htmlText = null;
  // Try allorigins /get first because it parses json and avoids some issues
  try {
    const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.contents) {
        htmlText = data.contents;
      }
    }
  } catch (err) {
    console.warn('allorigins /get failed, trying raw proxies...');
  }

  // Fallback to other proxies if /get fails
  if (!htmlText) {
    for (const proxyFn of PROXIES) {
      try {
        const response = await fetch(proxyFn(url));
        if (response.ok) {
          htmlText = await response.text();
          if (htmlText && htmlText.length > 100) break;
        }
      } catch (e) {
        console.warn(`Proxy failed for ${url}`, e);
      }
    }
  }

  const loadingEl = document.getElementById(loadingId);
  if (loadingEl) loadingEl.remove();

  if (!htmlText) {
    container.insertAdjacentHTML('beforeend', '<p style="color:#ef4444; margin-top:10px;">⚠️ Errore nel caricamento del testo completo. I server proxy sono bloccati o il sito non risponde.</p>');
    return;
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');
    
    // Find the main article container
    const article = doc.querySelector('article') || doc.querySelector('.post-content') || doc.querySelector('.article-body') || doc.querySelector('.entry-content') || doc.querySelector('main');
    
    if (article) {
       // Remove ads, scripts, navs, and svgs from the extracted content
       article.querySelectorAll('script, style, iframe, nav, header, footer, aside, svg, .ad, .banner, .social-share').forEach(el => el.remove());
       
       // Fix relative images
       article.querySelectorAll('img').forEach(img => {
         const src = img.getAttribute('src') || img.getAttribute('data-src');
         if (src) {
           try {
             img.src = new URL(src, url).href;
           } catch(e) {}
         }
         // Strip srcset to prevent loading issues with relative paths
         img.removeAttribute('srcset');
       });

       // Replace modal body with the full clean text
       container.innerHTML = article.innerHTML;
    } else {
       // Fallback: extract large paragraphs
       const paragraphs = Array.from(doc.querySelectorAll('p')).filter(p => p.textContent.length > 60);
       if (paragraphs.length > 0) {
         container.innerHTML = paragraphs.map(p => `<p style="margin-bottom:14px;">${p.innerHTML}</p>`).join('');
       } else {
         container.innerHTML = `<p>⚠️ Impossibile estrarre automaticamente l'articolo completo. Clicca il pulsante in basso per aprirlo nel sito originale.</p>`;
       }
    }
  } catch (err) {
    container.insertAdjacentHTML('beforeend', '<p style="color:#ef4444; margin-top:10px;">⚠️ Errore nel parsing del testo dell\'articolo.</p>');
  }
}

function updateBookmarkModalBtnState() {
  if (!currentOpenedArticle) return;
  const isSaved = savedArticleUrls.has(currentOpenedArticle.link);
  document.getElementById('bookmarkBtnText').textContent = isSaved ? 'Rimuovi dai salvati' : 'Salva articolo';
}

function toggleBookmarkModal() {
  if (!currentOpenedArticle) return;
  const link = currentOpenedArticle.link;
  if (savedArticleUrls.has(link)) {
    savedArticleUrls.delete(link);
  } else {
    savedArticleUrls.add(link);
  }
  localStorage.setItem('infohub_bookmarks', JSON.stringify(Array.from(savedArticleUrls)));
  updateBookmarkModalBtnState();
  applyFilters();
}

// Helpers
function formatDate(dateStr) {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffHours = Math.floor((now - d) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Pochi minuti fa';
    if (diffHours < 24) return `${diffHours}h fa`;
    return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
  } catch (e) {
    return '';
  }
}

function getFallbackImage(category) {
  if (category === 'motorsport') {
    return 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=600&q=80';
  }
  return 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80';
}

function cleanHtmlContent(html) {
  if (!html) return '';
  // Comprehensive Ad-Block & Tracker removal
  let doc = new DOMParser().parseFromString(html, 'text/html');
  const adSelectors = [
    'script', 'iframe', 'ins', 'embed', 'object',
    '.ad', '.ads', '.ad-container', '.advertisement', '.banner-ad',
    '.social-share', '.cookie-banner', '.newsletter-signup', '.outbrain',
    '[id*="google_ads"]', '[class*="sponsored"]', '[class*="advert"]'
  ];
  doc.querySelectorAll(adSelectors.join(', ')).forEach(el => el.remove());
  return doc.body.innerHTML;
}

/* ==========================================================================
   WP8 METRO START SCREEN & LIVE TILES ENGINE
   ========================================================================== */

function renderStartScreenTiles() {
  const container = document.getElementById('metroGrid');
  if (!container) return;

  container.innerHTML = METRO_TILES.map(tile => {
    return `
      <div class="metro-tile ${tile.size} ${tile.color}" data-id="${tile.id}" data-type="${tile.type}">
        ${renderTileInnerContent(tile)}
      </div>
    `;
  }).join('');

  // Setup click & contextmenu (long press) handlers for tiles
  container.querySelectorAll('.metro-tile').forEach(tileEl => {
    const tileId = tileEl.getAttribute('data-id');
    const tileObj = METRO_TILES.find(t => t.id === tileId);

    tileEl.addEventListener('click', () => {
      handleTileClick(tileObj);
    });

    tileEl.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      openTileEditModal(tileObj);
    });
  });

  // Enable SortableJS Drag & Drop on tiles grid
  if (typeof Sortable !== 'undefined') {
    if (window.metroGridSortable) window.metroGridSortable.destroy();
    window.metroGridSortable = new Sortable(container, {
      animation: 150,
      delay: 200,
      delayOnTouchOnly: true,
      onEnd: function () {
        const newTilesOrder = [];
        container.querySelectorAll('.metro-tile').forEach(el => {
          const id = el.getAttribute('data-id');
          const tile = METRO_TILES.find(t => t.id === id);
          if (tile) newTilesOrder.push(tile);
        });
        if (newTilesOrder.length === METRO_TILES.length) {
          METRO_TILES = newTilesOrder;
          saveMetroTilesConfig();
        }
      }
    });
  }
}

function renderTileInnerContent(tile) {
  if (tile.type === 'clock') {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' });
    return `
      <div class="clock-tile-content">
        <div class="clock-tile-time" id="tileClockTime">${timeStr}</div>
        <div class="clock-tile-date" id="tileClockDate">${dateStr}</div>
      </div>
      <div class="tile-label">${tile.title}</div>
    `;
  }

  if (tile.type === 'calendar') {
    const now = new Date();
    const dayNum = now.getDate();
    const monthStr = now.toLocaleDateString('it-IT', { month: 'short' });
    return `
      <div class="calendar-tile-content">
        <div class="calendar-tile-day">${dayNum}</div>
        <div class="calendar-tile-month">${monthStr}</div>
      </div>
      <div class="tile-label">${tile.title}</div>
    `;
  }

  if (tile.type === 'weather') {
    const temp = window.currentWeatherTemp || '--°';
    const icon = window.currentWeatherIcon || '☀️';
    const city = activeWeatherCity ? activeWeatherCity.name : 'Meteo';
    return `
      <div class="weather-tile-content">
        <div>
          <div class="weather-tile-temp" id="tileWeatherTemp">${temp}</div>
          <div class="weather-tile-city" id="tileWeatherCity">${city}</div>
        </div>
        <div class="weather-tile-icon" id="tileWeatherIcon">${icon}</div>
      </div>
      <div class="tile-label">${tile.title}</div>
    `;
  }

  if (tile.type === 'news') {
    let headline = 'Caricamento ultime notizie...';
    let source = 'Glance';
    if (allArticles.length > 0) {
      const art = allArticles[currentNewsTileIndex % allArticles.length];
      headline = art.title;
      source = art.source;
    }
    return `
      <div class="news-tile-content">
        <div class="news-tile-headline" id="tileNewsHeadline">${headline}</div>
        <div class="news-tile-source" id="tileNewsSource">${source}</div>
      </div>
      <div class="tile-label">${tile.title}</div>
    `;
  }

  // Generic shortcut tile
  const iconContent = tile.iconSvg || `<span class="tile-icon-huge">${tile.icon || '📱'}</span>`;
  return `
    <div class="tile-icon-container">
      ${iconContent}
    </div>
    <div class="tile-label">${tile.title}</div>
  `;
}

function handleTileClick(tile) {
  if (!tile) return;
  if (tile.type === 'weather') {
    switchTabTo('weatherView');
  } else if (tile.type === 'news') {
    switchTabTo('feedView');
  } else if (tile.type === 'clock' || tile.type === 'calendar') {
    const now = new Date();
    alert(`📅 ${now.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}\n⏰ ${now.toLocaleTimeString('it-IT')}`);
  } else if (tile.action) {
    if (tile.action.startsWith('http://') || tile.action.startsWith('https://') || tile.action.startsWith('tel:') || tile.action.startsWith('sms:') || tile.action.startsWith('mailto:')) {
      window.open(tile.action, '_blank');
    } else {
      alert(`Shortcut ${tile.title} avviata.`);
    }
  }
}

function switchTabTo(tabId) {
  const btn = document.querySelector(`.pivot-btn[data-tab="${tabId}"]`);
  if (btn) btn.click();
}

function startLiveTileIntervals() {
  // Update Clock every second
  setInterval(() => {
    const timeEl = document.getElementById('tileClockTime');
    const dateEl = document.getElementById('tileClockDate');
    if (timeEl && dateEl) {
      const now = new Date();
      timeEl.innerText = now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
      dateEl.innerText = now.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' });
    }
  }, 1000);

  // Rotate News Tile headline every 6 seconds
  setInterval(() => {
    if (allArticles.length === 0) return;
    currentNewsTileIndex = (currentNewsTileIndex + 1) % allArticles.length;
    const headlineEl = document.getElementById('tileNewsHeadline');
    const sourceEl = document.getElementById('tileNewsSource');
    if (headlineEl && sourceEl) {
      const art = allArticles[currentNewsTileIndex];
      headlineEl.innerText = art.title;
      sourceEl.innerText = art.source;
    }
  }, 6000);
}

/* ==========================================================================
   HORIZONTAL SWIPE NAVIGATION (Start <-> Meteo <-> Feed News)
   ========================================================================== */
function setupSwipeNavigation() {
  const tabsOrder = ['startView', 'weatherView', 'feedView'];
  let touchStartX = 0;
  let touchStartY = 0;

  const mainContent = document.getElementById('mainContent');
  if (!mainContent) return;

  mainContent.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
  }, { passive: true });

  mainContent.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].screenX;
    const touchEndY = e.changedTouches[0].screenY;
    
    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;

    // Horizontality check
    if (Math.abs(diffX) > 60 && Math.abs(diffY) < 50) {
      const activeBtn = document.querySelector('.pivot-btn.active');
      if (!activeBtn) return;
      const currentTabId = activeBtn.getAttribute('data-tab');
      let currentIndex = tabsOrder.indexOf(currentTabId);

      if (diffX < 0 && currentIndex < tabsOrder.length - 1) {
        // Swiped Left -> Move Right
        switchTabTo(tabsOrder[currentIndex + 1]);
      } else if (diffX > 0 && currentIndex > 0) {
        // Swiped Right -> Move Left
        switchTabTo(tabsOrder[currentIndex - 1]);
      }
    }
  }, { passive: true });
}

/* ==========================================================================
   TILE CUSTOMIZATION MODAL ENGINE
   ========================================================================== */
let editingTileObj = null;

function openTileEditModal(tile) {
  editingTileObj = tile;
  const modal = document.getElementById('tileEditModal');
  if (!modal) return;

  document.getElementById('editTileId').value = tile.id;

  // Active size
  document.querySelectorAll('.size-opt-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.size === tile.size.replace('tile-', ''));
  });

  // Active color
  document.querySelectorAll('.color-opt-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.color === tile.color);
  });

  modal.showModal();
}

function setupTileEditModalListeners() {
  const modal = document.getElementById('tileEditModal');
  const closeBtn = document.getElementById('closeEditTileBtn');
  const saveBtn = document.getElementById('saveTileEditBtn');
  const deleteBtn = document.getElementById('deleteTileBtn');

  if (closeBtn) closeBtn.addEventListener('click', () => modal.close());

  // Size option selection
  document.querySelectorAll('.size-opt-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.size-opt-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Color option selection
  document.querySelectorAll('.color-opt-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.color-opt-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Save tile changes
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      if (!editingTileObj) return;
      const selectedSizeBtn = document.querySelector('.size-opt-btn.active');
      const selectedColorBtn = document.querySelector('.color-opt-btn.active');

      if (selectedSizeBtn) {
        const sizeKey = selectedSizeBtn.dataset.size;
        editingTileObj.size = sizeKey === 'small' ? 'tile-small' : sizeKey === 'wide' ? 'tile-wide' : 'tile-medium';
      }
      if (selectedColorBtn) {
        editingTileObj.color = selectedColorBtn.dataset.color;
      }

      saveMetroTilesConfig();
      renderStartScreenTiles();
      modal.close();
    });
  }

  // Delete tile
  if (deleteBtn) {
    deleteBtn.addEventListener('click', () => {
      if (!editingTileObj) return;
      METRO_TILES = METRO_TILES.filter(t => t.id !== editingTileObj.id);
      saveMetroTilesConfig();
      renderStartScreenTiles();
      modal.close();
    });
  }

  // Sidebar start options
  const addTileBtn = document.getElementById('addTileBtn');
  const resetTilesBtn = document.getElementById('resetTilesBtn');
  const addShortcutModal = document.getElementById('addShortcutModal');
  const closeAddShortcutBtn = document.getElementById('closeAddShortcutBtn');
  const saveShortcutBtn = document.getElementById('saveShortcutBtn');

  if (addTileBtn && addShortcutModal) {
    addTileBtn.addEventListener('click', () => addShortcutModal.showModal());
  }
  if (closeAddShortcutBtn && addShortcutModal) {
    closeAddShortcutBtn.addEventListener('click', () => addShortcutModal.close());
  }
  if (saveShortcutBtn) {
    saveShortcutBtn.addEventListener('click', () => {
      const title = document.getElementById('shortcutTitle').value.trim();
      const url = document.getElementById('shortcutUrl').value.trim();
      if (!title || !url) {
        alert('Inserisci nome e URL/intent.');
        return;
      }
      const newTile = {
        id: 'tile_' + Date.now(),
        type: 'shortcut',
        title: title,
        icon: '📌',
        action: url,
        size: 'tile-medium',
        color: 'accent-blue'
      };
      METRO_TILES.push(newTile);
      saveMetroTilesConfig();
      renderStartScreenTiles();
      addShortcutModal.close();
    });
  }

  if (resetTilesBtn) {
    resetTilesBtn.addEventListener('click', () => {
      if (confirm('Vuoi ripristinare le Tile alle impostazioni predefinite?')) {
        METRO_TILES = DEFAULT_METRO_TILES;
        saveMetroTilesConfig();
        renderStartScreenTiles();
      }
    });
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, match => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[match]);
}
