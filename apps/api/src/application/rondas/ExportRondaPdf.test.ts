import assert from 'node:assert/strict';
import test from 'node:test';
import { Buffer } from 'node:buffer';
import type { Ronda, RondaPhoto } from '../../domain/entities/Ronda.js';
import type { PhotoStorage } from '../../domain/ports/PhotoStorage.js';
import type { RondaRepository } from '../../domain/ports/RondaRepository.js';
import { ExportRondaPdf, buildRondaPdf } from './ExportRondaPdf.js';

function fakeJpeg(width: number, height: number): Buffer {
  const sof = Buffer.alloc(19);
  sof[0] = 0xff;
  sof[1] = 0xc0;
  sof.writeUInt16BE(17, 2);
  sof[4] = 8;
  sof.writeUInt16BE(height, 5);
  sof.writeUInt16BE(width, 7);
  return Buffer.concat([Buffer.from([0xff, 0xd8]), sof, Buffer.from([0xff, 0xd9])]);
}

function photo(id: string, itemIndex?: number): RondaPhoto {
  return {
    id,
    filename: `${id}.jpg`,
    mimeType: 'image/jpeg',
    relativePath: `${id}.jpg`,
    itemIndex,
    createdAt: new Date('2026-04-02T18:30:00Z'),
  };
}

function ronda(overrides: Partial<Ronda> = {}): Ronda {
  return {
    id: 'ronda-demo-abc123',
    templateId: 'tpl-1',
    templateName: 'Checklist de piso retail',
    ownerId: 'owner-1',
    siteName: 'Sucursal 12 — Palermo',
    location: 'Av. Santa Fe 1234',
    status: 'completed',
    answers: [
      { itemIndex: 0, label: 'Extintor', type: 'bool', boolValue: true },
      { itemIndex: 1, label: 'Salida', type: 'bool', boolValue: false },
      { itemIndex: 2, label: 'Góndola', type: 'text', textValue: 'Pasillo libre' },
      { itemIndex: 3, label: 'Depósito', type: 'bool', naValue: true },
    ],
    photos: [],
    findings: [],
    summary: 'Pasillo despejado. Queda 1 hallazgo abierto en la salida de emergencia.',
    summarySource: 'llm',
    summaryModel: 'gemini-2.5-flash',
    summaryLatencyMs: 1868,
    summaryRisk: 'ALTO',
    summaryKeyFindings: ['Salida de emergencia obstruida'],
    summaryActions: ['Liberar el acceso', 'Reponer el precinto del extintor'],
    completedAt: new Date('2026-04-02T21:15:00Z'),
    lastEditedAt: new Date('2026-04-02T21:16:00Z'),
    createdAt: new Date('2026-04-02T21:00:00Z'),
    updatedAt: new Date('2026-04-02T21:16:00Z'),
    ...overrides,
  };
}

function pageCount(pdf: Buffer): number {
  return pdf.toString('latin1').match(/\/Type \/Page(?!s)/g)?.length ?? 0;
}

function contentStreams(pdf: Buffer): string[] {
  const text = pdf.toString('latin1');
  return [...text.matchAll(/stream\n([\s\S]*?)\nendstream/g)].map((match) => match[1] ?? '');
}

test('0 fotos -> 1 página, 2 fotos -> 2, 5 fotos -> 4', async () => {
  const storage = new Map<string, Buffer>();
  const photos: PhotoStorage = {
    async save() {
      return { relativePath: '' };
    },
    async read(relativePath: string) {
      const bytes = storage.get(relativePath);
      if (!bytes) throw new Error('missing');
      return bytes;
    },
  };
  for (const count of [0, 2, 5] as const) {
    storage.clear();
    const items = Array.from({ length: count }, (_, i) => photo(`p${i}`, i));
    for (const item of items) storage.set(item.relativePath, fakeJpeg(640, 480));
    const current = ronda({ photos: items });
    const rondas = { async findById() { return current; } } as unknown as RondaRepository;
    const { bytes } = await new ExportRondaPdf(rondas, photos).execute(current.id, current.ownerId);
    const expected = count === 0 ? 1 : 1 + Math.ceil(count / 2);
    assert.equal(pageCount(bytes), expected, `${count} fotos`);
  }
});

test('resumen largo desborda sin partir acciones ni checklist', () => {
  const summary = Array.from({ length: 40 }, (_, i) => `Oración ${i + 1} del resumen ejecutivo con detalle suficiente para ocupar una línea propia del informe.`).join(' ');
  const actions = ['Liberar el acceso a la salida', 'Reponer el precinto del extintor', 'Registrar el hallazgo en el panel'];
  const current = ronda({
    summary,
    summaryActions: actions,
    answers: [
      { itemIndex: 0, label: 'Extintor con precinto', type: 'bool', boolValue: false },
      { itemIndex: 1, label: 'Salida de emergencia', type: 'bool', boolValue: false },
      { itemIndex: 2, label: 'Iluminación de depósito', type: 'bool', boolValue: true },
      { itemIndex: 3, label: 'Notas de góndola', type: 'text', textValue: 'Sin observaciones' },
    ],
  });
  const pdf = buildRondaPdf(current, []);
  assert.ok(pageCount(pdf) >= 2);
  const streams = contentStreams(pdf);
  const actionsPage = streams.find((stream) => stream.includes('ACCIONES RECOMENDADAS'));
  assert.ok(actionsPage);
  for (const action of actions) assert.ok(actionsPage.includes(action), action);
  const checklistPage = streams.find((stream) => stream.includes('CHECKLIST'));
  assert.ok(checklistPage);
  for (const label of ['Extintor con precinto', 'Salida de emergencia', 'Iluminación de depósito', 'Notas de góndola']) {
    assert.ok(checklistPage.includes(label), label);
  }
  assert.equal(streams.filter((stream) => stream.includes('ACCIONES RECOMENDADAS')).length, 1);
  assert.equal(streams.filter((stream) => stream.includes('CHECKLIST')).length, 1);
});

test('incluye puntaje, riesgo una sola vez y hora ART', () => {
  const pdf = buildRondaPdf(ronda(), []).toString('latin1');
  assert.match(pdf, /2\/3 OK/);
  assert.match(pdf, /% cumplimiento/);
  assert.equal(pdf.split('Riesgo:').length - 1, 1);
  assert.match(pdf, /ART/);
  assert.ok(pdf.includes('\x97'), 'em dash WinAnsi');
});
