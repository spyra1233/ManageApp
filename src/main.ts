import './style.css';
import type { Project, Story, StoryPriority, StoryState, User } from './types';
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
    </main>
  </div>
`;

const userNameLabel = document.querySelector<HTMLSpanElement>('#user-name');
const form = document.querySelector<HTMLFormElement>('#project-form');
const idInput = document.querySelector<HTMLInputElement>('#project-id');
const nameInput = document.querySelector<HTMLInputElement>('#project-name');
const descriptionInput = document.querySelector<HTMLTextAreaElement>('#project-description');
const cancelEditBtn = document.querySelector<HTMLButtonElement>('#cancel-edit-btn');
const projectsList = document.querySelector<HTMLUListElement>('#projects-list');
const projectsEmpty = document.querySelector<HTMLDivElement>('#projects-empty');
const projectsCount = document.querySelector<HTMLSpanElement>('#projects-count');
const saveBtn = document.querySelector<HTMLButtonElement>('#save-btn');

// Story elements
const storiesCard = document.querySelector<HTMLElement>('.stories-card');
const storiesProjectLabel = document.querySelector<HTMLParagraphElement>('#stories-project-label');
const storyForm = document.querySelector<HTMLFormElement>('#story-form');
const storyIdInput = document.querySelector<HTMLInputElement>('#story-id');
const storyNameInput = document.querySelector<HTMLInputElement>('#story-name');
const storyDescriptionInput = document.querySelector<HTMLTextAreaElement>('#story-description');
const storyPrioritySelect = document.querySelector<HTMLSelectElement>('#story-priority');
const storyStateSelect = document.querySelector<HTMLSelectElement>('#story-state');
const storySaveBtn = document.querySelector<HTMLButtonElement>('#story-save-btn');
const storyCancelBtn = document.querySelector<HTMLButtonElement>('#story-cancel-btn');
const storiesEmpty = document.querySelector<HTMLDivElement>('#stories-empty');
const storiesList = document.querySelector<HTMLUListElement>('#stories-list');
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

userNameLabel.textContent = `${currentUser.firstName} ${currentUser.lastName}`;

type StoriesFilter = 'all' | StoryState;

let activeProjectId: string | null = getActiveProjectId();
let activeStoriesFilter: StoriesFilter = 'all';

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
        <button type="button" class="btn small" data-action="set-active">${
          activeProjectId === project.id ? 'Aktywny' : 'Ustaw jako aktywny'
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
