import type { Ronda, RondaAnswer, RondaPhoto } from '../../domain/entities/Ronda.js';
import type {
  CompleteRondaInput,
  CreateRondaInput,
  RondaRepository,
} from '../../domain/ports/RondaRepository.js';
import { RondaModel, type RondaDocument } from './RondaModel.js';

function toDomain(doc: RondaDocument): Ronda {
  return {
    id: doc._id.toHexString(),
    templateId: String(doc.templateId),
    templateName: doc.templateName,
    ownerId: String(doc.ownerId),
    location: doc.location,
    status: doc.status as Ronda['status'],
    answers: doc.answers.map((a) => ({
      itemIndex: a.itemIndex,
      label: a.label,
      type: a.type as RondaAnswer['type'],
      textValue: a.textValue ?? undefined,
      boolValue: a.boolValue ?? undefined,
    })),
    photos: doc.photos.map((p) => ({
      id: p.id,
      filename: p.filename,
      mimeType: p.mimeType,
      relativePath: p.relativePath,
      itemIndex: p.itemIndex ?? undefined,
      createdAt: p.createdAt,
    })),
    summary: doc.summary ?? undefined,
    summarySource: (doc.summarySource as Ronda['summarySource']) ?? undefined,
    completedAt: doc.completedAt ?? undefined,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export class MongoRondaRepository implements RondaRepository {
  async create(input: CreateRondaInput): Promise<Ronda> {
    const doc = await RondaModel.create({
      templateId: input.templateId,
      templateName: input.templateName,
      ownerId: input.ownerId,
      location: input.location,
      status: 'in_progress',
      answers: input.answers,
      photos: [],
    });
    return toDomain(doc as RondaDocument);
  }

  async findByOwner(ownerId: string): Promise<Ronda[]> {
    const docs = await RondaModel.find({ ownerId })
      .sort({ createdAt: -1 })
      .exec();
    return docs.map((d) => toDomain(d as RondaDocument));
  }

  async findById(id: string): Promise<Ronda | null> {
    const doc = await RondaModel.findById(id).exec();
    return doc ? toDomain(doc as RondaDocument) : null;
  }

  async saveAnswers(
    id: string,
    ownerId: string,
    answers: RondaAnswer[],
  ): Promise<Ronda | null> {
    const doc = await RondaModel.findOneAndUpdate(
      { _id: id, ownerId, status: 'in_progress' },
      { $set: { answers } },
      { new: true },
    ).exec();
    return doc ? toDomain(doc as RondaDocument) : null;
  }

  async addPhotos(
    id: string,
    ownerId: string,
    photos: RondaPhoto[],
  ): Promise<Ronda | null> {
    const doc = await RondaModel.findOneAndUpdate(
      { _id: id, ownerId, status: 'in_progress' },
      { $push: { photos: { $each: photos } } },
      { new: true },
    ).exec();
    return doc ? toDomain(doc as RondaDocument) : null;
  }

  async complete(
    id: string,
    ownerId: string,
    input: CompleteRondaInput,
  ): Promise<Ronda | null> {
    const doc = await RondaModel.findOneAndUpdate(
      { _id: id, ownerId, status: 'in_progress' },
      {
        $set: {
          status: 'completed',
          summary: input.summary,
          summarySource: input.summarySource,
          completedAt: input.completedAt,
        },
      },
      { new: true },
    ).exec();
    return doc ? toDomain(doc as RondaDocument) : null;
  }
}
