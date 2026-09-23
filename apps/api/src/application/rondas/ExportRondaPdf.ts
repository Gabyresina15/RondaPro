import type { Ronda } from '../../domain/entities/Ronda.js';
import type { RondaRepository } from '../../domain/ports/RondaRepository.js';
import { RondaNotFoundError } from './GetRonda.js';

function foldAscii(text: string): string {
  return text
    .replace(/[\u00e1\u00e0\u00e4\u00e2]/g, 'a')
    .replace(/[\u00e9\u00e8\u00eb\u00ea]/g, 'e')
    .replace(/[\u00ed\u00ec\u00ef\u00ee]/g, 'i')
    .replace(/[\u00f3\u00f2\u00f6\u00f4]/g, 'o')
    .replace(/[\u00fa\u00f9\u00fc\u00fb]/g, 'u')
    .replace(/[\u00c1\u00c0\u00c4\u00c2]/g, 'A')
    .replace(/[\u00c9\u00c8\u00cb\u00ca]/g, 'E')
    .replace(/[\u00cd\u00cc\u00cf\u00ce]/g, 'I')
    .replace(/[\u00d3\u00d2\u00d6\u00d4]/g, 'O')
    .replace(/[\u00da\u00d9\u00dc\u00db]/g, 'U')
    .replace(/\u00f1/g, 'n')
    .replace(/\u00d1/g, 'N')
    .replace(/[\u2014\u2013]/g, '-')
    .replace(/\u00b7/g, '-')
    .replace(/[\u201c\u201d"]/g, "'");
}

function escapePdf(text: string): string {
  return foldAscii(text)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function wrap(text: string, width: number): string[] {
  const rawLines = text.split(/\n/);
  const out: string[] = [];
  for (const raw of rawLines) {
    const words = raw.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      out.push('');
      continue;
    }
    let current = '';
    for (const word of words) {
      const next = current ? `${current} ${word}` : word;
      if (next.length > width) {
        if (current) out.push(current);
        current = word;
      } else {
        current = next;
      }
    }
    if (current) out.push(current);
  }
  return out.length ? out : [''];
}

function formatDate(value?: Date): string {
  if (!value) return '-';
  return value.toISOString().slice(0, 16).replace('T', ' ') + ' UTC';
}

function buildLines(ronda: Ronda): string[] {
  const status = ronda.status === 'completed' ? 'Completada' : 'En curso';
  const source =
    ronda.summarySource === 'llm'
      ? 'Gemini'
      : ronda.summarySource
        ? 'Resumen automatico (IA no disponible)'
        : '-';

  const lines: string[] = [
    'RONDAPRO',
    'Informe de inspeccion de campo',
    '----------------------------------------------',
    `Plantilla: ${ronda.templateName}`,
    `Sitio: ${ronda.siteName || ronda.location || '-'}`,
    `Estado: ${status}`,
    `Creada: ${formatDate(ronda.createdAt)}`,
    `Cerrada: ${formatDate(ronda.completedAt)}`,
    `Fotos adjuntas: ${ronda.photos.length}`,
    `Fuente del resumen: ${source}`,
    '',
    '1. RESUMEN',
    '----------------------------------------------',
    ronda.summary?.trim() || 'Sin resumen generado.',
    '',
    '2. HALLAZGOS',
    '----------------------------------------------',
  ];

  if (ronda.findings.length === 0) {
    lines.push('No se registraron hallazgos.');
  } else {
    for (const finding of ronda.findings) {
      const estado = finding.status === 'open' ? 'abierto' : 'cerrado';
      lines.push(`- ${finding.title} [${finding.severity} / ${estado}]`);
      if (finding.notes) lines.push(`  Nota: ${finding.notes}`);
      if (finding.assignee) lines.push(`  Asignado: ${finding.assignee}`);
      if (finding.resolutionNote) lines.push(`  Resolucion: ${finding.resolutionNote}`);
    }
  }

  lines.push('', '3. CHECKLIST', '----------------------------------------------');
  if (ronda.answers.length === 0) {
    lines.push('Sin respuestas.');
  } else {
    for (const answer of ronda.answers) {
      let value = '-';
      if (answer.type === 'bool') {
        value =
          answer.boolValue === true
            ? 'Pasa'
            : answer.boolValue === false
              ? 'No pasa'
              : 'Sin responder';
      } else if (answer.type === 'text') {
        value = answer.textValue?.trim() || 'Sin notas';
      } else {
        value = 'Evidencia fotografica';
      }
      lines.push(`- ${answer.label}: ${value}`);
    }
  }

  if (ronda.photos.length > 0) {
    lines.push('', '4. EVIDENCIA', '----------------------------------------------');
    ronda.photos.forEach((photo, index) => {
      lines.push(`${index + 1}. ${photo.filename}`);
    });
  }

  return lines.flatMap((line) => wrap(line, 88));
}

function buildPdf(ronda: Ronda): Buffer {
  const all = buildLines(ronda);
  const perPage = 48;
  const pages: string[][] = [];
  for (let i = 0; i < all.length; i += perPage) {
    pages.push(all.slice(i, i + perPage));
  }
  if (pages.length === 0) pages.push(['(vacio)']);

  const objects: string[] = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '',
  ];
  const pageIds: number[] = [];
  const contentIds: number[] = [];

  for (const pageLines of pages) {
    const chunks = ['BT', '/F1 11 Tf', '48 760 Td', '14 TL'];
    for (const line of pageLines) {
      chunks.push(`(${escapePdf(line)}) Tj`, 'T*');
    }
    chunks.push('ET');
    const stream = chunks.join('\n');
    objects.push(`<< /Length ${Buffer.byteLength(stream, 'latin1')} >>\nstream\n${stream}\nendstream`);
    contentIds.push(objects.length);
    objects.push('PAGE_PLACEHOLDER');
    pageIds.push(objects.length);
  }

  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const fontId = objects.length;
  objects[1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pages.length} >>`;
  for (let i = 0; i < pages.length; i += 1) {
    objects[pageIds[i] - 1] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ${contentIds[i]} 0 R /Resources << /Font << /F1 ${fontId} 0 R >> >> >>`;
  }

  const out: Buffer[] = [Buffer.from('%PDF-1.4\n')];
  const offsets = [0];
  for (let i = 0; i < objects.length; i += 1) {
    offsets.push(out.reduce((sum, c) => sum + c.length, 0));
    out.push(Buffer.from(`${i + 1} 0 obj\n${objects[i]}\nendobj\n`, 'latin1'));
  }
  const xrefStart = out.reduce((sum, c) => sum + c.length, 0);
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i += 1) {
    xref += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  out.push(Buffer.from(xref, 'latin1'));
  out.push(
    Buffer.from(
      `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`,
      'latin1',
    ),
  );
  return Buffer.concat(out);
}

export class ExportRondaPdf {
  constructor(private readonly rondas: RondaRepository) {}

  async execute(
    rondaId: string,
    ownerId: string,
  ): Promise<{ bytes: Buffer; filename: string }> {
    const ronda = await this.rondas.findById(rondaId);
    if (!ronda || (ronda.ownerId !== ownerId && ronda.assigneeId !== ownerId)) {
      throw new RondaNotFoundError(rondaId);
    }
    const safeName = foldAscii(ronda.templateName)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40);
    return {
      bytes: buildPdf(ronda),
      filename: `rondapro-${safeName || 'ronda'}-${ronda.id.slice(-6)}.pdf`,
    };
  }
}
