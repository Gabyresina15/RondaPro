import { Buffer } from 'node:buffer';
import type { Ronda } from '../../domain/entities/Ronda.js';
import type { PhotoStorage } from '../../domain/ports/PhotoStorage.js';
import type { RondaRepository } from '../../domain/ports/RondaRepository.js';
import { RondaNotFoundError } from './GetRonda.js';

const WIN_ANSI: Record<string, string> = {
  '\u2014': '\x97',
  '\u2013': '\x96',
  '\u201C': '\x93',
  '\u201D': '\x94',
  '\u2018': '\x91',
  '\u2019': '\x92',
  '\u2026': '\x85',
  '\u20AC': '\x80',
  '\u2022': '\x95',
};

function escapePdf(text: string): string {
  return text
    .replace(/[\u2014\u2013\u201C\u201D\u2018\u2019\u2026\u20AC\u2022]/g, (c) => WIN_ANSI[c] ?? '?')
    .replace(/[^\x00-\xFF]/g, '?')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function formatAr(date?: Date): string {
  if (!date) return '-';
  const fmt = new Intl.DateTimeFormat('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return `${fmt.format(date)} ART`;
}

function executiveOnly(summary?: string): string {
  const text = (summary ?? '').trim();
  if (!text) return 'Sin resumen.';
  const cut = text.search(/\n\s*Nivel de riesgo:/i);
  return (cut > 0 ? text.slice(0, cut) : text).trim();
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
      ? `Gemini${ronda.summaryModel && ronda.summaryModel !== 'heuristic' ? ` (${ronda.summaryModel})` : ''}${ronda.summaryLatencyMs != null ? ` ${ronda.summaryLatencyMs}ms` : ''}`
      : ronda.summarySource
        ? 'Resumen automático'
        : '-';
  const lines = [
    'RONDAPRO',
    'Informe de inspección de campo',
    '----------------------------------------------',
    `Plantilla: ${ronda.templateName}`,
    `Sitio: ${ronda.siteName || ronda.location || '-'}`,
    `Estado: ${ronda.status === 'completed' ? 'Completada' : 'En curso'}`,
    `Cerrada: ${formatAr(ronda.completedAt)}`,
    `Editada: ${formatAr(ronda.lastEditedAt)}`,
    `Fuente: ${source}`,
    `Riesgo: ${ronda.summaryRisk ?? '-'}`,
    '',
    '1. RESUMEN',
    executiveOnly(ronda.summary),
  ];
  const findings = ronda.summaryKeyFindings ?? [];
  const actions = ronda.summaryActions ?? [];
  if (findings.length) {
    lines.push('', 'Hallazgos clave:');
    for (const item of findings) lines.push(`- ${item}`);
  }
  if (actions.length) {
    lines.push('', 'Acciones recomendadas:');
    actions.forEach((item, i) => lines.push(`${i + 1}. ${item}`));
  }
  lines.push('', '2. HALLAZGOS');
  if (!ronda.findings.length) lines.push('No se registraron hallazgos.');
  else {
    for (const f of ronda.findings) {
      const sev = f.severity === 'high' ? 'Alta' : f.severity === 'medium' ? 'Media' : f.severity === 'low' ? 'Baja' : f.severity;
      lines.push(`- ${f.title} [${sev} / ${f.status === 'open' ? 'abierto' : 'cerrado'}]`);
    }
  }
  return lines.flatMap((l) => wrap(l, 88));
}

function checklistLines(ronda: Ronda): string[] {
  const lines = ['3. CHECKLIST'];
  for (const a of ronda.answers) {
    let value = '-';
    if (a.type === 'bool') {
      value = a.naValue ? 'N/A' : a.boolValue === true ? 'Pasa' : a.boolValue === false ? 'No pasa' : 'Sin responder';
    } else if (a.type === 'text') value = a.textValue?.trim() || 'Sin notas';
    else value = 'Evidencia fotográfica';
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
    return {
      bytes: this.build(headerLines(ronda), checklistLines(ronda), images),
      filename: `rondapro-${ronda.id.slice(-6)}.pdf`,
    };
  }

  private build(
    lines: string[],
    checklist: string[],
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
    const firstImage = images[0];
    const restImages = firstImage ? images.slice(1) : images;
    const headerChunk = firstImage ? lines.slice(0, 22) : lines;
    const leftover = firstImage ? lines.slice(22) : [];

    if (firstImage) {
      const imageId = push([
        { text: `<< /Type /XObject /Subtype /Image /Width ${firstImage.width} /Height ${firstImage.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${firstImage.bytes.length} >>\nstream\n` },
        { binary: firstImage.bytes },
        { text: '\nendstream' },
      ]);
      const scale = Math.min(500 / firstImage.width, 320 / firstImage.height, 1);
      const w = Math.round(firstImage.width * scale);
      const h = Math.round(firstImage.height * scale);
      const x = Math.round((612 - w) / 2);
      const stream = [
        textStream(headerChunk),
        'BT',
        '/F1 11 Tf',
        '48 390 Td',
        `(${escapePdf(firstImage.caption)}) Tj`,
        'ET',
        'q',
        `${w} 0 0 ${h} ${x} 70 cm`,
        `/Im${imageId} Do`,
        'Q',
      ].join('\n');
      const contentId = push([{ text: `<< /Length ${Buffer.byteLength(stream, 'latin1')} >>\nstream\n${stream}\nendstream` }]);
      const pageId = push([{ text: 'P' }]);
      refs.push(pageId);
      pages.push({ pageId, contentId, imageId });
    }

    const leftoverLines = leftover.length ? leftover : firstImage ? [] : headerChunk;
    for (let i = 0; i < leftoverLines.length; i += 46) {
      const stream = textStream(leftoverLines.slice(i, i + 46));
      const contentId = push([{ text: `<< /Length ${Buffer.byteLength(stream, 'latin1')} >>\nstream\n${stream}\nendstream` }]);
      const pageId = push([{ text: 'P' }]);
      refs.push(pageId);
      pages.push({ pageId, contentId, imageId: null });
    }
    for (let i = 0; i < checklist.length; i += 46) {
      const stream = textStream(checklist.slice(i, i + 46));
      const contentId = push([{ text: `<< /Length ${Buffer.byteLength(stream, 'latin1')} >>\nstream\n${stream}\nendstream` }]);
      const pageId = push([{ text: 'P' }]);
      refs.push(pageId);
      pages.push({ pageId, contentId, imageId: null });
    }
    for (const image of restImages) {
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
    const fontId = push([{ text: '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>' }]);
    objs[1] = [{ text: `<< /Type /Pages /Kids [${refs.map((id) => `${id} 0 R`).join(' ')}] /Count ${refs.length} >>` }];
    for (const page of pages) {
      const xobj = page.imageId == null ? '' : ` /XObject << /Im${page.imageId} ${page.imageId} 0 R >>`;
      objs[page.pageId - 1] = [{ text: `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ${page.contentId} 0 R /Resources << /Font << /F1 ${fontId} 0 R >>${xobj} >> >>` }];
    }
    const chunks: Buffer[] = [Buffer.from('%PDF-1.4\n', 'latin1')];
    const offsets = [0];
    for (let i = 0; i < objs.length; i += 1) {
      offsets.push(chunks.reduce((s, c) => s + c.length, 0));
      const parts: Buffer[] = [Buffer.from(`${i + 1} 0 obj\n`, 'latin1')];
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
