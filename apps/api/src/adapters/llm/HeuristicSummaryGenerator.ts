import type { Ronda } from '../../domain/entities/Ronda.js';
import type {
  GeneratedSummary,
  SummaryGenerator,
} from '../../domain/ports/SummaryGenerator.js';

export class HeuristicSummaryGenerator implements SummaryGenerator {
  async generate(ronda: Ronda): Promise<GeneratedSummary> {
    const yes = ronda.answers.filter((a) => a.type === 'bool' && a.boolValue === true).length;
    const no = ronda.answers.filter((a) => a.type === 'bool' && a.boolValue === false).length;
    const notes = ronda.answers
      .filter((a) => a.type === 'text' && (a.textValue ?? '').trim().length > 0)
      .map((a) => `- ${a.label}: ${a.textValue?.trim()}`)
      .join('\n');
    const location = ronda.location.trim() || 'unspecified location';

    const text = [
      `Ronda completed for "${ronda.templateName}" at ${location}.`,
      `Evidence: ${ronda.photos.length} photo(s) attached.`,
      `Checklist results: ${yes} passed, ${no} failed, ${ronda.answers.length} items recorded.`,
      notes ? `Notes:\n${notes}` : 'No free-text notes were recorded.',
      no > 0
        ? 'Follow-up recommended for failed boolean checks.'
        : 'No failed boolean checks were recorded.',
    ].join(' ');

    return { text, source: 'heuristic' };
  }
}
