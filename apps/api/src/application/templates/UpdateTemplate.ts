import type {
  ChecklistItem,
  ChecklistTemplate,
} from '../../domain/entities/ChecklistTemplate.js';
import type { ChecklistTemplateRepository } from '../../domain/ports/ChecklistTemplateRepository.js';
import { TemplateNotFoundError } from './GetTemplate.js';

export interface UpdateTemplateInput {
  name?: string;
  description?: string;
  items?: ChecklistItem[];
}

export class UpdateTemplate {
  constructor(private readonly templates: ChecklistTemplateRepository) {}

  async execute(
    id: string,
    ownerId: string,
    input: UpdateTemplateInput,
  ): Promise<ChecklistTemplate> {
    const patch: UpdateTemplateInput = {};
    if (input.name !== undefined) {
      patch.name = input.name.trim();
    }
    if (input.description !== undefined) {
      patch.description = input.description.trim();
    }
    if (input.items !== undefined) {
      patch.items = input.items;
    }

    const updated = await this.templates.update(id, ownerId, patch);
    if (!updated) {
      throw new TemplateNotFoundError(id);
    }
    return updated;
  }
}
