import type { ChecklistTemplate } from '../../domain/entities/ChecklistTemplate.js';
import type {
  ChecklistTemplateRepository,
  CreateTemplateInput,
  UpdateTemplateInput,
} from '../../domain/ports/ChecklistTemplateRepository.js';
import {
  ChecklistTemplateModel,
  type ChecklistTemplateDocument,
} from './ChecklistTemplateModel.js';

function toDomain(doc: ChecklistTemplateDocument): ChecklistTemplate {
  return {
    id: doc._id.toHexString(),
    name: doc.name,
    description: doc.description,
    items: doc.items.map((item) => ({
      label: item.label,
      required: item.required,
      type: item.type as ChecklistTemplate['items'][number]['type'],
    })),
    ownerId: String(doc.ownerId),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export class MongoChecklistTemplateRepository
  implements ChecklistTemplateRepository
{
  async create(input: CreateTemplateInput): Promise<ChecklistTemplate> {
    const doc = await ChecklistTemplateModel.create({
      name: input.name,
      description: input.description,
      items: input.items,
      ownerId: input.ownerId,
    });
    return toDomain(doc as ChecklistTemplateDocument);
  }

  async findByOwner(ownerId: string): Promise<ChecklistTemplate[]> {
    const docs = await ChecklistTemplateModel.find({ ownerId })
      .sort({ updatedAt: -1 })
      .exec();
    return docs.map((d) => toDomain(d as ChecklistTemplateDocument));
  }

  async findById(id: string): Promise<ChecklistTemplate | null> {
    const doc = await ChecklistTemplateModel.findById(id).exec();
    return doc ? toDomain(doc as ChecklistTemplateDocument) : null;
  }

  async update(
    id: string,
    ownerId: string,
    input: UpdateTemplateInput,
  ): Promise<ChecklistTemplate | null> {
    const doc = await ChecklistTemplateModel.findOneAndUpdate(
      { _id: id, ownerId },
      { $set: input },
      { new: true },
    ).exec();
    return doc ? toDomain(doc as ChecklistTemplateDocument) : null;
  }

  async delete(id: string, ownerId: string): Promise<boolean> {
    const result = await ChecklistTemplateModel.deleteOne({
      _id: id,
      ownerId,
    }).exec();
    return result.deletedCount === 1;
  }
}
