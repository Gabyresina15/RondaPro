import type { FindingStatus, Ronda } from '../../domain/entities/Ronda.js';
import type { RondaRepository } from '../../domain/ports/RondaRepository.js';
import { FindingNotFoundError } from './ResolveFinding.js';
import { RondaNotFoundError } from './GetRonda.js';

export interface UpdateFindingInput {
  rondaId: string;
  ownerId: string;
  findingId: string;
  status?: FindingStatus;
  assignee?: string;
  resolutionNote?: string;
}

function normalizeStatus(status?: FindingStatus): FindingStatus | undefined {
  if (!status) {
    return undefined;
  }
  if (status === 'closed') {
    return 'resolved';
  }
  return status;
}

export class UpdateFinding {
  constructor(private readonly rondas: RondaRepository) {}

  async execute(input: UpdateFindingInput): Promise<Ronda> {
    const existing = await this.rondas.findById(input.rondaId);
    if (!existing || existing.ownerId !== input.ownerId) {
      throw new RondaNotFoundError(input.rondaId);
    }
    const finding = existing.findings.find((f) => f.id === input.findingId);
    if (!finding) {
      throw new FindingNotFoundError(input.findingId);
    }

    const status = normalizeStatus(input.status);
    const resolved =
      status === 'resolved'
        ? {
            resolvedAt: new Date(),
            resolvedBy: input.ownerId,
          }
        : status === 'open'
          ? {
              resolvedAt: undefined,
              resolvedBy: '',
            }
          : {};

    const updated = await this.rondas.updateFinding(
      input.rondaId,
      input.ownerId,
      input.findingId,
      {
        status,
        assignee: input.assignee?.trim(),
        resolutionNote: input.resolutionNote?.trim(),
        ...resolved,
      },
    );
    if (!updated) {
      throw new FindingNotFoundError(input.findingId);
    }
    return updated;
  }
}
