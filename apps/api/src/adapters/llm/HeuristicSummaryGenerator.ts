import type { Ronda } from '../../domain/entities/Ronda.js';
import type {
  GeneratedSummary,
  SummaryGenerator,
} from '../../domain/ports/SummaryGenerator.js';
import {
  connectionFallbackSummary,
  formatStructuredSummary,
  type StructuredAuditSummary,
} from './auditSummary.js';

export class HeuristicSummaryGenerator implements SummaryGenerator {
  async generate(ronda: Ronda): Promise<GeneratedSummary> {
    return { text: formatStructuredSummary(fromRonda(ronda)), source: 'heuristic' };
  }
}

export class ConnectionFallbackSummaryGenerator implements SummaryGenerator {
  async generate(): Promise<GeneratedSummary> {
    return {
      text: formatStructuredSummary(connectionFallbackSummary()),
      source: 'heuristic',
    };
  }
}

function fromRonda(ronda: Ronda): StructuredAuditSummary {
  const failed = ronda.answers.filter((a) => a.type === 'bool' && a.boolValue === false);
  const open = ronda.findings.filter((f) => f.status === 'open');
  const high = open.filter((f) => f.severity === 'high').length;
  const place = ronda.siteName?.trim() || ronda.location.trim() || 'sitio no especificado';

  let nivel: StructuredAuditSummary['nivel_de_riesgo'] = 'Bajo';
  if (high > 0 || failed.length >= 3) nivel = 'Alto';
  else if (open.length > 0 || failed.length > 0) nivel = 'Medio';

  const acciones: string[] = [];
  if (open.length) acciones.push(`Cerrar ${open.length} hallazgo(s) abierto(s)`);
  if (failed.length) acciones.push(`Revisar ${failed.length} check(s) que no pasaron`);
  if (ronda.photos.length < 2) acciones.push('Completar evidencia fotográfica mínima');
  if (!acciones.length) acciones.push('Archivar la ronda; no se detectaron desvíos');

  return {
    resumen_ejecutivo: `Ronda "${ronda.templateName}" en ${place}. ${ronda.photos.length} foto(s), ${failed.length} check(s) fallidos y ${open.length} hallazgo(s) abierto(s).`,
    nivel_de_riesgo: nivel,
    acciones_recomendadas: acciones,
  };
}
