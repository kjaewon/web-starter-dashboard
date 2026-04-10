import { supabase } from './supabase.js';

export async function initSettings(user) {
  try {
    let { data, error } = await supabase
      .from('user_settings')
      .select('config')
      .eq('user_id', user.id)
      .single();

    if (error && error.code === 'PGRST116') {
      const defaultRes = await fetch('./config.json');
      const defaultConfig = await defaultRes.json();
      
      const { data: insertData, error: insertError } = await supabase
        .from('user_settings')
        .insert([{ user_id: user.id, config: defaultConfig }])
        .select()
        .single();
        
      if (insertError) throw insertError;
      data = insertData;
    } else if (error) {
      throw error;
    }

    if (!data) throw new Error("데이터가 생성되지 않았습니다.");
    window.appConfig = data.config;
    document.dispatchEvent(new Event('configLoaded'));
  } catch (err) {
    console.error('Error loading settings from Supabase:', err);
    alert('DB 로드 에러 (Supabase 연동 문제):\n' + (err.message || JSON.stringify(err)));
    const req = await fetch('./config.json');
    window.appConfig = await req.json();
    document.dispatchEvent(new Event('configLoaded'));
  }
}

export async function saveSettings(newConfig) {
  window.appConfig = newConfig;
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    const { data, error } = await supabase
      .from('user_settings')
      .update({ config: newConfig })
      .eq('user_id', user.id)
      .select();
      
    if (error) {
      alert('DB 저장 에러:\n' + error.message);
    } else if (!data || data.length === 0) {
      // 0 rows updated means row doesn't exist or RLS blocked update
      alert('저장 실패: 테이블에 현재 사용자의 행이 없거나 권한이 막혀있습니다.');
    }
  }
}

// UI bindings for settings
document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('settings-modal');
  const btnOpen = document.getElementById('btn-settings');
  const btnClose = document.getElementById('btn-settings-close');
  const btnCloseTop = document.getElementById('btn-settings-close-top');
  const btnSave = document.getElementById('btn-settings-save');
  
  const inputBg = document.getElementById('setting-bg-keyword');
  const inputCity = document.getElementById('setting-weather-city');
  const inputWeatherApi = document.getElementById('setting-weather-api-key');

  // Tabs
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.target).classList.add('active');
    });
  });

  // Workspaces logic
  const wsContainer = document.getElementById('workspaces-editor-container');
  const btnAddGroup = document.getElementById('btn-add-group');

  function renderWorkspacesEditor() {
    wsContainer.innerHTML = '';
    const bookmarks = window.appConfig?.bookmarks || [];
    
    bookmarks.forEach((group, gIndex) => {
      const gDiv = document.createElement('div');
      gDiv.className = 'ws-group-edit';
      
      const gHeader = document.createElement('div');
      gHeader.style.display = 'flex';
      gHeader.style.gap = '0.5rem';
      gHeader.style.alignItems = 'center';
      
      const gInput = document.createElement('input');
      gInput.type = 'text';
      gInput.value = group.groupName;
      gInput.className = 'search-input ws-group-name';
      gInput.style.flex = '1';
      gInput.style.fontWeight = 'bold';
      
      const btnDelGroup = document.createElement('button');
      btnDelGroup.className = 'btn-icon';
      btnDelGroup.style.color = '#ff6b6b';
      btnDelGroup.innerHTML = '&times;';
      btnDelGroup.onclick = () => { gDiv.remove(); };

      gHeader.appendChild(gInput);
      gHeader.appendChild(btnDelGroup);
      gDiv.appendChild(gHeader);

      const itemsContainer = document.createElement('div');
      itemsContainer.className = 'ws-items-list';
      
      group.items.forEach(item => {
        itemsContainer.appendChild(createItemDOM(item.name, item.url));
      });
      gDiv.appendChild(itemsContainer);

      const btnAddItem = document.createElement('button');
      btnAddItem.className = 'btn-secondary';
      btnAddItem.style.marginTop = '0.5rem';
      btnAddItem.style.fontSize = '0.8rem';
      btnAddItem.innerText = '+ Add Site';
      btnAddItem.onclick = () => {
        itemsContainer.appendChild(createItemDOM('', 'https://'));
      };
      gDiv.appendChild(btnAddItem);

      wsContainer.appendChild(gDiv);
    });
  }

  function createItemDOM(name, url) {
    const iDiv = document.createElement('div');
    iDiv.className = 'ws-item-edit';
    
    const iName = document.createElement('input');
    iName.type = 'text';
    iName.value = name;
    iName.className = 'search-input ws-item-name';
    iName.placeholder = 'Name';
    
    const iUrl = document.createElement('input');
    iUrl.type = 'text';
    iUrl.value = url;
    iUrl.className = 'search-input ws-item-url';
    iUrl.placeholder = 'URL';
    
    const btnDelItem = document.createElement('button');
    btnDelItem.className = 'btn-icon';
    btnDelItem.style.color = '#ff6b6b';
    btnDelItem.innerHTML = '&times;';
    btnDelItem.onclick = () => { iDiv.remove(); };
    
    iDiv.appendChild(iName);
    iDiv.appendChild(iUrl);
    iDiv.appendChild(btnDelItem);
    return iDiv;
  }

  btnAddGroup?.addEventListener('click', () => {
    window.appConfig.bookmarks = window.appConfig.bookmarks || [];
    window.appConfig.bookmarks.push({ groupId: 'group_' + Date.now(), groupName: 'New Group', items: [] });
    renderWorkspacesEditor();
  });

  const closeModal = () => modal.style.display = 'none';

  btnOpen?.addEventListener('click', () => {
    inputBg.value = window.appConfig?.background?.unsplashQuery || 'nature';
    inputCity.value = window.appConfig?.weather?.city || 'Seoul';
    inputWeatherApi.value = window.appConfig?.weather?.apiKey === 'DEMO_KEY' ? '' : (window.appConfig?.weather?.apiKey || '');
    renderWorkspacesEditor();
    
    // Switch to first tab by default
    tabBtns[0].click();
    modal.style.display = 'flex';
  });

  btnClose?.addEventListener('click', closeModal);
  btnCloseTop?.addEventListener('click', closeModal);

  btnSave?.addEventListener('click', async () => {
    if(!window.appConfig) return;
    
    // Save General Setttings
    if(!window.appConfig.background) window.appConfig.background = {};
    window.appConfig.background.unsplashQuery = inputBg.value;
    
    if(!window.appConfig.weather) window.appConfig.weather = {};
    window.appConfig.weather.city = inputCity.value;
    
    // Fallback securely so we don't save empty string and ruin defaults completely unless user empties it
    if (inputWeatherApi.value.trim() !== '') {
      window.appConfig.weather.apiKey = inputWeatherApi.value.trim();
    } else if (window.appConfig.weather.apiKey !== 'DEMO_KEY') {
      window.appConfig.weather.apiKey = 'DEMO_KEY';
    }
    
    // Collect Workspaces from DOM
    const newBookmarks = [];
    const groups = wsContainer.querySelectorAll('.ws-group-edit');
    groups.forEach((gEl, idx) => {
      const gName = gEl.querySelector('.ws-group-name').value;
      const items = [];
      gEl.querySelectorAll('.ws-item-edit').forEach(iEl => {
        const iName = iEl.querySelector('.ws-item-name').value;
        const iUrl = iEl.querySelector('.ws-item-url').value;
        if(iName || iUrl) items.push({ name: iName, url: iUrl });
      });
      newBookmarks.push({
         groupId: window.appConfig.bookmarks?.[idx]?.groupId || 'group_'+Date.now()+idx,
         groupName: gName,
         items: items
      });
    });
    window.appConfig.bookmarks = newBookmarks;
    
    // Save to server
    await saveSettings(window.appConfig);
    closeModal();
    window.location.reload();
  });
});
