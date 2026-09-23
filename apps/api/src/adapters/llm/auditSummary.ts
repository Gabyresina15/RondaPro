export type RiskLevel = 'Bajo' | 'Medio' | 'Alto' | 'Desconocido';

export interface StructuredAuditSummary {
  resumen_ejecutivo: string;
  nivel_de_riesgo: RiskLevel;
  acciones_recomendadas: string[];
}

export const AUDIT_SYSTEM_PROMPT = [
  'Eres un auditor senior experto en retail y facilities.',
  'Resumí hallazgos con tono corporativo, neutral y factual.',
  'No inventes datos que no estén en el JSON de entrada.',
  'nivel_de_riesgo: Alto si hay extintor/salida/seguridad en falla o hallazgo high;',
  'Medio si hay checks fallidos o hallazgos abiertos; Bajo si todo pasa.',
  'Usa Desconocido solo si no hay datos suficientes.',
  'Responde únicamente con JSON válido, sin markdown.',
].join(' ');

export const AUDIT_JSON_SCHEMA = {
  type: 'object',
  properties: {
    resumen_ejecutivo: { type: 'string' },
    nivel_de_riesgo: {
      type: 'string',
      enum: ['Bajo', 'Medio', 'Alto', 'Desconocido'],
    },
    acciones_recomendadas: {
      type: 'array',
      items: { type: 'string' },
    },
  },
  required: ['resumen_ejecutivo', 'nivel_de_riesgo', 'acciones_recomendadas'],
} as const;

export function connectionFallbackSummary(): StructuredAuditSummary {
  return {
    resumen_ejecutivo:
      'Revisión manual requerida por fallo de conexión con el modelo.',
    nivel_de_riesgo: 'Desconocido',
    acciones_recomendadas: [
      'Reintentar el resumen cuando el servicio de IA esté disponible',
      'Revisar hallazgos abiertos de forma manual',
    ],
  };
}

export function formatStructuredSummary(data: StructuredAuditSummary): string {
  const actions = data.acciones_recomendadas.length
    ? data.acciones_recomendadas.map((item, i) => `${i + 1}. ${item}`).join('\n')
    : '1. Sin acciones adicionales.';
  return [
    data.resumen_ejecutivo.trim(),
    `Nivel de riesgo: ${data.nivel_de_riesgo}`,
    'Acciones recomendadas:',
    actions,
  ].join('\n\n');
}

export function parseStructuredSummary(raw: string): StructuredAuditSummary {
  const cleaned = raw.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
  const parsed = JSON.parse(cleaned) as Partial<StructuredAuditSummary>;
  const risk = parsed.nivel_de_riesgo;
  const valid: RiskLevel[] = ['Bajo', 'Medio', 'Alto', 'Desconocido'];
  if (!parsed.resumen_ejecutivo || typeof parsed.resumen_ejecutivo !== 'string') {
    throw new Error('Invalid structured summary: missing resumen_ejecutivo');
  }
  return {
    resumen_ejecutivo: parsed.resumen_ejecutivo.trim(),
    nivel_de_riesgo: valid.includes(risk as RiskLevel)
      ? (risk as RiskLevel)
      : 'Desconocido',
    acciones_recomendadas: Array.isArray(parsed.acciones_recomendadas)
      ? parsed.acciones_recomendadas.map(String).filter((s) => s.trim())
      : [],
  };
}
