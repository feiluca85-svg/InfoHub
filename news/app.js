/* Glance News - Application Logic (Ultra-fast Client RSS Parser, Robust Proxy Waterfall, 0 Console Errors) */

const ALL_SEARCHABLE_SOURCES = [
  // Generali / Prima Pagina / Italia
  { name: 'ANSA Ultima Ora', url: 'https://www.ansa.it/sito/ansait_rss.xml', category: 'prima-pagina', tags: 'ansa notizie italia prima pagina news ultime notizie' },
  { name: 'ANSA Italia', url: 'https://www.ansa.it/sito/notizie/italia/italia_rss.xml', category: 'italia', tags: 'ansa italia notizie cronaca' },
  { name: 'ANSA Mondo', url: 'https://www.ansa.it/sito/notizie/mondo/mondo_rss.xml', category: 'mondo', tags: 'ansa mondo esteri internazionale' },
  { name: 'ANSA Economia', url: 'https://www.ansa.it/sito/notizie/economia/economia_rss.xml', category: 'economia', tags: 'ansa finanza economia borse' },
  { name: 'ANSA Tecnologia', url: 'https://www.ansa.it/sito/notizie/tecnologia/tecnologia_rss.xml', category: 'tecnologia', tags: 'ansa tech tecnologia scienza' },
  
  { name: 'Corriere della Sera', url: 'https://xml2.corriereobjects.it/rss/homepage.xml', category: 'prima-pagina', tags: 'corriere sera notizie italia prima pagina coriere' },
  { name: 'La Repubblica', url: 'https://www.repubblica.it/rss/homepage/rss2.0.xml', category: 'prima-pagina', tags: 'repubblica rep notizie italia prima pagina republica' },
  { name: 'Il Sole 24 Ore', url: 'https://www.ilsole24ore.com/rss/italia.xml', category: 'economia', tags: 'sole 24 ore economia finanza borse mercati italia' },
  { name: 'TGCOM24', url: 'https://www.tgcom24.mediaset.it/rss/homepage.xml', category: 'italia', tags: 'tgcom tgcom24 mediaset notizie cronaca italia' },
  { name: 'Il Fatto Quotidiano', url: 'https://www.ilfattoquotidiano.it/feed/', category: 'italia', tags: 'fatto quotidiano fattoquotidiano travaglio notizie politica' },
  { name: 'Fanpage.it', url: 'https://www.fanpage.it/feed/', category: 'italia', tags: 'fanpage fanpageit notizie cronaca italia' },
  { name: 'Open Online', url: 'https://www.open.online/feed/', category: 'italia', tags: 'open mentana notizie giovani italia' },
  { name: 'Il Post', url: 'https://www.ilpost.it/feed/', category: 'italia', tags: 'post ilpost notizie spiegato bene cultura' },
  { name: 'La Stampa', url: 'https://www.lastampa.it/rss/homepage.xml', category: 'prima-pagina', tags: 'stampa la stampa torino notizie italia' },
  { name: 'Il Messaggero', url: 'https://www.ilmessaggero.it/rss/home.xml', category: 'italia', tags: 'messaggero il messaggero roma notizie' },
  { name: 'Il Giornale', url: 'https://www.ilgiornale.it/feed.xml', category: 'italia', tags: 'giornale il giornale gornale notizie politica' },
  { name: 'Libero Quotidiano', url: 'https://www.liberoquotidiano.it/rss.xml', category: 'italia', tags: 'libero quotidiano notizie italia' },
  { name: 'Rai News', url: 'https://www.rainews.it/rss/tutti', category: 'italia', tags: 'rainews rai notizie italia mondo' },
  { name: 'AGI Agenzia Italia', url: 'https://www.agi.it/rss', category: 'italia', tags: 'agi agenzia italia notizie' },
  { name: 'Adnkronos', url: 'https://www.adnkronos.com/rss/ultima-ora', category: 'italia', tags: 'adnkronos agenzia notizie' },

  // Sport
  { name: 'La Gazzetta dello Sport', url: 'https://www.gazzetta.it/rss/home.xml', category: 'sport', tags: 'gazzetta gazzeta sport calcio serie a champions formula 1 moto' },
  { name: 'Corriere dello Sport', url: 'https://www.corrieredellosport.it/rss', category: 'sport', tags: 'corriere sport corriere dello sport coriere calcio serie a' },
  { name: 'Tuttosport', url: 'https://www.tuttosport.com/rss', category: 'sport', tags: 'tuttosport tutto sport juve torino calcio' },
  { name: 'Sky Sport', url: 'https://sport.sky.it/rss/sport.xml', category: 'sport', tags: 'sky sport calcio formula 1 motogp tennis' },
  { name: 'Eurosport Italia', url: 'https://it.eurosport.com/rss.xml', category: 'sport', tags: 'eurosport sport tennis ciclismo sci' },
  { name: 'Calciomercato.com', url: 'https://www.calciomercato.com/feed', category: 'sport', tags: 'calciomercato calcio trasferimenti serie a' },

  // Tecnologia & Scienza
  { name: 'Wired Italia', url: 'https://www.wired.it/feed/rss', category: 'tecnologia', tags: 'wired tecnologia tech innovazione scienza gadgets' },
  { name: 'HDblog.it', url: 'https://www.hdblog.it/feed/', category: 'tecnologia', tags: 'hdblog hd blog smartphone android apple recensioni tech' },
  { name: 'Tom\'s Hardware Italia', url: 'https://www.tomshw.it/feed', category: 'tecnologia', tags: 'toms hardware tomshardware pc componenti giochi tech' },
  { name: 'Hardware Upgrade', url: 'https://www.hwupgrade.it/rss_news.xml', category: 'tecnologia', tags: 'hwupgrade hardware upgrade pc scheda video tech' },
  { name: 'DDAY.it', url: 'https://www.dday.it/rss.xml', category: 'tecnologia', tags: 'dday ddayit tv audio fotocamera tecnologia' },
  { name: 'Punto Informatico', url: 'https://www.punto-informatico.it/feed/', category: 'tecnologia', tags: 'punto informatico software sicurezza web tech' },
  { name: 'TechCrunch', url: 'https://techcrunch.com/feed/', category: 'tecnologia', tags: 'techcrunch startup tecnologia intelligenza artificiale ai' },
  { name: 'Multiplayer.it', url: 'https://multiplayer.it/feed/rss/news/', category: 'tecnologia', tags: 'multiplayer videogiochi gaming ps5 xbox nintendo' },
  { name: 'Everyeye.it', url: 'https://www.everyeye.it/feed/feed_news_rss.asp', category: 'tecnologia', tags: 'everyeye gaming videogiochi anime cinema' },
  { name: 'Focus.it Scienza', url: 'https://www.focus.it/rss', category: 'tecnologia', tags: 'focus scienza spazio natura ambiente tecnologia' },

  // Internazionali
  { name: 'BBC News World', url: 'http://feeds.bbci.co.uk/news/world/rss.xml', category: 'mondo', tags: 'bbc news bbc world inglese notizie esteri' },
  { name: 'CNN Top Stories', url: 'http://rss.cnn.com/rss/edition.rss', category: 'mondo', tags: 'cnn notizie america usa mondo' },
  { name: 'Reuters World News', url: 'https://www.reutersagency.com/feed/', category: 'mondo', tags: 'reuters agenzia mondo finanza esteri' },
  { name: 'The Guardian World', url: 'https://www.theguardian.com/world/rss', category: 'mondo', tags: 'guardian the guardian uk mondo esteri' },
  { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', category: 'tecnologia', tags: 'the verge verge tech america gadget ai' }
];

const DEFAULT_NEWS_FEEDS = [
  { id: 'ansa', name: 'ANSA Ultima Ora', url: 'https://www.ansa.it/sito/ansait_rss.xml', category: 'prima-pagina' },
  { id: 'corriere', name: 'Corriere della Sera', url: 'https://xml2.corriereobjects.it/rss/homepage.xml', category: 'prima-pagina' },
  { id: 'repubblica', name: 'La Repubblica', url: 'https://www.repubblica.it/rss/homepage/rss2.0.xml', category: 'prima-pagina' },
  { id: 'tgcom24', name: 'TGCOM24', url: 'https://www.tgcom24.mediaset.it/rss/homepage.xml', category: 'italia' },
  { id: 'sole24ore', name: 'Il Sole 24 Ore', url: 'https://www.ilsole24ore.com/rss/italia.xml', category: 'economia' },
  { id: 'techcrunch', name: 'TechCrunch', url: 'https://techcrunch.com/feed/', category: 'tecnologia' },
  { id: 'skysport', name: 'Sky Sport', url: 'https://sport.sky.it/rss/sport.xml', category: 'sport' },
  { id: 'wired', name: 'Wired Italia', url: 'https://www.wired.it/feed/rss', category: 'tecnologia' }
];

const PRESET_SUGGESTED_FEEDS = ALL_SEARCHABLE_SOURCES.slice(0, 10);

let NEWS_FEEDS = JSON.parse(localStorage.getItem('GLANCE_NEWS_FEEDS')) || DEFAULT_NEWS_FEEDS;
let cachedArticles = JSON.parse(localStorage.getItem('GLANCE_NEWS_CACHE')) || [];
let activeCategory = 'tutti';
let activeFeedId = 'tutti';
let searchQuery = '';
let readerFontSize = 1.1; // rem
let deletingFeedsMode = false;
let isLongPressPreventClick = false;

document.addEventListener('DOMContentLoaded', () => {
  // 1. Instant Launch: Render cached articles immediately (0ms delay)
  renderFeedsList();
  renderArticles();
  setupEventListeners();

  // 2. Background fresh fetch
  loadAllFeeds();
});

function saveNewsFeeds() {
  localStorage.setItem('GLANCE_NEWS_FEEDS', JSON.stringify(NEWS_FEEDS));
}

function setupEventListeners() {
  // WP8 Metro Pivot Titles
  document.querySelectorAll('.wp8-pivot-title').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.wp8-pivot-title').forEach(c => c.classList.remove('active'));
      item.classList.add('active');

      activeCategory = item.getAttribute('data-category');
      const catTitle = document.getElementById('newsCategoryTitle');
      if (catTitle) catTitle.innerText = item.innerText.toLowerCase();

      // Scroll pivot tab gently into view
      item.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });

      renderArticles();
    });
  });

  // Search Toggle & Clear
  const searchToggleBtn = document.getElementById('searchToggleBtn');
  const searchBanner = document.getElementById('searchBanner');
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');

  if (searchToggleBtn && searchBanner && searchInput) {
    searchToggleBtn.addEventListener('click', () => {
      searchBanner.classList.toggle('hidden');
      if (!searchBanner.classList.contains('hidden')) {
        searchInput.focus();
      }
    });

    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim().toLowerCase();
      renderArticles();
    });

    if (clearSearchBtn) {
      clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        renderArticles();
      });
    }
  }

  // Sidebar Menu Toggle
  const sidebarBtn = document.getElementById('sidebarToggleBtn');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const closeSidebarBtn = document.getElementById('closeSidebarBtn');
  const toggleDeleteBtn = document.getElementById('toggleDeleteFeedsBtn');

  if (sidebarBtn && sidebar && overlay) {
    sidebarBtn.addEventListener('click', () => {
      sidebar.classList.add('open');
      overlay.classList.remove('hidden');
    });
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.add('hidden');
      deletingFeedsMode = false;
      renderFeedsList();
    });
    if (closeSidebarBtn) {
      closeSidebarBtn.addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.classList.add('hidden');
        deletingFeedsMode = false;
        renderFeedsList();
      });
    }
  }

  if (toggleDeleteBtn) {
    toggleDeleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deletingFeedsMode = !deletingFeedsMode;
      renderFeedsList();
    });
  }

  // Refresh Button
  const refreshBtn = document.getElementById('refreshNewsBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      refreshBtn.style.transform = 'rotate(360deg)';
      setTimeout(() => refreshBtn.style.transform = 'none', 600);
      loadAllFeeds();
    });
  }

  // Reader Mode Font Size Controls
  const closeReaderBtn = document.getElementById('closeReaderBtn');
  const readerModal = document.getElementById('readerModal');
  const fontIncBtn = document.getElementById('fontIncBtn');
  const fontDecBtn = document.getElementById('fontDecBtn');

  if (closeReaderBtn && readerModal) {
    closeReaderBtn.addEventListener('click', () => readerModal.close());
  }

  if (fontIncBtn && fontDecBtn) {
    fontIncBtn.addEventListener('click', () => {
      if (readerFontSize < 1.6) readerFontSize += 0.1;
      updateReaderFontSize();
    });
    fontDecBtn.addEventListener('click', () => {
      if (readerFontSize > 0.8) readerFontSize -= 0.1;
      updateReaderFontSize();
    });
  }

  // Add Feed Modal & Google Site Finder Engine
  const addFeedBtn = document.getElementById('addFeedBtn');
  const addFeedModal = document.getElementById('addFeedModal');
  const closeAddFeedBtn = document.getElementById('closeAddFeedBtn');
  const saveCustomFeedBtn = document.getElementById('saveCustomFeedBtn');
  const googleSearchInput = document.getElementById('googleSiteSearchInput');
  const googleSearchBtn = document.getElementById('googleSiteSearchBtn');
  const googleSearchResults = document.getElementById('googleSiteSearchResults');

  if (addFeedBtn && addFeedModal) {
    addFeedBtn.addEventListener('click', () => {
      renderPresetFeedsList();
      if (googleSearchResults) googleSearchResults.innerHTML = '';
      if (googleSearchInput) googleSearchInput.value = '';
      addFeedModal.showModal();
    });
  }
  if (closeAddFeedBtn && addFeedModal) {
    closeAddFeedBtn.addEventListener('click', () => addFeedModal.close());
  }

  // Smart Search & Auto-Suggest Source Finder Engine
  if (googleSearchInput && googleSearchResults) {
    let debounceTimer = null;

    const performSmartSourceSearch = () => {
      const query = googleSearchInput.value.trim();
      if (!query) {
        googleSearchResults.innerHTML = '';
        return;
      }

      const qLow = query.toLowerCase();
      const cleanQ = qLow.replace(/[^a-z0-9]/g, '');

      // Fuzzy & Keyword Matching in Source Database
      const matchedSources = ALL_SEARCHABLE_SOURCES.filter(source => {
        const nameMatch = source.name.toLowerCase().includes(qLow);
        const tagsMatch = source.tags.toLowerCase().includes(qLow);
        const urlMatch = source.url.toLowerCase().includes(qLow);
        const catMatch = source.category.toLowerCase().includes(qLow);
        
        let typoMatch = false;
        if (cleanQ.length >= 4) {
          const sClean = source.name.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (sClean.includes(cleanQ) || cleanQ.includes(sClean)) typoMatch = true;
        }
        return nameMatch || tagsMatch || urlMatch || catMatch || typoMatch;
      });

      let html = '';
      
      if (matchedSources.length > 0) {
        html += `<div style="font-size:0.75rem; text-transform:uppercase; color:#0078d7; font-weight:700; margin-bottom:8px; letter-spacing:1px;">Siti consigliati per "${escapeHtml(query)}"</div>`;
        html += matchedSources.map(src => {
          const isAdded = NEWS_FEEDS.some(f => f.url === src.url);
          return `
            <div class="google-search-result-item">
              <div class="google-result-info">
                <div class="google-result-title">${escapeHtml(src.name)}</div>
                <div class="google-result-url">${escapeHtml(src.url)} <span style="display:inline-block; padding:1px 6px; background:#333; color:#aaa; border-radius:3px; font-size:0.7rem; margin-left:6px;">${escapeHtml(src.category)}</span></div>
              </div>
              <button class="add-google-site-btn ${isAdded ? 'added' : ''}" data-name="${escapeHtml(src.name)}" data-url="${escapeHtml(src.url)}" data-category="${escapeHtml(src.category)}">
                ${isAdded ? '✓ Aggiunto' : '+ Aggiungi'}
              </button>
            </div>
          `;
        }).join('');
      } else {
        html += `<div style="color:#aaa; font-size:0.85rem; padding:6px 0;">Nessun sito preconfigurato trovato con "${escapeHtml(query)}". Puoi aggiungere il feed dinamico qui sotto:</div>`;
      }

      // Dynamic Google News Topic Feed Fallback
      const gNewsUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=it&gl=IT&ceid=IT:it`;
      const isGNewsAdded = NEWS_FEEDS.some(f => f.url === gNewsUrl);
      html += `
        <div style="font-size:0.75rem; text-transform:uppercase; color:#888; font-weight:700; margin:14px 0 8px 0; letter-spacing:1px;">Oppure aggiungi come argomento live Google News</div>
        <div class="google-search-result-item" style="border-left-color: #ffaa00;">
          <div class="google-result-info">
            <div class="google-result-title">Notizie per "${escapeHtml(query)}"</div>
            <div class="google-result-url">Feed dinamico Google News per "${escapeHtml(query)}"</div>
          </div>
          <button class="add-google-site-btn ${isGNewsAdded ? 'added' : ''}" data-name="Notizie: ${escapeHtml(query)}" data-url="${escapeHtml(gNewsUrl)}" data-category="tutti">
            ${isGNewsAdded ? '✓ Aggiunto' : '+ Aggiungi Feed'}
          </button>
        </div>
      `;

      googleSearchResults.innerHTML = html;

      // Add click handlers
      googleSearchResults.querySelectorAll('.add-google-site-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const siteName = btn.getAttribute('data-name');
          const feedUrl = btn.getAttribute('data-url');
          const siteCat = btn.getAttribute('data-category') || 'tutti';

          if (NEWS_FEEDS.some(f => f.url === feedUrl)) {
            return;
          }

          const newSite = {
            id: 'site_' + Date.now(),
            name: siteName,
            url: feedUrl,
            category: siteCat
          };

          NEWS_FEEDS.push(newSite);
          saveNewsFeeds();
          renderFeedsList();
          loadAllFeeds();

          btn.textContent = '✓ Aggiunto';
          btn.classList.add('added');
          btn.style.background = '#28a745';
        });
      });
    };

    googleSearchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(performSmartSourceSearch, 150);
    });

    if (googleSearchBtn) {
      googleSearchBtn.addEventListener('click', performSmartSourceSearch);
    }
  }

  // Direct Custom URL Input
  if (saveCustomFeedBtn) {
    saveCustomFeedBtn.addEventListener('click', () => {
      const input = document.getElementById('customFeedUrlInput');
      const url = input ? input.value.trim() : '';
      if (!url) return;

      const newFeed = {
        id: 'feed_' + Date.now(),
        name: new URL(url).hostname.replace('www.', ''),
        url: url,
        category: 'tutti'
      };

      NEWS_FEEDS.push(newFeed);
      saveNewsFeeds();
      renderFeedsList();
      loadAllFeeds();

      if (addFeedModal) addFeedModal.close();
      if (input) input.value = '';
    });
  }
}

function updateReaderFontSize() {
  const bodyText = document.querySelectorAll('.reader-body-text p');
  bodyText.forEach(p => p.style.fontSize = `${readerFontSize}rem`);
}

// Render Sidebar Feeds List
function renderFeedsList() {
  const container = document.getElementById('feedsListContainer');
  const toggleDeleteBtn = document.getElementById('toggleDeleteFeedsBtn');

  if (!container) return;

  if (toggleDeleteBtn) {
    toggleDeleteBtn.classList.toggle('active-delete-mode', deletingFeedsMode);
  }

  let html = `
    <div class="feed-item ${activeFeedId === 'tutti' ? 'active-feed' : ''}" data-feed-id="tutti">
      <span>Tutte le fonti</span>
    </div>
  `;

  html += NEWS_FEEDS.map(feed => `
    <div class="feed-item ${activeFeedId === feed.id ? 'active-feed' : ''}" data-feed-id="${feed.id}">
      <span>${escapeHtml(feed.name)}</span>
      ${deletingFeedsMode ? `<button class="feed-minus-btn" data-delete-id="${feed.id}" title="Elimina fonte" aria-label="Elimina">&minus;</button>` : ''}
    </div>
  `).join('');

  container.innerHTML = html;

  container.querySelectorAll('.feed-item').forEach(el => {
    let touchTimer = null;

    el.addEventListener('touchstart', () => {
      isLongPressPreventClick = false;
      touchTimer = setTimeout(() => {
        isLongPressPreventClick = true;
        deletingFeedsMode = !deletingFeedsMode;
        renderFeedsList();
      }, 450);
    }, { passive: true });

    el.addEventListener('touchend', () => clearTimeout(touchTimer), { passive: true });
    el.addEventListener('touchmove', () => clearTimeout(touchTimer), { passive: true });

    el.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      deletingFeedsMode = !deletingFeedsMode;
      renderFeedsList();
    });

    el.addEventListener('click', (e) => {
      if (isLongPressPreventClick) {
        isLongPressPreventClick = false;
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      const deleteBtn = e.target.closest('.feed-minus-btn');
      if (deleteBtn) {
        e.stopPropagation();
        e.preventDefault();
        const deleteId = deleteBtn.getAttribute('data-delete-id');
        if (NEWS_FEEDS.length <= 1) {
          alert("Non puoi eliminare l'unica fonte salvata.");
          return;
        }
        NEWS_FEEDS = NEWS_FEEDS.filter(f => f.id !== deleteId);
        if (activeFeedId === deleteId) activeFeedId = 'tutti';
        saveNewsFeeds();
        renderFeedsList();
        renderArticles();
        return;
      }

      activeFeedId = el.getAttribute('data-feed-id');
      renderFeedsList();
      renderArticles();

      const sidebar = document.getElementById('sidebar');
      const overlay = document.getElementById('sidebarOverlay');
      if (sidebar && overlay) {
        sidebar.classList.remove('open');
        overlay.classList.add('hidden');
      }
    });
  });
}

function renderPresetFeedsList() {
  const container = document.getElementById('presetFeedsList');
  if (!container) return;

  container.innerHTML = PRESET_SUGGESTED_FEEDS.map(preset => {
    const isAdded = NEWS_FEEDS.some(f => f.url === preset.url);
    return `
      <div class="preset-item">
        <div>
          <strong>${escapeHtml(preset.name)}</strong>
          <div style="font-size:0.75rem; color:#888;">${preset.category}</div>
        </div>
        ${isAdded ? `<span style="color:#0078d7; font-size:0.8rem;">Aggiunta ✓</span>` : `<button data-preset-url="${preset.url}" data-preset-name="${escapeHtml(preset.name)}" data-preset-cat="${preset.category}">+ Aggiungi</button>`}
      </div>
    `;
  }).join('');

  container.querySelectorAll('button[data-preset-url]').forEach(btn => {
    btn.addEventListener('click', () => {
      const url = btn.getAttribute('data-preset-url');
      const name = btn.getAttribute('data-preset-name');
      const category = btn.getAttribute('data-preset-cat');

      NEWS_FEEDS.push({
        id: 'preset_' + Date.now(),
        name: name,
        url: url,
        category: category
      });

      saveNewsFeeds();
      renderFeedsList();
      renderPresetFeedsList();
      loadAllFeeds();
    });
  });
}

// Fetch RSS Feeds in Parallel with Robust Proxy Waterfall
async function loadAllFeeds() {
  let allArticles = [];

  const promises = NEWS_FEEDS.map(async feed => {
    try {
      const items = await fetchRssItems(feed);
      return items;
    } catch (e) {
      return [];
    }
  });

  const results = await Promise.all(promises);
  results.forEach(items => allArticles.push(...items));

  if (allArticles.length > 0) {
    allArticles.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    cachedArticles = allArticles.slice(0, 150);
    localStorage.setItem('GLANCE_NEWS_CACHE', JSON.stringify(cachedArticles));
    renderArticles();
  }
}

// Robust RSS Fetching Engine (0 console errors, fast JSON & CORS proxy fallbacks)
async function fetchRssItems(feed) {
  const targetUrl = feed.url;
  const isLocalhost = location.hostname === 'localhost' || location.hostname === '127.0.0.1';

  // 1. If running on local Node server, try local proxy
  if (isLocalhost) {
    try {
      const res = await fetch(`/api/proxy?url=${encodeURIComponent(targetUrl)}`);
      if (res.ok) {
        const text = await res.text();
        const items = parseRssXml(text, feed);
        if (items && items.length > 0) return items;
      }
    } catch (e) {}
  }

  // 2. Fast rss2json API (returns pre-parsed JSON)
  try {
    const rss2jsonUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(targetUrl)}`;
    const res = await fetch(rss2jsonUrl);
    if (res.ok) {
      const data = await res.json();
      if (data.status === 'ok' && data.items && data.items.length > 0) {
        return data.items.map(item => ({
          id: item.guid || item.link,
          title: item.title,
          snippet: cleanSnippet(item.description),
          content: item.content || item.description,
          image: item.thumbnail || extractImageFromHtml(item.description) || extractImageFromHtml(item.content),
          link: item.link,
          source: feed.name,
          category: feed.category || 'tutti',
          pubDate: item.pubDate || new Date().toISOString()
        }));
      }
    }
  } catch (e) {}

  // 3. CorsProxy.io (Reliable raw XML proxy)
  try {
    const corsUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
    const res = await fetch(corsUrl);
    if (res.ok) {
      const text = await res.text();
      const items = parseRssXml(text, feed);
      if (items && items.length > 0) return items;
    }
  } catch (e) {}

  // 4. CodeTabs Proxy Fallback
  try {
    const codeTabsUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`;
    const res = await fetch(codeTabsUrl);
    if (res.ok) {
      const text = await res.text();
      const items = parseRssXml(text, feed);
      if (items && items.length > 0) return items;
    }
  } catch (e) {}

  return [];
}

// Advanced Multi-Tag RSS XML Parser
function parseRssXml(xmlString, feed) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
  const items = xmlDoc.querySelectorAll('item, entry');

  const articles = [];
  items.forEach(item => {
    const title = getXmlText(item, 'title');
    const link = getXmlLink(item);
    const description = getXmlText(item, 'description') || getXmlText(item, 'summary');
    const contentEncoded = getXmlText(item, 'content\\:encoded') || getXmlText(item, 'encoded') || getXmlText(item, 'content');
    const pubDate = getXmlText(item, 'pubDate') || getXmlText(item, 'published') || getXmlText(item, 'dc\\:date') || getXmlText(item, 'date') || new Date().toISOString();
    
    // Extract Image from all media tags or embedded HTML
    const image = getXmlImage(item, description, contentEncoded);

    if (title && link) {
      articles.push({
        id: link,
        title: title,
        snippet: cleanSnippet(description || contentEncoded),
        content: contentEncoded || description,
        image: image,
        link: link,
        source: feed.name,
        category: feed.category || 'tutti',
        pubDate: pubDate
      });
    }
  });

  return articles;
}

function getXmlText(parent, tag) {
  const el = parent.querySelector(tag);
  return el ? el.textContent.trim() : '';
}

function getXmlLink(parent) {
  const linkEl = parent.querySelector('link');
  if (!linkEl) return '';
  if (linkEl.getAttribute('href')) return linkEl.getAttribute('href');
  return linkEl.textContent.trim();
}

function getXmlImage(item, htmlDescription, htmlContent) {
  // 1. media:content
  const mediaContent = item.querySelector('media\\:content, content');
  if (mediaContent && mediaContent.getAttribute('url')) return mediaContent.getAttribute('url');

  // 2. media:thumbnail
  const mediaThumb = item.querySelector('media\\:thumbnail, thumbnail');
  if (mediaThumb && mediaThumb.getAttribute('url')) return mediaThumb.getAttribute('url');

  // 3. enclosure (image)
  const enclosure = item.querySelector('enclosure');
  if (enclosure && enclosure.getAttribute('url')) {
    const type = enclosure.getAttribute('type') || '';
    if (type.startsWith('image') || enclosure.getAttribute('url').match(/\.(jpg|jpeg|png|webp|gif)/i)) {
      return enclosure.getAttribute('url');
    }
  }

  // 4. itunes:image
  const itunesImage = item.querySelector('itunes\\:image, image');
  if (itunesImage && (itunesImage.getAttribute('href') || itunesImage.getAttribute('url'))) {
    return itunesImage.getAttribute('href') || itunesImage.getAttribute('url');
  }

  // 5. HTML img in description or content:encoded
  const imgFromDesc = extractImageFromHtml(htmlDescription);
  if (imgFromDesc) return imgFromDesc;

  const imgFromContent = extractImageFromHtml(htmlContent);
  if (imgFromContent) return imgFromContent;

  return '';
}

function extractImageFromHtml(html) {
  if (!html) return '';
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (match && match[1] && !match[1].includes('feedburner') && !match[1].includes('pixel')) {
    return match[1];
  }
  const srcSetMatch = html.match(/srcset=["']([^"'\s]+)/i);
  if (srcSetMatch && srcSetMatch[1]) return srcSetMatch[1];
  return '';
}

function cleanSnippet(html) {
  if (!html) return '';
  const text = html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  return text.length > 160 ? text.substring(0, 160) + '...' : text;
}

function generateDistinctMetroGradient(sourceName) {
  const hash = sourceName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colors = [
    'linear-gradient(135deg, #0078d7 0%, #002050 100%)',
    'linear-gradient(135deg, #d83b01 0%, #501000 100%)',
    'linear-gradient(135deg, #107c41 0%, #003010 100%)',
    'linear-gradient(135deg, #881798 0%, #300040 100%)',
    'linear-gradient(135deg, #008272 0%, #003025 100%)',
    'linear-gradient(135deg, #e3008c 0%, #500030 100%)',
    'linear-gradient(135deg, #00bcf2 0%, #004060 100%)'
  ];
  return colors[hash % colors.length];
}

// Render News Grid & Hero Card
function renderArticles() {
  const heroContainer = document.getElementById('featuredNewsSection');
  const gridContainer = document.getElementById('newsGrid');

  if (!gridContainer) return;

  let filtered = cachedArticles.filter(art => {
    const matchesCat = (activeCategory === 'tutti') || (art.category === activeCategory) || (activeCategory === 'prima-pagina' && art.category === 'tutti');
    const matchesFeed = (activeFeedId === 'tutti') || (NEWS_FEEDS.find(f => f.id === activeFeedId)?.name === art.source);
    const matchesSearch = !searchQuery || art.title.toLowerCase().includes(searchQuery) || art.snippet.toLowerCase().includes(searchQuery);

    return matchesCat && matchesFeed && matchesSearch;
  });

  if (filtered.length === 0) {
    if (heroContainer) heroContainer.innerHTML = '';
    gridContainer.innerHTML = `
      <div style="text-align:center; padding:40px 20px; color:#888;">
        <p style="font-size:1.1rem; margin-bottom:8px;">Nessuna notizia trovata.</p>
        <p style="font-size:0.85rem;">Prova a cambiare categoria o aggiornare le fonti.</p>
      </div>
    `;
    return;
  }

  const hero = filtered[0];
  if (heroContainer && !searchQuery) {
    const heroImgHtml = hero.image
      ? `<img src="${hero.image}" alt="${escapeHtml(hero.title)}" onerror="this.onerror=null; this.parentNode.innerHTML='<div class=\\'metro-fallback-thumb\\' style=\\'background:${generateDistinctMetroGradient(hero.source)}\\'><span>${escapeHtml(hero.source)}</span></div>'">`
      : `<div class="metro-fallback-thumb" style="background:${generateDistinctMetroGradient(hero.source)}">
           <span style="font-size:1.4rem; font-weight:700;">${escapeHtml(hero.source)}</span>
         </div>`;

    heroContainer.innerHTML = `
      <div class="hero-news-card" data-article-id="${escapeHtml(hero.id)}">
        <div class="hero-image-wrapper">
          ${heroImgHtml}
        </div>
        <div class="hero-content">
          <span class="source-pill">${escapeHtml(hero.source)}</span>
          <h2 class="hero-title">${escapeHtml(hero.title)}</h2>
          <p class="hero-snippet">${escapeHtml(hero.snippet)}</p>
          <div class="news-meta">${formatTimeAgo(hero.pubDate)} • Modalità Lettura 📖</div>
        </div>
      </div>
    `;

    heroContainer.querySelector('.hero-news-card').addEventListener('click', () => openReaderModal(hero));
  } else if (heroContainer) {
    heroContainer.innerHTML = '';
  }

  const restArticles = searchQuery ? filtered : filtered.slice(1);
  gridContainer.innerHTML = restArticles.map(art => {
    const thumbHtml = art.image
      ? `<img src="${art.image}" alt="${escapeHtml(art.title)}" onerror="this.onerror=null; this.parentNode.innerHTML='<div class=\\'metro-fallback-thumb\\' style=\\'background:${generateDistinctMetroGradient(art.source)}\\'><span>${escapeHtml(art.source.substring(0,3))}</span></div>'">`
      : `<div class="metro-fallback-thumb" style="background:${generateDistinctMetroGradient(art.source)}">
           <span>${escapeHtml(art.source.substring(0,6))}</span>
         </div>`;

    return `
      <div class="news-card" data-article-id="${escapeHtml(art.id)}">
        <div class="news-thumb">
          ${thumbHtml}
        </div>
        <div class="news-card-info">
          <h3 class="news-card-title">${escapeHtml(art.title)}</h3>
          <div class="news-card-footer">
            <span class="source-name">${escapeHtml(art.source)}</span>
            <span class="news-time">${formatTimeAgo(art.pubDate)}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');

  gridContainer.querySelectorAll('.news-card').forEach(card => {
    card.addEventListener('click', () => {
      const artId = card.getAttribute('data-article-id');
      const article = cachedArticles.find(a => a.id === artId);
      if (article) openReaderModal(article);
    });
  });
}

const fullArticleCache = {};

async function openReaderModal(article) {
  const modal = document.getElementById('readerModal');
  const body = document.getElementById('readerArticleBody');

  if (!modal || !body) return;

  let cleanContent = article.content || article.snippet;
  const initialParagraphs = cleanContent.split('\n').filter(p => p.trim().length > 0);
  const formattedInitial = initialParagraphs.length > 0 
    ? initialParagraphs.map(p => `<p>${escapeHtml(p.replace(/<[^>]+>/g, ''))}</p>`).join('')
    : `<p>${escapeHtml(article.snippet)}</p>`;

  body.innerHTML = `
    <h1 class="reader-title">${escapeHtml(article.title)}</h1>
    <div class="reader-meta-bar">
      Fonte: <strong>${escapeHtml(article.source)}</strong> • Pubblicato: ${new Date(article.pubDate).toLocaleString('it-IT')}
    </div>
    ${article.image ? `<img src="${article.image}" class="reader-hero-img" alt="${escapeHtml(article.title)}" onerror="this.style.display='none'">` : ''}
    
    <div id="fullArticleLoader" style="display:flex; align-items:center; gap:8px; color:#0078d7; font-size:0.9rem; margin:16px 0; font-weight:500;">
      <svg width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" fill="none" style="animation: spin 1s linear infinite;">
        <circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="10"></circle>
      </svg>
      Caricamento testo completo dell'articolo...
    </div>

    <div id="readerBodyText" class="reader-body-text">
      ${formattedInitial}
    </div>
    <a href="${article.link}" target="_blank" rel="noopener" class="reader-original-link-btn">
      Visita sito originale (${escapeHtml(article.source)}) &rarr;
    </a>
  `;

  modal.showModal();
  updateReaderFontSize();

  // Asynchronously fetch full article text from original site
  try {
    const fullParagraphs = await fetchFullArticleText(article.link);
    const loaderEl = document.getElementById('fullArticleLoader');
    const textEl = document.getElementById('readerBodyText');

    if (fullParagraphs && fullParagraphs.length > 1 && textEl) {
      textEl.innerHTML = fullParagraphs.map(p => `<p>${escapeHtml(p)}</p>`).join('');
      if (loaderEl) loaderEl.style.display = 'none';
    } else if (loaderEl) {
      loaderEl.style.display = 'none';
    }
  } catch (e) {
    const loaderEl = document.getElementById('fullArticleLoader');
    if (loaderEl) loaderEl.style.display = 'none';
  }
}

async function fetchFullArticleText(url) {
  if (fullArticleCache[url]) return fullArticleCache[url];

  const targetProxies = [];
  const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  if (isLocal) {
    targetProxies.push(`/api/proxy?url=${encodeURIComponent(url)}`);
  }
  targetProxies.push(`https://corsproxy.io/?${encodeURIComponent(url)}`);
  targetProxies.push(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`);

  for (const proxyUrl of targetProxies) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);
      const res = await fetch(proxyUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const html = await res.text();
        const paragraphs = extractParagraphsFromHtml(html);
        if (paragraphs && paragraphs.length > 1) {
          fullArticleCache[url] = paragraphs;
          return paragraphs;
        }
      }
    } catch (e) {}
  }
  return null;
}

function extractParagraphsFromHtml(htmlString) {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');

    // Remove scripts, styles, navs, footers, headers, ads
    const elementsToRemove = doc.querySelectorAll('script, style, nav, footer, header, aside, .comments, .ad, .advertisement, .social-share, .cookie-banner');
    elementsToRemove.forEach(el => el.remove());

    const container = doc.querySelector('article, [class*="article-body"], [class*="entry-content"], [class*="post-content"], [class*="article-content"], [class*="content"], main') || doc.body;

    const pNodes = container.querySelectorAll('p');
    const validParagraphs = [];

    pNodes.forEach(p => {
      const text = p.textContent.trim();
      if (text.length > 35 && !text.toLowerCase().includes('cookie') && !text.toLowerCase().includes('privacy policy') && !text.toLowerCase().includes('tutti i diritti riservati')) {
        validParagraphs.push(text);
      }
    });

    return validParagraphs;
  } catch (e) {
    return null;
  }
}

function formatTimeAgo(dateStr) {
  try {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMin = Math.floor((now - date) / 60000);

    if (isNaN(diffMin) || diffMin < 0) return 'Recentissimo';
    if (diffMin < 60) return `${diffMin}m fa`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h fa`;
    return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
  } catch (e) {
    return '';
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
