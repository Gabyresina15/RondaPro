import type { Ronda, RondaAnswer } from '../../domain/entities/Ronda.js';
import type { RondaRepository } from '../../domain/ports/RondaRepository.js';
import { canActOnRonda } from './canActOnRonda.js';
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
    if (!canActOnRonda(existing, ownerId)) {
      throw new RondaNotFoundError(id);
    }
    const updated = await this.rondas.saveAnswers(id, ownerId, answers);
    if (!updated) {
      throw new RondaNotFoundError(id);
    }
    return updated;
  }
}
