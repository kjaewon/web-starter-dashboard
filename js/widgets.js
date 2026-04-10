// Exports for central initialization
export { initClock, initWeather, initSearch, initBookmarks, initRSS, initAnalytics };

// Clock Logic
function initClock() {
  const timeDisplay = document.getElementById('time-display');
  const dateDisplay = document.getElementById('date-display');

  function update() {
    const now = new Date();
    timeDisplay.textContent = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    dateDisplay.textContent = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }
  
  update();
  setInterval(update, 1000); // UI may not show seconds but keeps it updated on the minute
}

// Weather Logic
async function initWeather() {
  const config = window.appConfig.weather;
  const tempEl = document.getElementById('weather-temp');
  const descEl = document.getElementById('weather-desc');
  const iconEl = document.getElementById('weather-icon');
  
  if (!config || !config.enabled) {
    document.getElementById('weather-container').style.display = 'none';
    return;
  }

  if (config.apiKey === 'DEMO_KEY' || !config.apiKey) {
    tempEl.textContent = '22°C';
    descEl.textContent = 'Sunny (Demo)';
    iconEl.textContent = '☀️';
    return;
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${config.city}&units=${config.units}&appid=${config.apiKey}`;
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.main) {
      tempEl.textContent = `${Math.round(data.main.temp)}°`;
      descEl.textContent = data.weather[0].description;
      
      const iconMap = {
        'Clear': '☀️', 'Clouds': '☁️', 'Rain': '🌧️', 'Snow': '❄️', 'Thunderstorm': '⛈️', 'Drizzle': '🌦️'
      };
      iconEl.textContent = iconMap[data.weather[0].main] || '⛅';
    }
  } catch (e) {
    descEl.textContent = 'Weather error';
  }
}

// Search Logic
function initSearch() {
  const select = document.getElementById('search-engine-select');
  const form = document.getElementById('search-form');
  const input = document.getElementById('search-input');
  const searchConfig = window.appConfig.search;
  
  if (!searchConfig || !searchConfig.engines) return;

  searchConfig.engines.forEach(engine => {
    const opt = document.createElement('option');
    opt.value = engine.id;
    opt.textContent = engine.name;
    opt.dataset.url = engine.url;
    if (engine.id === searchConfig.defaultEngineId) opt.selected = true;
    select.appendChild(opt);
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = input.value.trim();
    if (!query) return;

    const selectedOption = select.options[select.selectedIndex];
    const baseUrl = selectedOption.dataset.url;
    
    window.location.href = baseUrl + encodeURIComponent(query);
  });
}

// Bookmarks / Workspaces Logic
function initBookmarks() {
  const container = document.getElementById('bookmarks-container');
  const groups = window.appConfig.bookmarks;
  
  if (!groups) return;

  groups.forEach(group => {
    const groupDiv = document.createElement('div');
    groupDiv.className = 'bookmark-group';
    
    // Header
    const header = document.createElement('div');
    header.className = 'group-header';
    header.innerHTML = `
      <span class="group-title">${group.groupName}</span>
      <button class="glass-button btn-launch" data-group="${group.groupId}">Launch All</button>
    `;
    
    // Grid
    const grid = document.createElement('div');
    grid.className = 'bookmark-grid';
    
    group.items.forEach(item => {
      const a = document.createElement('a');
      a.className = 'bookmark-item';
      a.href = item.url;
      a.target = '_blank';
      
      // Auto-extract domain to get a favicon (using google favicon service)
      let domain = new URL(item.url).hostname;
      const iconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
      
      a.innerHTML = `
        <img class="bookmark-icon" src="${iconUrl}" alt="" loading="lazy"/>
        <span class="bookmark-name">${item.name}</span>
      `;
      grid.appendChild(a);
    });
    
    groupDiv.appendChild(header);
    groupDiv.appendChild(grid);
    container.appendChild(groupDiv);
  });
  
  // Launch All Feature (One-click session)
  container.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-launch')) {
      const groupId = e.target.dataset.group;
      const group = groups.find(g => g.groupId === groupId);
      if (group) {
        group.items.forEach(item => {
          window.open(item.url, '_blank');
        });
      }
    }
  });
}

// RSS Feed Logic (Using rss2json)
async function initRSS() {
  const config = window.appConfig.rss;
  const list = document.getElementById('rss-feed-list');
  
  if (!config || !config.enabled || !config.feeds.length) {
    document.getElementById('rss-widget').style.display = 'none';
    return;
  }
  
  const feedUrl = encodeURIComponent(config.feeds[0].url);
  const rss2jsonUrl = `https://api.rss2json.com/v1/api.json?rss_url=${feedUrl}`;
  
  try {
    const res = await fetch(rss2jsonUrl);
    const data = await res.json();
    
    list.innerHTML = '';
    
    if (data.status === 'ok') {
      // Top 5 items
      data.items.slice(0, 5).forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = `<a href="${item.link}" target="_blank" class="rss-item" title="${item.title}">${item.title}</a>`;
        list.appendChild(li);
      });
    } else {
      list.innerHTML = '<li>Unable to load feeds.</li>';
    }
  } catch (err) {
    list.innerHTML = '<li>Error fetching feeds.</li>';
  }
}

// Analytics Logic (Efficiency & Deep Work)
function initAnalytics() {
  const config = window.appConfig.analytics || { efficiency: 0, dwHistory: [0,0,0,0,0,0,0] };
  
  // 1. Efficiency Ring
  const effProgress = document.getElementById('eff-progress');
  const effValue = document.getElementById('eff-value');
  if (effProgress && effValue) {
    const score = Math.min(Math.max(config.efficiency, 0), 100);
    effValue.textContent = `${score}%`;
    // Circle circumference is ~251.2
    // offset = 251.2 - (251.2 * score / 100)
    const offset = 251.2 - (251.2 * score / 100);
    // Add small delay for animation
    setTimeout(() => {
      effProgress.style.strokeDashoffset = offset;
    }, 100);
  }

  // 2. Deep Work Chart
  const barsContainer = document.getElementById('dw-bars-container');
  const labelsContainer = document.getElementById('dw-labels-container');
  if (barsContainer && labelsContainer) {
    barsContainer.innerHTML = '';
    labelsContainer.innerHTML = '';
    
    // For a real app, calculate actual day names
    const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const maxVal = Math.max(...config.dwHistory, 4); // assume 4 hours is target
    
    config.dwHistory.forEach((val, i) => {
      const heightPct = Math.min((val / maxVal) * 100, 100);
      
      const wrapper = document.createElement('div');
      wrapper.className = 'dw-bar-wrapper';
      
      const bar = document.createElement('div');
      bar.className = 'dw-bar';
      bar.title = `${val.toFixed(1)} hrs`;
      
      wrapper.appendChild(bar);
      barsContainer.appendChild(wrapper);
      
      setTimeout(() => { bar.style.height = `${heightPct}%`; }, 100);
      
      const label = document.createElement('div');
      label.className = 'dw-label';
      label.textContent = days[i];
      labelsContainer.appendChild(label);
    });
  }
}
