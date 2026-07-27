/* Glance Meteo - Application Logic with WP8 Vector Icons & Refined Layout */

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
  loadAllWeatherData();
});

function saveMeteoCities() {
  localStorage.setItem('GLANCE_METEO_CITIES', JSON.stringify(METEO_CITIES));
}

function setupEventListeners() {
  // 1. GPS Button Listener
  const gpsBtn = document.getElementById('gpsBtn');
  if (gpsBtn) {
    gpsBtn.addEventListener('click', () => {
      if (!navigator.geolocation) {
        alert('Geolocalizzazione non supportata dal tuo browser.');
        return;
      }
      gpsBtn.style.transform = 'scale(0.85)';
      setTimeout(() => gpsBtn.style.transform = 'none', 300);

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;

          let gpsCityName = 'Posizione Attuale';
          try {
            const revUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${lat},${lon}&count=1`;
            const revRes = await fetch(revUrl);
            if (revRes.ok) {
              const revData = await revRes.json();
              if (revData.results && revData.results[0]) {
                gpsCityName = revData.results[0].name;
              }
            }
          } catch (e) {
            // Fallback
          }

          const gpsCity = {
            id: 'gps_' + Date.now(),
            name: `📍 ${gpsCityName}`,
            lat: lat,
            lon: lon
          };

          activeCity = gpsCity;
          renderCitiesList();
          loadAllWeatherData();
        },
        (error) => {
          alert('Impossibile rilevare la posizione GPS. Assicurati di aver dato i permessi di localizzazione.');
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    });
  }

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
      loadAllWeatherData();
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
        loadAllWeatherData();
        return;
      }

      activeCity = METEO_CITIES.find(c => c.id === el.dataset.id);
      renderCitiesList();
      loadAllWeatherData();
      
      const sidebar = document.getElementById('sidebar');
      const overlay = document.getElementById('sidebarOverlay');
      if (sidebar && overlay) {
        sidebar.classList.remove('open');
        overlay.classList.add('hidden');
      }
    });

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

/* Master Data Fetching (Forecast + Hourly + Air Quality + Tips) */
async function loadAllWeatherData() {
  await Promise.all([
    loadCurrentAndForecastWeather(),
    loadAirQualityData()
  ]);
}

async function loadCurrentAndForecastWeather() {
  const heroTemp = document.getElementById('weatherHeroTemp');
  const heroIcon = document.getElementById('weatherHeroIcon');
  const heroDesc = document.getElementById('weatherHeroDesc');
  const heroDetails = document.getElementById('weatherHeroDetails');
  const smartTipText = document.getElementById('smartTipText');
  const sunriseTimeEl = document.getElementById('sunriseTime');
  const sunsetTimeEl = document.getElementById('sunsetTime');
  const hourlyList = document.getElementById('hourlyList');
  const forecastList = document.getElementById('forecastList');
  const alertBanner = document.getElementById('meteoAlertBanner');

  if (!heroTemp) return;

  heroDesc.innerText = 'Caricamento meteo...';

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${activeCity.lat}&longitude=${activeCity.lon}&current_weather=true&hourly=temperature_2m,weathercode,precipitation_probability&daily=weathercode,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('API Error');
    const data = await res.json();

    const curr = data.current_weather;
    const info = getWeatherCodeSvgInfo(curr.weathercode, true);
    const maxT = Math.round(data.daily.temperature_2m_max[0]);
    const minT = Math.round(data.daily.temperature_2m_min[0]);
    const maxRainProb = data.daily.precipitation_probability_max ? data.daily.precipitation_probability_max[0] : 0;

    // 1. Current Weather Hero Card
    heroTemp.innerText = `${Math.round(curr.temperature)}°`;
    heroIcon.innerHTML = info.svg;
    heroDesc.innerText = info.description;
    heroDetails.innerText = `Vento: ${curr.windspeed} km/h • Max: ${maxT}° / Min: ${minT}°`;

    // 2. Extreme Weather Alert Banner
    if (alertBanner) {
      if (curr.temperature >= 35) {
        alertBanner.classList.remove('hidden');
        document.getElementById('meteoAlertText').innerText = 'Allerta Caldo Estremo: temperatura oltre 35°C!';
      } else if (curr.temperature <= 0) {
        alertBanner.classList.remove('hidden');
        document.getElementById('meteoAlertText').innerText = 'Allerta Gelo: pericolo ghiaccio sulle strade!';
      } else if (curr.weathercode >= 95) {
        alertBanner.classList.remove('hidden');
        document.getElementById('meteoAlertText').innerText = 'Allerta Temporali Forti in corso!';
      } else {
        alertBanner.classList.add('hidden');
      }
    }

    // 3. Smart Daily Tip
    if (smartTipText) {
      smartTipText.innerText = generateSmartTip(curr.temperature, curr.weathercode, maxRainProb, curr.windspeed);
    }

    // 4. Sunrise & Sunset
    if (sunriseTimeEl && sunsetTimeEl && data.daily.sunrise && data.daily.sunset) {
      const sunriseVal = new Date(data.daily.sunrise[0]).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
      const sunsetVal = new Date(data.daily.sunset[0]).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
      sunriseTimeEl.innerText = sunriseVal;
      sunsetTimeEl.innerText = sunsetVal;
    }

    // 5. Hourly Forecast List (Next 24 Hours)
    if (hourlyList && data.hourly) {
      const now = new Date();
      const currentHourStr = now.toISOString().slice(0, 13);
      let startIndex = data.hourly.time.findIndex(t => t.startsWith(currentHourStr));
      if (startIndex === -1) startIndex = 0;

      let hourlyHtml = '';
      for (let i = startIndex; i < Math.min(startIndex + 24, data.hourly.time.length); i++) {
        const timeObj = new Date(data.hourly.time[i]);
        const timeLabel = timeObj.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
        const hCode = getWeatherCodeSvgInfo(data.hourly.weathercode[i], false);
        const hTemp = Math.round(data.hourly.temperature_2m[i]);
        const hRain = data.hourly.precipitation_probability ? data.hourly.precipitation_probability[i] : 0;

        hourlyHtml += `
          <div class="hourly-item">
            <div class="hourly-time">${timeLabel}</div>
            <div class="hourly-icon">${hCode.svg}</div>
            <div class="hourly-temp">${hTemp}°</div>
            <div class="hourly-rain">${hRain > 0 ? `💧 ${hRain}%` : ''}</div>
          </div>
        `;
      }
      hourlyList.innerHTML = hourlyHtml;
    }

    // 6. 7-Day Daily Forecast List
    if (forecastList && data.daily) {
      let html = '';
      for (let i = 0; i < data.daily.time.length; i++) {
        const dateObj = new Date(data.daily.time[i]);
        const dayName = i === 0 ? 'Oggi' : dateObj.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' });
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
  } catch (err) {
    heroDesc.innerText = 'Impossibile caricare il meteo. Riprova.';
  }
}

/* Fetch Air Quality Index (AQI) */
async function loadAirQualityData() {
  const aqiText = document.getElementById('aqiText');
  if (!aqiText) return;

  try {
    const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${activeCity.lat}&longitude=${activeCity.lon}&current=european_aqi`;
    const res = await fetch(aqiUrl);
    if (!res.ok) throw new Error('AQI Error');
    const data = await res.json();

    if (data.current && data.current.european_aqi !== undefined) {
      const aqi = data.current.european_aqi;
      let label = 'Ottima 🟢';
      if (aqi > 20 && aqi <= 40) label = 'Buona 🟢';
      else if (aqi > 40 && aqi <= 60) label = 'Moderata 🟡';
      else if (aqi > 60 && aqi <= 80) label = 'Scadente 🔴';
      else if (aqi > 80) label = 'Pessima 🔴';

      aqiText.innerText = `${label} (AQI ${Math.round(aqi)})`;
    } else {
      aqiText.innerText = 'Buona 🟢';
    }
  } catch (e) {
    aqiText.innerText = 'Buona 🟢';
  }
}

/* Smart Daily Clothing Tip Generator */
function generateSmartTip(temp, code, rainProb, wind) {
  if (code >= 95) return 'Temporali forti in vista: resta al sicuro al coperto!';
  if (code >= 51 && code <= 67 || rainProb >= 40) return 'Probabile pioggia oggi: ricordati di portare l’ombrello!';
  if (code >= 71) return 'Nevicate previste: abbigliamento molto caldo e calzature adatte!';
  if (temp >= 30) return 'Giornata molto calda e soleggiata: consigliati occhiali da sole e idratazione.';
  if (temp >= 22) return 'Clima mite e piacevole: ideale per abbigliamento leggero estivo.';
  if (temp >= 14) return 'Clima fresco: consigliata una felpa o giacca leggera.';
  if (temp < 14 && temp >= 5) return 'Giornata fredda: indossa un cappotto o giubbotto caldo.';
  if (temp < 5) return 'Gelo e freddo intenso: consigliati guanti, berretto e sciarpa.';
  return 'Buona giornata! Il clima è perfetto per uscire.';
}

/* Authentic WP8 Vector SVG Weather Icons */
function getWeatherCodeSvgInfo(code, isLarge = false) {
  const size = isLarge ? 56 : 26;
  const stroke = isLarge ? 1.5 : 1.8;

  if (code === 0) {
    return {
      description: 'Sereno',
      svg: `<svg viewBox="0 0 24 24" width="${size}" height="${size}" stroke="currentColor" stroke-width="${stroke}" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`
    };
  }
  if (code >= 1 && code <= 3) {
    return {
      description: 'Poco nuvoloso',
      svg: `<svg viewBox="0 0 24 24" width="${size}" height="${size}" stroke="currentColor" stroke-width="${stroke}" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path></svg>`
    };
  }
  if (code >= 45 && code <= 48) {
    return {
      description: 'Nebbia',
      svg: `<svg viewBox="0 0 24 24" width="${size}" height="${size}" stroke="currentColor" stroke-width="${stroke}" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>`
    };
  }
  if (code >= 51 && code <= 67 || (code >= 80 && code <= 82)) {
    return {
      description: 'Pioggia',
      svg: `<svg viewBox="0 0 24 24" width="${size}" height="${size}" stroke="currentColor" stroke-width="${stroke}" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="16" y1="13" x2="14" y2="21"></line><line x1="10" y1="13" x2="8" y2="21"></line><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"></path></svg>`
    };
  }
  if (code >= 71 && code <= 77) {
    return {
      description: 'Neve',
      svg: `<svg viewBox="0 0 24 24" width="${size}" height="${size}" stroke="currentColor" stroke-width="${stroke}" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line><line x1="4.93" y1="19.07" x2="19.07" y2="4.93"></line></svg>`
    };
  }
  if (code >= 95 && code <= 99) {
    return {
      description: 'Temporale',
      svg: `<svg viewBox="0 0 24 24" width="${size}" height="${size}" stroke="currentColor" stroke-width="${stroke}" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M19 16.9A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 9"></path><polyline points="13 11 9 17 15 17 11 23"></polyline></svg>`
    };
  }

  return {
    description: 'Sereno',
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
