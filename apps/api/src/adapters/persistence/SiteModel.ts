import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const siteSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true, default: '', trim: true },
    notes: { type: String, required: true, default: '', trim: true },
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

export type SiteDocument = InferSchemaType<typeof siteSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const SiteModel =
  mongoose.models.Site ?? mongoose.model('Site', siteSchema);
