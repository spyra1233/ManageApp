export interface Project {
  id: string;
  name: string;
  description: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
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
