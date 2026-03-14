import './style.css';
import type { Project } from './types';
import { createProject, deleteProject, getProjects, updateProject } from './storage';

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('Root #app not found');
}

app.innerHTML = `
  <div class="page">
    <header class="page-header">
      <h1>ManageMe</h1>
      <p class="subtitle">Proste zarządzanie projektami w przeglądarce (CRUD + localStorage).</p>
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
          <h2>Lista projektów</h2>
          <span class="chip" id="projects-count">0 projektów</span>
        </header>
        <div id="projects-empty" class="empty">
          Brak projektów. Dodaj pierwszy projekt w formularzu obok.
        </div>
        <ul id="projects-list" class="projects-list"></ul>
      </section>
    </main>
  </div>
`;

const form = document.querySelector<HTMLFormElement>('#project-form');
const idInput = document.querySelector<HTMLInputElement>('#project-id');
const nameInput = document.querySelector<HTMLInputElement>('#project-name');
const descriptionInput = document.querySelector<HTMLTextAreaElement>('#project-description');
const cancelEditBtn = document.querySelector<HTMLButtonElement>('#cancel-edit-btn');
const projectsList = document.querySelector<HTMLUListElement>('#projects-list');
const projectsEmpty = document.querySelector<HTMLDivElement>('#projects-empty');
const projectsCount = document.querySelector<HTMLSpanElement>('#projects-count');
const saveBtn = document.querySelector<HTMLButtonElement>('#save-btn');

if (
  !form ||
  !idInput ||
  !nameInput ||
  !descriptionInput ||
  !cancelEditBtn ||
  !projectsList ||
  !projectsEmpty ||
  !projectsCount ||
  !saveBtn
) {
  throw new Error('ManageMe UI elements not found');
}

function setEditing(project: Project | null): void {
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

function renderProjects(): void {
  const projects = getProjects();

  projectsList.innerHTML = '';

  if (projects.length === 0) {
    projectsEmpty.style.display = 'block';
  } else {
    projectsEmpty.style.display = 'none';
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
        <button type="button" class="btn small" data-action="edit">Edytuj</button>
        <button type="button" class="btn small danger" data-action="delete">Usuń</button>
      </div>
    `;

    projectsList.appendChild(li);
  }
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
    createProject({ name, description });
  }

  setEditing(null);
  renderProjects();
});

cancelEditBtn.addEventListener('click', () => {
  setEditing(null);
});

projectsList.addEventListener('click', (event) => {
  const target = event.target as HTMLElement | null;
  if (!target) return;

  const action = target.dataset.action;
  if (!action) return;

  const item = target.closest<HTMLLIElement>('.project-item');
  if (!item || !item.dataset.id) return;

  const id = item.dataset.id;

  if (action === 'edit') {
    const projects = getProjects();
    const project = projects.find((p) => p.id === id) ?? null;
    setEditing(project);
  }

  if (action === 'delete') {
    const confirmed = window.confirm('Czy na pewno chcesz usunąć ten projekt?');
    if (!confirmed) return;
    deleteProject(id);
    if (idInput.value === id) {
      setEditing(null);
    }
    renderProjects();
  }
});

cancelEditBtn.disabled = true;
renderProjects();
