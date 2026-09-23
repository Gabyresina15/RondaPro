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
    return {
      text: formatStructuredSummary(fromRonda(ronda)),
      source: 'heuristic',
      model: 'heuristic',
      latencyMs: 0,
    };
  }
}

export class ConnectionFallbackSummaryGenerator implements SummaryGenerator {
  async generate(ronda: Ronda): Promise<GeneratedSummary> {
    return {
      text: formatStructuredSummary(fromRonda(ronda)),
      source: 'heuristic',
      model: 'heuristic',
      latencyMs: 0,
    };
  }
}

export function fromRonda(ronda: Ronda): StructuredAuditSummary {
  const failed = ronda.answers.filter((a) => a.type === 'bool' && a.boolValue === false);
  const passed = ronda.answers.filter((a) => a.type === 'bool' && a.boolValue === true);
  const open = ronda.findings.filter((f) => f.status === 'open');
  const high = open.filter((f) => f.severity === 'high').length;
  const notes = ronda.answers
    .filter((a) => a.type === 'text' && (a.textValue ?? '').trim())
    .map((a) => a.label.toLowerCase());
  const place = ronda.siteName?.trim() || ronda.location.trim() || 'el sitio inspeccionado';

  let nivel: StructuredAuditSummary['nivel_de_riesgo'] = 'Bajo';
  const safetyFail = failed.some((a) => /extintor|salida|emergencia|seguridad/i.test(a.label));
  if (high > 0 || safetyFail || failed.length >= 3) nivel = 'Alto';
  else if (open.length > 0 || failed.length > 0) nivel = 'Medio';

  const failedLabels = failed.map((a) => a.label).join(', ');
  const resumen = [
    `La ronda de campo en ${place} (${ronda.templateName}) relevo ${ronda.photos.length} evidencia(s) fotografica(s).`,
    passed.length || failed.length
      ? `Checklist: ${passed.length} item(s) conformes y ${failed.length} no conformes${failedLabels ? ` (${failedLabels})` : ''}.`
      : 'No se registraron checks booleanos.',
    open.length ? `Quedan ${open.length} hallazgo(s) abierto(s).` : 'No hay hallazgos abiertos.',
    notes.length ? `Se consignaron notas en: ${notes.join(', ')}.` : '',
  ].filter(Boolean).join(' ');

  const acciones: string[] = [];
  if (failed.length) acciones.push(`Revisar y regularizar: ${failedLabels || 'items no conformes'}`);
  if (open.length) acciones.push('Cerrar los hallazgos abiertos con evidencia de resolucion');
  if (!acciones.length) acciones.push('Mantener el estandar observado en la proxima visita');

  return {
    resumen_ejecutivo: resumen,
    nivel_de_riesgo: nivel,
    acciones_recomendadas: acciones,
  };
}
