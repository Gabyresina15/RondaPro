import type { Ronda } from '../../domain/entities/Ronda.js';
import type { RondaRepository } from '../../domain/ports/RondaRepository.js';

export class ListRondas {
  constructor(private readonly rondas: RondaRepository) {}

  execute(ownerId: string): Promise<Ronda[]> {
    return this.rondas.findByOwner(ownerId);
  }
}
