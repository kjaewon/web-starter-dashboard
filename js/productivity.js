import { saveSettings } from '../src/settings.js';

export { initTodo, initPomodoro };

// ToDo List Logic
function initTodo() {
  const form = document.getElementById('todo-form');
  const input = document.getElementById('todo-input');
  const list = document.getElementById('todo-list');
  const MAX_TODOS = 3;

  // Load from config
  let todos = window.appConfig?.todos || [];

  async function save() {
    if (!window.appConfig) return;
    window.appConfig.todos = todos;
    await saveSettings(window.appConfig);
  }

  function render() {
    list.innerHTML = '';
    todos.forEach((todo, index) => {
      const li = document.createElement('li');
      li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
      
      li.innerHTML = `
        <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''} data-index="${index}">
        <span class="todo-text">${todo.text}</span>
        <button class="todo-delete" data-index="${index}">&times;</button>
      `;
      list.appendChild(li);
    });

    if (todos.length >= MAX_TODOS) {
      input.placeholder = "Max 3 priorities reached";
      input.disabled = true;
      form.querySelector('button').disabled = true;
    } else {
      input.placeholder = "What's the main focus today?";
      input.disabled = false;
      form.querySelector('button').disabled = false;
    }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (text && todos.length < MAX_TODOS) {
      todos.push({ text, completed: false });
      input.value = '';
      save();
      render();
    }
  });

  list.addEventListener('click', (e) => {
    if (e.target.classList.contains('todo-checkbox')) {
      const index = e.target.dataset.index;
      todos[index].completed = e.target.checked;
      save();
      render();
    } else if (e.target.classList.contains('todo-delete')) {
      const index = e.target.dataset.index;
      todos.splice(index, 1);
      save();
      render();
    }
  });

  render();
}

// Pomodoro Timer Logic
function initPomodoro() {
  const timeDisplay = document.getElementById('pomodoro-time');
  const btnStart = document.getElementById('pomo-start');
  const btnPause = document.getElementById('pomo-pause');
  const btnReset = document.getElementById('pomo-reset');
  
  const btnIncrease = document.getElementById('pomo-increase');
  const btnDecrease = document.getElementById('pomo-decrease');

  let workTimeMinutes = 25;
  let timeLeft = workTimeMinutes * 60;
  let timerId = null;
  let isRunning = false;

  function updateDisplay() {
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    timeDisplay.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  function start() {
    if (isRunning) return;
    isRunning = true;
    timerId = setInterval(() => {
      if (timeLeft > 0) {
        timeLeft--;
        updateDisplay();
      } else {
        clearInterval(timerId);
        isRunning = false;
        alert('Pomodoro completed! Take a break.');
        
        // Track Deep Work internally
        trackPomodoroCompletion(workTimeMinutes);
      }
    }, 1000);
  }

  async function trackPomodoroCompletion(minutes) {
    if(!window.appConfig) return;
    if(!window.appConfig.analytics) {
      window.appConfig.analytics = { efficiency: 0, dwHistory: [0,0,0,0,0,0,0] };
    }
    
    // Add efficiency score up to 100
    window.appConfig.analytics.efficiency = Math.min(window.appConfig.analytics.efficiency + 10, 100);
    
    // Add to today's deep work (assuming today is the last item [6] for simplicity in demo)
    const hours = minutes / 60;
    const currentToday = window.appConfig.analytics.dwHistory[6] || 0;
    window.appConfig.analytics.dwHistory[6] = currentToday + hours;
    
    await saveSettings(window.appConfig);
    
    // Trigger Analytics UI refresh locally
    document.dispatchEvent(new Event('analyticsUpdated'));
  }

  function pause() {
    clearInterval(timerId);
    isRunning = false;
  }

  function reset() {
    clearInterval(timerId);
    isRunning = false;
    timeLeft = workTimeMinutes * 60;
    updateDisplay();
  }

  function addTime() {
    if (isRunning) pause();
    workTimeMinutes += 5;
    if (workTimeMinutes > 60) workTimeMinutes = 60;
    reset();
  }

  function subtractTime() {
    if (isRunning) pause();
    workTimeMinutes -= 5;
    if (workTimeMinutes < 5) workTimeMinutes = 5;
    reset();
  }

  btnStart.addEventListener('click', start);
  btnPause.addEventListener('click', pause);
  btnReset.addEventListener('click', reset);
  btnIncrease.addEventListener('click', addTime);
  btnDecrease.addEventListener('click', subtractTime);

  updateDisplay();
}
