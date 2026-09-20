export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  rondaId?: string;
  readAt?: Date;
  createdAt: Date;
}
