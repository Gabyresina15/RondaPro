import type { Ronda } from '../../domain/entities/Ronda.js';
import type {
  GeneratedSummary,
  SummaryGenerator,
} from '../../domain/ports/SummaryGenerator.js';
import {
  AUDIT_SYSTEM_PROMPT,
  formatStructuredSummary,
  parseStructuredSummary,
} from './auditSummary.js';

export interface GeminiSummaryConfig {
  apiKey: string;
  model: string;
  baseUrl?: string;
}

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    resumen_ejecutivo: { type: 'STRING' },
    nivel_de_riesgo: {
      type: 'STRING',
      enum: ['Bajo', 'Medio', 'Alto', 'Desconocido'],
    },
    acciones_recomendadas: {
      type: 'ARRAY',
      items: { type: 'STRING' },
    },
  },
  required: ['resumen_ejecutivo', 'nivel_de_riesgo', 'acciones_recomendadas'],
};

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
    const models = uniqueModels(this.config.model);
    let lastError = 'Gemini request failed';

    for (const model of models) {
      for (const withSchema of [true, false]) {
        try {
          const raw = await this.callModel(model, ronda, withSchema);
          const structured = parseStructuredSummary(raw);
          return { text: formatStructuredSummary(structured), source: 'llm' };
        } catch (err) {
          lastError = err instanceof Error ? err.message : String(err);
        }
      }
    }

    throw new Error(lastError);
  }

  private async callModel(
    model: string,
    ronda: Ronda,
    withSchema: boolean,
  ): Promise<string> {
    const base =
      this.config.baseUrl?.replace(/\/$/, '') ??
      'https://generativelanguage.googleapis.com/v1beta';
    const url = `${base}/models/${model}:generateContent?key=${encodeURIComponent(this.config.apiKey)}`;

    const generationConfig: Record<string, unknown> = {
      temperature: 0.2,
      maxOutputTokens: 700,
      responseMimeType: 'application/json',
    };
    if (withSchema) {
      generationConfig.responseSchema = RESPONSE_SCHEMA;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45_000);

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
                    'Resume esta ronda. Devolve solo JSON con resumen_ejecutivo, nivel_de_riesgo y acciones_recomendadas.',
                    JSON.stringify(rondaPayload(ronda)),
                  ].join('\n'),
                },
              ],
            },
          ],
          generationConfig,
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Gemini ${model} ${response.status}: ${body.slice(0, 180)}`);
      }

      const json = (await response.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      const raw = json.candidates?.[0]?.content?.parts
        ?.map((part) => part.text ?? '')
        .join('')
        .trim();
      if (!raw) {
        throw new Error(`Gemini ${model} empty body`);
      }
      return raw;
    } finally {
      clearTimeout(timeout);
    }
  }
}

function uniqueModels(preferred: string): string[] {
  const list = [
    preferred,
    'gemini-2.0-flash',
    'gemini-2.5-flash',
    'gemini-flash-latest',
  ];
  return [...new Set(list.filter(Boolean))];
}
