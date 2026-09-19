import type { Finding, Ronda, RondaAnswer, RondaPhoto } from '../entities/Ronda.js';

export interface CreateRondaInput {
  templateId: string;
  templateName: string;
  ownerId: string;
  siteId?: string;
  siteName?: string;
  location: string;
  answers: RondaAnswer[];
}

export interface CompleteRondaInput {
  summary: string;
  summarySource: 'llm' | 'heuristic';
  completedAt: Date;
  findings?: Finding[];
}

export interface RondaRepository {
  create(input: CreateRondaInput): Promise<Ronda>;
  findByOwner(ownerId: string): Promise<Ronda[]>;
  findById(id: string): Promise<Ronda | null>;
  saveAnswers(
    id: string,
    ownerId: string,
    answers: RondaAnswer[],
  ): Promise<Ronda | null>;
  addPhotos(
    id: string,
    ownerId: string,
    photos: RondaPhoto[],
  ): Promise<Ronda | null>;
  addFinding(
    id: string,
    ownerId: string,
    finding: Finding,
  ): Promise<Ronda | null>;
  resolveFinding(
    id: string,
    ownerId: string,
    findingId: string,
  ): Promise<Ronda | null>;
  updateFinding(
    id: string,
    ownerId: string,
    findingId: string,
    patch: Partial<Finding>,
  ): Promise<Ronda | null>;
  complete(
    id: string,
    ownerId: string,
    input: CompleteRondaInput,
  ): Promise<Ronda | null>;
}
