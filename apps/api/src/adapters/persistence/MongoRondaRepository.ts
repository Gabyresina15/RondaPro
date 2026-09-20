import type {
  Finding,
  Ronda,
  RondaAnswer,
  RondaPhoto,
} from '../../domain/entities/Ronda.js';
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
    assigneeId: (doc as RondaDocument & { assigneeId?: unknown }).assigneeId
      ? String((doc as RondaDocument & { assigneeId?: unknown }).assigneeId)
      : undefined,
    assigneeName: (doc as RondaDocument & { assigneeName?: string }).assigneeName,
    siteId: doc.siteId ? String(doc.siteId) : undefined,
    siteName: doc.siteName ?? undefined,
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
    findings: (doc.findings ?? []).map((f) => ({
      id: f.id,
      title: f.title,
      notes: f.notes,
      severity: f.severity as Finding['severity'],
      status: f.status as Finding['status'],
      itemIndex: f.itemIndex ?? undefined,
      assignee: f.assignee ?? undefined,
      resolutionNote: f.resolutionNote ?? undefined,
      resolvedAt: f.resolvedAt ?? undefined,
      resolvedBy: f.resolvedBy ?? undefined,
      createdAt: f.createdAt,
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
      siteId: input.siteId,
      siteName: input.siteName,
      location: input.location,
      status: 'in_progress',
      answers: input.answers,
      photos: [],
      findings: [],
    });
    return toDomain(doc as RondaDocument);
  }

  async findByOwner(ownerId: string): Promise<Ronda[]> {
    const docs = await RondaModel.find({
      $or: [{ ownerId }, { assigneeId: ownerId }],
    })
      .sort({ createdAt: -1 })
      .exec();
    return docs.map((d) => toDomain(d as RondaDocument));
  }

  async findAll(): Promise<Ronda[]> {
    const docs = await RondaModel.find({}).sort({ createdAt: -1 }).exec();
    return docs.map((d) => toDomain(d as RondaDocument));
  }

  async assign(
    id: string,
    assigneeId: string,
    assigneeName: string,
  ): Promise<Ronda | null> {
    const doc = await RondaModel.findByIdAndUpdate(
      id,
      { $set: { assigneeId, assigneeName } },
      { new: true },
    ).exec();
    return doc ? toDomain(doc as RondaDocument) : null;
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

  async addFinding(
    id: string,
    ownerId: string,
    finding: Finding,
  ): Promise<Ronda | null> {
    const doc = await RondaModel.findOneAndUpdate(
      { _id: id, ownerId, status: 'in_progress' },
      { $push: { findings: finding } },
      { new: true },
    ).exec();
    return doc ? toDomain(doc as RondaDocument) : null;
  }

  async resolveFinding(
    id: string,
    ownerId: string,
    findingId: string,
  ): Promise<Ronda | null> {
    return this.updateFinding(id, ownerId, findingId, {
      status: 'resolved',
      resolvedAt: new Date(),
    });
  }

  async updateFinding(
    id: string,
    ownerId: string,
    findingId: string,
    patch: Partial<Finding>,
  ): Promise<Ronda | null> {
    const set: Record<string, unknown> = {};
    if (patch.status !== undefined) set['findings.$.status'] = patch.status;
    if (patch.assignee !== undefined) set['findings.$.assignee'] = patch.assignee;
    if (patch.resolutionNote !== undefined) {
      set['findings.$.resolutionNote'] = patch.resolutionNote;
    }
    if ('resolvedAt' in patch) set['findings.$.resolvedAt'] = patch.resolvedAt ?? null;
    if ('resolvedBy' in patch) set['findings.$.resolvedBy'] = patch.resolvedBy ?? '';
    const doc = await RondaModel.findOneAndUpdate(
      { _id: id, ownerId, 'findings.id': findingId },
      { $set: set },
      { new: true },
    ).exec();
    return doc ? toDomain(doc as RondaDocument) : null;
  }

  async complete(
    id: string,
    ownerId: string,
    input: CompleteRondaInput,
  ): Promise<Ronda | null> {
    const set: Record<string, unknown> = {
      status: 'completed',
      summary: input.summary,
      summarySource: input.summarySource,
      completedAt: input.completedAt,
    };
    if (input.findings) {
      set.findings = input.findings;
    }
    const doc = await RondaModel.findOneAndUpdate(
      { _id: id, ownerId, status: 'in_progress' },
      { $set: set },
      { new: true },
    ).exec();
    return doc ? toDomain(doc as RondaDocument) : null;
  }
}
