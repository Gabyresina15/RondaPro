import type { Ronda } from '../../domain/entities/Ronda.js';
import type {
  GeneratedSummary,
  SummaryGenerator,
} from '../../domain/ports/SummaryGenerator.js';

export interface OpenAiSummaryConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export class OpenAiSummaryGenerator implements SummaryGenerator {
  constructor(private readonly config: OpenAiSummaryConfig) {}

  async generate(ronda: Ronda): Promise<GeneratedSummary> {
    const payload = {
      model: this.config.model,
      temperature: 0.3,
      messages: [
        {
          role: 'system',
          content:
            'You write a short operational audit summary (max 120 words) for a completed field ronda. Be factual, mention photo evidence count, failed checks, and a recommended next action. Do not invent facts.',
        },
        {
          role: 'user',
          content: JSON.stringify({
            template: ronda.templateName,
            location: ronda.location,
            photoCount: ronda.photos.length,
            answers: ronda.answers.map((a) => ({
              label: a.label,
              type: a.type,
              textValue: a.textValue ?? null,
              boolValue: a.boolValue ?? null,
            })),
          }),
        },
      ],
    };

    const url = `${this.config.baseUrl.replace(/\/$/, '')}/chat/completions`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`LLM request failed (${response.status}): ${body}`);
    }

    const json = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = json.choices?.[0]?.message?.content?.trim();
    if (!text) {
      throw new Error('LLM returned an empty summary');
    }
    return { text, source: 'llm' };
  }
}

export class FallbackSummaryGenerator implements SummaryGenerator {
  constructor(
    private readonly primary: SummaryGenerator,
    private readonly fallback: SummaryGenerator,
  ) {}

  async generate(ronda: Ronda): Promise<GeneratedSummary> {
    try {
      return await this.primary.generate(ronda);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`[summary] Gemini fallback: ${message}`);
      return this.fallback.generate(ronda);
    }
  }
}
