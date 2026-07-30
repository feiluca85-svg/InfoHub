/* Glance Meteo - Application Logic (Instant Launch 0ms, Dedicated Delete Button, Long-Press Fix, Persistent City Saver) */

const DEFAULT_METEO_CITIES = [
  { id: 'roma', name: 'Roma', lat: 41.9028, lon: 12.4964 },
  { id: 'milano', name: 'Milano', lat: 45.4642, lon: 9.1900 },
  { id: 'napoli', name: 'Napoli', lat: 40.8518, lon: 14.2681 },
  { id: 'torino', name: 'Torino', lat: 45.0703, lon: 7.6869 },
  { id: 'firenze', name: 'Firenze', lat: 43.7696, lon: 11.2558 }
];

let METEO_CITIES = JSON.parse(localStorage.getItem('GLANCE_METEO_CITIES')) || DEFAULT_METEO_CITIES;

// Remember and Restore Last Selected Active City
let savedActiveCityId = localStorage.getItem('GLANCE_METEO_ACTIVE_CITY_ID');
let savedGpsCity = JSON.parse(localStorage.getItem('GLANCE_METEO_GPS_CITY'));

let activeCity = (savedGpsCity && savedActiveCityId === savedGpsCity.id) 
  ? savedGpsCity 
  : (METEO_CITIES.find(c => c.id === savedActiveCityId) || METEO_CITIES[0]);

let deletingCitiesMode = false;
let isLongPressPreventClick = false;

// User Settings
let appLang = localStorage.getItem('GLANCE_METEO_LANG') || 'it';
let appTheme = localStorage.getItem('GLANCE_METEO_THEME') || 'dark';
let appAccent = localStorage.getItem('GLANCE_METEO_ACCENT') || '#0078d7';
let appUnit = localStorage.getItem('GLANCE_METEO_UNIT') || 'metric';

function applySettingsToDOM() {
  // Theme
  if (appTheme === 'light') {
    document.body.classList.add('theme-light');
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) metaTheme.setAttribute('content', '#ffffff');
  } else {
    document.body.classList.remove('theme-light');
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) metaTheme.setAttribute('content', '#000000');
  }
  
  // Accent
  if (appAccent !== 'auto') {
    document.documentElement.style.setProperty('--accent-color', appAccent);
  } else {
    // Provide a fallback color to prevent 'auto' string turning into black CSS
    document.documentElement.style.setProperty('--accent-color', '#0078d7');
  }

  // Sync Toggles in Modal
  document.querySelectorAll('.settings-toggle-btn[data-lang]').forEach(b => {
    b.classList.toggle('active', b.dataset.lang === appLang);
  });
  document.querySelectorAll('.settings-toggle-btn[data-theme]').forEach(b => {
    b.classList.toggle('active', b.dataset.theme === appTheme);
  });
  document.querySelectorAll('.settings-toggle-btn[data-unit]').forEach(b => {
    b.classList.toggle('active', b.dataset.unit === appUnit);
  });
  document.querySelectorAll('.color-swatch').forEach(b => {
    b.classList.toggle('active', b.dataset.color === appAccent);
  });
  
  // Static labels translation
  const labels = {
    it: { settings: 'impostazioni', addCityBtn: '+ cerca e aggiungi città', savedCities: 'città salvate', searchCity: 'cerca città', searchInput: 'Es: Milano, Napoli, Parigi, Londra...', searchBtn: 'Cerca' },
    en: { settings: 'settings', addCityBtn: '+ search and add city', savedCities: 'saved cities', searchCity: 'search city', searchInput: 'Ex: Milan, Naples, Paris, London...', searchBtn: 'Search' }
  };
  
  const l = labels[appLang];
  const sTitle = document.getElementById('settingsTitle');
  if(sTitle) sTitle.innerText = l.settings;
  const addCityBtn = document.getElementById('addCityBtn');
  if(addCityBtn) addCityBtn.innerText = l.addCityBtn;
  const savedTitle = document.querySelector('.sidebar-header h2');
  if(savedTitle) savedTitle.innerText = l.savedCities;
  const searchModalTitle = document.querySelector('#addCityModal .reader-header h2');
  if(searchModalTitle) searchModalTitle.innerText = l.searchCity;
  const cSearchInput = document.getElementById('citySearchInput');
  if(cSearchInput) cSearchInput.placeholder = l.searchInput;
  const cSearchBtn = document.getElementById('searchCityBtn');
  if(cSearchBtn) cSearchBtn.innerText = l.searchBtn;
}

document.addEventListener('DOMContentLoaded', () => {
  applySettingsToDOM();
  // 1. Instant Launch: Render cached UI state immediately (0ms delay)
  renderCitiesList();
  renderCachedWeather();
  setupEventListeners();

  // 2. Fast background update for fresh weather data
  loadAllWeatherData();
});

function saveMeteoCities() {
  localStorage.setItem('GLANCE_METEO_CITIES', JSON.stringify(METEO_CITIES));
}

function saveActiveCityState(city) {
  activeCity = city;
  localStorage.setItem('GLANCE_METEO_ACTIVE_CITY_ID', city.id);
  if (city.id.startsWith('gps_')) {
    localStorage.setItem('GLANCE_METEO_GPS_CITY', JSON.stringify(city));
  }
}

function setupEventListeners() {
  // GPS Long-Press on Header City Name
  const meteoCityName = document.getElementById('meteoCityName');
  if (meteoCityName) {
    let titleTouchTimer = null;
    let isTitleLongPressPreventClick = false;

    const startGpsSearch = () => {
      if (!navigator.geolocation) {
        alert(appLang === 'en' ? 'Geolocation not supported by your browser.' : 'Geolocalizzazione non supportata dal tuo browser.');
        return;
      }
      
      meteoCityName.style.transform = 'scale(0.95)';
      setTimeout(() => meteoCityName.style.transform = 'none', 300);
      meteoCityName.innerText = appLang === 'en' ? 'GPS Searching...' : 'Rilevamento GPS...';

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;

          let realCityName = appLang === 'en' ? 'Detected Location' : 'Posizione Rilevata';
          try {
            // 1. BigDataCloud API
            const geoUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=${appLang}`;
            const geoRes = await fetch(geoUrl);
            if (geoRes.ok) {
              const geoData = await geoRes.json();
              realCityName = geoData.city || geoData.locality || geoData.principalSubdivision || realCityName;
            }
          } catch (e) { }

          if (realCityName === 'Posizione Rilevata' || realCityName === 'Detected Location') {
            try {
              // 2. Open-Meteo Reverse Geocoding API
              const geoUrl2 = `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}&language=${appLang}`;
              const res2 = await fetch(geoUrl2);
              if (res2.ok) {
                const data2 = await res2.json();
                if (data2.results && data2.results[0]) {
                  realCityName = data2.results[0].name;
                }
              }
            } catch (e) { }
          }

          const gpsCity = {
            id: 'gps_' + Date.now(),
            name: realCityName,
            lat: lat,
            lon: lon
          };

          saveActiveCityState(gpsCity);
          renderCitiesList();
          loadAllWeatherData();
        },
        (error) => {
          alert(appLang === 'en' ? 'Cannot detect GPS. Please ensure location permissions are granted.' : 'Impossibile rilevare la posizione GPS. Assicurati di aver dato i permessi di localizzazione.');
          renderCitiesList(); // restore old name
        }
      );
    };

    meteoCityName.addEventListener('touchstart', () => {
      isTitleLongPressPreventClick = false;
      titleTouchTimer = setTimeout(() => {
        isTitleLongPressPreventClick = true;
        startGpsSearch();
      }, 500);
    }, { passive: true });

    meteoCityName.addEventListener('touchend', () => clearTimeout(titleTouchTimer), { passive: true });
    meteoCityName.addEventListener('touchmove', () => clearTimeout(titleTouchTimer), { passive: true });
    
    // Also support desktop right-click or long click (mousedown)
    meteoCityName.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return; // Only left click
      isTitleLongPressPreventClick = false;
      titleTouchTimer = setTimeout(() => {
        isTitleLongPressPreventClick = true;
        startGpsSearch();
      }, 500);
    });
    meteoCityName.addEventListener('mouseup', () => clearTimeout(titleTouchTimer));
    meteoCityName.addEventListener('mouseleave', () => clearTimeout(titleTouchTimer));
    meteoCityName.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      startGpsSearch();
    });
  }

  // Sidebar Toggle & Close
  const sidebarBtn = document.getElementById('sidebarToggleBtn');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const closeSidebarBtn = document.getElementById('closeSidebarBtn');
  const toggleDeleteBtn = document.getElementById('toggleDeleteCitiesBtn');

  if (sidebarBtn && sidebar && overlay) {
    sidebarBtn.addEventListener('click', () => {
      sidebar.classList.add('open');
      overlay.classList.remove('hidden');
    });
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.add('hidden');
      deletingCitiesMode = false;
      renderCitiesList();
    });
    if (closeSidebarBtn) {
      closeSidebarBtn.addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.classList.add('hidden');
        deletingCitiesMode = false;
        renderCitiesList();
      });
    }
  }

  // Dedicated Delete Toggle Button in Sidebar Header
  if (toggleDeleteBtn) {
    toggleDeleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deletingCitiesMode = !deletingCitiesMode;
      renderCitiesList();
    });
  }

  // Settings Button & Modal
  const settingsBtn = document.getElementById('settingsBtn');
  const settingsModal = document.getElementById('settingsModal');
  const closeSettingsBtn = document.getElementById('closeSettingsBtn');

  if (settingsBtn && settingsModal) {
    settingsBtn.addEventListener('click', () => settingsModal.showModal());
  }
  if (closeSettingsBtn && settingsModal) {
    closeSettingsBtn.addEventListener('click', () => settingsModal.close());
  }

  // Settings Logic
  document.querySelectorAll('.settings-toggle-btn[data-lang]').forEach(btn => {
    btn.addEventListener('click', () => {
      appLang = btn.dataset.lang;
      localStorage.setItem('GLANCE_METEO_LANG', appLang);
      applySettingsToDOM();
      renderCachedWeather(); // Re-render with new language
    });
  });

  document.querySelectorAll('.settings-toggle-btn[data-theme]').forEach(btn => {
    btn.addEventListener('click', () => {
      appTheme = btn.dataset.theme;
      localStorage.setItem('GLANCE_METEO_THEME', appTheme);
      applySettingsToDOM();
    });
  });

  document.querySelectorAll('.settings-toggle-btn[data-unit]').forEach(btn => {
    btn.addEventListener('click', () => {
      appUnit = btn.dataset.unit;
      localStorage.setItem('GLANCE_METEO_UNIT', appUnit);
      applySettingsToDOM();
      renderCachedWeather();
      loadAllWeatherData();
    });
  });

  document.querySelectorAll('.color-swatch').forEach(btn => {
    btn.addEventListener('click', () => {
      appAccent = btn.dataset.color;
      localStorage.setItem('GLANCE_METEO_ACCENT', appAccent);
      applySettingsToDOM();
      if (appAccent === 'auto') {
        renderCachedWeather(); // Force immediate weather-based color calculation
      }
    });
  });

  // Pull to Refresh Logic
  const meteoBody = document.getElementById('meteoBodyScroll');
  const ptrIndicator = document.getElementById('pullToRefreshIndicator');
  
  if (meteoBody && ptrIndicator) {
    let startY = 0;
    let currentY = 0;
    let isPulling = false;
    
    meteoBody.addEventListener('touchstart', (e) => {
      if (window.scrollY === 0) {
        startY = e.touches[0].clientY;
        isPulling = true;
      }
    }, { passive: true });
    
    meteoBody.addEventListener('touchmove', (e) => {
      if (!isPulling) return;
      currentY = e.touches[0].clientY;
      const diff = currentY - startY;
      
      if (diff > 0 && window.scrollY === 0) {
        // Pulling down
        ptrIndicator.style.height = Math.min(diff * 0.4, 80) + 'px';
        const spinner = ptrIndicator.querySelector('.ptr-spinner');
        if (spinner) {
          spinner.style.opacity = Math.min(diff / 100, 1);
          spinner.style.transform = `rotate(${diff * 2}deg)`;
        }
      }
    }, { passive: true });
    
    meteoBody.addEventListener('touchend', (e) => {
      if (!isPulling) return;
      isPulling = false;
      const diff = currentY - startY;
      
      if (diff > 60 && window.scrollY === 0) {
        // Trigger refresh
        ptrIndicator.style.height = '60px';
        const spinner = ptrIndicator.querySelector('.ptr-spinner');
        if (spinner) {
          spinner.style.animation = 'spin 1s linear infinite';
        }
        
        loadAllWeatherData().then(() => {
          ptrIndicator.style.height = '0px';
          if (spinner) spinner.style.animation = 'none';
        });
      } else {
        ptrIndicator.style.height = '0px';
      }
    }, { passive: true });
  }

  // Add City Modal & Search
  const addCityBtn = document.getElementById('addCityBtn');
  const addCityModal = document.getElementById('addCityModal');
  const closeAddCityBtn = document.getElementById('closeAddCityBtn');
  const searchCityBtn = document.getElementById('searchCityBtn');
  const citySearchInput = document.getElementById('citySearchInput');

  if (addCityBtn && addCityModal) {
    addCityBtn.addEventListener('click', () => addCityModal.showModal());
  }
  if (closeAddCityBtn && addCityModal) {
    closeAddCityBtn.addEventListener('click', () => addCityModal.close());
  }

  if (searchCityBtn && citySearchInput) {
    searchCityBtn.addEventListener('click', () => executeCitySearch());
    citySearchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') executeCitySearch();
    });
  }
}

async function executeCitySearch() {
  const input = document.getElementById('citySearchInput');
  const resultsContainer = document.getElementById('citySearchResults');
  const query = input ? input.value.trim() : '';

  if (!query || !resultsContainer) return;

  resultsContainer.innerHTML = '<p style="color:#0078d7; text-align:center; padding:10px;">🔍 Ricerca in corso...</p>';

  try {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&language=it&count=6`;
    const res = await fetch(geoUrl);
    if (!res.ok) throw new Error('Errore ricerca');
    const data = await res.json();

    if (!data.results || data.results.length === 0) {
      resultsContainer.innerHTML = '<p style="color:#aaa; text-align:center; padding:10px;">Nessuna città trovata.</p>';
      return;
    }

    resultsContainer.innerHTML = data.results.map(city => {
      const country = city.country ? `, ${city.country}` : '';
      const admin1 = city.admin1 ? ` (${city.admin1})` : '';
      return `
        <div class="search-result-item" data-name="${escapeHtml(city.name)}" data-lat="${city.latitude}" data-lon="${city.longitude}">
          <div>
            <strong>${escapeHtml(city.name)}</strong>${admin1}${country}
          </div>
          <button class="metro-icon-btn" style="width:32px; height:32px; border-color:#0078d7; background:#0078d7; color:white;">+</button>
        </div>
      `;
    }).join('');

    resultsContainer.querySelectorAll('.search-result-item').forEach(item => {
      item.addEventListener('click', () => {
        const name = item.getAttribute('data-name');
        const lat = parseFloat(item.getAttribute('data-lat'));
        const lon = parseFloat(item.getAttribute('data-lon'));

        const newCity = {
          id: 'city_' + Date.now(),
          name: name,
          lat: lat,
          lon: lon
        };

        METEO_CITIES.push(newCity);
        saveMeteoCities();
        saveActiveCityState(newCity);
        renderCitiesList();
        loadAllWeatherData();

        document.getElementById('addCityModal').close();
        input.value = '';
        resultsContainer.innerHTML = '';
      });
    });
  } catch (err) {
    resultsContainer.innerHTML = '<p style="color:#ef4444; text-align:center; padding:10px;">Errore durante la ricerca.</p>';
  }
}

// Optimized City List Renderer with Fast Minus Button & Touch Long-Press Protection
function renderCitiesList() {
  const container = document.getElementById('citiesListContainer');
  const headerCityName = document.getElementById('meteoCityName');
  const toggleDeleteBtn = document.getElementById('toggleDeleteCitiesBtn');

  if (!container) return;

  if (headerCityName) headerCityName.innerText = activeCity.name;
  if (toggleDeleteBtn) {
    toggleDeleteBtn.classList.toggle('active-delete-mode', deletingCitiesMode);
  }

  container.innerHTML = METEO_CITIES.map(city => `
    <div class="weather-city-item ${city.id === activeCity.id ? 'active-city' : ''}" data-id="${city.id}">
      <span>${escapeHtml(city.name)}</span>
      ${deletingCitiesMode ? `<button class="city-minus-btn" data-delete-id="${city.id}" title="Elimina città" aria-label="Elimina">&minus;</button>` : ''}
    </div>
  `).join('');

  container.querySelectorAll('.weather-city-item').forEach(el => {
    let cityTouchTimer = null;

    // Long press on mobile touch devices
    el.addEventListener('touchstart', () => {
      isLongPressPreventClick = false;
      cityTouchTimer = setTimeout(() => {
        isLongPressPreventClick = true;
        deletingCitiesMode = !deletingCitiesMode;
        renderCitiesList();
      }, 450);
    }, { passive: true });

    el.addEventListener('touchend', () => clearTimeout(cityTouchTimer), { passive: true });
    el.addEventListener('touchmove', () => clearTimeout(cityTouchTimer), { passive: true });

    // Right click on desktop
    el.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      deletingCitiesMode = !deletingCitiesMode;
      renderCitiesList();
    });

    // Click handler with long-press protection
    el.addEventListener('click', (e) => {
      if (isLongPressPreventClick) {
        isLongPressPreventClick = false;
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      const deleteBtn = e.target.closest('.city-minus-btn');
      if (deleteBtn) {
        e.stopPropagation();
        e.preventDefault();
        const deleteId = deleteBtn.getAttribute('data-delete-id');
        if (METEO_CITIES.length <= 1) {
          alert("Non puoi eliminare l'unica città salvata.");
          return;
        }
        METEO_CITIES = METEO_CITIES.filter(c => c.id !== deleteId);
        if (activeCity.id === deleteId) {
          saveActiveCityState(METEO_CITIES[0]);
        }
        saveMeteoCities();
        renderCitiesList();
        loadAllWeatherData();
        return;
      }

      const clickedCity = METEO_CITIES.find(c => c.id === el.dataset.id);
      if (clickedCity) {
        saveActiveCityState(clickedCity);
        renderCitiesList();
        loadAllWeatherData();
      }
      
      const sidebar = document.getElementById('sidebar');
      const overlay = document.getElementById('sidebarOverlay');
      if (sidebar && overlay) {
        sidebar.classList.remove('open');
        overlay.classList.add('hidden');
      }
    });
  });
}

// Instant Launch: Render cached weather data from local memory immediately
function renderCachedWeather() {
  const cached = localStorage.getItem(`GLANCE_METEO_CACHE_${activeCity.id}`);
  if (!cached) return;
  try {
    const data = JSON.parse(cached);
    applyWeatherDataToDOM(data.weather, data.airQuality);
  } catch (e) {
    // Ignore cache parse error
  }
}

// Fetch Weather & Air Quality in Parallel
async function loadAllWeatherData() {
  try {
    const [weatherData, aqiData] = await Promise.all([
      fetchWeatherData(activeCity.lat, activeCity.lon),
      fetchAirQualityData(activeCity.lat, activeCity.lon)
    ]);

    if (weatherData) {
      applyWeatherDataToDOM(weatherData, aqiData);
      localStorage.setItem(`GLANCE_METEO_CACHE_${activeCity.id}`, JSON.stringify({
        weather: weatherData,
        airQuality: aqiData
      }));
    }
  } catch (e) {
    // Silent catch
  }
}

async function fetchWeatherData(lat, lon) {
  let url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,apparent_temperature,dewpoint_2m,weathercode,precipitation_probability&daily=weathercode,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max&timezone=auto`;
  if (appUnit === 'imperial') {
    url += '&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch';
  }
  const res = await fetch(url);
  if (!res.ok) return null;
  return await res.json();
}

async function fetchAirQualityData(lat, lon) {
  try {
    const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=european_aqi`;
    const res = await fetch(aqiUrl);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
}

function applyWeatherDataToDOM(data, aqiData) {
  const heroTemp = document.getElementById('weatherHeroTemp');
  const heroIcon = document.getElementById('weatherHeroIcon');
  const heroDesc = document.getElementById('weatherHeroDesc');
  const heroDetails = document.getElementById('weatherHeroDetails');
  const heroExtra = document.getElementById('weatherHeroExtra');
  const smartTipText = document.getElementById('smartTipText');
  const smartTipBadge = document.querySelector('.smart-tip-badge');
  const aqiText = document.getElementById('aqiText');
  const aqiLabel = document.querySelector('.aqi-tile .tile-label');
  const hourlyList = document.getElementById('hourlyList');
  const forecastList = document.getElementById('forecastList');
  const alertBanner = document.getElementById('meteoAlertBanner');

  if (!heroTemp || !data || !data.current_weather) return;

  const curr = data.current_weather;
  const info = getWeatherCodeSvgInfo(curr.weathercode, true);
  const maxT = Math.round(data.daily.temperature_2m_max[0]);
  const minT = Math.round(data.daily.temperature_2m_min[0]);
  const maxRainProb = data.daily.precipitation_probability_max ? data.daily.precipitation_probability_max[0] : 0;
  
  // Dynamic Auto Color Logic
  if (appAccent === 'auto') {
    let autoColor = '#0078d7'; // Default Blue
    if (curr.weathercode >= 95) autoColor = '#a200ff'; // Thunderstorm -> Purple
    else if (curr.weathercode >= 71) autoColor = '#00aba9'; // Snow -> Teal
    else if (curr.weathercode >= 51 && curr.weathercode <= 67) autoColor = '#0078d7'; // Rain -> Blue
    else if (curr.temperature >= 30) autoColor = '#e81123'; // Hot -> Red
    else if (curr.temperature >= 22) autoColor = '#f09609'; // Warm -> Orange
    else if (curr.temperature <= 5) autoColor = '#00aba9'; // Cold -> Teal
    else autoColor = '#8cbF26'; // Mild/Good weather -> Lime
    
    document.documentElement.style.setProperty('--accent-color', autoColor);
  } else {
    document.documentElement.style.setProperty('--accent-color', appAccent);
  }
  
  // Extract apparent temp and dew point from hourly array based on current time
  let apparentTemp = Math.round(curr.temperature);
  let dewPoint = Math.round(curr.temperature);
  if (data.hourly && data.hourly.time && curr.time) {
    const currentHourPrefix = curr.time.slice(0, 13);
    const hIdx = Math.max(0, data.hourly.time.findIndex(t => t.startsWith(currentHourPrefix)));
    if (data.hourly.apparent_temperature && data.hourly.apparent_temperature[hIdx] !== undefined) {
      apparentTemp = Math.round(data.hourly.apparent_temperature[hIdx]);
    }
    if (data.hourly.dewpoint_2m && data.hourly.dewpoint_2m[hIdx] !== undefined) {
      dewPoint = Math.round(data.hourly.dewpoint_2m[hIdx]);
    }
  }

  // Hero Card
  heroTemp.innerText = `${Math.round(curr.temperature)}°`;
  heroIcon.innerHTML = info.svg;
  heroDesc.innerText = info.description;
  
  const speedUnit = appUnit === 'imperial' ? 'mph' : 'km/h';
  if (appLang === 'en') {
    heroDetails.innerText = `Wind: ${curr.windspeed} ${speedUnit} • Max: ${maxT}° / Min: ${minT}°`;
    if (heroExtra) heroExtra.innerText = `Feels like: ${apparentTemp}° • Dew point: ${dewPoint}°`;
  } else {
    heroDetails.innerText = `Vento: ${curr.windspeed} ${speedUnit} • Max: ${maxT}° / Min: ${minT}°`;
    if (heroExtra) heroExtra.innerText = `Percepita: ${apparentTemp}° • P. di rugiada: ${dewPoint}°`;
  }

  // Extreme Alert (Smart Alerts)
  const alertCard = document.getElementById('alertCard');
  const alertText = document.getElementById('alertText');
  const alertBadge = document.getElementById('alertBadge');
  
  if (alertCard && alertText && alertBadge) {
    let hasAlert = false;
    let aColor = '#ff0000';
    let aText = '';
    
    const heatThreshold = appUnit === 'imperial' ? 95 : 35;
    const coldThreshold = appUnit === 'imperial' ? 32 : 0;
    const windThreshold = appUnit === 'imperial' ? 37 : 60;
    
    if (curr.temperature >= heatThreshold || maxT >= heatThreshold) {
      hasAlert = true;
      aColor = '#ff0000'; // Red
      aText = appLang === 'en' ? 'Extreme Heat Alert!' : 'Allerta Caldo Estremo!';
    } else if (curr.temperature <= coldThreshold || minT <= coldThreshold) {
      hasAlert = true;
      aColor = '#0078d7'; // Blue/Ice
      aText = appLang === 'en' ? 'Ice/Freezing Alert!' : 'Allerta Ghiaccio / Gelo!';
    } else if (curr.weathercode >= 95) {
      hasAlert = true;
      aColor = '#a200ff'; // Purple
      aText = appLang === 'en' ? 'Severe Thunderstorms Alert!' : 'Allerta Temporali Forti in corso!';
    } else if (curr.windspeed >= windThreshold) {
      hasAlert = true;
      aColor = '#ff0097'; // Magenta
      aText = appLang === 'en' ? 'Strong Wind Alert!' : 'Allerta Vento Forte!';
    }
    
    if (hasAlert) {
      alertCard.style.display = 'block';
      alertCard.style.borderLeftColor = aColor;
      alertBadge.style.backgroundColor = aColor;
      alertBadge.innerText = appLang === 'en' ? 'alert' : 'allerta';
      alertText.innerText = aText;
    } else {
      alertCard.style.display = 'none';
    }
  }

  // Smart Tip
  if (smartTipText) {
    if (smartTipBadge) smartTipBadge.innerText = appLang === 'en' ? 'tip' : 'consiglio';
    smartTipText.innerText = generateSmartTip(curr.temperature, curr.weathercode, maxRainProb, curr.windspeed);
  }

  // Sunrise & Sunset Timeline
  const astroLabelSunrise = document.querySelector('.astro-card .astro-label-small:nth-child(1)');
  const astroLabelSunset = document.querySelector('.astro-card .astro-label-small:nth-child(2)');
  if (astroLabelSunrise) astroLabelSunrise.innerHTML = (appLang === 'en' ? 'SUNRISE <br>' : 'ALBA <br>') + '<strong id="sunriseTime">--:--</strong>';
  if (astroLabelSunset) astroLabelSunset.innerHTML = (appLang === 'en' ? 'SUNSET <br>' : 'TRAMONTO <br>') + '<strong id="sunsetTime">--:--</strong>';

  const sunriseTimeEl = document.getElementById('sunriseTime');
  const sunsetTimeEl = document.getElementById('sunsetTime');

  if (sunriseTimeEl && sunsetTimeEl && data.daily.sunrise && data.daily.sunset) {
    const sunriseTimeStr = data.daily.sunrise[0];
    const sunsetTimeStr = data.daily.sunset[0];
    
    const sunriseVal = new Date(sunriseTimeStr).toLocaleTimeString(appLang === 'en' ? 'en-US' : 'it-IT', { hour: '2-digit', minute: '2-digit' });
    const sunsetVal = new Date(sunsetTimeStr).toLocaleTimeString(appLang === 'en' ? 'en-US' : 'it-IT', { hour: '2-digit', minute: '2-digit' });
    sunriseTimeEl.innerText = sunriseVal;
    sunsetTimeEl.innerText = sunsetVal;
    
    // Timeline calculation
    const nowMs = new Date(curr.time).getTime();
    const riseMs = new Date(sunriseTimeStr).getTime();
    const setMs = new Date(sunsetTimeStr).getTime();
    const progress = document.getElementById('astroProgress');
    const iconDiv = document.getElementById('astroIcon');
    
    if (progress && iconDiv) {
      if (nowMs >= riseMs && nowMs <= setMs) {
        // Daytime
        const pct = ((nowMs - riseMs) / (setMs - riseMs)) * 100;
        progress.style.width = `${pct}%`;
        iconDiv.style.left = `${pct}%`;
        iconDiv.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="1.8" fill="none"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
      } else {
        // Nighttime
        let prevSetMs = setMs - 86400000;
        let nextRiseMs = riseMs;
        if (nowMs > setMs) {
          prevSetMs = setMs;
          nextRiseMs = riseMs + 86400000;
        }
        let pct = ((nowMs - prevSetMs) / (nextRiseMs - prevSetMs)) * 100;
        if (pct < 0) pct = 0;
        if (pct > 100) pct = 100;
        progress.style.width = `${pct}%`;
        iconDiv.style.left = `${pct}%`;
        iconDiv.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="1.8" fill="none"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
      }
    }
  }

  // Air Quality
  if (aqiLabel) aqiLabel.innerText = appLang === 'en' ? 'air quality' : "qualità dell'aria";
  
  if (aqiText) {
    if (aqiData && aqiData.current && aqiData.current.european_aqi !== undefined) {
      const aqi = aqiData.current.european_aqi;
      let label = appLang === 'en' ? 'Excellent 🟢' : 'Ottima 🟢';
      if (aqi > 20 && aqi <= 40) label = appLang === 'en' ? 'Good 🟢' : 'Buona 🟢';
      else if (aqi > 40 && aqi <= 60) label = appLang === 'en' ? 'Moderate 🟡' : 'Moderata 🟡';
      else if (aqi > 60 && aqi <= 80) label = appLang === 'en' ? 'Poor 🔴' : 'Scadente 🔴';
      else if (aqi > 80) label = appLang === 'en' ? 'Very Poor 🔴' : 'Pessima 🔴';

      aqiText.innerText = `${label} (AQI ${Math.round(aqi)})`;
    } else {
      aqiText.innerText = appLang === 'en' ? 'Good 🟢' : 'Buona 🟢';
    }
  }

  // Hourly Forecast
  const hourlyTitle = document.querySelector('.forecast-section:nth-of-type(4) .forecast-section-title');
  if (hourlyTitle) hourlyTitle.innerText = appLang === 'en' ? 'next 24 hours' : 'prossime 24 ore (orario)';
  
  if (hourlyList && data.hourly && curr.time) {
    const currentHourPrefix = curr.time.slice(0, 13);
    let startIndex = data.hourly.time.findIndex(t => t.startsWith(currentHourPrefix));
    if (startIndex === -1) startIndex = 0;

    let hourlyHtml = '';
    for (let i = startIndex; i < Math.min(startIndex + 24, data.hourly.time.length); i++) {
      const timeObj = new Date(data.hourly.time[i]);
      const timeLabel = timeObj.toLocaleTimeString(appLang === 'en' ? 'en-US' : 'it-IT', { hour: '2-digit', minute: '2-digit' });
      const hCode = getWeatherCodeSvgInfo(data.hourly.weathercode[i], false);
      const hTemp = Math.round(data.hourly.temperature_2m[i]);
      const hRain = data.hourly.precipitation_probability ? data.hourly.precipitation_probability[i] : 0;

      const isCurrentHour = (i === startIndex);

      hourlyHtml += `
        <div class="hourly-item ${isCurrentHour ? 'current-hour' : ''}">
          <div class="hourly-time">${timeLabel}</div>
          <div class="hourly-icon">${hCode.svg}</div>
          <div class="hourly-temp">${hTemp}°</div>
          <div class="hourly-rain">${hRain > 0 ? `💧 ${hRain}%` : ''}</div>
        </div>
      `;
    }
    hourlyList.innerHTML = hourlyHtml;
  }

  // 7-Day Forecast
  const dailyTitle = document.querySelector('.forecast-section:nth-of-type(5) .forecast-section-title');
  if (dailyTitle) dailyTitle.innerText = appLang === 'en' ? 'next 7 days' : 'prossimi 7 giorni';
  
  if (forecastList && data.daily) {
    let html = '';
    for (let i = 0; i < data.daily.time.length; i++) {
      const dateObj = new Date(data.daily.time[i]);
      let dayName = i === 0 ? (appLang === 'en' ? 'Today' : 'Oggi') : dateObj.toLocaleDateString(appLang === 'en' ? 'en-US' : 'it-IT', { weekday: 'short', day: 'numeric', month: 'short' });
      const codeInfo = getWeatherCodeSvgInfo(data.daily.weathercode[i], false);
      const maxD = Math.round(data.daily.temperature_2m_max[i]);
      const minD = Math.round(data.daily.temperature_2m_min[i]);

      html += `
        <div class="forecast-item">
          <div class="forecast-day">${dayName}</div>
          <div class="forecast-icon">${codeInfo.svg}</div>
          <div class="forecast-temps">
            <span class="forecast-max">${maxD}°</span>
            <span class="forecast-min">${minD}°</span>
          </div>
        </div>
      `;
    }
    forecastList.innerHTML = html;
  }
}

function generateSmartTip(temp, code, rainProb, wind) {
  const en = appLang === 'en';
  if (code >= 95) return en ? 'Severe thunderstorms expected: stay safe indoors!' : 'Temporali forti in vista: resta al sicuro al coperto!';
  if (code >= 51 && code <= 67 || rainProb >= 40) return en ? 'Rain expected today: remember your umbrella!' : 'Probabile pioggia oggi: ricordati di portare l’ombrello!';
  if (code >= 71) return en ? 'Snow expected: dress warmly with appropriate footwear!' : 'Nevicate previste: abbigliamento molto caldo e calzature adatte!';
  if (temp >= 30) return en ? 'Very hot and sunny day: sunglasses and hydration recommended.' : 'Giornata molto calda e soleggiata: consigliati occhiali da sole e idratazione.';
  if (temp >= 22) return en ? 'Mild and pleasant weather: perfect for light summer clothing.' : 'Clima mite e piacevole: ideale per abbigliamento leggero estivo.';
  if (temp >= 14) return en ? 'Cool weather: a light jacket or hoodie is recommended.' : 'Clima fresco: consigliata una felpa o giacca leggera.';
  if (temp < 14 && temp >= 5) return en ? 'Cold day: wear a warm coat or jacket.' : 'Giornata fredda: indossa un cappotto o giubbotto caldo.';
  if (temp < 5) return en ? 'Freezing cold: gloves, beanie, and scarf recommended.' : 'Gelo e freddo intenso: consigliati guanti, berretto e sciarpa.';
  return en ? 'Have a great day! The weather is perfect for heading outside.' : 'Buona giornata! Il clima è perfetto per uscire.';
}

function getWeatherCodeSvgInfo(code, isLarge = false) {
  const size = isLarge ? 56 : 26;
  const stroke = isLarge ? 1.5 : 1.8;
  const en = appLang === 'en';

  if (code === 0) {
    return {
      description: en ? 'Clear' : 'Sereno',
      svg: `<svg viewBox="0 0 24 24" width="${size}" height="${size}" stroke="currentColor" stroke-width="${stroke}" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`
    };
  }
  if (code >= 1 && code <= 3) {
    return {
      description: en ? 'Partly Cloudy' : 'Poco nuvoloso',
      svg: `<svg viewBox="0 0 24 24" width="${size}" height="${size}" stroke="currentColor" stroke-width="${stroke}" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path></svg>`
    };
  }
  if (code >= 45 && code <= 48) {
    return {
      description: en ? 'Fog' : 'Nebbia',
      svg: `<svg viewBox="0 0 24 24" width="${size}" height="${size}" stroke="currentColor" stroke-width="${stroke}" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>`
    };
  }
  if (code >= 51 && code <= 67 || (code >= 80 && code <= 82)) {
    return {
      description: en ? 'Rain' : 'Pioggia',
      svg: `<svg viewBox="0 0 24 24" width="${size}" height="${size}" stroke="currentColor" stroke-width="${stroke}" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="16" y1="13" x2="14" y2="21"></line><line x1="10" y1="13" x2="8" y2="21"></line><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"></path></svg>`
    };
  }
  if (code >= 71 && code <= 77) {
    return {
      description: en ? 'Snow' : 'Neve',
      svg: `<svg viewBox="0 0 24 24" width="${size}" height="${size}" stroke="currentColor" stroke-width="${stroke}" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line><line x1="4.93" y1="19.07" x2="19.07" y2="4.93"></line></svg>`
    };
  }
  if (code >= 95 && code <= 99) {
    return {
      description: en ? 'Thunderstorm' : 'Temporale',
      svg: `<svg viewBox="0 0 24 24" width="${size}" height="${size}" stroke="currentColor" stroke-width="${stroke}" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M19 16.9A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 9"></path><polyline points="13 11 9 17 15 17 11 23"></polyline></svg>`
    };
  }

  return {
    description: en ? 'Clear' : 'Sereno',
    svg: `<svg viewBox="0 0 24 24" width="${size}" height="${size}" stroke="currentColor" stroke-width="${stroke}" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`
  };
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
