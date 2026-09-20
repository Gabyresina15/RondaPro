import type { UserRepository } from '../../domain/ports/UserRepository.js';
import type { RondaRepository } from '../../domain/ports/RondaRepository.js';
import { RondaNotFoundError } from './GetRonda.js';

export class ForbiddenError extends Error {
  constructor() {
    super('Only a supervisor can assign rondas');
    this.name = 'ForbiddenError';
  }
}

export class AssignRonda {
  constructor(
    private readonly rondas: RondaRepository,
    private readonly users: UserRepository,
  ) {}

  async execute(input: {
    rondaId: string;
    actorId: string;
    role: 'auditor' | 'supervisor';
    assigneeId: string;
  }) {
    if (input.role !== 'supervisor') {
      throw new ForbiddenError();
    }
    const ronda = await this.rondas.findById(input.rondaId);
    if (!ronda) {
      throw new RondaNotFoundError(input.rondaId);
    }
    const assignee = await this.users.findById(input.assigneeId);
    if (!assignee) {
      throw new RondaNotFoundError(input.assigneeId);
    }
    const updated = await this.rondas.assign(
      input.rondaId,
      assignee.id,
      assignee.name,
    );
    if (!updated) {
      throw new RondaNotFoundError(input.rondaId);
    }
    return updated;
  }
}
