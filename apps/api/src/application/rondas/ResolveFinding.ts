import type { Ronda } from '../../domain/entities/Ronda.js';
import type { RondaRepository } from '../../domain/ports/RondaRepository.js';
import { RondaNotFoundError } from './GetRonda.js';

export class FindingNotFoundError extends Error {
  constructor(id: string) {
    super(`Finding not found: ${id}`);
    this.name = 'FindingNotFoundError';
  }
}

export class ResolveFinding {
  constructor(private readonly rondas: RondaRepository) {}

  async execute(
    rondaId: string,
    ownerId: string,
    findingId: string,
  ): Promise<Ronda> {
    const existing = await this.rondas.findById(rondaId);
    if (!existing || existing.ownerId !== ownerId) {
      throw new RondaNotFoundError(rondaId);
    }
    if (!existing.findings.some((f) => f.id === findingId)) {
      throw new FindingNotFoundError(findingId);
    }
    const updated = await this.rondas.resolveFinding(
      rondaId,
      ownerId,
      findingId,
    );
    if (!updated) {
      throw new FindingNotFoundError(findingId);
    }
    return updated;
  }
}
