import type { AppNotification } from '../entities/AppNotification.js';

export interface CreateNotificationInput {
  userId: string;
  title: string;
  body: string;
  rondaId?: string;
}

export interface NotificationRepository {
  create(input: CreateNotificationInput): Promise<AppNotification>;
  findByUser(userId: string): Promise<AppNotification[]>;
  markRead(id: string, userId: string): Promise<AppNotification | null>;
}
