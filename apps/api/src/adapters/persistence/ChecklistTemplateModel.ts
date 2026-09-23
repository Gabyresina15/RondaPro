import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const checklistItemSchema = new Schema(
  {
    label: { type: String, required: true, trim: true },
    required: { type: Boolean, required: true, default: false },
    type: {
      type: String,
      required: true,
      enum: ['text', 'bool', 'photo'],
    },
  },
  { _id: false },
);

const checklistTemplateSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: false, default: '', trim: true },
    items: { type: [checklistItemSchema], required: true, default: [] },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export type ChecklistTemplateDocument = InferSchemaType<
  typeof checklistTemplateSchema
> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const ChecklistTemplateModel =
  mongoose.models.ChecklistTemplate ??
  mongoose.model('ChecklistTemplate', checklistTemplateSchema);
