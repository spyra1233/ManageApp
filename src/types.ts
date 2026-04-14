export interface Project {
  id: string;
  name: string;
  description: string;
}

export type UserRole = 'admin' | 'devops' | 'developer';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export type StoryState = 'todo' | 'doing' | 'done';

export type StoryPriority = 'low' | 'medium' | 'high';

export interface Story {
  id: string;
  name: string;
  description: string;
  priority: StoryPriority;
  projectId: string;
  createdAt: string;
  state: StoryState;
  ownerId: string;
}

export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskState = 'todo' | 'doing' | 'done';

export interface Task {
  id: string;
  name: string;
  description: string;
  priority: TaskPriority;
  storyId: string;
  estimatedHours: number;
  state: TaskState;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
  assigneeId?: string;
}
