import type { ChecklistTemplateRepository } from '../../domain/ports/ChecklistTemplateRepository.js';
import type { Ronda } from '../../domain/entities/Ronda.js';
import type { RondaRepository } from '../../domain/ports/RondaRepository.js';
import type { SummaryGenerator } from '../../domain/ports/SummaryGenerator.js';
import { RondaAlreadyCompletedError } from './SaveRondaAnswers.js';
import { RondaNotFoundError } from './GetRonda.js';

export class RondaCompletionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RondaCompletionError';
  }
}

export class CompleteRonda {
  constructor(
    private readonly rondas: RondaRepository,
    private readonly templates: ChecklistTemplateRepository,
    private readonly summaries: SummaryGenerator,
  ) {}

  async execute(id: string, ownerId: string): Promise<Ronda> {
    const ronda = await this.rondas.findById(id);
    if (!ronda || ronda.ownerId !== ownerId) {
      throw new RondaNotFoundError(id);
    }
    if (ronda.status === 'completed') {
      throw new RondaAlreadyCompletedError(id);
    }
    if (ronda.photos.length < 2) {
      throw new RondaCompletionError(
        'A ronda needs at least 2 photos before it can be completed',
      );
    }

    const template = await this.templates.findById(ronda.templateId);
    if (template) {
      for (const [index, item] of template.items.entries()) {
        if (!item.required) continue;
        const answer = ronda.answers.find((a) => a.itemIndex === index);
        if (item.type === 'bool' && answer?.boolValue === undefined) {
          throw new RondaCompletionError(
            `Required check is missing: ${item.label}`,
          );
        }
        if (item.type === 'text' && !(answer?.textValue ?? '').trim()) {
          throw new RondaCompletionError(
            `Required note is missing: ${item.label}`,
          );
        }
        if (item.type === 'photo') {
          const count = ronda.photos.filter((p) => p.itemIndex === index).length;
          if (count < 1) {
            throw new RondaCompletionError(
              `Required photo is missing: ${item.label}`,
            );
          }
        }
      }
    }

    const generated = await this.summaries.generate(ronda);
    const completed = await this.rondas.complete(id, ownerId, {
      summary: generated.text,
      summarySource: generated.source,
      completedAt: new Date(),
    });
    if (!completed) {
      throw new RondaAlreadyCompletedError(id);
    }
    return completed;
  }
}
