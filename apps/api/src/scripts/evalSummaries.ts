import { fromRonda } from '../adapters/llm/HeuristicSummaryGenerator.js';
import type { Ronda } from '../domain/entities/Ronda.js';

type Fixture = {
  id: string;
  expect: 'Bajo' | 'Medio' | 'Alto';
  ronda: Pick<Ronda, 'templateName' | 'siteName' | 'location' | 'answers' | 'findings' | 'photos'>;
};

function fixture(partial: Fixture): Fixture {
  return partial;
}

const fixtures: Fixture[] = [
  fixture({
    id: 'clean-store',
    expect: 'Bajo',
    ronda: {
      templateName: 'Retail floor',
      siteName: 'Palermo',
      location: '',
      photos: [],
      findings: [],
      answers: [
        { itemIndex: 0, label: 'Piso', type: 'bool', boolValue: true },
        { itemIndex: 1, label: 'Limpieza', type: 'bool', boolValue: true },
      ],
    },
  }),
  fixture({
    id: 'extintor-fail',
    expect: 'Alto',
    ronda: {
      templateName: 'Retail floor',
      siteName: 'Palermo',
      location: '',
      photos: [],
      findings: [],
      answers: [
        { itemIndex: 0, label: 'Piso', type: 'bool', boolValue: true },
        { itemIndex: 1, label: 'Extintor', type: 'bool', boolValue: false },
      ],
    },
  }),
  fixture({
    id: 'salida-emergencia',
    expect: 'Alto',
    ronda: {
      templateName: 'Retail floor',
      siteName: 'Palermo',
      location: '',
      photos: [],
      findings: [],
      answers: [
        { itemIndex: 0, label: 'Salida de emergencia', type: 'bool', boolValue: false },
      ],
    },
  }),
  fixture({
    id: 'one-failed-generic',
    expect: 'Medio',
    ronda: {
      templateName: 'Retail floor',
      siteName: 'Belgrano',
      location: '',
      photos: [],
      findings: [],
      answers: [
        { itemIndex: 0, label: 'Limpieza', type: 'bool', boolValue: false },
        { itemIndex: 1, label: 'Piso', type: 'bool', boolValue: true },
      ],
    },
  }),
  fixture({
    id: 'open-high-finding',
    expect: 'Alto',
    ronda: {
      templateName: 'Retail floor',
      siteName: 'Centro',
      location: '',
      photos: [],
      answers: [{ itemIndex: 0, label: 'Piso', type: 'bool', boolValue: true }],
      findings: [
        {
          id: 'f1',
          title: 'Cable pelado',
          notes: '',
          severity: 'high',
          status: 'open',
          createdAt: new Date(),
        },
      ],
    },
  }),
  fixture({
    id: 'open-medium-finding',
    expect: 'Medio',
    ronda: {
      templateName: 'Retail floor',
      siteName: 'Centro',
      location: '',
      photos: [],
      answers: [{ itemIndex: 0, label: 'Piso', type: 'bool', boolValue: true }],
      findings: [
        {
          id: 'f2',
          title: 'Gondola chueca',
          notes: '',
          severity: 'medium',
          status: 'open',
          createdAt: new Date(),
        },
      ],
    },
  }),
  fixture({
    id: 'three-fails',
    expect: 'Alto',
    ronda: {
      templateName: 'Retail floor',
      siteName: 'Once',
      location: '',
      photos: [],
      findings: [],
      answers: [
        { itemIndex: 0, label: 'Limpieza', type: 'bool', boolValue: false },
        { itemIndex: 1, label: 'Gondola', type: 'bool', boolValue: false },
        { itemIndex: 2, label: 'Iluminacion', type: 'bool', boolValue: false },
      ],
    },
  }),
  fixture({
    id: 'resolved-only',
    expect: 'Bajo',
    ronda: {
      templateName: 'Retail floor',
      siteName: 'Palermo',
      location: '',
      photos: [],
      answers: [{ itemIndex: 0, label: 'Piso', type: 'bool', boolValue: true }],
      findings: [
        {
          id: 'f3',
          title: 'Viejo',
          notes: '',
          severity: 'high',
          status: 'resolved',
          createdAt: new Date(),
        },
      ],
    },
  }),
  fixture({
    id: 'seguridad-label',
    expect: 'Alto',
    ronda: {
      templateName: 'Retail floor',
      siteName: 'Palermo',
      location: '',
      photos: [],
      findings: [],
      answers: [{ itemIndex: 0, label: 'Seguridad de caja', type: 'bool', boolValue: false }],
    },
  }),
  fixture({
    id: 'notes-only-pass',
    expect: 'Bajo',
    ronda: {
      templateName: 'Retail floor',
      siteName: 'Palermo',
      location: '',
      photos: [],
      findings: [],
      answers: [
        { itemIndex: 0, label: 'Piso', type: 'bool', boolValue: true },
        { itemIndex: 1, label: 'Observaciones', type: 'text', textValue: 'Todo ok' },
      ],
    },
  }),
];

function asRonda(fix: Fixture): Ronda {
  return {
    id: fix.id,
    templateId: 't1',
    templateName: fix.ronda.templateName,
    ownerId: 'u1',
    siteName: fix.ronda.siteName,
    location: fix.ronda.location,
    status: 'completed',
    answers: fix.ronda.answers,
    photos: fix.ronda.photos,
    findings: fix.ronda.findings,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

let failed = 0;
for (const fix of fixtures) {
  const got = fromRonda(asRonda(fix));
  const ok = got.nivel_de_riesgo === fix.expect;
  if (!ok) failed += 1;
  console.log(
    `${ok ? 'PASS' : 'FAIL'} ${fix.id} expected=${fix.expect} got=${got.nivel_de_riesgo}`,
  );
}

if (failed > 0) {
  console.error(`eval:summaries failed: ${failed}/${fixtures.length}`);
  process.exit(1);
}
console.log(`eval:summaries ok ${fixtures.length}/${fixtures.length}`);
