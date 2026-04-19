import 'bootstrap/dist/css/bootstrap.min.css';
import './style.css';
import * as bootstrap from 'bootstrap';

import type { Project, Story, StoryPriority, StoryState, User, Task, TaskPriority } from './types';
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
} from './storage';
import {
  applyDocumentTheme,
  getStoredTheme,
  initThemeListeners,
  setStoredTheme,
  updateThemeToggleLabel,
  type ThemePreference,
} from './theme';

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('Root #app not found');
}

const currentUser: User = getCurrentUser();

app.innerHTML = `
  <div class="container py-4">
    <header class="mb-4 d-flex flex-wrap justify-content-between align-items-start gap-3">
      <div>
        <h1 class="h2 mb-1">ManageMe</h1>
        <p class="text-body-secondary mb-0 small">Proste zarządzanie projektami, historyjkami i aktywnym kontekstem.</p>
      </div>
      <div class="d-flex flex-wrap align-items-center gap-2 justify-content-end">
        <div class="dropdown">
          <button class="btn btn-outline-secondary btn-sm dropdown-toggle" type="button" data-bs-toggle="dropdown" data-bs-auto-close="true" aria-expanded="false" id="theme-menu-btn" aria-label="Wybierz motyw">
            <span id="theme-toggle-label">Motyw</span>
          </button>
          <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="theme-menu-btn">
            <li><button type="button" class="dropdown-item" data-theme-pref="light">Jasny</button></li>
            <li><button type="button" class="dropdown-item" data-theme-pref="dark">Ciemny</button></li>
            <li><hr class="dropdown-divider" /></li>
            <li><button type="button" class="dropdown-item" data-theme-pref="system">Zgodnie z systemem</button></li>
          </ul>
        </div>
        <div class="text-end border-start ps-3 ms-1">
          <div class="text-body-secondary text-uppercase small" style="font-size: 0.65rem; letter-spacing: 0.08em;">Zalogowany</div>
          <span class="badge rounded-pill text-bg-secondary mt-1" id="user-name"></span>
        </div>
      </div>
    </header>

    <div class="row g-4">
      <div class="col-12 col-lg-5">
        <div class="card shadow-sm h-100">
          <div class="card-header py-3">
            <h2 class="h5 mb-0">Projekt</h2>
          </div>
          <div class="card-body">
            <form id="project-form" class="d-flex flex-column gap-3">
              <input type="hidden" id="project-id" />

              <div>
                <label class="form-label" for="project-name">Nazwa projektu</label>
                <input class="form-control" id="project-name" type="text" placeholder="Np. Aplikacja CRM" required />
              </div>

              <div>
                <label class="form-label" for="project-description">Opis</label>
                <textarea class="form-control" id="project-description" rows="4" placeholder="Krótki opis celu projektu"></textarea>
              </div>

              <div class="d-flex flex-wrap justify-content-end gap-2 pt-1">
                <button type="submit" class="btn btn-primary" id="save-btn">Zapisz</button>
                <button type="button" class="btn btn-outline-secondary" id="cancel-edit-btn">Anuluj edycję</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div class="col-12 col-lg-7">
        <div class="card shadow-sm h-100">
          <div class="card-header py-3 d-flex flex-wrap justify-content-between align-items-center gap-2">
            <div>
              <h2 class="h5 mb-0">Lista projektów</h2>
              <p class="text-body-secondary small mb-0 mt-1">Wybierz aktywny projekt, aby pracować na jego historyjkach.</p>
            </div>
            <span class="badge rounded-pill text-bg-secondary" id="projects-count">0 projektów</span>
          </div>
          <div class="card-body">
            <div id="projects-empty" class="alert alert-secondary mb-0 py-3" role="status">
              Brak projektów. Dodaj pierwszy projekt w formularzu obok.
            </div>
            <ul id="projects-list" class="list-group list-group-flush projects-list"></ul>
          </div>
        </div>
      </div>

      <div class="col-12">
        <div class="card shadow-sm stories-card">
          <div class="card-header py-3 d-flex flex-wrap justify-content-between align-items-start gap-3">
            <div>
              <h2 class="h5 mb-0">Historyjki projektu</h2>
              <p class="text-body-secondary small mb-0 mt-1" id="stories-project-label">Brak aktywnego projektu.</p>
            </div>
            <div class="btn-group btn-group-sm flex-wrap" role="group" aria-label="Filtr historyjek">
              <button type="button" class="btn btn-outline-primary stories-filter-btn" data-filter="all">Wszystkie</button>
              <button type="button" class="btn btn-outline-primary stories-filter-btn" data-filter="todo">Do zrobienia</button>
              <button type="button" class="btn btn-outline-primary stories-filter-btn" data-filter="doing">W toku</button>
              <button type="button" class="btn btn-outline-primary stories-filter-btn" data-filter="done">Zamknięte</button>
            </div>
          </div>
          <div class="card-body">
            <form id="story-form" class="d-flex flex-column gap-3 mb-3 stories-form">
              <input type="hidden" id="story-id" />

              <div class="row g-3 stories-form-grid">
                <div class="col-12 col-md-6">
                  <label class="form-label" for="story-name">Tytuł</label>
                  <input class="form-control" id="story-name" type="text" placeholder="Krótki tytuł historyjki" required />
                </div>
                <div class="col-12 col-md-3">
                  <label class="form-label" for="story-priority">Priorytet</label>
                  <select class="form-select" id="story-priority">
                    <option value="low">Niski</option>
                    <option value="medium" selected>Średni</option>
                    <option value="high">Wysoki</option>
                  </select>
                </div>
                <div class="col-12 col-md-3">
                  <label class="form-label" for="story-state">Status</label>
                  <select class="form-select" id="story-state">
                    <option value="todo">Do zrobienia</option>
                    <option value="doing">W toku</option>
                    <option value="done">Zamknięte</option>
                  </select>
                </div>
              </div>

              <div>
                <label class="form-label" for="story-description">Opis</label>
                <textarea class="form-control" id="story-description" rows="3" placeholder="Szczegóły funkcjonalności"></textarea>
              </div>

              <div class="d-flex flex-wrap justify-content-end gap-2">
                <button type="submit" class="btn btn-primary" id="story-save-btn">Zapisz historyjkę</button>
                <button type="button" class="btn btn-outline-secondary" id="story-cancel-btn">Wyczyść formularz</button>
              </div>
            </form>

            <div id="stories-empty" class="alert alert-secondary mb-0 py-3" role="status">
              Brak historyjek dla aktywnego projektu.
            </div>

            <ul id="stories-list" class="list-group list-group-flush stories-list mt-2"></ul>
          </div>
        </div>
      </div>

      <div class="col-12">
        <div class="card shadow-sm tasks-card">
          <div class="card-header py-3 d-flex flex-wrap justify-content-between align-items-center gap-2">
            <div>
              <h2 class="h5 mb-0">Tablica zadań</h2>
              <p class="text-body-secondary small mb-0 mt-1" id="tasks-story-label">Wybierz historyjkę, aby zarządzać zadaniami.</p>
            </div>
            <button type="button" class="btn btn-sm btn-primary" id="add-task-btn" disabled>Dodaj zadanie</button>
          </div>
          <div class="card-body">
            <div class="kanban-board d-none flex-column flex-md-row" id="kanban-board">
              <div class="kanban-column flex-fill border rounded overflow-hidden">
                <h3 class="h6 mb-0 px-3 py-2 bg-body-secondary border-bottom">Do zrobienia</h3>
                <div class="kanban-list p-2" id="kanban-todo" data-state="todo"></div>
              </div>
              <div class="kanban-column flex-fill border rounded overflow-hidden">
                <h3 class="h6 mb-0 px-3 py-2 bg-body-secondary border-bottom">W toku</h3>
                <div class="kanban-list p-2" id="kanban-doing" data-state="doing"></div>
              </div>
              <div class="kanban-column flex-fill border rounded overflow-hidden">
                <h3 class="h6 mb-0 px-3 py-2 bg-body-secondary border-bottom">Zamknięte</h3>
                <div class="kanban-list p-2" id="kanban-done" data-state="done"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="modal fade" id="task-modal" tabindex="-1" aria-labelledby="task-modal-title" aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
      <div class="modal-content">
        <form id="task-form">
          <div class="modal-header">
            <h2 class="modal-title fs-5" id="task-modal-title">Zadanie</h2>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Zamknij" id="task-modal-close"></button>
          </div>
          <div class="modal-body">
            <input type="hidden" id="task-id" />

            <div class="row g-3">
              <div class="col-12 col-md-6">
                <label class="form-label" for="task-name">Nazwa zadania</label>
                <input class="form-control" id="task-name" type="text" placeholder="Krótka nazwa" required />
              </div>
              <div class="col-12 col-md-3">
                <label class="form-label" for="task-priority">Priorytet</label>
                <select class="form-select" id="task-priority">
                  <option value="low">Niski</option>
                  <option value="medium" selected>Średni</option>
                  <option value="high">Wysoki</option>
                </select>
              </div>
              <div class="col-12 col-md-3">
                <label class="form-label" for="task-hours">Czas (godziny)</label>
                <input class="form-control" id="task-hours" type="number" min="0" step="0.5" value="1" required />
              </div>
              <div class="col-12 col-md-6 d-none" id="task-assignee-field">
                <label class="form-label" for="task-assignee">Przypisz pracownika</label>
                <select class="form-select" id="task-assignee">
                  <option value="">Wybierz...</option>
                </select>
              </div>
            </div>

            <div class="mt-3">
              <label class="form-label" for="task-description">Opis</label>
              <textarea class="form-control" id="task-description" rows="3" placeholder="Szczegóły..."></textarea>
            </div>

            <div class="task-stats border rounded p-3 mt-3 bg-body-secondary d-none" id="task-stats">
              <p class="mb-1 small"><strong>Stan:</strong> <span id="task-state-label"></span></p>
              <p class="mb-1 small"><strong>Przypisano:</strong> <span id="task-assignee-label"></span></p>
              <p class="mb-1 small"><strong>Dodano:</strong> <span id="task-created-at"></span></p>
              <p class="mb-0 small d-none" id="task-started-container"><strong>Start:</strong> <span id="task-started-at"></span></p>
              <p class="mb-0 small d-none" id="task-finished-container"><strong>Koniec:</strong> <span id="task-finished-at"></span></p>
            </div>
          </div>
          <div class="modal-footer flex-wrap gap-2" id="task-form-actions">
            <button type="submit" class="btn btn-primary" id="task-save-btn">Zapisz zadanie</button>
            <button type="button" class="btn btn-outline-danger d-none" id="task-delete-btn">Usuń</button>
            <button type="button" class="btn btn-outline-primary d-none" id="task-start-btn">Rozpocznij</button>
            <button type="button" class="btn btn-success d-none" id="task-done-btn">Zakończ</button>
          </div>
        </form>
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

const storiesCard = document.querySelector<HTMLElement>('.stories-card')!;
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

const themeToggleLabel = document.querySelector<HTMLSpanElement>('#theme-toggle-label')!;

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
  !storiesList ||
  !themeToggleLabel
) {
  throw new Error('ManageMe UI elements not found');
}

const taskModalEl = document.querySelector<HTMLDivElement>('#task-modal')!;
const bsTaskModal = new bootstrap.Modal(taskModalEl);

const tasksCardLabel = document.querySelector<HTMLParagraphElement>('#tasks-story-label')!;
const addTaskBtn = document.querySelector<HTMLButtonElement>('#add-task-btn')!;
const kanbanBoard = document.querySelector<HTMLDivElement>('#kanban-board')!;
const kanbanTodo = document.querySelector<HTMLDivElement>('#kanban-todo')!;
const kanbanDoing = document.querySelector<HTMLDivElement>('#kanban-doing')!;
const kanbanDone = document.querySelector<HTMLDivElement>('#kanban-done')!;
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

if (
  !tasksCardLabel ||
  !addTaskBtn ||
  !kanbanBoard ||
  !kanbanTodo ||
  !kanbanDoing ||
  !kanbanDone ||
  !taskModalCloseBtn ||
  !taskForm ||
  !taskIdInput ||
  !taskNameInput ||
  !taskPrioritySelect ||
  !taskHoursInput ||
  !taskAssigneeField ||
  !taskAssigneeSelect ||
  !taskDescriptionInput ||
  !taskStats ||
  !taskStateLabel ||
  !taskAssigneeLabel ||
  !taskCreatedAtLabel ||
  !taskStartedContainer ||
  !taskStartedAtLabel ||
  !taskFinishedContainer ||
  !taskFinishedAtLabel ||
  !taskSaveBtn ||
  !taskDeleteBtn ||
  !taskStartBtn ||
  !taskDoneBtn
) {
  throw new Error('ManageMe Tasks UI elements not found');
}

function syncThemeUi(): void {
  const pref = getStoredTheme();
  applyDocumentTheme(pref);
  updateThemeToggleLabel(themeToggleLabel, pref);
}

syncThemeUi();
initThemeListeners(syncThemeUi);

document.querySelectorAll<HTMLButtonElement>('[data-theme-pref]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const raw = btn.dataset.themePref;
    if (raw === 'light' || raw === 'dark' || raw === 'system') {
      setStoredTheme(raw as ThemePreference);
      syncThemeUi();
    }
  });
});

userNameLabel.textContent = `${currentUser.firstName} ${currentUser.lastName} [${currentUser.role}]`;

type StoriesFilter = 'all' | StoryState;

let activeProjectId: string | null = getActiveProjectId();
let activeStoriesFilter: StoriesFilter = 'all';
let activeStoryId: string | null = null;

function storyPriorityBadgeClass(priority: StoryPriority): string {
  if (priority === 'high') return 'text-bg-danger';
  if (priority === 'medium') return 'text-bg-warning';
  return 'text-bg-success';
}

function storyStateBadgeClass(state: StoryState): string {
  if (state === 'done') return 'text-bg-success';
  if (state === 'doing') return 'text-bg-primary';
  return 'text-bg-secondary';
}

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
    projectsEmpty.classList.remove('d-none');
    activeProjectId = null;
    setActiveProjectId(null);
  } else {
    projectsEmpty.classList.add('d-none');
  }

  if (projects.length > 0 && (!activeProjectId || !projects.some((p) => p.id === activeProjectId))) {
    activeProjectId = projects[0].id;
    setActiveProjectId(activeProjectId);
  }

  projectsCount.textContent = formatCount(projects.length);

  for (const project of projects) {
    const li = document.createElement('li');
    li.className = 'list-group-item list-group-item-action project-item';
    li.dataset.id = project.id;

    const isActive = activeProjectId === project.id;
    if (isActive) {
      li.classList.add('active');
    }

    li.innerHTML = `
      <div class="d-flex flex-column flex-md-row justify-content-between align-items-start gap-2">
        <div class="flex-grow-1">
          <h3 class="h6 mb-1">${project.name || 'Bez nazwy'}</h3>
          <p class="small text-body-secondary mb-0">${project.description || '<brak opisu>'}</p>
        </div>
        <div class="d-flex flex-shrink-0 flex-wrap gap-1">
          <button type="button" class="btn btn-sm ${isActive ? 'btn-light' : 'btn-outline-primary'}" data-action="set-active">${isActive ? 'Aktywny' : 'Ustaw jako aktywny'}</button>
          <button type="button" class="btn btn-sm btn-outline-secondary" data-action="edit">Edytuj</button>
          <button type="button" class="btn btn-sm btn-outline-danger" data-action="delete">Usuń</button>
        </div>
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
    storiesEmpty.classList.remove('d-none');
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
    storiesEmpty.classList.remove('d-none');
    return;
  }

  storiesEmpty.classList.add('d-none');

  filteredStories.forEach((story) => {
    const li = document.createElement('li');
    li.className = 'list-group-item story-item';
    li.dataset.id = story.id;

    li.innerHTML = `
      <div class="d-flex flex-column flex-md-row justify-content-between align-items-start gap-3">
        <div class="flex-grow-1">
          <div class="d-flex flex-wrap justify-content-between align-items-baseline gap-2 mb-1">
            <span class="fw-semibold">${story.name || 'Bez tytułu'}</span>
            <span class="d-inline-flex flex-wrap gap-1">
              <span class="badge ${storyPriorityBadgeClass(story.priority)}">${formatStoryPriority(story.priority)}</span>
              <span class="badge ${storyStateBadgeClass(story.state)}">${formatStoryState(story.state)}</span>
            </span>
          </div>
          <p class="small text-body-secondary mb-2">${story.description || '<brak opisu>'}</p>
          <p class="small text-body-secondary mb-0 d-flex flex-wrap justify-content-between gap-2">
            <span>Właściciel: ${currentUser.firstName} ${currentUser.lastName}</span>
            <span>Utworzono: ${formatDate(story.createdAt)}</span>
          </p>
        </div>
        <div class="d-flex flex-shrink-0 flex-wrap gap-1">
          <button type="button" class="btn btn-sm btn-primary" data-action="story-active">Pokaż zadania</button>
          <button type="button" class="btn btn-sm btn-outline-secondary" data-action="story-edit">Edytuj</button>
          <button type="button" class="btn btn-sm btn-outline-danger" data-action="story-delete">Usuń</button>
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
    storiesFilterButtons.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    renderStories();
  });
});

cancelEditBtn.disabled = true;
storiesFilterButtons[0]?.classList.add('active');
renderProjects();

function renderTasks(): void {
  if (!activeStoryId) {
    tasksCardLabel.textContent = 'Wybierz historyjkę, aby zarządzać zadaniami.';
    addTaskBtn.disabled = true;
    kanbanBoard.classList.add('d-none');
    kanbanBoard.classList.remove('d-flex');
    return;
  }

  const stories = getStoriesByProject(activeProjectId!);
  const story = stories.find((s) => s.id === activeStoryId);

  if (!story) {
    activeStoryId = null;
    renderTasks();
    return;
  }

  tasksCardLabel.textContent = `Zadania dla: ${story.name}`;
  addTaskBtn.disabled = false;
  kanbanBoard.classList.remove('d-none');
  kanbanBoard.classList.add('d-flex');

  const tasks = getTasksByStory(activeStoryId);
  kanbanTodo.innerHTML = '';
  kanbanDoing.innerHTML = '';
  kanbanDone.innerHTML = '';

  tasks.forEach((task) => {
    const div = document.createElement('div');
    div.className = 'task-item card card-body p-2 mb-2 shadow-sm';
    div.dataset.id = task.id;

    let assigneeName = 'Brak';
    if (task.assigneeId) {
      const u = getUsers().find((x) => x.id === task.assigneeId);
      if (u) assigneeName = `${u.firstName} ${u.lastName}`;
    }

    div.innerHTML = `
      <div class="fw-semibold small mb-1">${task.name}</div>
      <div class="d-flex justify-content-between text-muted" style="font-size: 0.75rem;">
        <span>Czas: ${task.estimatedHours}h</span>
        <span>${task.priority}</span>
      </div>
      <div class="text-muted mt-1" style="font-size: 0.75rem;">${assigneeName}</div>
    `;

    if (task.state === 'todo') kanbanTodo.appendChild(div);
    else if (task.state === 'doing') kanbanDoing.appendChild(div);
    else if (task.state === 'done') kanbanDone.appendChild(div);
  });
}

function openTaskModal(task: Task | null): void {
  taskAssigneeSelect.innerHTML = '<option value="">Wybierz...</option>';
  const eligibleUsers = getUsers().filter((u) => u.role === 'devops' || u.role === 'developer');
  eligibleUsers.forEach((u) => {
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
    taskAssigneeField.classList.add('d-none');
    taskAssigneeSelect.value = '';

    taskStats.classList.add('d-none');
    taskDeleteBtn.classList.add('d-none');
    taskStartBtn.classList.add('d-none');
    taskDoneBtn.classList.add('d-none');
    taskSaveBtn.textContent = 'Zapisz zadanie';
  } else {
    taskIdInput.value = task.id;
    taskNameInput.value = task.name;
    taskDescriptionInput.value = task.description || '';
    taskPrioritySelect.value = task.priority;
    taskHoursInput.value = task.estimatedHours.toString();

    taskStats.classList.remove('d-none');
    taskStateLabel.textContent = task.state;
    taskCreatedAtLabel.textContent = formatDate(task.createdAt);

    if (task.startedAt) {
      taskStartedContainer.classList.remove('d-none');
      taskStartedAtLabel.textContent = formatDate(task.startedAt);
    } else {
      taskStartedContainer.classList.add('d-none');
    }

    if (task.finishedAt) {
      taskFinishedContainer.classList.remove('d-none');
      taskFinishedAtLabel.textContent = formatDate(task.finishedAt);
    } else {
      taskFinishedContainer.classList.add('d-none');
    }

    if (task.assigneeId) {
      const u = getUsers().find((x) => x.id === task.assigneeId);
      taskAssigneeLabel.textContent = u ? `${u.firstName} ${u.lastName}` : task.assigneeId;
    } else {
      taskAssigneeLabel.textContent = 'Brak';
    }

    taskDeleteBtn.classList.remove('d-none');
    taskSaveBtn.textContent = 'Zapisz zmiany';

    if (task.state === 'todo') {
      taskAssigneeField.classList.remove('d-none');
      taskStartBtn.classList.remove('d-none');
      taskDoneBtn.classList.add('d-none');
    } else if (task.state === 'doing') {
      taskAssigneeField.classList.add('d-none');
      taskStartBtn.classList.add('d-none');
      taskDoneBtn.classList.remove('d-none');
    } else {
      taskAssigneeField.classList.add('d-none');
      taskStartBtn.classList.add('d-none');
      taskDoneBtn.classList.add('d-none');
    }
  }

  bsTaskModal.show();
}

function closeTaskModal(): void {
  bsTaskModal.hide();
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
    createTask({
      name,
      description,
      priority,
      estimatedHours,
      storyId: activeStoryId,
      state: 'todo',
    });
  }

  closeTaskModal();
  renderTasks();
  renderStories();
});

taskDeleteBtn.addEventListener('click', () => {
  const id = taskIdInput.value;
  if (!id) return;
  if (confirm('Usunąć zadanie?')) {
    deleteTask(id);
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
  updateTask(id, {
    state: 'doing',
    assigneeId: assigneeId,
    startedAt: new Date().toISOString(),
  });
  closeTaskModal();
  renderTasks();
  renderStories();
});

taskDoneBtn.addEventListener('click', () => {
  const id = taskIdInput.value;
  if (!id) return;
  updateTask(id, {
    state: 'done',
    finishedAt: new Date().toISOString(),
  });
  closeTaskModal();
  renderTasks();
  renderStories();
});

kanbanBoard.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  const item = target.closest<HTMLDivElement>('.task-item');
  if (item && item.dataset.id) {
    const tasks = getTasksByStory(activeStoryId!);
    const task = tasks.find((t) => t.id === item.dataset.id) || null;
    if (task) openTaskModal(task);
  }
});
