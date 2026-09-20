import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const notificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    rondaId: { type: Schema.Types.ObjectId, ref: 'Ronda', required: false },
    readAt: { type: Date, required: false },
  },
  { timestamps: true, versionKey: false },
);

notificationSchema.index({ userId: 1, createdAt: -1 });

export type NotificationDocument = InferSchemaType<typeof notificationSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
};

export const NotificationModel =
  mongoose.models.AppNotification ??
  mongoose.model('AppNotification', notificationSchema);
