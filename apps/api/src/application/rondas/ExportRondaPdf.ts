import type { Ronda } from '../../domain/entities/Ronda.js';
import type { PhotoStorage } from '../../domain/ports/PhotoStorage.js';
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
    .replace(/\u00d1/g, 'N');
}

function escapePdf(text: string): string {
  return foldAscii(text).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function wrap(text: string, width: number): string[] {
  const out: string[] = [];
  for (const raw of text.split(/\n/)) {
    const words = raw.split(/\s+/).filter(Boolean);
    if (!words.length) {
      out.push('');
      continue;
    }
    let current = '';
    for (const word of words) {
      const next = current ? `${current} ${word}` : word;
      if (next.length > width) {
        if (current) out.push(current);
        current = word;
      } else current = next;
    }
    if (current) out.push(current);
  }
  return out.length ? out : [''];
}

function jpegSize(buf: Buffer): { width: number; height: number } | null {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let i = 2;
  while (i < buf.length - 8) {
    if (buf[i] !== 0xff) {
      i += 1;
      continue;
    }
    const marker = buf[i + 1];
    if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
      return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
    }
    if (marker === 0xd8 || marker === 0xd9 || marker === 0x01) {
      i += 2;
      continue;
    }
    i += 2 + buf.readUInt16BE(i + 2);
  }
  return null;
}

function textStream(lines: string[]): string {
  const chunks = ['BT', '/F1 11 Tf', '48 760 Td', '14 TL'];
  for (const line of lines) {
    chunks.push(`(${escapePdf(line)}) Tj`, 'T*');
  }
  chunks.push('ET');
  return chunks.join('\n');
}

function headerLines(ronda: Ronda): string[] {
  const source =
    ronda.summarySource === 'llm'
      ? `Gemini${ronda.summaryModel ? ` (${ronda.summaryModel})` : ''}${ronda.summaryLatencyMs != null ? ` ${ronda.summaryLatencyMs}ms` : ''}`
      : ronda.summarySource
        ? 'Resumen automatico'
        : '-';
  const lines = [
    'RONDAPRO',
    'Informe de inspeccion de campo',
    '----------------------------------------------',
    `Plantilla: ${ronda.templateName}`,
    `Sitio: ${ronda.siteName || ronda.location || '-'}`,
    `Estado: ${ronda.status === 'completed' ? 'Completada' : 'En curso'}`,
    `Cerrada: ${ronda.completedAt?.toISOString().slice(0, 16).replace('T', ' ') ?? '-'} UTC`,
    `Editada: ${ronda.lastEditedAt?.toISOString().slice(0, 16).replace('T', ' ') ?? '-'} UTC`,
    `Fuente: ${source}`,
    '',
    '1. RESUMEN',
    ronda.summary?.trim() || 'Sin resumen.',
    '',
    '2. HALLAZGOS',
  ];
  if (!ronda.findings.length) lines.push('No se registraron hallazgos.');
  else {
    for (const f of ronda.findings) {
      lines.push(`- ${f.title} [${f.severity} / ${f.status === 'open' ? 'abierto' : 'cerrado'}]`);
    }
  }
  lines.push('', '3. CHECKLIST');
  for (const a of ronda.answers) {
    let value = '-';
    if (a.type === 'bool') value = a.boolValue === true ? 'Pasa' : a.boolValue === false ? 'No pasa' : 'Sin responder';
    else if (a.type === 'text') value = a.textValue?.trim() || 'Sin notas';
    else value = 'Evidencia fotografica';
    lines.push(`- ${a.label}: ${value}`);
  }
  return lines.flatMap((l) => wrap(l, 88));
}

export class ExportRondaPdf {
  constructor(
    private readonly rondas: RondaRepository,
    private readonly photos: PhotoStorage,
  ) {}

  async execute(rondaId: string, ownerId: string): Promise<{ bytes: Buffer; filename: string }> {
    const ronda = await this.rondas.findById(rondaId);
    if (!ronda || (ronda.ownerId !== ownerId && ronda.assigneeId !== ownerId)) {
      throw new RondaNotFoundError(rondaId);
    }
    const labels = new Map(ronda.answers.map((a) => [a.itemIndex, a.label] as const));
    const images: { bytes: Buffer; width: number; height: number; caption: string }[] = [];
    for (const photo of ronda.photos) {
      try {
        const bytes = await this.photos.read(photo.relativePath);
        const size = jpegSize(bytes);
        if (!size) continue;
        const label = photo.itemIndex != null ? labels.get(photo.itemIndex) : undefined;
        images.push({
          bytes,
          width: size.width,
          height: size.height,
          caption: label ? `Evidencia: ${label}` : 'Evidencia general',
        });
      } catch {
        /* skip */
      }
    }
    return { bytes: this.build(ronda, headerLines(ronda), images), filename: `rondapro-${ronda.id.slice(-6)}.pdf` };
  }

  private build(
    ronda: Ronda,
    lines: string[],
    images: { bytes: Buffer; width: number; height: number; caption: string }[],
  ): Buffer {
    type Part = { text?: string; binary?: Buffer };
    const objs: Part[][] = [];
    const push = (parts: Part[]) => {
      objs.push(parts);
      return objs.length;
    };
    push([{ text: '<< /Type /Catalog /Pages 2 0 R >>' }]);
    push([{ text: 'PAGES' }]);
    const pages: { pageId: number; contentId: number; imageId: number | null }[] = [];
    const refs: number[] = [];
    for (let i = 0; i < lines.length; i += 46) {
      const stream = textStream(lines.slice(i, i + 46));
      const contentId = push([{ text: `<< /Length ${Buffer.byteLength(stream, 'latin1')} >>\nstream\n${stream}\nendstream` }]);
      const pageId = push([{ text: 'P' }]);
      refs.push(pageId);
      pages.push({ pageId, contentId, imageId: null });
    }
    for (const image of images) {
      const imageId = push([
        { text: `<< /Type /XObject /Subtype /Image /Width ${image.width} /Height ${image.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.bytes.length} >>\nstream\n` },
        { binary: image.bytes },
        { text: '\nendstream' },
      ]);
      const scale = Math.min(500 / image.width, 600 / image.height, 1);
      const w = Math.round(image.width * scale);
      const h = Math.round(image.height * scale);
      const x = Math.round((612 - w) / 2);
      const stream = ['BT', '/F1 12 Tf', '48 760 Td', `(${escapePdf(image.caption)}) Tj`, 'ET', 'q', `${w} 0 0 ${h} ${x} 70 cm`, `/Im${imageId} Do`, 'Q'].join('\n');
      const contentId = push([{ text: `<< /Length ${Buffer.byteLength(stream, 'latin1')} >>\nstream\n${stream}\nendstream` }]);
      const pageId = push([{ text: 'P' }]);
      refs.push(pageId);
      pages.push({ pageId, contentId, imageId });
    }
    const fontId = push([{ text: '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>' }]);
    objs[1] = [{ text: `<< /Type /Pages /Kids [${refs.map((id) => `${id} 0 R`).join(' ')}] /Count ${refs.length} >>` }];
    for (const page of pages) {
      const xobj = page.imageId == null ? '' : ` /XObject << /Im${page.imageId} ${page.imageId} 0 R >>`;
      objs[page.pageId - 1] = [{ text: `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ${page.contentId} 0 R /Resources << /Font << /F1 ${fontId} 0 R >>${xobj} >> >>` }];
    }
    const chunks: Buffer[] = [Buffer.from('%PDF-1.4\n', 'latin1')];
    const offsets = [0];
    for (let i = 0; i < objs.length; i += 1) {
      offsets.push(chunks.reduce((s, c) => s + c.length, 0));
      const parts = [Buffer.from(`${i + 1} 0 obj\n`, 'latin1')];
      for (const part of objs[i]) {
        if (part.text) parts.push(Buffer.from(part.text, 'latin1'));
        if (part.binary) parts.push(part.binary);
      }
      parts.push(Buffer.from('\nendobj\n', 'latin1'));
      chunks.push(Buffer.concat(parts));
    }
    const xrefStart = chunks.reduce((s, c) => s + c.length, 0);
    let xref = `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
    for (let i = 1; i <= objs.length; i += 1) xref += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
    chunks.push(Buffer.from(xref, 'latin1'));
    chunks.push(Buffer.from(`trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`, 'latin1'));
    return Buffer.concat(chunks);
  }
}
