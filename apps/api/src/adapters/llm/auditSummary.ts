export type RiskLevel = 'Bajo' | 'Medio' | 'Alto' | 'Desconocido';

export interface StructuredAuditSummary {
  resumen_ejecutivo: string;
  nivel_de_riesgo: RiskLevel;
  hallazgos_clave: string[];
  acciones_recomendadas: string[];
}

export const AUDIT_SYSTEM_PROMPT = [
  'Eres un auditor senior experto en retail y facilities.',
  'Resumí hallazgos con tono corporativo, neutral y factual.',
  'No inventes datos que no estén en el JSON de entrada.',
  'nivel_de_riesgo: Alto si hay extintor/salida/seguridad en falla o hallazgo high;',
  'Medio si hay checks fallidos o hallazgos abiertos; Bajo si todo pasa.',
  'Usa Desconocido solo si no hay datos suficientes.',
  'hallazgos_clave: 1 a 4 frases cortas con lo que el supervisor debe ver primero.',
  'acciones_recomendadas: 2 a 4 acciones concretas y ordenadas.',
  'Concordancia: con un solo hallazgo escribí "Queda 1 hallazgo abierto", nunca "Quedan 1 hallazgos".',
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
    hallazgos_clave: { type: 'array', items: { type: 'string' } },
    acciones_recomendadas: { type: 'array', items: { type: 'string' } },
  },
  required: [
    'resumen_ejecutivo',
    'nivel_de_riesgo',
    'hallazgos_clave',
    'acciones_recomendadas',
  ],
} as const;

export function connectionFallbackSummary(): StructuredAuditSummary {
  return {
    resumen_ejecutivo:
      'Revisión manual requerida por fallo de conexión con el modelo.',
    nivel_de_riesgo: 'Desconocido',
    hallazgos_clave: ['No se pudo generar el resumen automático'],
    acciones_recomendadas: [
      'Reintentar el resumen cuando el servicio de IA esté disponible',
      'Revisar hallazgos abiertos de forma manual',
    ],
  };
}

export function agreeFindings(text: string): string {
  return text
    .replace(/Quedan\s+1\s+hallazgos?\s+abiertos?/gi, 'Queda 1 hallazgo abierto')
    .replace(/Quedan\s+1\b/g, 'Queda 1')
    .replace(/\b1\s+hallazgos\b/g, '1 hallazgo');
}

export function formatStructuredSummary(data: StructuredAuditSummary): string {
  const findings = data.hallazgos_clave.length
    ? data.hallazgos_clave.map((item) => `- ${item}`).join('\n')
    : '- Sin hallazgos clave.';
  const actions = data.acciones_recomendadas.length
    ? data.acciones_recomendadas.map((item, i) => `${i + 1}. ${item}`).join('\n')
    : '1. Sin acciones adicionales.';
  const body = [
    data.resumen_ejecutivo.trim(),
    `Nivel de riesgo: ${data.nivel_de_riesgo}`,
    'Hallazgos clave:',
    findings,
    'Acciones recomendadas:',
    actions,
  ].join('\n\n');
  return agreeFindings(body);
}

export function parseStructuredSummary(raw: string): StructuredAuditSummary {
  const cleaned = raw.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
  const parsed = JSON.parse(cleaned) as Partial<StructuredAuditSummary> & {
    riesgo?: string;
    acciones?: unknown;
  };
  const risk = parsed.nivel_de_riesgo ?? parsed.riesgo;
  const valid: RiskLevel[] = ['Bajo', 'Medio', 'Alto', 'Desconocido'];
  if (!parsed.resumen_ejecutivo || typeof parsed.resumen_ejecutivo !== 'string') {
    throw new Error('Invalid structured summary: missing resumen_ejecutivo');
  }
  const actions = Array.isArray(parsed.acciones_recomendadas)
    ? parsed.acciones_recomendadas
    : Array.isArray(parsed.acciones)
      ? parsed.acciones
      : [];
  const findings = Array.isArray(parsed.hallazgos_clave)
    ? parsed.hallazgos_clave
    : [];
  return {
    resumen_ejecutivo: agreeFindings(parsed.resumen_ejecutivo.trim()),
    nivel_de_riesgo: valid.includes(risk as RiskLevel)
      ? (risk as RiskLevel)
      : 'Desconocido',
    hallazgos_clave: findings.map(String).map((s) => s.trim()).filter(Boolean),
    acciones_recomendadas: actions.map(String).map((s) => s.trim()).filter(Boolean),
  };
}
