import type { Ronda } from '../../domain/entities/Ronda.js';
import type { RondaRepository } from '../../domain/ports/RondaRepository.js';
import { RondaNotFoundError } from './GetRonda.js';

function escapePdf(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function wrap(text: string, width: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > width) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [''];
}

function buildPdf(ronda: Ronda): Buffer {
  const lines: string[] = [
    'RondaPro - Ronda report',
    '',
    `Template: ${ronda.templateName}`,
    `Status: ${ronda.status}`,
    `Site: ${ronda.siteName ?? '-'}`,
    `Location: ${ronda.location || '-'}`,
    `Created: ${ronda.createdAt.toISOString()}`,
    `Completed: ${ronda.completedAt?.toISOString() ?? '-'}`,
    `Photos: ${ronda.photos.length}`,
    '',
    'Summary',
    ronda.summary ?? 'No summary',
    ronda.summarySource ? `(source: ${ronda.summarySource})` : '',
    '',
    'Findings',
  ];

  if (ronda.findings.length === 0) {
    lines.push('None');
  } else {
    for (const finding of ronda.findings) {
      const status = finding.status === 'open' ? 'open' : 'closed';
      lines.push(`- ${finding.title} [${finding.severity} / ${status}]`);
      if (finding.notes) lines.push(`  ${finding.notes}`);
      if (finding.assignee) lines.push(`  Assignee: ${finding.assignee}`);
      if (finding.resolutionNote) {
        lines.push(`  Resolution: ${finding.resolutionNote}`);
      }
    }
  }

  lines.push('', 'Answers');
  if (ronda.answers.length === 0) {
    lines.push('None');
  } else {
    for (const answer of ronda.answers) {
      let value = '-';
      if (answer.type === 'bool') {
        value =
          answer.boolValue === true
            ? 'Pass'
            : answer.boolValue === false
              ? 'Fail'
              : 'Not answered';
      } else if (answer.type === 'text') {
        value = answer.textValue || 'No notes';
      } else {
        value = 'Photo item';
      }
      lines.push(`- ${answer.label}: ${value}`);
    }
  }

  if (ronda.photos.length > 0) {
    lines.push('', 'Photo files');
    for (const photo of ronda.photos) {
      lines.push(`- ${photo.filename} (${photo.mimeType})`);
    }
  }

  const wrapped = lines.flatMap((line) => wrap(line, 95));
  const contentChunks: string[] = ['BT', '/F1 11 Tf', '50 780 Td', '14 TL'];
  for (const line of wrapped) {
    contentChunks.push(`(${escapePdf(line)}) Tj`, 'T*');
  }
  contentChunks.push('ET');
  const stream = contentChunks.join('\n');

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];

  const chunks: Buffer[] = [Buffer.from('%PDF-1.4\n')];
  const offsets = [0];
  for (let i = 0; i < objects.length; i += 1) {
    offsets.push(chunks.reduce((sum, c) => sum + c.length, 0));
    chunks.push(Buffer.from(`${i + 1} 0 obj\n${objects[i]}\nendobj\n`));
  }
  const xrefStart = chunks.reduce((sum, c) => sum + c.length, 0);
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i += 1) {
    xref += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  chunks.push(Buffer.from(xref));
  chunks.push(
    Buffer.from(
      `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`,
    ),
  );
  return Buffer.concat(chunks);
}

export class ExportRondaPdf {
  constructor(private readonly rondas: RondaRepository) {}

  async execute(
    rondaId: string,
    ownerId: string,
  ): Promise<{ bytes: Buffer; filename: string }> {
    const ronda = await this.rondas.findById(rondaId);
    if (!ronda || ronda.ownerId !== ownerId) {
      throw new RondaNotFoundError(rondaId);
    }
    const safeName = ronda.templateName
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
