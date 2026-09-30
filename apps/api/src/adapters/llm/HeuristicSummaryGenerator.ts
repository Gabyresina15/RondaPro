import type { Ronda } from '../../domain/entities/Ronda.js';
import type {
  GeneratedSummary,
  SummaryGenerator,
} from '../../domain/ports/SummaryGenerator.js';
import {
  formatStructuredSummary,
  type StructuredAuditSummary,
} from './auditSummary.js';

export class HeuristicSummaryGenerator implements SummaryGenerator {
  async generate(ronda: Ronda): Promise<GeneratedSummary> {
    const structured = fromRonda(ronda);
    return {
      text: formatStructuredSummary(structured),
      source: 'heuristic',
      latencyMs: 0,
      risk: structured.nivel_de_riesgo,
      keyFindings: structured.hallazgos_clave,
      actions: structured.acciones_recomendadas,
    };
  }
}

export class ConnectionFallbackSummaryGenerator implements SummaryGenerator {
  async generate(ronda: Ronda): Promise<GeneratedSummary> {
    const structured = fromRonda(ronda);
    return {
      text: formatStructuredSummary(structured),
      source: 'heuristic',
      latencyMs: 0,
      risk: structured.nivel_de_riesgo,
      keyFindings: structured.hallazgos_clave,
      actions: structured.acciones_recomendadas,
    };
  }
}

function severityEs(raw: string): string {
  switch (raw) {
    case 'high':
      return 'Alta';
    case 'medium':
      return 'Media';
    case 'low':
      return 'Baja';
    default:
      return raw;
  }
}

function plural(n: number, one: string, many: string): string {
  return n === 1 ? one : many;
}

export function fromRonda(ronda: Ronda): StructuredAuditSummary {
  const failed = ronda.answers.filter((a) => a.type === 'bool' && a.boolValue === false && !a.naValue);
  const passed = ronda.answers.filter((a) => a.type === 'bool' && a.boolValue === true && !a.naValue);
  const open = ronda.findings.filter((f) => f.status === 'open');
  const high = open.filter((f) => f.severity === 'high').length;
  const notes = ronda.answers
    .filter((a) => a.type === 'text' && (a.textValue ?? '').trim())
    .map((a) => a.label);
  const place = ronda.siteName?.trim() || ronda.location.trim() || 'el sitio inspeccionado';

  let nivel: StructuredAuditSummary['nivel_de_riesgo'] = 'Bajo';
  const safetyFail = failed.some((a) => /extintor|salida|emergencia|seguridad/i.test(a.label));
  if (high > 0 || safetyFail || failed.length >= 3) nivel = 'Alto';
  else if (open.length > 0 || failed.length > 0) nivel = 'Medio';

  const failedLabels = failed.map((a) => a.label).join(', ');
  const photoCount = ronda.photos.length;
  const resumen = [
    `La ronda de campo en ${place} (${ronda.templateName}) relevó ${photoCount} ${plural(photoCount, 'evidencia fotográfica', 'evidencias fotográficas')}.`,
    passed.length || failed.length
      ? `Checklist: ${passed.length} ${plural(passed.length, 'ítem conforme', 'ítems conformes')} y ${failed.length} ${plural(failed.length, 'no conforme', 'no conformes')}${failedLabels ? ` (${failedLabels})` : ''}.`
      : 'No se registraron checks de pasa/falla.',
    open.length
      ? `Quedan ${open.length} ${plural(open.length, 'hallazgo abierto', 'hallazgos abiertos')}.`
      : 'No hay hallazgos abiertos.',
    notes.length ? `Se consignaron notas en: ${notes.join(', ')}.` : '',
  ]
    .filter(Boolean)
    .join(' ');

  const acciones: string[] = [];
  if (failed.length) acciones.push(`Revisar y regularizar: ${failedLabels || 'ítems no conformes'}`);
  if (open.length) acciones.push('Cerrar los hallazgos abiertos con evidencia de resolución');
  if (high > 0) acciones.push('Priorizar los hallazgos de gravedad alta en las próximas 24 h');
  if (!acciones.length) acciones.push('Mantener el estándar observado en la próxima visita');

  const seen = new Set<string>();
  const hallazgos: string[] = [];
  const pushUnique = (item: string) => {
    const key = item.toLowerCase().replace(/\s+/g, ' ').trim();
    if (seen.has(key)) return;
    seen.add(key);
    hallazgos.push(item);
  };
  for (const f of open.slice(0, 4)) {
    pushUnique(`${f.title} (${severityEs(f.severity)})`);
  }
  for (const a of failed.slice(0, 3)) {
    const already = open.some((f) => f.itemIndex === a.itemIndex || f.title.includes(a.label));
    if (already) continue;
    pushUnique(`Check no conforme: ${a.label}`);
  }

  return {
    resumen_ejecutivo: resumen,
    nivel_de_riesgo: nivel,
    hallazgos_clave: hallazgos.slice(0, 4),
    acciones_recomendadas: acciones,
  };
}
