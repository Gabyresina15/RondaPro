import type { NotificationRepository } from '../../domain/ports/NotificationRepository.js';

export class ListNotifications {
  constructor(private readonly notifications: NotificationRepository) {}

  execute(userId: string) {
    return this.notifications.findByUser(userId);
  }
}
