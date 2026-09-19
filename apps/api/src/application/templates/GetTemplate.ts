import type { ChecklistTemplate } from '../../domain/entities/ChecklistTemplate.js';
import type { ChecklistTemplateRepository } from '../../domain/ports/ChecklistTemplateRepository.js';

export class TemplateNotFoundError extends Error {
  constructor(id: string) {
    super(`Template not found: ${id}`);
    this.name = 'TemplateNotFoundError';
  }
}

export class GetTemplate {
  constructor(private readonly templates: ChecklistTemplateRepository) {}

  async execute(id: string, ownerId: string): Promise<ChecklistTemplate> {
    const template = await this.templates.findById(id);
    if (!template || template.ownerId !== ownerId) {
      throw new TemplateNotFoundError(id);
    }
    return template;
  }
}
