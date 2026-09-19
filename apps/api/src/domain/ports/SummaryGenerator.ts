import type { Ronda } from '../entities/Ronda.js';

export interface GeneratedSummary {
  text: string;
  source: 'llm' | 'heuristic';
}

export interface SummaryGenerator {
  generate(ronda: Ronda): Promise<GeneratedSummary>;
}
