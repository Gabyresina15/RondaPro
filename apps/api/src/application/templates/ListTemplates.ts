import type { ChecklistTemplate } from '../../domain/entities/ChecklistTemplate.js';
import type { ChecklistTemplateRepository } from '../../domain/ports/ChecklistTemplateRepository.js';

export class ListTemplates {
  constructor(private readonly templates: ChecklistTemplateRepository) {}

  async execute(ownerId: string): Promise<ChecklistTemplate[]> {
    return this.templates.findByOwner(ownerId);
  }
}
