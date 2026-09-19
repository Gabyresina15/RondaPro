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

  async execute(id: string, ownerId: string): Promise<Ronda> {
    const ronda = await this.rondas.findById(id);
    if (!ronda || ronda.ownerId !== ownerId) {
      throw new RondaNotFoundError(id);
    }
    return ronda;
  }
}
