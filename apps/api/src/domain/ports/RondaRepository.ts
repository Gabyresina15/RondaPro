import type { Ronda, RondaAnswer, RondaPhoto } from '../entities/Ronda.js';

export interface CreateRondaInput {
  templateId: string;
  templateName: string;
  ownerId: string;
  location: string;
  answers: RondaAnswer[];
}

export interface CompleteRondaInput {
  summary: string;
  summarySource: 'llm' | 'heuristic';
  completedAt: Date;
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
  complete(
    id: string,
    ownerId: string,
    input: CompleteRondaInput,
  ): Promise<Ronda | null>;
}
