import type { Ronda } from '../../domain/entities/Ronda.js';
import type {
  GeneratedSummary,
  SummaryGenerator,
} from '../../domain/ports/SummaryGenerator.js';

export interface GeminiSummaryConfig {
  apiKey: string;
  model: string;
  baseUrl?: string;
}

export class GeminiSummaryGenerator implements SummaryGenerator {
  constructor(private readonly config: GeminiSummaryConfig) {}

  async generate(ronda: Ronda): Promise<GeneratedSummary> {
    const base =
      this.config.baseUrl?.replace(/\/$/, '') ??
      'https://generativelanguage.googleapis.com/v1beta';
    const url = `${base}/models/${this.config.model}:generateContent?key=${encodeURIComponent(this.config.apiKey)}`;

    const prompt = [
      'Write a short operational audit summary (max 120 words) for a completed field ronda.',
      'Be factual. Mention photo evidence count, failed checks, open findings, and one recommended next action.',
      'Do not invent facts.',
      '',
      JSON.stringify({
        template: ronda.templateName,
        site: ronda.siteName ?? null,
        location: ronda.location,
        photoCount: ronda.photos.length,
        answers: ronda.answers.map((a) => ({
          label: a.label,
          type: a.type,
          textValue: a.textValue ?? null,
          boolValue: a.boolValue ?? null,
        })),
        findings: ronda.findings.map((f) => ({
          title: f.title,
          severity: f.severity,
          status: f.status,
          notes: f.notes,
        })),
      }),
    ].join('\n');

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 400 },
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Gemini request failed (${response.status}): ${body}`);
    }

    const json = (await response.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = json.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? '')
      .join('')
      .trim();
    if (!text) {
      throw new Error('Gemini returned an empty summary');
    }
    return { text, source: 'llm' };
  }
}
