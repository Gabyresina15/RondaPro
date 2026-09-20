import type { AppNotification } from '../../domain/entities/AppNotification.js';
import type {
  CreateNotificationInput,
  NotificationRepository,
} from '../../domain/ports/NotificationRepository.js';
import {
  NotificationModel,
  type NotificationDocument,
} from './NotificationModel.js';

function toDomain(doc: NotificationDocument): AppNotification {
  return {
    id: doc._id.toHexString(),
    userId: String(doc.userId),
    title: doc.title,
    body: doc.body,
    rondaId: doc.rondaId ? String(doc.rondaId) : undefined,
    readAt: doc.readAt ?? undefined,
    createdAt: doc.createdAt,
  };
}

export class MongoNotificationRepository implements NotificationRepository {
  async create(input: CreateNotificationInput): Promise<AppNotification> {
    const doc = await NotificationModel.create({
      userId: input.userId,
      title: input.title,
      body: input.body,
      rondaId: input.rondaId,
    });
    return toDomain(doc as NotificationDocument);
  }

  async findByUser(userId: string): Promise<AppNotification[]> {
    const docs = await NotificationModel.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .exec();
    return docs.map((d) => toDomain(d as NotificationDocument));
  }

  async markRead(id: string, userId: string): Promise<AppNotification | null> {
    const doc = await NotificationModel.findOneAndUpdate(
      { _id: id, userId },
      { $set: { readAt: new Date() } },
      { new: true },
    ).exec();
    return doc ? toDomain(doc as NotificationDocument) : null;
  }
}
