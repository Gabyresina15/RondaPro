export type RondaStatus = 'in_progress' | 'completed';
export type FindingSeverity = 'low' | 'medium' | 'high';
export type FindingStatus = 'open' | 'resolved' | 'closed';

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

export interface Finding {
  id: string;
  title: string;
  notes: string;
  severity: FindingSeverity;
  status: FindingStatus;
  itemIndex?: number;
  assignee?: string;
  resolutionNote?: string;
  resolvedAt?: Date;
  resolvedBy?: string;
  createdAt: Date;
}

export interface Ronda {
  id: string;
  templateId: string;
  templateName: string;
  ownerId: string;
  siteId?: string;
  siteName?: string;
  location: string;
  status: RondaStatus;
  answers: RondaAnswer[];
  photos: RondaPhoto[];
  findings: Finding[];
  summary?: string;
  summarySource?: 'llm' | 'heuristic';
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
