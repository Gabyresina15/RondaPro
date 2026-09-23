import { randomUUID } from 'node:crypto';
import type { ChecklistTemplateRepository } from '../../domain/ports/ChecklistTemplateRepository.js';
import type { Finding, Ronda } from '../../domain/entities/Ronda.js';
import type { RondaRepository } from '../../domain/ports/RondaRepository.js';
import type { SummaryGenerator } from '../../domain/ports/SummaryGenerator.js';
import { RondaAlreadyCompletedError } from './SaveRondaAnswers.js';
import { canActOnRonda } from './canActOnRonda.js';
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
    if (!canActOnRonda(ronda, ownerId)) {
      throw new RondaNotFoundError(id);
    }
    if (ronda.status === 'completed') {
      throw new RondaAlreadyCompletedError(id);
    }
    const template = await this.templates.findById(ronda.templateId);
    if (template) {
      for (const [index, item] of template.items.entries()) {
        if (!item.required || item.type === 'photo') continue;
        const answer = ronda.answers.find((a) => a.itemIndex === index);
        if (item.type === 'bool' && answer?.boolValue === undefined) {
          throw new RondaCompletionError(
            `Falta el check obligatorio: ${item.label}`,
          );
        }
        if (item.type === 'text' && !(answer?.textValue ?? '').trim()) {
          throw new RondaCompletionError(
            `Falta la nota obligatoria: ${item.label}`,
          );
        }
      }
    }

    const findings = mergeAutoFindings(ronda);
    const forSummary = { ...ronda, findings };
    const generated = await this.summaries.generate(forSummary);
    const completed = await this.rondas.complete(id, ownerId, {
      summary: generated.text,
      summarySource: generated.source,
      completedAt: new Date(),
      findings,
    });
    if (!completed) {
      throw new RondaAlreadyCompletedError(id);
    }
    return completed;
  }
}

function mergeAutoFindings(ronda: Ronda): Finding[] {
  const findings = [...ronda.findings];
  for (const answer of ronda.answers) {
    if (answer.type !== 'bool' || answer.boolValue !== false) {
      continue;
    }
    const already = findings.some(
      (f) => f.itemIndex === answer.itemIndex && f.status === 'open',
    );
    if (already) {
      continue;
    }
    findings.push({
      id: randomUUID(),
      title: `Check fallido: ${answer.label}`,
      notes: 'Creado automáticamente por un ítem que no pasó',
      severity: 'medium',
      status: 'open',
      itemIndex: answer.itemIndex,
      createdAt: new Date(),
    });
  }
  return findings;
}
