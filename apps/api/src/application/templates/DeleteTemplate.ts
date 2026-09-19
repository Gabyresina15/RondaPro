import type { ChecklistTemplateRepository } from '../../domain/ports/ChecklistTemplateRepository.js';
import { TemplateNotFoundError } from './GetTemplate.js';

export class DeleteTemplate {
  constructor(private readonly templates: ChecklistTemplateRepository) {}

  async execute(id: string, ownerId: string): Promise<void> {
    const deleted = await this.templates.delete(id, ownerId);
    if (!deleted) {
      throw new TemplateNotFoundError(id);
    }
  }
}
