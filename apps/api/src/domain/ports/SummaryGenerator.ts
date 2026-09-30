import type { Ronda } from '../entities/Ronda.js';

export interface GeneratedSummary {
  text: string;
  source: 'llm' | 'heuristic';
  latencyMs?: number;
  model?: string;
  risk?: string;
  keyFindings?: string[];
  actions?: string[];
}

export interface SummaryGenerator {
  generate(ronda: Ronda): Promise<GeneratedSummary>;
}
