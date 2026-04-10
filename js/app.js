import { initAuth } from '../src/auth.js';
import { initSettings } from '../src/settings.js';
import { initClock, initWeather, initSearch, initBookmarks, initRSS, initAnalytics } from './widgets.js';
import { initTodo, initPomodoro } from './productivity.js';
import { initDragAndDrop } from './dragdrop.js';

import '../css/glassmorphism.css';
import '../css/style.css';

window.appConfig = {};
let isAppInitialized = false;

document.addEventListener('DOMContentLoaded', async () => {
  // Load default fallback config initially so UI doesn't look completely broken before login
  try {
    const res = await fetch('./config.json');
    window.appConfig = await res.json();
    initTheme();
    initBackground();
    initializeApp();
  } catch (error) {
    console.error('Error loading fallback config', error);
  }

  // Init Auth (This will determine if we show login or not)
  await initAuth();
});

document.addEventListener('userAuthenticated', async (e) => {
  const user = e.detail;
  
  // Load precise user config from Supabase
  await initSettings(user);
  
  // Re-apply theme and background according to server config
  initTheme();
  initBackground();
  
  // Re-initialize app components with the new user config
  initializeApp();
});

document.addEventListener('analyticsUpdated', () => {
  initAnalytics();
});

function initializeApp() {
  // 1. Clear contents for a fresh start so we don't append duplicates
  document.getElementById('bookmarks-container').innerHTML = '';
  document.getElementById('search-engine-select').innerHTML = '';
  document.getElementById('todo-list').innerHTML = '';
  document.getElementById('rss-feed-list').innerHTML = '<li class="loading-text">Loading feeds...</li>';

  // 2. Init all modules
  initClock();
  initWeather();
  initSearch();
  initBookmarks();
  initRSS();
  initAnalytics();
  initTodo();
  initPomodoro();
  
  // Drag and drop relies on the generated elements
  initDragAndDrop();
}

// ------------------------------------
// UI Logic Helper Functions
// ------------------------------------

function initTheme() {
  const themeToggle = document.getElementById('theme-toggle');
  const body = document.getElementById('app-body');
  
  const defaultTheme = window.appConfig?.theme || 'dark';
  const currentTheme = localStorage.getItem('theme') || defaultTheme;
  
  if (currentTheme === 'light') {
    body.classList.remove('dark-mode');
  } else {
    body.classList.add('dark-mode');
  }

  // Remove old listeners to prevent multiple firing 
  // (using cloneNode is a quick trick to strip all anonymous evt listeners)
  const newToggle = themeToggle.cloneNode(true);
  themeToggle.parentNode.replaceChild(newToggle, themeToggle);

  newToggle.addEventListener('click', () => {
    body.classList.toggle('dark-mode');
    const isDark = body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  });
}

function initBackground() {
  const bgOverlay = document.getElementById('bg-overlay');
  const query = window.appConfig?.background?.unsplashQuery || 'nature';
  
  // Simple cache busting param
  const imgUrl = `https://source.unsplash.com/1920x1080/?${encodeURIComponent(query)}&t=${new Date().getTime()}`;
  
  const img = new Image();
  img.src = imgUrl;
  img.onload = () => {
    bgOverlay.style.backgroundImage = `url(${imgUrl})`;
    bgOverlay.style.opacity = '1';
  };
  img.onerror = () => {
    bgOverlay.style.backgroundImage = `url('https://images.unsplash.com/photo-1506744626753-1fa44df31c2f?auto=format&fit=crop&w=1920&q=80')`;
    bgOverlay.style.opacity = '1';
  };
}
