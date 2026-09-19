import type { Ronda, RondaAnswer } from '../../domain/entities/Ronda.js';
import type { RondaRepository } from '../../domain/ports/RondaRepository.js';
import { RondaNotFoundError } from './GetRonda.js';

export class RondaAlreadyCompletedError extends Error {
  constructor(id: string) {
    super(`Ronda already completed: ${id}`);
    this.name = 'RondaAlreadyCompletedError';
  }
}

export class SaveRondaAnswers {
  constructor(private readonly rondas: RondaRepository) {}

  async execute(
    id: string,
    ownerId: string,
    answers: RondaAnswer[],
  ): Promise<Ronda> {
    const existing = await this.rondas.findById(id);
    if (!existing || existing.ownerId !== ownerId) {
      throw new RondaNotFoundError(id);
    }
    if (existing.status === 'completed') {
      throw new RondaAlreadyCompletedError(id);
    }
    const updated = await this.rondas.saveAnswers(id, ownerId, answers);
    if (!updated) {
      throw new RondaAlreadyCompletedError(id);
    }
    return updated;
  }
}
