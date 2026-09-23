import type { Ronda } from '../../domain/entities/Ronda.js';
import type {
  GeneratedSummary,
  SummaryGenerator,
} from '../../domain/ports/SummaryGenerator.js';
import {
  AUDIT_JSON_SCHEMA,
  AUDIT_SYSTEM_PROMPT,
  formatStructuredSummary,
  parseStructuredSummary,
} from './auditSummary.js';

export interface GeminiSummaryConfig {
  apiKey: string;
  model: string;
  baseUrl?: string;
}

function rondaPayload(ronda: Ronda) {
  return {
    plantilla: ronda.templateName,
    sitio: ronda.siteName ?? null,
    ubicacion: ronda.location,
    fotos: ronda.photos.length,
    respuestas: ronda.answers.map((a) => ({
      etiqueta: a.label,
      tipo: a.type,
      texto: a.textValue ?? null,
      pasa: a.boolValue ?? null,
    })),
    hallazgos: ronda.findings.map((f) => ({
      titulo: f.title,
      gravedad: f.severity,
      estado: f.status,
      notas: f.notes,
    })),
  };
}

export class GeminiSummaryGenerator implements SummaryGenerator {
  constructor(private readonly config: GeminiSummaryConfig) {}

  async generate(ronda: Ronda): Promise<GeneratedSummary> {
    const base =
      this.config.baseUrl?.replace(/\/$/, '') ??
      'https://generativelanguage.googleapis.com/v1beta';
    const url = `${base}/models/${this.config.model}:generateContent?key=${encodeURIComponent(this.config.apiKey)}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: AUDIT_SYSTEM_PROMPT }],
          },
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: [
                    'Resume esta ronda de auditoría. Devolvé solo el JSON pedido.',
                    JSON.stringify(rondaPayload(ronda)),
                  ].join('\n'),
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 500,
            responseMimeType: 'application/json',
            responseSchema: AUDIT_JSON_SCHEMA,
          },
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Gemini request failed (${response.status}): ${body.slice(0, 240)}`);
      }

      const json = (await response.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      const raw = json.candidates?.[0]?.content?.parts
        ?.map((part) => part.text ?? '')
        .join('')
        .trim();
      if (!raw) {
        throw new Error('Gemini returned an empty summary');
      }
      const structured = parseStructuredSummary(raw);
      return { text: formatStructuredSummary(structured), source: 'llm' };
    } finally {
      clearTimeout(timeout);
    }
  }
}
