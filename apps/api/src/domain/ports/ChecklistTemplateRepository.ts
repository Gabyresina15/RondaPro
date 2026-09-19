import type {
  ChecklistItem,
  ChecklistTemplate,
} from '../entities/ChecklistTemplate.js';

export interface CreateTemplateInput {
  name: string;
  description: string;
  items: ChecklistItem[];
  ownerId: string;
}

export interface UpdateTemplateInput {
  name?: string;
  description?: string;
  items?: ChecklistItem[];
}

export interface ChecklistTemplateRepository {
  create(input: CreateTemplateInput): Promise<ChecklistTemplate>;
  findByOwner(ownerId: string): Promise<ChecklistTemplate[]>;
  findById(id: string): Promise<ChecklistTemplate | null>;
  update(
    id: string,
    ownerId: string,
    input: UpdateTemplateInput,
  ): Promise<ChecklistTemplate | null>;
  delete(id: string, ownerId: string): Promise<boolean>;
}
