import { Buffer } from 'node:buffer';
import type { Ronda } from '../../domain/entities/Ronda.js';
import type { PhotoStorage } from '../../domain/ports/PhotoStorage.js';
import type { RondaRepository } from '../../domain/ports/RondaRepository.js';
import { agreeFindings } from '../../adapters/llm/auditSummary.js';
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

export function pdfFilename(rondaId: string): string {
  const short = rondaId.length > 6 ? rondaId.slice(-6) : rondaId;
  return `rondapro-${short}.pdf`;
}

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
  return agreeFindings((cut > 0 ? text.slice(0, cut) : text).trim());
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
    const size = buf.readUInt16BE(i + 2);
    if (size < 2) break;
    i += 2 + size;
  }
  return null;
}

function textStream(lines: string[], startY = 760): string {
  const chunks = ['BT', '/F1 11 Tf', `48 ${startY} Td`, '14 TL'];
  for (const line of lines) {
    chunks.push(`(${escapePdf(line)}) Tj`, 'T*');
  }
  chunks.push('ET');
  return chunks.join('\n');
}

function severityEs(raw: string): string {
  if (raw === 'high') return 'Alta';
  if (raw === 'medium') return 'Media';
  if (raw === 'low') return 'Baja';
  return raw;
}

function reportSections(ronda: Ronda): string[][] {
  const source =
    ronda.summarySource === 'llm'
      ? `Gemini${ronda.summaryModel && ronda.summaryModel !== 'heuristic' && ronda.summaryModel !== 'gemini-unavailable' ? ` (${ronda.summaryModel})` : ''}${ronda.summaryLatencyMs != null ? ` ${ronda.summaryLatencyMs} ms` : ''}`
      : ronda.summarySource
        ? 'Resumen automático'
        : '-';
  const meta = [
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
  const sections = [meta];
  const findings = ronda.summaryKeyFindings ?? [];
  if (findings.length) {
    sections.push(['', 'Hallazgos clave:', ...findings.map((item) => `- ${item}`)]);
  }
  const actions = ronda.summaryActions ?? [];
  if (actions.length) {
    sections.push([
      '',
      'Acciones recomendadas:',
      ...actions.map((item, i) => `${i + 1}. ${item}`),
    ]);
  }
  const registered = ['', '2. HALLAZGOS'];
  if (!ronda.findings.length) registered.push('No se registraron hallazgos.');
  else {
    for (const f of ronda.findings) {
      registered.push(
        `- ${f.title} [${severityEs(f.severity)} / ${f.status === 'open' ? 'abierto' : 'cerrado'}]`,
      );
    }
  }
  sections.push(registered);
  return sections;
}

function checklistSection(ronda: Ronda): string[] {
  const lines = ['3. CHECKLIST'];
  for (const a of ronda.answers) {
    let value = '-';
    if (a.type === 'bool') {
      value = a.naValue ? 'N/A' : a.boolValue === true ? 'Pasa' : a.boolValue === false ? 'No pasa' : 'Sin responder';
    } else if (a.type === 'text') value = a.textValue?.trim() || 'Sin notas';
    else value = 'Evidencia fotográfica';
    lines.push(`- ${a.label}: ${value}`);
  }
  return lines;
}

const REPORT_LIMIT = 46;

function reportPage(ronda: Ronda): string[] {
  const sections = reportSections(ronda);
  const actionIndex = sections.findIndex((section) => section.some((line) => line.startsWith('Acciones recomendadas')));
  const actions = actionIndex >= 0 ? sections[actionIndex] : [];
  const before = sections.filter((_, index) => index !== actionIndex);
  const actionLines = actions.flatMap((line) => wrap(line, 88));
  const head = before.flatMap((section) => section.flatMap((line) => wrap(line, 88)));
  const budget = REPORT_LIMIT - actionLines.length;
  if (actionLines.length && head.length > budget) {
    return [...head.slice(0, Math.max(8, budget - 1)), '...', ...actionLines];
  }
  return [...head, ...actionLines].slice(0, REPORT_LIMIT);
}

function checklistPages(ronda: Ronda): string[][] {
  const lines = checklistSection(ronda).flatMap((line) => wrap(line, 88));
  const pages: string[][] = [];
  for (let i = 0; i < lines.length; i += REPORT_LIMIT) pages.push(lines.slice(i, i + REPORT_LIMIT));
  return pages.length ? pages : [['3. CHECKLIST', 'Sin respuestas.']];
}

type PdfImage = { bytes: Buffer; width: number; height: number; caption: string };

function fit(image: PdfImage, maxW: number, maxH: number): { w: number; h: number } {
  const scale = Math.min(maxW / image.width, maxH / image.height, 1);
  return { w: Math.max(1, Math.round(image.width * scale)), h: Math.max(1, Math.round(image.height * scale)) };
}

function drawImage(imageId: number, image: PdfImage, maxW: number, maxH: number, top: number): { stream: string; bottom: number } {
  const { w, h } = fit(image, maxW, maxH);
  const x = Math.round((612 - w) / 2);
  const y = Math.max(48, top - h);
  const captionY = Math.max(32, y - 16);
  const stream = [
    'q',
    `${w} 0 0 ${h} ${x} ${y} cm`,
    `/Im${imageId} Do`,
    'Q',
    'BT',
    '/F1 11 Tf',
    `48 ${captionY} Td`,
    `(${escapePdf(image.caption)}) Tj`,
    'ET',
  ].join('\n');
  return { stream, bottom: captionY - 14 };
}

function evidenceGroups(images: PdfImage[]): PdfImage[][] {
  if (!images.length) return [];
  const groups: PdfImage[][] = [];
  for (let i = 0; i < images.length; i += 2) groups.push(images.slice(i, i + 2));
  return groups;
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
    const images: PdfImage[] = [];
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
        /* skip missing or non-jpeg evidence */
      }
    }
    return {
      bytes: this.build([reportPage(ronda)], checklistPages(ronda), images),
      filename: pdfFilename(ronda.id),
    };
  }

  private build(reportPages: string[][], checklistPages: string[][], images: PdfImage[]): Buffer {
    type Part = { text?: string; binary?: Buffer };
    const objs: Part[][] = [];
    const push = (parts: Part[]) => {
      objs.push(parts);
      return objs.length;
    };
    push([{ text: '<< /Type /Catalog /Pages 2 0 R >>' }]);
    push([{ text: 'PAGES' }]);
    const pages: { pageId: number; contentId: number; imageIds: number[] }[] = [];
    const refs: number[] = [];

    const addTextPage = (lines: string[]) => {
      const stream = textStream(lines);
      const contentId = push([{ text: `<< /Length ${Buffer.byteLength(stream, 'latin1')} >>\nstream\n${stream}\nendstream` }]);
      const pageId = push([{ text: 'P' }]);
      refs.push(pageId);
      pages.push({ pageId, contentId, imageIds: [] });
    };
    for (const lines of reportPages) addTextPage(lines);
    for (const lines of checklistPages) addTextPage(lines);

    for (const group of evidenceGroups(images)) {
      const imageIds = group.map((image) =>
        push([
          { text: `<< /Type /XObject /Subtype /Image /Width ${image.width} /Height ${image.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.bytes.length} >>\nstream\n` },
          { binary: image.bytes },
          { text: '\nendstream' },
        ]),
      );
      const captionH = 28;
      const available = 680;
      const maxH = Math.max(160, Math.floor(available / group.length) - captionH);
      const chunks = [textStream(['4. EVIDENCIAS'], 760)];
      let top = 724;
      for (let i = 0; i < group.length; i += 1) {
        const drawn = drawImage(imageIds[i], group[i], 500, maxH, top);
        chunks.push(drawn.stream);
        top = drawn.bottom - 6;
      }
      const stream = chunks.join('\n');
      const contentId = push([{ text: `<< /Length ${Buffer.byteLength(stream, 'latin1')} >>\nstream\n${stream}\nendstream` }]);
      const pageId = push([{ text: 'P' }]);
      refs.push(pageId);
      pages.push({ pageId, contentId, imageIds });
    }

    const fontId = push([{ text: '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>' }]);
    objs[1] = [{ text: `<< /Type /Pages /Kids [${refs.map((id) => `${id} 0 R`).join(' ')}] /Count ${refs.length} >>` }];
    for (const page of pages) {
      const xobj = page.imageIds.length
        ? ` /XObject << ${page.imageIds.map((id) => `/Im${id} ${id} 0 R`).join(' ')} >>`
        : '';
      objs[page.pageId - 1] = [{ text: `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ${page.contentId} 0 R /Resources << /Font << /F1 ${fontId} 0 R >>${xobj} >> >>` }];
    }
    const chunks: Buffer[] = [Buffer.from('%PDF-1.4\n', 'latin1')];
    const offsets = [0];
    for (let i = 0; i < objs.length; i += 1) {
      offsets.push(chunks.reduce((sum, chunk) => sum + chunk.length, 0));
      const parts: Buffer[] = [Buffer.from(`${i + 1} 0 obj\n`, 'latin1')];
      for (const part of objs[i]) {
        if (part.text) parts.push(Buffer.from(part.text, 'latin1'));
        if (part.binary) parts.push(part.binary);
      }
      parts.push(Buffer.from('\nendobj\n', 'latin1'));
      chunks.push(Buffer.concat(parts));
    }
    const xrefStart = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    let xref = `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
    for (let i = 1; i <= objs.length; i += 1) xref += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
    chunks.push(Buffer.from(xref, 'latin1'));
    chunks.push(Buffer.from(`trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`, 'latin1'));
    return Buffer.concat(chunks);
  }
}
