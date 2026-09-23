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

function actorFilter(id: string, ownerId: string, extra: Record<string, unknown> = {}) {
  return {
    _id: id,
    deletedAt: { $in: [null, undefined] },
    $or: [{ ownerId }, { assigneeId: ownerId }],
    ...extra,
  };
}

function toDomain(doc: RondaDocument): Ronda {
  const extra = doc as RondaDocument & {
    assigneeId?: unknown;
    assigneeName?: string;
    summaryModel?: string;
    summaryLatencyMs?: number;
    lastEditedAt?: Date;
    deletedAt?: Date;
  };
  return {
    id: doc._id.toHexString(),
    templateId: String(doc.templateId),
    templateName: doc.templateName,
    ownerId: String(doc.ownerId),
    assigneeId: extra.assigneeId ? String(extra.assigneeId) : undefined,
    assigneeName: extra.assigneeName,
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
    summaryModel: extra.summaryModel,
    summaryLatencyMs: extra.summaryLatencyMs,
    completedAt: doc.completedAt ?? undefined,
    lastEditedAt: extra.lastEditedAt,
    deletedAt: extra.deletedAt,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

const notDeleted = { deletedAt: { $in: [null, undefined] } };

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
      ...notDeleted,
      $or: [{ ownerId }, { assigneeId: ownerId }],
    })
      .sort({ createdAt: -1 })
      .exec();
    return docs.map((d) => toDomain(d as RondaDocument));
  }

  async findAll(): Promise<Ronda[]> {
    const docs = await RondaModel.find(notDeleted).sort({ createdAt: -1 }).exec();
    return docs.map((d) => toDomain(d as RondaDocument));
  }

  async assign(
    id: string,
    assigneeId: string,
    assigneeName: string,
  ): Promise<Ronda | null> {
    const doc = await RondaModel.findOneAndUpdate(
      { _id: id, ...notDeleted },
      { $set: { assigneeId, assigneeName } },
      { new: true },
    ).exec();
    return doc ? toDomain(doc as RondaDocument) : null;
  }

  async findById(id: string): Promise<Ronda | null> {
    const doc = await RondaModel.findOne({ _id: id, ...notDeleted }).exec();
    return doc ? toDomain(doc as RondaDocument) : null;
  }

  async saveAnswers(
    id: string,
    ownerId: string,
    answers: RondaAnswer[],
  ): Promise<Ronda | null> {
    const doc = await RondaModel.findOneAndUpdate(
      actorFilter(id, ownerId),
      { $set: { answers, lastEditedAt: new Date() } },
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
      actorFilter(id, ownerId),
      { $push: { photos: { $each: photos } }, $set: { lastEditedAt: new Date() } },
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
      actorFilter(id, ownerId),
      { $push: { findings: finding }, $set: { lastEditedAt: new Date() } },
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
    const set: Record<string, unknown> = { lastEditedAt: new Date() };
    if (patch.status !== undefined) set['findings.$.status'] = patch.status;
    if (patch.assignee !== undefined) set['findings.$.assignee'] = patch.assignee;
    if (patch.resolutionNote !== undefined) {
      set['findings.$.resolutionNote'] = patch.resolutionNote;
    }
    if ('resolvedAt' in patch) set['findings.$.resolvedAt'] = patch.resolvedAt ?? null;
    if ('resolvedBy' in patch) set['findings.$.resolvedBy'] = patch.resolvedBy ?? '';
    const doc = await RondaModel.findOneAndUpdate(
      actorFilter(id, ownerId, { 'findings.id': findingId }),
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
      summaryModel: input.summaryModel,
      summaryLatencyMs: input.summaryLatencyMs,
      completedAt: input.completedAt,
    };
    if (input.findings) set.findings = input.findings;
    const doc = await RondaModel.findOneAndUpdate(
      actorFilter(id, ownerId, { status: 'in_progress' }),
      { $set: set },
      { new: true },
    ).exec();
    return doc ? toDomain(doc as RondaDocument) : null;
  }

  async softDelete(id: string, ownerId: string): Promise<boolean> {
    const doc = await RondaModel.findOneAndUpdate(
      actorFilter(id, ownerId),
      { $set: { deletedAt: new Date() } },
      { new: true },
    ).exec();
    return Boolean(doc);
  }
}
