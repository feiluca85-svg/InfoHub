/* Glance News - Application Logic (Ultra-fast RSS Parser, Reader Mode, Instant Startup, Feed Manager) */

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

const PRESET_SUGGESTED_FEEDS = [
  { name: 'ANSA Mondo', url: 'https://www.ansa.it/sito/notizie/mondo/mondo_rss.xml', category: 'mondo' },
  { name: 'ANSA Economia', url: 'https://www.ansa.it/sito/notizie/economia/economia_rss.xml', category: 'economia' },
  { name: 'ANSA Tecnologia', url: 'https://www.ansa.it/sito/notizie/tecnologia/tecnologia_rss.xml', category: 'tecnologia' },
  { name: 'La Gazzetta dello Sport', url: 'https://www.gazzetta.it/rss/home.xml', category: 'sport' },
  { name: 'BBC News - World', url: 'http://feeds.bbci.co.uk/news/world/rss.xml', category: 'mondo' }
];

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
  // Category Chips
  document.querySelectorAll('.category-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      activeCategory = chip.getAttribute('data-category');
      const catTitle = document.getElementById('newsCategoryTitle');
      if (catTitle) catTitle.innerText = chip.innerText.toLowerCase();

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

  // Add Feed Modal & Preset Feeds
  const addFeedBtn = document.getElementById('addFeedBtn');
  const addFeedModal = document.getElementById('addFeedModal');
  const closeAddFeedBtn = document.getElementById('closeAddFeedBtn');
  const saveCustomFeedBtn = document.getElementById('saveCustomFeedBtn');

  if (addFeedBtn && addFeedModal) {
    addFeedBtn.addEventListener('click', () => {
      renderPresetFeedsList();
      addFeedModal.showModal();
    });
  }
  if (closeAddFeedBtn && addFeedModal) {
    closeAddFeedBtn.addEventListener('click', () => addFeedModal.close());
  }

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

// Fetch RSS Feeds in Parallel
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
    // Sort articles by publication date (newest first)
    allArticles.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    cachedArticles = allArticles.slice(0, 120); // Keep top 120 articles
    localStorage.setItem('GLANCE_NEWS_CACHE', JSON.stringify(cachedArticles));
    renderArticles();
  }
}

async function fetchRssItems(feed) {
  // Method 1: Local Proxy when on node server, or rss2json fallback
  let rawXml = null;
  const targetUrl = feed.url;

  try {
    const localProxyUrl = `/api/proxy?url=${encodeURIComponent(targetUrl)}`;
    const res = await fetch(localProxyUrl);
    if (res.ok) {
      rawXml = await res.text();
    }
  } catch (e) {}

  if (!rawXml) {
    try {
      const corsUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
      const res = await fetch(corsUrl);
      if (res.ok) {
        rawXml = await res.text();
      }
    } catch (e) {}
  }

  if (rawXml) {
    return parseRssXml(rawXml, feed);
  }

  // Method 2: rss2json fallback
  try {
    const rss2jsonUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(targetUrl)}`;
    const res = await fetch(rss2jsonUrl);
    if (res.ok) {
      const data = await res.json();
      if (data.items) {
        return data.items.map(item => ({
          id: item.guid || item.link,
          title: item.title,
          snippet: cleanSnippet(item.description),
          content: item.content || item.description,
          image: item.thumbnail || extractImageFromHtml(item.description) || getCategoryFallbackImage(feed.category),
          link: item.link,
          source: feed.name,
          category: feed.category || 'tutti',
          pubDate: item.pubDate || new Date().toISOString()
        }));
      }
    }
  } catch (e) {}

  return [];
}

function parseRssXml(xmlString, feed) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
  const items = xmlDoc.querySelectorAll('item, entry');

  const articles = [];
  items.forEach(item => {
    const title = getXmlText(item, 'title');
    const link = getXmlLink(item);
    const description = getXmlText(item, 'description') || getXmlText(item, 'content') || getXmlText(item, 'summary');
    const pubDate = getXmlText(item, 'pubDate') || getXmlText(item, 'published') || getXmlText(item, 'dc:date') || new Date().toISOString();
    const image = getXmlImage(item, description) || getCategoryFallbackImage(feed.category);

    if (title && link) {
      articles.push({
        id: link,
        title: title,
        snippet: cleanSnippet(description),
        content: description,
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

function getXmlImage(item, htmlContent) {
  const mediaContent = item.querySelector('media\\:content, content');
  if (mediaContent && mediaContent.getAttribute('url')) return mediaContent.getAttribute('url');

  const enclosure = item.querySelector('enclosure');
  if (enclosure && enclosure.getAttribute('url') && enclosure.getAttribute('type')?.startsWith('image')) {
    return enclosure.getAttribute('url');
  }

  return extractImageFromHtml(htmlContent);
}

function extractImageFromHtml(html) {
  if (!html) return '';
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : '';
}

function cleanSnippet(html) {
  if (!html) return '';
  const text = html.replace(/<[^>]+>/g, '').trim();
  return text.length > 160 ? text.substring(0, 160) + '...' : text;
}

function getCategoryFallbackImage(category) {
  const fallbacks = {
    'tecnologia': 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80',
    'economia': 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&auto=format&fit=crop&q=80',
    'sport': 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600&auto=format&fit=crop&q=80',
    'mondo': 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=600&auto=format&fit=crop&q=80',
    'prima-pagina': 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&auto=format&fit=crop&q=80'
  };
  return fallbacks[category] || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&auto=format&fit=crop&q=80';
}

// Render News Grid & Hero Card
function renderArticles() {
  const heroContainer = document.getElementById('featuredNewsSection');
  const gridContainer = document.getElementById('newsGrid');

  if (!gridContainer) return;

  // Filter articles
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

  // Hero breaking news (first article)
  const hero = filtered[0];
  if (heroContainer && !searchQuery) {
    heroContainer.innerHTML = `
      <div class="hero-news-card" data-article-id="${escapeHtml(hero.id)}">
        <div class="hero-image-wrapper">
          <img src="${hero.image}" alt="${escapeHtml(hero.title)}" onerror="this.src='${getCategoryFallbackImage(hero.category)}'">
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

  // Rest of articles in grid
  const restArticles = searchQuery ? filtered : filtered.slice(1);
  gridContainer.innerHTML = restArticles.map(art => `
    <div class="news-card" data-article-id="${escapeHtml(art.id)}">
      <div class="news-thumb">
        <img src="${art.image}" alt="${escapeHtml(art.title)}" onerror="this.src='${getCategoryFallbackImage(art.category)}'">
      </div>
      <div class="news-card-info">
        <h3 class="news-card-title">${escapeHtml(art.title)}</h3>
        <div class="news-card-footer">
          <span class="source-name">${escapeHtml(art.source)}</span>
          <span class="news-time">${formatTimeAgo(art.pubDate)}</span>
        </div>
      </div>
    </div>
  `).join('');

  gridContainer.querySelectorAll('.news-card').forEach(card => {
    card.addEventListener('click', () => {
      const artId = card.getAttribute('data-article-id');
      const article = cachedArticles.find(a => a.id === artId);
      if (article) openReaderModal(article);
    });
  });
}

// Distraction-Free Reader Mode Modal
function openReaderModal(article) {
  const modal = document.getElementById('readerModal');
  const body = document.getElementById('readerArticleBody');

  if (!modal || !body) return;

  // Format clean paragraphs
  let cleanContent = article.content || article.snippet;
  const paragraphs = cleanContent.split('\n').filter(p => p.trim().length > 0);
  const formattedParagraphs = paragraphs.length > 0 
    ? paragraphs.map(p => `<p>${escapeHtml(p.replace(/<[^>]+>/g, ''))}</p>`).join('')
    : `<p>${escapeHtml(article.snippet)}</p>`;

  body.innerHTML = `
    <h1 class="reader-title">${escapeHtml(article.title)}</h1>
    <div class="reader-meta-bar">
      Fonte: <strong>${escapeHtml(article.source)}</strong> • Pubblicato: ${new Date(article.pubDate).toLocaleString('it-IT')}
    </div>
    ${article.image ? `<img src="${article.image}" class="reader-hero-img" alt="${escapeHtml(article.title)}" onerror="this.style.display='none'">` : ''}
    <div class="reader-body-text">
      ${formattedParagraphs}
    </div>
    <a href="${article.link}" target="_blank" rel="noopener" class="reader-original-link-btn">
      Leggi articolo completo su ${escapeHtml(article.source)} &rarr;
    </a>
  `;

  modal.showModal();
  updateReaderFontSize();
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
