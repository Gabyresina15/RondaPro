import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const answerSchema = new Schema(
  {
    itemIndex: { type: Number, required: true },
    label: { type: String, required: true, trim: true },
    type: { type: String, required: true, enum: ['text', 'bool', 'photo'] },
    textValue: { type: String, required: false },
    boolValue: { type: Boolean, required: false },
  },
  { _id: false },
);

const photoSchema = new Schema(
  {
    id: { type: String, required: true },
    filename: { type: String, required: true },
    mimeType: { type: String, required: true },
    relativePath: { type: String, required: true },
    itemIndex: { type: Number, required: false },
    createdAt: { type: Date, required: true },
  },
  { _id: false },
);

const findingSchema = new Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    notes: { type: String, required: true, default: '', trim: true },
    severity: {
      type: String,
      required: true,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    status: {
      type: String,
      required: true,
      enum: ['open', 'resolved', 'closed'],
      default: 'open',
    },
    itemIndex: { type: Number, required: false },
    assignee: { type: String, required: false, trim: true },
    resolutionNote: { type: String, required: false, trim: true },
    resolvedAt: { type: Date, required: false },
    resolvedBy: { type: String, required: false, trim: true },
    createdAt: { type: Date, required: true },
  },
  { _id: false },
);

const rondaSchema = new Schema(
  {
    templateId: {
      type: Schema.Types.ObjectId,
      ref: 'ChecklistTemplate',
      required: true,
      index: true,
    },
    templateName: { type: String, required: true, trim: true },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    assigneeId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      index: true,
    },
    assigneeName: { type: String, required: false, trim: true },
    siteId: {
      type: Schema.Types.ObjectId,
      ref: 'Site',
      required: false,
      index: true,
    },
    siteName: { type: String, required: false, trim: true },
    location: { type: String, required: true, default: '', trim: true },
    status: {
      type: String,
      required: true,
      enum: ['in_progress', 'completed'],
      default: 'in_progress',
      index: true,
    },
    answers: { type: [answerSchema], required: true, default: [] },
    photos: { type: [photoSchema], required: true, default: [] },
    findings: { type: [findingSchema], required: true, default: [] },
    summary: { type: String, required: false },
    summarySource: { type: String, required: false, enum: ['llm', 'heuristic'] },
    completedAt: { type: Date, required: false },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

rondaSchema.index({ ownerId: 1, createdAt: -1 });

export type RondaDocument = InferSchemaType<typeof rondaSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const RondaModel =
  mongoose.models.Ronda ?? mongoose.model('Ronda', rondaSchema);
