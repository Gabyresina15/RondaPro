import { randomUUID } from 'node:crypto';
import type { Finding, FindingSeverity, Ronda } from '../../domain/entities/Ronda.js';
import type { RondaRepository } from '../../domain/ports/RondaRepository.js';
import { RondaAlreadyCompletedError } from './SaveRondaAnswers.js';
import { canActOnRonda } from './canActOnRonda.js';
import { RondaNotFoundError } from './GetRonda.js';

export class AddFinding {
  constructor(private readonly rondas: RondaRepository) {}

  async execute(input: {
    rondaId: string;
    ownerId: string;
    title: string;
    notes: string;
    severity: FindingSeverity;
    itemIndex?: number;
  }): Promise<Ronda> {
    const existing = await this.rondas.findById(input.rondaId);
    if (!canActOnRonda(existing, input.ownerId)) {
      throw new RondaNotFoundError(input.rondaId);
    }
    if (existing.status === 'completed') {
      throw new RondaAlreadyCompletedError(input.rondaId);
    }

    const finding: Finding = {
      id: randomUUID(),
      title: input.title.trim(),
      notes: input.notes.trim(),
      severity: input.severity,
      status: 'open',
      itemIndex: input.itemIndex,
      createdAt: new Date(),
    };

    const updated = await this.rondas.addFinding(
      input.rondaId,
      input.ownerId,
      finding,
    );
    if (!updated) {
      throw new RondaAlreadyCompletedError(input.rondaId);
    }
    return updated;
  }
}
