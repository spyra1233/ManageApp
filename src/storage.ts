import type { Project, Story, User } from './types';

const PROJECTS_KEY = 'manageme-projects';
const ACTIVE_PROJECT_KEY = 'manageme-active-project-id';
const STORIES_KEY = 'manageme-stories';
const USER_KEY = 'manageme-current-user';

function readProjectsRaw(): Project[] {
  const raw = window.localStorage.getItem(PROJECTS_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as Project[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function writeProjectsRaw(projects: Project[]): void {
  window.localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

export function getProjects(): Project[] {
  return readProjectsRaw();
}

export function createProject(data: Omit<Project, 'id'>): Project {
  const projects = readProjectsRaw();
  const next: Project = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    ...data,
  };
  projects.push(next);
  writeProjectsRaw(projects);
  return next;
}

export function updateProject(id: string, patch: Partial<Omit<Project, 'id'>>): Project | null {
  const projects = readProjectsRaw();
  const idx = projects.findIndex((p) => p.id === id);
  if (idx === -1) return null;

  const updated: Project = { ...projects[idx], ...patch, id };
  projects[idx] = updated;
  writeProjectsRaw(projects);
  return updated;
}

export function deleteProject(id: string): void {
  const projects = readProjectsRaw();
  const filtered = projects.filter((p) => p.id !== id);
  writeProjectsRaw(filtered);
}

// Active project

export function getActiveProjectId(): string | null {
  return window.localStorage.getItem(ACTIVE_PROJECT_KEY);
}

export function setActiveProjectId(id: string | null): void {
  if (!id) {
    window.localStorage.removeItem(ACTIVE_PROJECT_KEY);
  } else {
    window.localStorage.setItem(ACTIVE_PROJECT_KEY, id);
  }
}

// Stories

function readStoriesRaw(): Story[] {
  const raw = window.localStorage.getItem(STORIES_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as Story[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function writeStoriesRaw(stories: Story[]): void {
  window.localStorage.setItem(STORIES_KEY, JSON.stringify(stories));
}

export function getStoriesByProject(projectId: string): Story[] {
  return readStoriesRaw().filter((s) => s.projectId === projectId);
}

export function createStory(data: Omit<Story, 'id' | 'createdAt'>): Story {
  const stories = readStoriesRaw();
  const next: Story = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    createdAt: new Date().toISOString(),
    ...data,
  };
  stories.push(next);
  writeStoriesRaw(stories);
  return next;
}

export function updateStory(
  id: string,
  patch: Partial<Omit<Story, 'id' | 'projectId' | 'ownerId'>>,
): Story | null {
  const stories = readStoriesRaw();
  const idx = stories.findIndex((s) => s.id === id);
  if (idx === -1) return null;

  const updated: Story = { ...stories[idx], ...patch, id };
  stories[idx] = updated;
  writeStoriesRaw(stories);
  return updated;
}

export function deleteStory(id: string): void {
  const stories = readStoriesRaw();
  const filtered = stories.filter((s) => s.id !== id);
  writeStoriesRaw(filtered);
}

// Current user (mock)

export function getCurrentUser(): User {
  const raw = window.localStorage.getItem(USER_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as User;
      if (parsed && parsed.id && parsed.firstName && parsed.lastName) {
        return parsed;
      }
    } catch {
      // ignore and create new
    }
  }

  const mockUser: User = {
    id: 'user-1',
    firstName: 'Jan',
    lastName: 'Kowalski',
  };

  window.localStorage.setItem(USER_KEY, JSON.stringify(mockUser));
  return mockUser;
}

