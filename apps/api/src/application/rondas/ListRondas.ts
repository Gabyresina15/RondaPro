import type { Ronda } from '../../domain/entities/Ronda.js';
import type { RondaRepository } from '../../domain/ports/RondaRepository.js';

export class ListRondas {
  constructor(private readonly rondas: RondaRepository) {}

  execute(
    actorId: string,
    role: 'auditor' | 'supervisor' = 'auditor',
  ): Promise<Ronda[]> {
    if (role === 'supervisor') {
      return this.rondas.findAll();
    }
    return this.rondas.findByOwner(actorId);
  }
}
