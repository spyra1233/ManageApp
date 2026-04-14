import './style.css';
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

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('Root #app not found');
}

const currentUser: User = getCurrentUser();

app.innerHTML = `
  <div class="page">
    <header class="page-header">
      <div>
        <h1>ManageMe</h1>
        <p class="subtitle">Proste zarządzanie projektami, historyjkami i aktywnym kontekstem.</p>
      </div>
      <div class="user-badge">
        <span class="user-label">Zalogowany użytkownik</span>
        <span class="user-name" id="user-name"></span>
      </div>
    </header>

    <main class="layout">
      <section class="card">
        <h2>Projekt</h2>
        <form id="project-form" class="form">
          <input type="hidden" id="project-id" />

          <label class="field">
            <span>Nazwa projektu</span>
            <input id="project-name" type="text" placeholder="Np. Aplikacja CRM" required />
          </label>

          <label class="field">
            <span>Opis</span>
            <textarea id="project-description" rows="4" placeholder="Krótki opis celu projektu"></textarea>
          </label>

          <div class="form-actions">
            <button type="submit" class="btn primary" id="save-btn">Zapisz</button>
            <button type="button" class="btn ghost" id="cancel-edit-btn">Anuluj edycję</button>
          </div>
        </form>
      </section>

      <section class="card">
        <header class="card-header">
          <div>
            <h2>Lista projektów</h2>
            <p class="card-subtitle">Wybierz aktywny projekt, aby pracować na jego historyjkach.</p>
          </div>
          <div class="card-header-right">
            <span class="chip" id="projects-count">0 projektów</span>
          </div>
        </header>
        <div id="projects-empty" class="empty">
          Brak projektów. Dodaj pierwszy projekt w formularzu obok.
        </div>
        <ul id="projects-list" class="projects-list"></ul>
      </section>

      <section class="card stories-card">
        <header class="card-header">
          <div>
            <h2>Historyjki projektu</h2>
            <p class="card-subtitle" id="stories-project-label">Brak aktywnego projektu.</p>
          </div>
          <div class="stories-filters">
            <button class="btn small stories-filter-btn" data-filter="all">Wszystkie</button>
            <button class="btn small stories-filter-btn" data-filter="todo">Do zrobienia</button>
            <button class="btn small stories-filter-btn" data-filter="doing">W toku</button>
            <button class="btn small stories-filter-btn" data-filter="done">Zamknięte</button>
          </div>
        </header>

        <form id="story-form" class="form stories-form">
          <input type="hidden" id="story-id" />

          <div class="stories-form-grid">
            <label class="field">
              <span>Tytuł</span>
              <input id="story-name" type="text" placeholder="Krótki tytuł historyjki" required />
            </label>

            <label class="field">
              <span>Priorytet</span>
              <select id="story-priority">
                <option value="low">Niski</option>
                <option value="medium" selected>Średni</option>
                <option value="high">Wysoki</option>
              </select>
            </label>

            <label class="field">
              <span>Status</span>
              <select id="story-state">
                <option value="todo">Do zrobienia</option>
                <option value="doing">W toku</option>
                <option value="done">Zamknięte</option>
              </select>
            </label>
          </div>

          <label class="field">
            <span>Opis</span>
            <textarea id="story-description" rows="3" placeholder="Szczegóły funkcjonalności"></textarea>
          </label>

          <div class="form-actions">
            <button type="submit" class="btn primary" id="story-save-btn">Zapisz historyjkę</button>
            <button type="button" class="btn ghost" id="story-cancel-btn">Wyczyść formularz</button>
          </div>
        </form>

        <div id="stories-empty" class="empty">
          Brak historyjek dla aktywnego projektu.
        </div>

        <ul id="stories-list" class="stories-list"></ul>
      </section>

      <section class="card tasks-card">
        <header class="card-header">
          <div>
            <h2>Tablica Zadań</h2>
            <p class="card-subtitle" id="tasks-story-label">Wybierz historyjkę, aby zarządzać zadaniami.</p>
          </div>
          <div class="card-header-right">
            <button type="button" class="btn small primary" id="add-task-btn" disabled>Dodaj zadanie</button>
          </div>
        </header>
        <div class="kanban-board" id="kanban-board" style="display: none;">
          <div class="kanban-column">
            <h3>Do zrobienia</h3>
            <div class="kanban-list" id="kanban-todo" data-state="todo"></div>
          </div>
          <div class="kanban-column">
            <h3>W toku</h3>
            <div class="kanban-list" id="kanban-doing" data-state="doing"></div>
          </div>
          <div class="kanban-column">
            <h3>Zamknięte</h3>
            <div class="kanban-list" id="kanban-done" data-state="done"></div>
          </div>
        </div>
      </section>
    </main>
  </div>

  <div class="modal hidden" id="task-modal">
    <div class="modal-content">
      <header class="modal-header">
        <h2 id="task-modal-title">Zadanie</h2>
        <button type="button" class="btn clean" id="task-modal-close">&times;</button>
      </header>
      <form id="task-form" class="form">
        <input type="hidden" id="task-id" />
        
        <div class="stories-form-grid">
          <label class="field">
            <span>Nazwa zadania</span>
            <input id="task-name" type="text" placeholder="Krótka nazwa" required />
          </label>
          <label class="field">
            <span>Priorytet</span>
            <select id="task-priority">
              <option value="low">Niski</option>
              <option value="medium" selected>Średni</option>
              <option value="high">Wysoki</option>
            </select>
          </label>
          <label class="field">
            <span>Czas (godziny)</span>
            <input id="task-hours" type="number" min="0" step="0.5" value="1" required />
          </label>
          <label class="field" id="task-assignee-field" style="display: none;">
            <span>Przypisz pracownika</span>
            <select id="task-assignee">
               <option value="">Wybierz...</option>
            </select>
          </label>
        </div>

        <label class="field">
          <span>Opis</span>
          <textarea id="task-description" rows="3" placeholder="Szczegóły..."></textarea>
        </label>
        
        <div class="task-stats" id="task-stats" style="display: none;">
           <p><strong>Stan:</strong> <span id="task-state-label"></span></p>
           <p><strong>Przypisano:</strong> <span id="task-assignee-label"></span></p>
           <p><strong>Dodano:</strong> <span id="task-created-at"></span></p>
           <p id="task-started-container" style="display:none;"><strong>Start:</strong> <span id="task-started-at"></span></p>
           <p id="task-finished-container" style="display:none;"><strong>Koniec:</strong> <span id="task-finished-at"></span></p>
        </div>

        <div class="form-actions" id="task-form-actions">
           <button type="submit" class="btn primary" id="task-save-btn">Zapisz zadanie</button>
           <button type="button" class="btn danger" id="task-delete-btn" style="display: none;">Usuń</button>
           <button type="button" class="btn primary" id="task-start-btn" style="display: none;">Rozpocznij</button>
           <button type="button" class="btn success" id="task-done-btn" style="display: none;">Zakończ</button>
        </div>
      </form>
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

if (!tasksCardLabel || !addTaskBtn || !kanbanBoard || !kanbanTodo || !kanbanDoing || !kanbanDone || !taskModal || !taskModalCloseBtn || !taskForm || !taskIdInput || !taskNameInput || !taskPrioritySelect || !taskHoursInput || !taskAssigneeField || !taskAssigneeSelect || !taskDescriptionInput || !taskStats || !taskStateLabel || !taskAssigneeLabel || !taskCreatedAtLabel || !taskStartedContainer || !taskStartedAtLabel || !taskFinishedContainer || !taskFinishedAtLabel || !taskSaveBtn || !taskDeleteBtn || !taskStartBtn || !taskDoneBtn) {
  throw new Error('ManageMe Tasks UI elements not found');
}

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
    li.className = 'project-item';
    li.dataset.id = project.id;

    li.innerHTML = `
      <div class="project-main">
        <h3>${project.name || 'Bez nazwy'}</h3>
        <p>${project.description || '<brak opisu>'}</p>
      </div>
      <div class="project-actions">
        <button type="button" class="btn small" data-action="set-active">${activeProjectId === project.id ? 'Aktywny' : 'Ustaw jako aktywny'
      }</button>
        <button type="button" class="btn small" data-action="edit">Edytuj</button>
        <button type="button" class="btn small danger" data-action="delete">Usuń</button>
      </div>
    `;

    if (activeProjectId === project.id) {
      li.classList.add('project-item--active');
    }

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
    storiesCard.classList.add('stories-card--disabled');
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

  storiesCard.classList.remove('stories-card--disabled');
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
    li.className = 'story-item';
    li.dataset.id = story.id;

    li.innerHTML = `
      <div class="story-main">
        <div class="story-header-row">
          <span class="story-title">${story.name || 'Bez tytułu'}</span>
          <span class="story-meta">
            <span class="story-badge story-badge--priority story-badge--priority-${story.priority}">
              ${formatStoryPriority(story.priority)}
            </span>
            <span class="story-badge story-badge--state story-badge--state-${story.state}">
              ${formatStoryState(story.state)}
            </span>
          </span>
        </div>
        <p class="story-description">${story.description || '<brak opisu>'}</p>
        <p class="story-footer">
          <span>Właściciel: ${currentUser.firstName} ${currentUser.lastName}</span>
          <span>Utworzono: ${formatDate(story.createdAt)}</span>
        </p>
      </div>
      <div class="story-actions">
        <button type="button" class="btn small primary" data-action="story-active">Pokaż zadania</button>
        <button type="button" class="btn small" data-action="story-edit">Edytuj</button>
        <button type="button" class="btn small danger" data-action="story-delete">Usuń</button>
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
    storiesFilterButtons.forEach((b) => b.classList.remove('stories-filter-btn--active'));
    btn.classList.add('stories-filter-btn--active');
    renderStories();
  });
});

cancelEditBtn.disabled = true;
storiesFilterButtons[0]?.classList.add('stories-filter-btn--active');
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
    div.className = 'task-item';
    div.dataset.id = task.id;

    let assigneeName = 'Brak';
    if (task.assigneeId) {
      const u = getUsers().find(x => x.id === task.assigneeId);
      if (u) assigneeName = `${u.firstName} ${u.lastName}`;
    }

    div.innerHTML = `
      <div class="task-title">${task.name}</div>
      <div class="task-meta">
        <span>Czas: ${task.estimatedHours}h</span>
        <span>Priorytet: ${task.priority}</span>
      </div>
      <div class="task-meta">
        <span>${assigneeName}</span>
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
    createTask({
      name, description, priority, estimatedHours,
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
    startedAt: new Date().toISOString()
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
    finishedAt: new Date().toISOString()
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
    const task = tasks.find(t => t.id === item.dataset.id) || null;
    if (task) openTaskModal(task);
  }
});
