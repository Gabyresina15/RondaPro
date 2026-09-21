import type { Ronda } from '../../domain/entities/Ronda.js';
import { AssignRonda } from './AssignRonda.js';
import { StartRonda } from './StartRonda.js';

export class CreateInspectionOrder {
  constructor(
    private readonly startRonda: StartRonda,
    private readonly assignRonda: AssignRonda,
  ) {}

  async execute(input: {
    actorId: string;
    role: 'auditor' | 'supervisor';
    templateId: string;
    assigneeId: string;
    location: string;
    siteId?: string;
  }): Promise<Ronda> {
    const ronda = await this.startRonda.execute({
      templateId: input.templateId,
      ownerId: input.actorId,
      location: input.location,
      siteId: input.siteId,
    });
    return this.assignRonda.execute({
      rondaId: ronda.id,
      actorId: input.actorId,
      role: input.role,
      assigneeId: input.assigneeId,
    });
  }
}
