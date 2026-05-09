import './style.css';
import type { Project, Story, StoryPriority, StoryState, User, Task, TaskPriority, Notification } from './types';
import {
  createProject,
  createStory,
  deleteProject,
  deleteStory,
  getActiveProjectId,
  getCurrentUser,
  getProjects,
  getStoriesByProject,
  setActiveProjectId,
  updateProject,
  updateStory,
  getTasksByStory,
  createTask,
  updateTask,
  deleteTask,
  getUsers,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from './storage';
import { notificationService } from './notifications';

declare var bootstrap: any;

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('Root #app not found');
}

const currentUser: User = getCurrentUser();

app.innerHTML = `
<div class="container py-4">
  <header class="d-flex justify-content-between align-items-center mb-4">
    <div>
      <h1 class="display-5 fw-bold mb-0">ManageMe</h1>
      <p class="text-secondary mb-0">Proste zarządzanie projektami, historyjkami i aktywnym kontekstem.</p>
    </div>
    <div class="d-flex align-items-center gap-3">
      <button class="btn btn-outline-secondary rounded-circle notification-bell hover-lift" id="notifications-btn" aria-controls="notifications-offcanvas">
        <i class="bi bi-bell"></i>
        <span class="badge bg-danger notification-badge shadow-sm" id="notifications-count" style="display: none;">0</span>
      </button>
      <button class="btn btn-outline-secondary rounded-circle d-flex align-items-center justify-content-center" style="width: 42px; height: 42px;" id="theme-switcher" aria-label="Zmień motyw">
        <i class="bi bi-moon-stars"></i>
      </button>
      <div class="text-end">
        <div class="small text-uppercase text-secondary" style="font-size: 0.7rem; letter-spacing: 0.1em;">Zalogowany użytkownik</div>
        <div class="badge bg-secondary bg-opacity-25 border border-secondary text-body rounded-pill py-2 px-3 fw-medium" id="user-name"></div>
      </div>
    </div>
  </header>

  <div class="row g-4">
    <div class="col-lg-5">
      <div class="card p-4 border-0 mb-4 hover-lift">
        <h2 class="h5 fw-semibold mb-3">Projekt</h2>
        <form id="project-form" class="d-flex flex-column gap-3">
          <input type="hidden" id="project-id" />
          
          <div>
            <label class="form-label text-secondary small mb-1">Nazwa projektu</label>
            <input id="project-name" class="form-control" type="text" placeholder="Np. Aplikacja CRM" required />
          </div>

          <div>
            <label class="form-label text-secondary small mb-1">Opis</label>
            <textarea id="project-description" class="form-control" rows="3" placeholder="Krótki opis celu projektu"></textarea>
          </div>

          <div class="d-flex justify-content-end gap-2 mt-2">
            <button type="button" class="btn btn-light" id="cancel-edit-btn">Anuluj edycję</button>
            <button type="submit" class="btn btn-primary" id="save-btn">Zapisz</button>
          </div>
        </form>
      </div>

      <div class="card p-4 border-0 hover-lift">
        <header class="d-flex justify-content-between align-items-start mb-3">
          <div>
            <h2 class="h5 fw-semibold mb-1">Lista projektów</h2>
            <p class="text-secondary small mb-0">Wybierz aktywny projekt, aby pracować na jego historyjkach.</p>
          </div>
          <span class="badge bg-secondary bg-opacity-25 border border-secondary text-body rounded-pill px-3 py-2" id="projects-count">0 projektów</span>
        </header>
        <div id="projects-empty" class="empty-state">
          Brak projektów. Dodaj pierwszy projekt w formularzu powyżej.
        </div>
        <ul id="projects-list" class="list-unstyled d-flex flex-column gap-2 mb-0" style="max-height: 400px; overflow-y: auto;"></ul>
      </div>
    </div>

    <div class="col-lg-7">
      <div class="card p-4 border-0 mb-4 hover-lift" id="stories-card">
        <header class="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
          <div>
            <h2 class="h5 fw-semibold mb-1">Historyjki projektu</h2>
            <p class="text-secondary small mb-0" id="stories-project-label">Brak aktywnego projektu.</p>
          </div>
          <div class="d-flex flex-wrap gap-2">
            <button class="btn btn-sm btn-primary stories-filter-btn active" data-filter="all">Wszystkie</button>
            <button class="btn btn-sm btn-outline-secondary stories-filter-btn" data-filter="todo">Do zrobienia</button>
            <button class="btn btn-sm btn-outline-primary stories-filter-btn" data-filter="doing">W toku</button>
            <button class="btn btn-sm btn-outline-success stories-filter-btn" data-filter="done">Zamknięte</button>
          </div>
        </header>

        <form id="story-form" class="mb-4">
          <input type="hidden" id="story-id" />
          <div class="row g-2 mb-3">
            <div class="col-md-5">
              <label class="form-label text-secondary small mb-1">Tytuł</label>
              <input id="story-name" class="form-control form-control-sm" type="text" placeholder="Krótki tytuł" required />
            </div>
            <div class="col-md-3">
              <label class="form-label text-secondary small mb-1">Priorytet</label>
              <select id="story-priority" class="form-select form-select-sm">
                <option value="low">Niski</option>
                <option value="medium" selected>Średni</option>
                <option value="high">Wysoki</option>
              </select>
            </div>
            <div class="col-md-4">
              <label class="form-label text-secondary small mb-1">Status</label>
              <select id="story-state" class="form-select form-select-sm">
                <option value="todo">Do zrobienia</option>
                <option value="doing">W toku</option>
                <option value="done">Zamknięte</option>
              </select>
            </div>
          </div>
          <div class="mb-3">
            <label class="form-label text-secondary small mb-1">Opis</label>
            <textarea id="story-description" class="form-control form-control-sm" rows="2" placeholder="Szczegóły funkcjonalności"></textarea>
          </div>
          <div class="d-flex justify-content-end gap-2">
            <button type="button" class="btn btn-sm btn-light" id="story-cancel-btn">Wyczyść</button>
            <button type="submit" class="btn btn-sm btn-primary" id="story-save-btn">Zapisz historyjkę</button>
          </div>
        </form>

        <div id="stories-empty" class="empty-state">
          Brak historyjek dla aktywnego projektu.
        </div>
        <ul id="stories-list" class="list-unstyled d-flex flex-column gap-2 mb-0" style="max-height: 350px; overflow-y: auto;"></ul>
      </div>

      <div class="card p-4 border-0 hover-lift" id="tasks-card">
        <header class="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h2 class="h5 fw-semibold mb-1">Tablica Zadań</h2>
            <p class="text-secondary small mb-0" id="tasks-story-label">Wybierz historyjkę, aby zarządzać zadaniami.</p>
          </div>
          <button type="button" class="btn btn-sm btn-primary shadow-sm" id="add-task-btn" disabled><i class="bi bi-plus-lg"></i> Dodaj zadanie</button>
        </header>

        <div class="kanban-board" id="kanban-board" style="display: none;">
          <div class="kanban-column">
            <h3 class="fw-semibold"><i class="bi bi-card-checklist text-secondary me-1"></i> Do zrobienia</h3>
            <div class="kanban-list" id="kanban-todo" data-state="todo"></div>
          </div>
          <div class="kanban-column">
            <h3 class="fw-semibold"><i class="bi bi-clock-history text-primary me-1"></i> W toku</h3>
            <div class="kanban-list" id="kanban-doing" data-state="doing"></div>
          </div>
          <div class="kanban-column">
            <h3 class="fw-semibold"><i class="bi bi-check2-circle text-success me-1"></i> Zamknięte</h3>
            <div class="kanban-list" id="kanban-done" data-state="done"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<div class="custom-modal-overlay hidden" id="task-modal">
  <div class="custom-modal-content card border-0 p-4 shadow-lg mx-auto">
    <header class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="h5 fw-bold mb-0" id="task-modal-title">Zadanie</h2>
      <button type="button" class="btn-close" id="task-modal-close" aria-label="Zwiń"></button>
    </header>
    <form id="task-form">
      <input type="hidden" id="task-id" />
      
      <div class="row g-3 mb-3">
        <div class="col-sm-12">
          <label class="form-label text-secondary small mb-1">Nazwa zadania</label>
          <input id="task-name" class="form-control" type="text" placeholder="Krótka nazwa" required />
        </div>
        <div class="col-sm-4">
          <label class="form-label text-secondary small mb-1">Priorytet</label>
          <select id="task-priority" class="form-select">
            <option value="low">Niski</option>
            <option value="medium" selected>Średni</option>
            <option value="high">Wysoki</option>
          </select>
        </div>
        <div class="col-sm-4">
          <label class="form-label text-secondary small mb-1">Czas (godz.)</label>
          <input id="task-hours" class="form-control" type="number" min="0" step="0.5" value="1" required />
        </div>
        <div class="col-sm-4" id="task-assignee-field" style="display: none;">
          <label class="form-label text-secondary small mb-1">Przypisz pracownika</label>
          <select id="task-assignee" class="form-select">
            <option value="">Wybierz...</option>
          </select>
        </div>
      </div>

      <div class="mb-3">
        <label class="form-label text-secondary small mb-1">Opis</label>
        <textarea id="task-description" class="form-control" rows="3" placeholder="Szczegóły..."></textarea>
      </div>

      <div class="card bg-secondary bg-opacity-10 border-0 p-3 mb-4 rounded" id="task-stats" style="display: none;">
        <div class="row small m-0">
          <div class="col-6 mb-2 ps-0"><strong>Stan:</strong> <span class="badge bg-secondary px-2 py-1" id="task-state-label"></span></div>
          <div class="col-6 mb-2 pe-0"><strong>Przypisano:</strong> <span id="task-assignee-label" class="text-body fw-medium"></span></div>
          <div class="col-6 mb-2 ps-0"><strong>Dodano:</strong> <span id="task-created-at" class="text-muted fw-medium"></span></div>
          <div class="col-6 mb-2 pe-0" id="task-started-container" style="display:none;"><strong>Start:</strong> <span id="task-started-at" class="text-muted fw-medium"></span></div>
          <div class="col-6 mb-0 ps-0" id="task-finished-container" style="display:none;"><strong>Koniec:</strong> <span id="task-finished-at" class="text-muted fw-medium"></span></div>
        </div>
      </div>

      <div class="d-flex justify-content-between align-items-center" id="task-form-actions">
        <div>
          <button type="button" class="btn btn-outline-danger" id="task-delete-btn" style="display: none;"><i class="bi bi-trash3"></i> Usuń</button>
        </div>
        <div class="d-flex gap-2">
          <button type="button" class="btn btn-outline-primary fw-medium" id="task-start-btn" style="display: none;">Rozpocznij</button>
          <button type="button" class="btn btn-outline-success fw-medium" id="task-done-btn" style="display: none;">Zakończ</button>
          <button type="submit" class="btn btn-primary fw-medium shadow-sm" id="task-save-btn">Zapisz zadanie</button>
        </div>
      </div>
    </form>
  </div>
</div>

<div class="offcanvas offcanvas-end shadow-lg" tabindex="-1" id="notifications-offcanvas" aria-labelledby="notifications-label" style="width: 400px; border-left: 1px solid var(--bs-border-color);">
  <div class="offcanvas-header border-bottom">
    <h5 class="offcanvas-title fw-bold" id="notifications-label"><i class="bi bi-bell-fill text-primary me-2"></i>Powiadomienia</h5>
    <div class="d-flex gap-2 align-items-center">
      <button type="button" class="btn btn-sm btn-outline-secondary" id="mark-all-read-btn" title="Oznacz wszystkie jako przeczytane"><i class="bi bi-check2-all"></i></button>
      <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Zamknij"></button>
    </div>
  </div>
  <div class="offcanvas-body p-0 bg-body-tertiary">
    <div id="notifications-empty" class="p-4 text-center text-secondary" style="display: none;">
      <i class="bi bi-inbox fs-1 mb-2 d-block opacity-50"></i>
      Brak nowych powiadomień.
    </div>
    <div class="list-group list-group-flush" id="notifications-list"></div>
  </div>
</div>

<div class="toast-container position-fixed bottom-0 end-0 p-3" id="toast-container" style="z-index: 1100"></div>

<!-- Modal podglądu powiadomienia -->
<div class="modal fade" id="notification-details-modal" tabindex="-1" aria-labelledby="notificationDetailsLabel" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title fw-bold" id="notificationDetailsLabel">Szczegóły powiadomienia</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Zamknij"></button>
      </div>
      <div class="modal-body">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <span class="badge" id="notif-detail-priority"></span>
          <small class="text-muted" id="notif-detail-date"></small>
        </div>
        <h4 class="h5 mb-3" id="notif-detail-title"></h4>
        <p class="mb-0" id="notif-detail-message"></p>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Zamknij</button>
      </div>
    </div>
  </div>
</div>
`;

const userNameLabel = document.querySelector<HTMLSpanElement>('#user-name')!;
const form = document.querySelector<HTMLFormElement>('#project-form')!;
const idInput = document.querySelector<HTMLInputElement>('#project-id')!;
const nameInput = document.querySelector<HTMLInputElement>('#project-name')!;
const descriptionInput = document.querySelector<HTMLTextAreaElement>('#project-description')!;
const cancelEditBtn = document.querySelector<HTMLButtonElement>('#cancel-edit-btn')!;
const projectsList = document.querySelector<HTMLUListElement>('#projects-list')!;
const projectsEmpty = document.querySelector<HTMLDivElement>('#projects-empty')!;
const projectsCount = document.querySelector<HTMLSpanElement>('#projects-count')!;
const saveBtn = document.querySelector<HTMLButtonElement>('#save-btn')!;

// Story elements
const storiesCard = document.querySelector<HTMLElement>('#stories-card')!;
const storiesProjectLabel = document.querySelector<HTMLParagraphElement>('#stories-project-label')!;
const storyForm = document.querySelector<HTMLFormElement>('#story-form')!;
const storyIdInput = document.querySelector<HTMLInputElement>('#story-id')!;
const storyNameInput = document.querySelector<HTMLInputElement>('#story-name')!;
const storyDescriptionInput = document.querySelector<HTMLTextAreaElement>('#story-description')!;
const storyPrioritySelect = document.querySelector<HTMLSelectElement>('#story-priority')!;
const storyStateSelect = document.querySelector<HTMLSelectElement>('#story-state')!;
const storySaveBtn = document.querySelector<HTMLButtonElement>('#story-save-btn')!;
const storyCancelBtn = document.querySelector<HTMLButtonElement>('#story-cancel-btn')!;
const storiesEmpty = document.querySelector<HTMLDivElement>('#stories-empty')!;
const storiesList = document.querySelector<HTMLUListElement>('#stories-list')!;
const storiesFilterButtons = Array.from(
  document.querySelectorAll<HTMLButtonElement>('.stories-filter-btn'),
);

if (
  !userNameLabel ||
  !form ||
  !idInput ||
  !nameInput ||
  !descriptionInput ||
  !cancelEditBtn ||
  !projectsList ||
  !projectsEmpty ||
  !projectsCount ||
  !saveBtn ||
  !storiesCard ||
  !storiesProjectLabel ||
  !storyForm ||
  !storyIdInput ||
  !storyNameInput ||
  !storyDescriptionInput ||
  !storyPrioritySelect ||
  !storyStateSelect ||
  !storySaveBtn ||
  !storyCancelBtn ||
  !storiesEmpty ||
  !storiesList
) {
  throw new Error('ManageMe UI elements not found');
}

userNameLabel.textContent = `${currentUser.firstName} ${currentUser.lastName} [${currentUser.role}]`;

// Tasks elements
const tasksCardLabel = document.querySelector<HTMLParagraphElement>('#tasks-story-label')!;
const addTaskBtn = document.querySelector<HTMLButtonElement>('#add-task-btn')!;
const kanbanBoard = document.querySelector<HTMLDivElement>('#kanban-board')!;
const kanbanTodo = document.querySelector<HTMLDivElement>('#kanban-todo')!;
const kanbanDoing = document.querySelector<HTMLDivElement>('#kanban-doing')!;
const kanbanDone = document.querySelector<HTMLDivElement>('#kanban-done')!;
const taskModal = document.querySelector<HTMLDivElement>('#task-modal')!;
const taskModalCloseBtn = document.querySelector<HTMLButtonElement>('#task-modal-close')!;
const taskForm = document.querySelector<HTMLFormElement>('#task-form')!;
const taskIdInput = document.querySelector<HTMLInputElement>('#task-id')!;
const taskNameInput = document.querySelector<HTMLInputElement>('#task-name')!;
const taskPrioritySelect = document.querySelector<HTMLSelectElement>('#task-priority')!;
const taskHoursInput = document.querySelector<HTMLInputElement>('#task-hours')!;
const taskAssigneeField = document.querySelector<HTMLDivElement>('#task-assignee-field')!;
const taskAssigneeSelect = document.querySelector<HTMLSelectElement>('#task-assignee')!;
const taskDescriptionInput = document.querySelector<HTMLTextAreaElement>('#task-description')!;
const taskStats = document.querySelector<HTMLDivElement>('#task-stats')!;
const taskStateLabel = document.querySelector<HTMLSpanElement>('#task-state-label')!;
const taskAssigneeLabel = document.querySelector<HTMLSpanElement>('#task-assignee-label')!;
const taskCreatedAtLabel = document.querySelector<HTMLSpanElement>('#task-created-at')!;
const taskStartedContainer = document.querySelector<HTMLParagraphElement>('#task-started-container')!;
const taskStartedAtLabel = document.querySelector<HTMLSpanElement>('#task-started-at')!;
const taskFinishedContainer = document.querySelector<HTMLParagraphElement>('#task-finished-container')!;
const taskFinishedAtLabel = document.querySelector<HTMLSpanElement>('#task-finished-at')!;
const taskSaveBtn = document.querySelector<HTMLButtonElement>('#task-save-btn')!;
const taskDeleteBtn = document.querySelector<HTMLButtonElement>('#task-delete-btn')!;
const taskStartBtn = document.querySelector<HTMLButtonElement>('#task-start-btn')!;
const taskDoneBtn = document.querySelector<HTMLButtonElement>('#task-done-btn')!;

// Theme Switcher Logic
const themeSwitcher = document.querySelector<HTMLButtonElement>('#theme-switcher')!;
const htmlEl = document.documentElement;

if (themeSwitcher) {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    htmlEl.setAttribute('data-bs-theme', savedTheme);
    themeSwitcher.innerHTML = savedTheme === 'dark' ? '<i class="bi bi-sun"></i>' : '<i class="bi bi-moon-stars"></i>';
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    htmlEl.setAttribute('data-bs-theme', 'light');
    themeSwitcher.innerHTML = '<i class="bi bi-moon-stars"></i>';
  }

  themeSwitcher.addEventListener('click', () => {
    const currentTheme = htmlEl.getAttribute('data-bs-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    htmlEl.setAttribute('data-bs-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    themeSwitcher.innerHTML = newTheme === 'dark' ? '<i class="bi bi-sun"></i>' : '<i class="bi bi-moon-stars"></i>';
  });
}

// Notifications elements
const notificationsBtn = document.querySelector<HTMLButtonElement>('#notifications-btn')!;
const notificationsCount = document.querySelector<HTMLSpanElement>('#notifications-count')!;
const notificationsList = document.querySelector<HTMLDivElement>('#notifications-list')!;
const notificationsEmpty = document.querySelector<HTMLDivElement>('#notifications-empty')!;
const markAllReadBtn = document.querySelector<HTMLButtonElement>('#mark-all-read-btn')!;
const toastContainer = document.querySelector<HTMLDivElement>('#toast-container')!;

const notifModal = document.getElementById('notification-details-modal')!;
const notifDetailTitle = document.getElementById('notif-detail-title')!;
const notifDetailMessage = document.getElementById('notif-detail-message')!;
const notifDetailDate = document.getElementById('notif-detail-date')!;
const notifDetailPriority = document.getElementById('notif-detail-priority')!;

if (!notificationsBtn || !notificationsCount || !notificationsList || !notificationsEmpty || !markAllReadBtn || !toastContainer || !notifModal || !notifDetailTitle || !notifDetailMessage || !notifDetailDate || !notifDetailPriority) {
  throw new Error('ManageMe Notifications UI elements not found');
}

function renderNotifications(): void {
  const notifications = getNotifications(currentUser.id);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (unreadCount > 0) {
    notificationsCount.textContent = unreadCount.toString();
    notificationsCount.style.display = 'inline-block';
  } else {
    notificationsCount.style.display = 'none';
  }

  notificationsList.innerHTML = '';

  if (notifications.length === 0) {
    notificationsEmpty.style.display = 'block';
  } else {
    notificationsEmpty.style.display = 'none';
    
    notifications.forEach(notif => {
      const a = document.createElement('a');
      a.className = `list-group-item list-group-item-action notification-item priority-${notif.priority} ${!notif.isRead ? 'unread' : ''}`;
      a.dataset.id = notif.id;
      a.innerHTML = `
        <div class="notification-title d-flex justify-content-between align-items-center">
          <span>${notif.title}</span>
          ${!notif.isRead ? '<span class="badge bg-primary rounded-pill" style="width: 8px; height: 8px; padding: 0;">&nbsp;</span>' : ''}
        </div>
        <div class="notification-message">${notif.message}</div>
        <div class="notification-meta">
          <span>${formatDate(notif.date)}</span>
          ${!notif.isRead ? '<button class="btn btn-sm btn-link text-decoration-none p-0" data-action="mark-read">Oznacz jako przeczytane</button>' : ''}
        </div>
      `;
      notificationsList.appendChild(a);
    });
  }
}

function showToast(notif: Notification): void {
  if (notif.priority !== 'medium' && notif.priority !== 'high') return;

  const toastId = 'toast-' + notif.id;
  const toastHtml = `
    <div id="${toastId}" class="toast" role="alert" aria-live="assertive" aria-atomic="true" data-bs-delay="5000">
      <div class="toast-header">
        <strong class="me-auto ${notif.priority === 'high' ? 'text-danger' : 'text-warning'}">
          <i class="bi bi-bell-fill me-1"></i> ${notif.title}
        </strong>
        <small class="text-muted">teraz</small>
        <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Zamknij"></button>
      </div>
      <div class="toast-body">
        ${notif.message}
      </div>
    </div>
  `;
  
  toastContainer.insertAdjacentHTML('beforeend', toastHtml);
  const toastEl = document.getElementById(toastId);
  if (toastEl) {
    // @ts-ignore
    const toast = new bootstrap.Toast(toastEl);
    toast.show();
    
    toastEl.addEventListener('hidden.bs.toast', () => {
      toastEl.remove();
    });
  }
}

notificationsList.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  const item = target.closest('.notification-item');
  if (!item) return;

  const id = (item as HTMLElement).dataset.id;
  if (!id) return;

  if (target.closest('[data-action="mark-read"]')) {
    e.preventDefault();
    e.stopPropagation();
    markNotificationAsRead(id);
    renderNotifications();
    return;
  }

  // Kliknięcie w powiadomienie też oznacza jako przeczytane i otwiera modal
  e.preventDefault();
  markNotificationAsRead(id);
  renderNotifications();
  
  const notifications = getNotifications(currentUser.id);
  const notif = notifications.find(n => n.id === id);
  if (notif) {
    notifDetailTitle.textContent = notif.title;
    notifDetailMessage.textContent = notif.message;
    notifDetailDate.textContent = formatDate(notif.date);
    
    notifDetailPriority.className = 'badge';
    if (notif.priority === 'high') {
      notifDetailPriority.classList.add('bg-danger');
      notifDetailPriority.textContent = 'Wysoki priorytet';
    } else if (notif.priority === 'medium') {
      notifDetailPriority.classList.add('bg-warning', 'text-dark');
      notifDetailPriority.textContent = 'Średni priorytet';
    } else {
      notifDetailPriority.classList.add('bg-secondary');
      notifDetailPriority.textContent = 'Niski priorytet';
    }
    
    // @ts-ignore
    const modal = new bootstrap.Modal(notifModal);
    modal.show();
  }
});

markAllReadBtn.addEventListener('click', () => {
  markAllNotificationsAsRead(currentUser.id);
  renderNotifications();
});

// Manualne otwieranie panelu powiadomień
notificationsBtn.addEventListener('click', (e) => {
  e.preventDefault();
  const offcanvasEl = document.getElementById('notifications-offcanvas');
  if (offcanvasEl) {
    try {
      // @ts-ignore
      const offcanvas = bootstrap.Offcanvas.getOrCreateInstance(offcanvasEl);
      offcanvas.show();
    } catch (err) {
      console.error(err);
      // Awaryjne otwieranie okna
      offcanvasEl.style.visibility = 'visible';
      offcanvasEl.classList.add('show');
    }
  }
});

// Awaryjne zamykanie panelu
const notifCloseBtn = document.querySelector<HTMLButtonElement>('#notifications-offcanvas .btn-close');
if (notifCloseBtn) {
  notifCloseBtn.addEventListener('click', () => {
    const offcanvasEl = document.getElementById('notifications-offcanvas');
    if (offcanvasEl) {
      try {
        // @ts-ignore
        bootstrap.Offcanvas.getInstance(offcanvasEl)?.hide();
      } catch(e) {}
      offcanvasEl.style.visibility = 'hidden';
      offcanvasEl.classList.remove('show');
    }
  });
}

window.addEventListener('app:new-notification', (e: Event) => {
  const notif = (e as CustomEvent).detail as Notification;
  if (notif.recipientId === currentUser.id) {
    renderNotifications();
    showToast(notif);
  }
});

renderNotifications();

type StoriesFilter = 'all' | StoryState;

let activeProjectId: string | null = getActiveProjectId();
let activeStoriesFilter: StoriesFilter = 'all';
let activeStoryId: string | null = null;

function setProjectEditing(project: Project | null): void {
  if (!project) {
    idInput.value = '';
    nameInput.value = '';
    descriptionInput.value = '';
    saveBtn.textContent = 'Zapisz';
    cancelEditBtn.disabled = true;
  } else {
    idInput.value = project.id;
    nameInput.value = project.name;
    descriptionInput.value = project.description;
    saveBtn.textContent = 'Zapisz zmiany';
    cancelEditBtn.disabled = false;
    nameInput.focus();
  }
}

function formatCount(count: number): string {
  if (count === 1) return '1 projekt';
  if (count >= 2 && count <= 4) return `${count} projekty`;
  return `${count} projektów`;
}

function formatStoryPriority(priority: StoryPriority): string {
  if (priority === 'high') return 'Wysoki';
  if (priority === 'medium') return 'Średni';
  return 'Niski';
}

function formatStoryState(state: StoryState): string {
  if (state === 'doing') return 'W toku';
  if (state === 'done') return 'Zamknięte';
  return 'Do zrobienia';
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('pl-PL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function renderProjects(): void {
  const projects = getProjects();

  projectsList.innerHTML = '';

  if (projects.length === 0) {
    projectsEmpty.style.display = 'block';
    activeProjectId = null;
    setActiveProjectId(null);
  } else {
    projectsEmpty.style.display = 'none';
  }

  if (projects.length > 0 && (!activeProjectId || !projects.some((p) => p.id === activeProjectId))) {
    activeProjectId = projects[0].id;
    setActiveProjectId(activeProjectId);
  }

  projectsCount.textContent = formatCount(projects.length);

  for (const project of projects) {
    const li = document.createElement('li');
    li.dataset.id = project.id;
    li.className = `project-item p-3 mb-2 rounded border hover-lift d-flex justify-content-between align-items-start gap-3 ${activeProjectId === project.id ? 'border-primary border-2 bg-primary bg-opacity-10' : 'border-secondary border-opacity-25 bg-body-tertiary bg-opacity-50'}`;
    li.innerHTML = `
      <div class="flex-grow-1">
        <h3 class="h6 fw-semibold mb-1">${project.name || 'Bez nazwy'}</h3>
        <p class="text-secondary small mb-0" style="white-space: pre-wrap;">${project.description || '<brak opisu>'}</p>
      </div>
      <div class="d-flex gap-2 flex-shrink-0">
        <button type="button" class="btn btn-sm ${activeProjectId === project.id ? 'btn-primary shadow-sm' : 'btn-outline-secondary'}" data-action="set-active">
          ${activeProjectId === project.id ? '<i class="bi bi-check2"></i>' : 'Aktywuj'}
        </button>
        <button type="button" class="btn btn-sm btn-outline-secondary" data-action="edit" title="Edytuj"><i class="bi bi-pencil"></i></button>
        <button type="button" class="btn btn-sm btn-outline-danger" data-action="delete" title="Usuń"><i class="bi bi-trash3"></i></button>
      </div>
    `;

    projectsList.appendChild(li);
  }

  renderStories();
}

function clearStoryForm(): void {
  storyIdInput.value = '';
  storyNameInput.value = '';
  storyDescriptionInput.value = '';
  storyPrioritySelect.value = 'medium';
  storyStateSelect.value = 'todo';
  storySaveBtn.textContent = 'Zapisz historyjkę';
}

function setStoryEditing(story: Story | null): void {
  if (!story) {
    clearStoryForm();
    return;
  }

  storyIdInput.value = story.id;
  storyNameInput.value = story.name;
  storyDescriptionInput.value = story.description;
  storyPrioritySelect.value = story.priority;
  storyStateSelect.value = story.state;
  storySaveBtn.textContent = 'Zapisz zmiany';
  storyNameInput.focus();
}

function renderStories(): void {
  if (!activeProjectId) {
    storiesCard.classList.add('opacity-50');
    storiesProjectLabel.textContent = 'Brak aktywnego projektu.';
    storiesEmpty.style.display = 'block';
    storiesList.innerHTML = '';
    storyForm.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
      'input, textarea, select',
    ).forEach((el) => {
      el.disabled = true;
    });
    storySaveBtn.disabled = true;
    storyCancelBtn.disabled = true;
    return;
  }

  storiesCard.classList.remove('opacity-50');
  const projects = getProjects();
  const activeProject = projects.find((p) => p.id === activeProjectId) ?? null;
  storiesProjectLabel.textContent = activeProject
    ? `Aktywny projekt: ${activeProject.name}`
    : 'Aktywny projekt (nie znaleziono w liście)';

  storyForm.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
    'input, textarea, select',
  ).forEach((el) => {
    el.disabled = false;
  });
  storySaveBtn.disabled = false;
  storyCancelBtn.disabled = false;

  const allStories = getStoriesByProject(activeProjectId);
  const filteredStories =
    activeStoriesFilter === 'all'
      ? allStories
      : allStories.filter((s) => s.state === activeStoriesFilter);

  storiesList.innerHTML = '';

  if (filteredStories.length === 0) {
    storiesEmpty.style.display = 'block';
    return;
  }

  storiesEmpty.style.display = 'none';

  filteredStories.forEach((story) => {
    const li = document.createElement('li');
    li.dataset.id = story.id;
    li.className = 'story-item p-3 mb-2 rounded border border-secondary border-opacity-25 bg-body-tertiary bg-opacity-50 hover-lift d-flex flex-column gap-2 cursor-pointer';
    li.innerHTML = `
      <div class="d-flex gap-2 justify-content-between align-items-start">
        <h3 class="h6 fw-semibold mb-0">${story.name || 'Bez tytułu'}</h3>
        <div class="d-flex gap-1 flex-shrink-0">
          <span class="badge ${story.priority === 'high' ? 'text-bg-danger' : story.priority === 'medium' ? 'text-bg-warning' : 'text-bg-success'}">
            ${formatStoryPriority(story.priority)}
          </span>
          <span class="badge ${story.state === 'done' ? 'text-bg-success' : story.state === 'doing' ? 'text-bg-primary' : 'text-bg-secondary'}">
            ${formatStoryState(story.state)}
          </span>
        </div>
      </div>
      <p class="text-secondary small mb-0" style="white-space: pre-wrap;">${story.description || '<brak opisu>'}</p>
      <div class="d-flex justify-content-between align-items-center mt-2">
        <div class="small text-muted" style="font-size: 0.75rem;">
          <i class="bi bi-person me-1"></i> ${currentUser.firstName} ${currentUser.lastName} &nbsp;&middot;&nbsp; <i class="bi bi-calendar-event me-1"></i> ${formatDate(story.createdAt)}
        </div>
        <div class="d-flex gap-2 flex-shrink-0">
          <button type="button" class="btn btn-sm btn-outline-info" data-action="story-active"><i class="bi bi-kanban"></i> Zadania</button>
          <button type="button" class="btn btn-sm btn-outline-secondary" data-action="story-edit"><i class="bi bi-pencil"></i></button>
          <button type="button" class="btn btn-sm btn-outline-danger" data-action="story-delete"><i class="bi bi-trash3"></i></button>
        </div>
      </div>
    `;

    storiesList.appendChild(li);
  });
}

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const name = nameInput.value.trim();
  const description = descriptionInput.value.trim();

  if (!name) {
    nameInput.focus();
    return;
  }

  const existingId = idInput.value;

  if (existingId) {
    updateProject(existingId, { name, description });
  } else {
    const created = createProject({ name, description });
    activeProjectId = created.id;
    setActiveProjectId(created.id);
    notificationService.notifyProjectCreated(created);
  }

  setProjectEditing(null);
  renderProjects();
});

cancelEditBtn.addEventListener('click', () => {
  setProjectEditing(null);
});

projectsList.addEventListener('click', (event) => {
  const target = event.target as HTMLElement | null;
  if (!target) return;

  const action = target.dataset.action;
  if (!action) return;

  const item = target.closest<HTMLLIElement>('.project-item');
  if (!item || !item.dataset.id) return;

  const id = item.dataset.id;

  if (action === 'set-active') {
    activeProjectId = id;
    setActiveProjectId(id);
    setProjectEditing(null);
    renderProjects();
  }

  if (action === 'edit') {
    const projects = getProjects();
    const project = projects.find((p) => p.id === id) ?? null;
    setProjectEditing(project);
  }

  if (action === 'delete') {
    const confirmed = window.confirm('Czy na pewno chcesz usunąć ten projekt?');
    if (!confirmed) return;
    deleteProject(id);
    if (idInput.value === id) {
      setProjectEditing(null);
    }
    renderProjects();
  }
});

storyForm.addEventListener('submit', (event) => {
  event.preventDefault();

  if (!activeProjectId) return;

  const name = storyNameInput.value.trim();
  const description = storyDescriptionInput.value.trim();
  const priority = storyPrioritySelect.value as StoryPriority;
  const state = storyStateSelect.value as StoryState;

  if (!name) {
    storyNameInput.focus();
    return;
  }

  const existingId = storyIdInput.value;

  if (existingId) {
    updateStory(existingId, {
      name,
      description,
      priority,
      state,
    });
  } else {
    createStory({
      name,
      description,
      priority,
      state,
      projectId: activeProjectId,
      ownerId: currentUser.id,
    });
  }

  setStoryEditing(null);
  renderStories();
});

storyCancelBtn.addEventListener('click', () => {
  setStoryEditing(null);
});

storiesList.addEventListener('click', (event) => {
  const target = event.target as HTMLElement | null;
  if (!target) return;

  const action = target.dataset.action;
  if (!action) return;

  const item = target.closest<HTMLLIElement>('.story-item');
  if (!item || !item.dataset.id) return;

  const id = item.dataset.id;

  if (action === 'story-active') {
    activeStoryId = id;
    renderTasks();
  }

  if (action === 'story-edit') {
    if (!activeProjectId) return;
    const stories = getStoriesByProject(activeProjectId);
    const story = stories.find((s) => s.id === id) ?? null;
    setStoryEditing(story);
  }

  if (action === 'story-delete') {
    const confirmed = window.confirm('Czy na pewno chcesz usunąć tę historyjkę?');
    if (!confirmed) return;
    deleteStory(id);
    if (storyIdInput.value === id) {
      setStoryEditing(null);
    }
    renderStories();
  }
});

storiesFilterButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const filter = btn.dataset.filter as StoriesFilter | undefined;
    if (!filter) return;
    activeStoriesFilter = filter;
    storiesFilterButtons.forEach((b) => {
      b.classList.remove('active', 'btn-primary', 'btn-success');
      b.classList.add('btn-outline-secondary');
    });
    btn.classList.remove('btn-outline-secondary');
    if (filter === 'all' || filter === 'doing') {
      btn.classList.add('active', 'btn-primary');
    } else if (filter === 'done') {
      btn.classList.add('active', 'btn-success');
    } else {
      btn.classList.add('active', 'btn-secondary');
    }
    renderStories();
  });
});

cancelEditBtn.disabled = true;
storiesFilterButtons[0]?.click();
renderProjects();

// Tasks Logic
function renderTasks(): void {
  if (!activeStoryId) {
    tasksCardLabel.textContent = 'Wybierz historyjkę, aby zarządzać zadaniami.';
    addTaskBtn.disabled = true;
    kanbanBoard.style.display = 'none';
    return;
  }

  const stories = getStoriesByProject(activeProjectId!);
  const story = stories.find(s => s.id === activeStoryId);

  if (!story) {
    activeStoryId = null;
    renderTasks();
    return;
  }

  tasksCardLabel.textContent = `Zadania dla: ${story.name}`;
  addTaskBtn.disabled = false;
  kanbanBoard.style.display = 'flex';

  const tasks = getTasksByStory(activeStoryId);
  kanbanTodo.innerHTML = '';
  kanbanDoing.innerHTML = '';
  kanbanDone.innerHTML = '';

  tasks.forEach(task => {
    const div = document.createElement('div');
    div.className = 'card border border-secondary border-opacity-25 shadow-sm p-3 hover-lift cursor-pointer task-item';
    div.dataset.id = task.id;

    let assigneeName = 'Nieprzypisane';
    if (task.assigneeId) {
      const u = getUsers().find(x => x.id === task.assigneeId);
      if (u) assigneeName = `${u.firstName} ${u.lastName}`;
    }

    div.innerHTML = `
      <div class="fw-semibold small mb-2 text-body">${task.name}</div>
      <div class="d-flex justify-content-between align-items-center mb-2 task-meta">
        <span class="badge ${task.priority === 'high' ? 'bg-danger-subtle text-danger' : task.priority === 'medium' ? 'bg-warning-subtle text-warning' : 'bg-success-subtle text-success'} border border-opacity-25">
          P: ${task.priority}
        </span>
        <span class="text-secondary fw-medium"><i class="bi bi-hourglass-split"></i> ${task.estimatedHours}h</span>
      </div>
      <div class="d-flex justify-content-start align-items-center opacity-75">
        <div class="small text-secondary" style="font-size: 0.7rem;"><i class="bi bi-person-circle me-1"></i> ${assigneeName}</div>
      </div>
    `;

    if (task.state === 'todo') kanbanTodo.appendChild(div);
    else if (task.state === 'doing') kanbanDoing.appendChild(div);
    else if (task.state === 'done') kanbanDone.appendChild(div);
  });
}

function openTaskModal(task: Task | null): void {
  taskAssigneeSelect.innerHTML = '<option value="">Wybierz...</option>';
  const eligibleUsers = getUsers().filter(u => u.role === 'devops' || u.role === 'developer');
  eligibleUsers.forEach(u => {
    const opt = document.createElement('option');
    opt.value = u.id;
    opt.textContent = `${u.firstName} ${u.lastName} (${u.role})`;
    taskAssigneeSelect.appendChild(opt);
  });

  if (!task) {
    taskIdInput.value = '';
    taskNameInput.value = '';
    taskDescriptionInput.value = '';
    taskPrioritySelect.value = 'medium';
    taskHoursInput.value = '1';
    taskAssigneeField.style.display = 'none';
    taskAssigneeSelect.value = '';

    taskStats.style.display = 'none';
    taskDeleteBtn.style.display = 'none';
    taskStartBtn.style.display = 'none';
    taskDoneBtn.style.display = 'none';
    taskSaveBtn.textContent = 'Zapisz zadanie';
  } else {
    taskIdInput.value = task.id;
    taskNameInput.value = task.name;
    taskDescriptionInput.value = task.description || '';
    taskPrioritySelect.value = task.priority;
    taskHoursInput.value = task.estimatedHours.toString();

    taskStats.style.display = 'block';
    taskStateLabel.textContent = task.state;
    taskCreatedAtLabel.textContent = formatDate(task.createdAt);

    if (task.startedAt) {
      taskStartedContainer.style.display = 'block';
      taskStartedAtLabel.textContent = formatDate(task.startedAt);
    } else {
      taskStartedContainer.style.display = 'none';
    }

    if (task.finishedAt) {
      taskFinishedContainer.style.display = 'block';
      taskFinishedAtLabel.textContent = formatDate(task.finishedAt);
    } else {
      taskFinishedContainer.style.display = 'none';
    }

    if (task.assigneeId) {
      const u = getUsers().find(x => x.id === task.assigneeId);
      taskAssigneeLabel.textContent = u ? `${u.firstName} ${u.lastName}` : task.assigneeId;
    } else {
      taskAssigneeLabel.textContent = 'Brak';
    }

    taskDeleteBtn.style.display = 'inline-flex';
    taskSaveBtn.textContent = 'Zapisz zmiany';

    if (task.state === 'todo') {
      taskAssigneeField.style.display = 'flex';
      taskStartBtn.style.display = 'inline-flex';
      taskDoneBtn.style.display = 'none';
    } else if (task.state === 'doing') {
      taskAssigneeField.style.display = 'none';
      taskStartBtn.style.display = 'none';
      taskDoneBtn.style.display = 'inline-flex';
    } else {
      taskAssigneeField.style.display = 'none';
      taskStartBtn.style.display = 'none';
      taskDoneBtn.style.display = 'none';
    }
  }

  taskModal.classList.remove('hidden');
}

function closeTaskModal(): void {
  taskModal.classList.add('hidden');
}

taskModalCloseBtn.addEventListener('click', closeTaskModal);
addTaskBtn.addEventListener('click', () => openTaskModal(null));

taskForm.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!activeStoryId) return;

  const id = taskIdInput.value;
  const name = taskNameInput.value.trim();
  const description = taskDescriptionInput.value.trim();
  const priority = taskPrioritySelect.value as TaskPriority;
  const estimatedHours = parseFloat(taskHoursInput.value) || 0;

  if (!name) return;

  if (id) {
    updateTask(id, { name, description, priority, estimatedHours });
  } else {
    const createdTask = createTask({
      name, description, priority, estimatedHours,
      storyId: activeStoryId,
      state: 'todo',
    });
    const stories = getStoriesByProject(activeProjectId!);
    const story = stories.find(s => s.id === activeStoryId);
    if (story) {
      notificationService.notifyTaskCreated(createdTask, story);
    }
  }

  closeTaskModal();
  renderTasks();
  renderStories();
});

taskDeleteBtn.addEventListener('click', () => {
  const id = taskIdInput.value;
  if (!id) return;
  if (confirm('Usunąć zadanie?')) {
    const tasks = getTasksByStory(activeStoryId!);
    const taskToDelete = tasks.find(t => t.id === id);
    const stories = getStoriesByProject(activeProjectId!);
    const story = stories.find(s => s.id === activeStoryId);
    
    deleteTask(id);
    
    if (taskToDelete && story) {
      notificationService.notifyTaskDeleted(taskToDelete, story);
    }
    
    closeTaskModal();
    renderTasks();
    renderStories();
  }
});

taskStartBtn.addEventListener('click', () => {
  const id = taskIdInput.value;
  const assigneeId = taskAssigneeSelect.value;
  if (!id || !assigneeId) {
    alert('Wybierz pracownika aby rozpocząć zadanie!');
    return;
  }
  const updatedTask = updateTask(id, {
    state: 'doing',
    assigneeId: assigneeId,
    startedAt: new Date().toISOString()
  });
  
  if (updatedTask) {
    notificationService.notifyTaskAssigned(updatedTask);
    const stories = getStoriesByProject(activeProjectId!);
    const story = stories.find(s => s.id === activeStoryId);
    if (story) {
      notificationService.notifyTaskStatusChanged(updatedTask, story, 'doing');
    }
  }
  
  closeTaskModal();
  renderTasks();
  renderStories();
});

taskDoneBtn.addEventListener('click', () => {
  const id = taskIdInput.value;
  if (!id) return;
  const updatedTask = updateTask(id, {
    state: 'done',
    finishedAt: new Date().toISOString()
  });
  
  if (updatedTask) {
    const stories = getStoriesByProject(activeProjectId!);
    const story = stories.find(s => s.id === activeStoryId);
    if (story) {
      notificationService.notifyTaskStatusChanged(updatedTask, story, 'done');
    }
  }
  
  closeTaskModal();
  renderTasks();
  renderStories();
});

kanbanBoard.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  const item = target.closest<HTMLDivElement>('.task-item');
  if (item && item.dataset.id) {
    const tasks = getTasksByStory(activeStoryId!);
    const task = tasks.find(t => t.id === item.dataset.id) || null;
    if (task) openTaskModal(task);
  }
});
