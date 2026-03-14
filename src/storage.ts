import type { Project } from './types';

const STORAGE_KEY = 'manageme-projects';

function readRaw(): Project[] {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as Project[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function writeRaw(projects: Project[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function getProjects(): Project[] {
  return readRaw();
}

export function createProject(data: Omit<Project, 'id'>): Project {
  const projects = readRaw();
  const next: Project = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    ...data,
  };
  projects.push(next);
  writeRaw(projects);
  return next;
}

export function updateProject(id: string, patch: Partial<Omit<Project, 'id'>>): Project | null {
  const projects = readRaw();
  const idx = projects.findIndex((p) => p.id === id);
  if (idx === -1) return null;

  const updated: Project = { ...projects[idx], ...patch, id };
  projects[idx] = updated;
  writeRaw(projects);
  return updated;
}

export function deleteProject(id: string): void {
  const projects = readRaw();
  const filtered = projects.filter((p) => p.id !== id);
  writeRaw(filtered);
}

