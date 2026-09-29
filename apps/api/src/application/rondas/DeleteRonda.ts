import type { RondaRepository } from '../../domain/ports/RondaRepository.js';
import { canActOnRonda } from './canActOnRonda.js';
import { RondaNotFoundError } from './GetRonda.js';

export class DeleteRonda {
  constructor(private readonly rondas: RondaRepository) {}

  async execute(id: string, ownerId: string): Promise<void> {
    const ronda = await this.rondas.findById(id);
    if (!canActOnRonda(ronda, ownerId)) {
      throw new RondaNotFoundError(id);
    }
    const ok = await this.rondas.softDelete(id, ownerId);
    if (!ok) {
      throw new RondaNotFoundError(id);
    }
  }
}
