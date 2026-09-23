import type {
  ChecklistItem,
  ChecklistTemplate,
} from '../../domain/entities/ChecklistTemplate.js';
import type { ChecklistTemplateRepository } from '../../domain/ports/ChecklistTemplateRepository.js';

export interface CreateTemplateInput {
  name: string;
  description?: string;
  items: ChecklistItem[];
  ownerId: string;
}

export class CreateTemplate {
  constructor(private readonly templates: ChecklistTemplateRepository) {}

  async execute(input: CreateTemplateInput): Promise<ChecklistTemplate> {
    return this.templates.create({
      name: input.name.trim(),
      description: (input.description ?? '').trim(),
      items: input.items,
      ownerId: input.ownerId,
    });
  }
}
