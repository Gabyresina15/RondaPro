import type { NotificationRepository } from '../../domain/ports/NotificationRepository.js';

export class MarkNotificationRead {
  constructor(private readonly notifications: NotificationRepository) {}

  execute(id: string, userId: string) {
    return this.notifications.markRead(id, userId);
  }
}
