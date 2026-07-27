/* Glance Meteo - Application Logic */

const DEFAULT_METEO_CITIES = [
  { id: 'roma', name: 'Roma', lat: 41.9028, lon: 12.4964 },
  { id: 'milano', name: 'Milano', lat: 45.4642, lon: 9.1900 },
  { id: 'napoli', name: 'Napoli', lat: 40.8518, lon: 14.2681 },
  { id: 'torino', name: 'Torino', lat: 45.0703, lon: 7.6869 },
  { id: 'firenze', name: 'Firenze', lat: 43.7696, lon: 11.2558 }
];

let METEO_CITIES = JSON.parse(localStorage.getItem('GLANCE_METEO_CITIES')) || DEFAULT_METEO_CITIES;
let activeCity = METEO_CITIES[0];
let deletingCitiesMode = false;

document.addEventListener('DOMContentLoaded', () => {
  renderCitiesList();
  setupEventListeners();
  loadCurrentAndForecastWeather();
});

function saveMeteoCities() {
  localStorage.setItem('GLANCE_METEO_CITIES', JSON.stringify(METEO_CITIES));
}

function setupEventListeners() {
  // Sidebar Toggle
  const sidebarBtn = document.getElementById('sidebarToggleBtn');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const closeSidebarBtn = document.getElementById('closeSidebarBtn');

  if (sidebarBtn && sidebar && overlay) {
    sidebarBtn.addEventListener('click', () => {
      sidebar.classList.add('open');
      overlay.classList.remove('hidden');
    });
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.add('hidden');
    });
    if (closeSidebarBtn) {
      closeSidebarBtn.addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.classList.add('hidden');
      });
    }
  }

  // Refresh Weather
  const refreshBtn = document.getElementById('refreshBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      refreshBtn.style.transform = 'rotate(360deg)';
      setTimeout(() => refreshBtn.style.transform = 'none', 600);
      loadCurrentAndForecastWeather();
    });
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
        activeCity = newCity;
        saveMeteoCities();
        renderCitiesList();
        loadCurrentAndForecastWeather();

        document.getElementById('addCityModal').close();
        input.value = '';
        resultsContainer.innerHTML = '';
      });
    });
  } catch (err) {
    resultsContainer.innerHTML = '<p style="color:#ef4444; text-align:center; padding:10px;">Errore durante la ricerca.</p>';
  }
}

function renderCitiesList() {
  const container = document.getElementById('citiesListContainer');
  const headerCityName = document.getElementById('meteoCityName');
  if (!container) return;

  if (headerCityName) headerCityName.innerText = activeCity.name;

  container.innerHTML = METEO_CITIES.map(city => `
    <div class="weather-city-item ${city.id === activeCity.id ? 'active-city' : ''}" data-id="${city.id}">
      <span>${escapeHtml(city.name)}</span>
      ${deletingCitiesMode ? `<button class="city-minus-btn" data-delete-id="${city.id}" title="Elimina città">&minus;</button>` : ''}
    </div>
  `).join('');

  container.querySelectorAll('.weather-city-item').forEach(el => {
    el.addEventListener('click', (e) => {
      const deleteBtn = e.target.closest('.city-minus-btn');
      if (deleteBtn) {
        e.stopPropagation();
        const deleteId = deleteBtn.getAttribute('data-delete-id');
        if (METEO_CITIES.length <= 1) {
          alert("Non puoi eliminare l'unica città salvata.");
          return;
        }
        METEO_CITIES = METEO_CITIES.filter(c => c.id !== deleteId);
        if (activeCity.id === deleteId) {
          activeCity = METEO_CITIES[0];
        }
        saveMeteoCities();
        renderCitiesList();
        loadCurrentAndForecastWeather();
        return;
      }

      activeCity = METEO_CITIES.find(c => c.id === el.dataset.id);
      renderCitiesList();
      loadCurrentAndForecastWeather();
      
      const sidebar = document.getElementById('sidebar');
      const overlay = document.getElementById('sidebarOverlay');
      if (sidebar && overlay) {
        sidebar.classList.remove('open');
        overlay.classList.add('hidden');
      }
    });

    // Right click / Long press toggles red minus buttons
    el.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      deletingCitiesMode = !deletingCitiesMode;
      renderCitiesList();
    });

    let cityTouchTimer = null;
    el.addEventListener('touchstart', () => {
      cityTouchTimer = setTimeout(() => {
        deletingCitiesMode = !deletingCitiesMode;
        renderCitiesList();
      }, 450);
    }, { passive: true });

    el.addEventListener('touchend', () => clearTimeout(cityTouchTimer), { passive: true });
    el.addEventListener('touchmove', () => clearTimeout(cityTouchTimer), { passive: true });
  });
}

async function loadCurrentAndForecastWeather() {
  const heroTemp = document.getElementById('weatherHeroTemp');
  const heroIcon = document.getElementById('weatherHeroIcon');
  const heroDesc = document.getElementById('weatherHeroDesc');
  const heroDetails = document.getElementById('weatherHeroDetails');
  const forecastList = document.getElementById('forecastList');

  if (!heroTemp) return;

  heroDesc.innerText = 'Caricamento meteo...';

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${activeCity.lat}&longitude=${activeCity.lon}&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('API Error');
    const data = await res.json();

    const curr = data.current_weather;
    const info = getWeatherCodeInfo(curr.weathercode);

    heroTemp.innerText = `${Math.round(curr.temperature)}°`;
    heroIcon.innerText = info.icon;
    heroDesc.innerText = info.description;
    heroDetails.innerText = `Vento: ${curr.windspeed} km/h • Max: ${Math.round(data.daily.temperature_2m_max[0])}° / Min: ${Math.round(data.daily.temperature_2m_min[0])}°`;

    // Render 7-Day Forecast
    if (forecastList && data.daily) {
      let html = '';
      for (let i = 0; i < data.daily.time.length; i++) {
        const dateObj = new Date(data.daily.time[i]);
        const dayName = i === 0 ? 'Oggi' : dateObj.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' });
        const codeInfo = getWeatherCodeInfo(data.daily.weathercode[i]);
        const maxT = Math.round(data.daily.temperature_2m_max[i]);
        const minT = Math.round(data.daily.temperature_2m_min[i]);

        html += `
          <div class="forecast-item">
            <div class="forecast-day">${dayName}</div>
            <div class="forecast-icon">${codeInfo.icon}</div>
            <div class="forecast-temps">
              <span class="forecast-max">${maxT}°</span>
              <span class="forecast-min">${minT}°</span>
            </div>
          </div>
        `;
      }
      forecastList.innerHTML = html;
    }
  } catch (err) {
    heroDesc.innerText = 'Impossibile caricare il meteo. Riprova.';
  }
}

function getWeatherCodeInfo(code) {
  if (code === 0) return { icon: '☀️', description: 'Sereno' };
  if (code >= 1 && code <= 3) return { icon: '⛅', description: 'Poco nuvoloso' };
  if (code >= 45 && code <= 48) return { icon: '🌫️', description: 'Nebbia' };
  if (code >= 51 && code <= 67) return { icon: '🌧️', description: 'Pioggia' };
  if (code >= 71 && code <= 77) return { icon: '❄️', description: 'Neve' };
  if (code >= 80 && code <= 82) return { icon: '🌦️', description: 'Rovesci' };
  if (code >= 95 && code <= 99) return { icon: '🌩️', description: 'Temporale' };
  return { icon: '☀️', description: 'Sereno' };
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
