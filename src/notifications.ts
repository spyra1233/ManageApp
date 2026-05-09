import { createNotification, getUsers } from './storage';
import type { Project, Story, Task, Notification } from './types';

export class NotificationService {
  private emitNewNotificationEvent(notification: Notification) {
    const event = new CustomEvent('app:new-notification', { detail: notification });
    window.dispatchEvent(event);
  }

  notifyProjectCreated(project: Project) {
    const admins = getUsers().filter(u => u.role === 'admin');
    
    admins.forEach(admin => {
      const notification = createNotification({
        title: 'Nowy projekt',
        message: `Utworzono nowy projekt: ${project.name}`,
        priority: 'high',
        recipientId: admin.id,
      });
      this.emitNewNotificationEvent(notification);
    });
  }

  notifyTaskAssigned(task: Task) {
    if (!task.assigneeId) return;

    const notification = createNotification({
      title: 'Nowe przypisanie',
      message: `Zostałeś przypisany do zadania: ${task.name}`,
      priority: 'high',
      recipientId: task.assigneeId,
    });
    this.emitNewNotificationEvent(notification);
  }

  notifyTaskCreated(task: Task, story: Story) {
    if (task.assigneeId === story.ownerId) return; // don't notify if the owner assigned themselves, wait this is about task creation
    // The requirement says: "Nowe zadanie w historyjce (medium, otrzymuje właściciel historyjki)"
    const notification = createNotification({
      title: 'Nowe zadanie w historyjce',
      message: `W historyjce "${story.name}" dodano nowe zadanie: ${task.name}`,
      priority: 'medium',
      recipientId: story.ownerId,
    });
    this.emitNewNotificationEvent(notification);
  }

  notifyTaskDeleted(task: Task, story: Story) {
    const notification = createNotification({
      title: 'Usunięto zadanie',
      message: `Z historyjki "${story.name}" usunięto zadanie: ${task.name}`,
      priority: 'medium',
      recipientId: story.ownerId,
    });
    this.emitNewNotificationEvent(notification);
  }

  notifyTaskStatusChanged(task: Task, story: Story, newStatus: Task['state']) {
    let priority: 'low' | 'medium' | 'high' = 'low';
    
    if (newStatus === 'done') priority = 'medium';
    else if (newStatus === 'doing') priority = 'low';
    else return; // If moved to todo, no explicit priority in requirements

    const statusPl = newStatus === 'done' ? 'Zakończone' : 'W toku';

    const notification = createNotification({
      title: 'Zmiana statusu zadania',
      message: `Zadanie "${task.name}" zmieniło status na: ${statusPl}`,
      priority: priority,
      recipientId: story.ownerId,
    });
    this.emitNewNotificationEvent(notification);
  }
}

export const notificationService = new NotificationService();
