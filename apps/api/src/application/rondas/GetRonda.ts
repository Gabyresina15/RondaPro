import type { Ronda } from '../../domain/entities/Ronda.js';
import type { RondaRepository } from '../../domain/ports/RondaRepository.js';

export class RondaNotFoundError extends Error {
  constructor(id: string) {
    super(`Ronda not found: ${id}`);
    this.name = 'RondaNotFoundError';
  }
}

export class GetRonda {
  constructor(private readonly rondas: RondaRepository) {}

  async execute(id: string, actorId: string): Promise<Ronda> {
    const ronda = await this.rondas.findById(id);
    const canSee =
      ronda &&
      (ronda.ownerId === actorId || ronda.assigneeId === actorId);
    if (!canSee) {
      throw new RondaNotFoundError(id);
    }
    return ronda;
  }
}
