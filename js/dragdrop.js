import { saveSettings } from '../src/settings.js';

export function initDragAndDrop() {
  const draggables = document.querySelectorAll('.widget-draggable');
  const containers = [
    document.querySelector('.top-bar'),
    document.querySelector('.main-widgets-grid'),
    document.querySelector('.bottom-section')
  ];

  // Load saved order from Supabase config
  const savedOrder = window.appConfig?.widgetOrder || null;
  if (savedOrder) {
    savedOrder.forEach(item => {
      const el = document.getElementById(item.id);
      const container = document.getElementById(item.containerId) || document.querySelector(`.${item.containerClass}`);
      if (el && container) {
        container.appendChild(el);
      }
    });
  }

  draggables.forEach(draggable => {
    draggable.addEventListener('dragstart', () => {
      draggable.classList.add('dragging');
      // Set opacity or ghost image if needed
      setTimeout(() => draggable.style.opacity = '0.5', 0);
    });

    draggable.addEventListener('dragend', () => {
      draggable.classList.remove('dragging');
      draggable.style.opacity = '1';
      saveOrder();
    });
  });

  containers.forEach(container => {
    if (!container) return;
    
    // Give containers an ID or use class for saving
    if (!container.id) {
      container.id = 'container-' + Math.random().toString(36).substr(2, 9);
    }

    container.addEventListener('dragover', e => {
      e.preventDefault();
      container.classList.add('drag-over');
      const afterElement = getDragAfterElement(container, e.clientY, e.clientX);
      const draggable = document.querySelector('.dragging');
      if (draggable) {
        if (afterElement == null) {
          container.appendChild(draggable);
        } else {
          container.insertBefore(draggable, afterElement);
        }
      }
    });

    container.addEventListener('dragleave', () => {
      container.classList.remove('drag-over');
    });

    container.addEventListener('drop', () => {
      container.classList.remove('drag-over');
    });
  });

  // Calculate where to drop
  function getDragAfterElement(container, y, x) {
    const draggableElements = [...container.querySelectorAll('.widget-draggable:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      // Use both X and Y for grid layouts
      const offsetY = y - box.top - box.height / 2;
      const offsetX = x - box.left - box.width / 2;
      
      // Simple heuristic for grid sorting
      if (offsetY < 0 && Math.abs(offsetY) > Math.abs(offsetX)) {
          if (offsetY > closest.offset && offsetY < 0) {
            return { offset: offsetY, element: child };
          }
      }
      return closest;
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }

  function saveOrder() {
    const order = [];
    draggables.forEach(widget => {
      order.push({
        id: widget.id,
        containerId: widget.parentElement.id,
        containerClass: widget.parentElement.className
      });
    });

    if (window.appConfig) {
      window.appConfig.widgetOrder = order;
      saveSettings(window.appConfig);
    }
  }
}
