import type { ChecklistTemplate } from '../../domain/entities/ChecklistTemplate.js';
import type { ChecklistTemplateRepository } from '../../domain/ports/ChecklistTemplateRepository.js';

export class ListTemplates {
  constructor(private readonly templates: ChecklistTemplateRepository) {}

  async execute(_ownerId: string): Promise<ChecklistTemplate[]> {
    return this.templates.findAll();
  }
}
