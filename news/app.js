/* Glance News - Application Logic (Authentic WP8 Metro Pivot, Google Site Search Engine & Multi-Tag RSS Image Parser) */

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

  // Add Feed Modal & Google Site Finder Engine (Identical to Original Mixed App)
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
      addFeedModal.showModal();
    });
  }
  if (closeAddFeedBtn && addFeedModal) {
    closeAddFeedBtn.addEventListener('click', () => addFeedModal.close());
  }

  // Original App Google Search Site Finder Logic
  if (googleSearchBtn && googleSearchInput && googleSearchResults) {
    const executeGoogleSearch = () => {
      const query = googleSearchInput.value.trim();
      if (!query) {
        alert('Inserisci il nome di un sito da cercare.');
        return;
      }

      googleSearchResults.innerHTML = '<p style="color:#0078d7; text-align:center; padding:10px;">🔍 Ricerca in corso per "' + escapeHtml(query) + '"...</p>';

      const cleanQuery = query.toLowerCase().replace(/[^a-z0-9]/g, '');
      const candidates = [
        { name: query, url: `https://www.${cleanQuery}.it`, feed: `https://www.${cleanQuery}.it/feed` },
        { name: query + ' (.com)', url: `https://www.${cleanQuery}.com`, feed: `https://www.${cleanQuery}.com/rss` },
        { name: query + ' News (Google)', url: `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=it&gl=IT&ceid=IT:it`, feed: `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=it&gl=IT&ceid=IT:it` }
      ];

      googleSearchResults.innerHTML = candidates.map(c => `
        <div class="google-search-result-item">
          <div class="google-result-info">
            <div class="google-result-title">${escapeHtml(c.name)}</div>
            <div class="google-result-url">${escapeHtml(c.url)}</div>
          </div>
          <button class="add-google-site-btn" data-name="${escapeHtml(c.name)}" data-url="${escapeHtml(c.url)}" data-feed="${escapeHtml(c.feed)}">+ Aggiungi</button>
        </div>
      `).join('');

      googleSearchResults.querySelectorAll('.add-google-site-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const siteName = btn.getAttribute('data-name');
          const siteUrl = btn.getAttribute('data-url');
          const feedUrl = btn.getAttribute('data-feed');

          const newSite = {
            id: 'site_' + Date.now(),
            name: siteName,
            url: feedUrl,
            category: 'tutti'
          };

          NEWS_FEEDS.push(newSite);
          saveNewsFeeds();
          renderFeedsList();
          loadAllFeeds();

          if (addFeedModal) addFeedModal.close();
          googleSearchInput.value = '';
          googleSearchResults.innerHTML = '';
        });
      });
    };

    googleSearchBtn.addEventListener('click', executeGoogleSearch);
    googleSearchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') executeGoogleSearch();
    });
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
    allArticles.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    cachedArticles = allArticles.slice(0, 120);
    localStorage.setItem('GLANCE_NEWS_CACHE', JSON.stringify(cachedArticles));
    renderArticles();
  }
}

async function fetchRssItems(feed) {
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
          image: item.thumbnail || extractImageFromHtml(item.description) || extractImageFromHtml(item.content),
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
  // Check img src
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (match && match[1] && !match[1].includes('feedburner') && !match[1].includes('pixel')) {
    return match[1];
  }
  // Check img srcset
  const srcSetMatch = html.match(/srcset=["']([^"'\s]+)/i);
  if (srcSetMatch && srcSetMatch[1]) return srcSetMatch[1];
  return '';
}

function cleanSnippet(html) {
  if (!html) return '';
  const text = html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  return text.length > 160 ? text.substring(0, 160) + '...' : text;
}

// Generate distinct color tile gradient for articles without specific images
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

function openReaderModal(article) {
  const modal = document.getElementById('readerModal');
  const body = document.getElementById('readerArticleBody');

  if (!modal || !body) return;

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
