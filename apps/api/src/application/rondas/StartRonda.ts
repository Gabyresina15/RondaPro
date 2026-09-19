import type { ChecklistTemplateRepository } from '../../domain/ports/ChecklistTemplateRepository.js';
import type { Ronda } from '../../domain/entities/Ronda.js';
import type { RondaRepository } from '../../domain/ports/RondaRepository.js';
import { TemplateNotFoundError } from '../templates/GetTemplate.js';

export class StartRonda {
  constructor(
    private readonly rondas: RondaRepository,
    private readonly templates: ChecklistTemplateRepository,
  ) {}

  async execute(input: {
    templateId: string;
    ownerId: string;
    location: string;
  }): Promise<Ronda> {
    const template = await this.templates.findById(input.templateId);
    if (!template || template.ownerId !== input.ownerId) {
      throw new TemplateNotFoundError(input.templateId);
    }

    return this.rondas.create({
      templateId: template.id,
      templateName: template.name,
      ownerId: input.ownerId,
      location: input.location.trim(),
      answers: template.items.map((item, itemIndex) => ({
        itemIndex,
        label: item.label,
        type: item.type,
        ...(item.type === 'bool' ? { boolValue: false } : {}),
      })),
    });
  }
}
