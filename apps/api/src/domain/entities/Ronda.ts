export type RondaStatus = 'in_progress' | 'completed';

export interface RondaAnswer {
  itemIndex: number;
  label: string;
  type: 'text' | 'bool' | 'photo';
  textValue?: string;
  boolValue?: boolean;
}

export interface RondaPhoto {
  id: string;
  filename: string;
  mimeType: string;
  relativePath: string;
  itemIndex?: number;
  createdAt: Date;
}

export interface Ronda {
  id: string;
  templateId: string;
  templateName: string;
  ownerId: string;
  location: string;
  status: RondaStatus;
  answers: RondaAnswer[];
  photos: RondaPhoto[];
  summary?: string;
  summarySource?: 'llm' | 'heuristic';
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
