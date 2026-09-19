export type ChecklistItemType = 'text' | 'bool' | 'photo';

export interface ChecklistItem {
  label: string;
  required: boolean;
  type: ChecklistItemType;
}

export interface ChecklistTemplate {
  id: string;
  name: string;
  description: string;
  items: ChecklistItem[];
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export const CHECKLIST_ITEM_TYPES: readonly ChecklistItemType[] = [
  'text',
  'bool',
  'photo',
] as const;
