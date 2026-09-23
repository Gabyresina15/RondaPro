import mongoose from 'mongoose';
import { loadConfig } from '../config.js';
import { RondaModel } from '../adapters/persistence/RondaModel.js';
import { SiteModel } from '../adapters/persistence/SiteModel.js';
import { fromRonda } from '../adapters/llm/HeuristicSummaryGenerator.js';
import type { Ronda } from '../domain/entities/Ronda.js';

type Bucket = {
  key: string;
  name: string;
  rondas: number;
  openFindings: number;
  storesWithIssues: Set<string>;
  storesSeen: Set<string>;
};

function emptyBucket(key: string, name: string): Bucket {
  return {
    key,
    name,
    rondas: 0,
    openFindings: 0,
    storesWithIssues: new Set(),
    storesSeen: new Set(),
  };
}

function riskOf(openFindings: number) {
  const fake = {
    templateName: 'Consolidado semanal',
    siteName: 'x',
    location: 'x',
    status: 'completed',
    answers: [] as Ronda['answers'],
    photos: [] as Ronda['photos'],
    findings: Array.from({ length: openFindings }, (_, i) => ({
      id: String(i),
      title: 'abierto',
      notes: '',
      severity: openFindings >= 3 ? 'high' : 'medium',
      status: 'open' as const,
      createdAt: new Date(),
    })),
  } as Ronda;
  return fromRonda(fake);
}

async function main() {
  const config = loadConfig();
  await mongoose.connect(config.MONGODB_URI);

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [docs, sites] = await Promise.all([
    RondaModel.find({
      status: 'completed',
      deletedAt: { $in: [null, undefined] },
      completedAt: { $gte: since },
    })
      .sort({ completedAt: -1 })
      .lean()
      .exec(),
    SiteModel.find({}).lean().exec(),
  ]);

  const siteById = new Map(
    sites.map((s) => [
      String(s._id),
      {
        id: String(s._id),
        name: String(s.name),
        parentId: s.parentId ? String(s.parentId) : undefined,
      },
    ]),
  );

  const byStore = new Map<string, Bucket>();
  const byBuilding = new Map<string, Bucket>();

  for (const doc of docs) {
    const siteId = doc.siteId ? String(doc.siteId) : '';
    const site = siteId ? siteById.get(siteId) : undefined;
    const storeName = site?.name || String(doc.siteName || doc.location || 'sin-sitio');
    const storeKey = site?.id || storeName;
    const parent = site?.parentId ? siteById.get(site.parentId) : undefined;
    const buildingKey = parent?.id || (site?.parentId ? site.parentId : storeKey);
    const buildingName = parent?.name || (site?.parentId ? site.parentId : storeName);

    const store = byStore.get(storeKey) ?? emptyBucket(storeKey, storeName);
    store.rondas += 1;
    const open = (doc.findings ?? []).filter((f: { status: string }) => f.status === 'open').length;
    store.openFindings += open;
    store.storesSeen.add(storeKey);
    if (open > 0) store.storesWithIssues.add(storeKey);
    byStore.set(storeKey, store);

    const building = byBuilding.get(buildingKey) ?? emptyBucket(buildingKey, buildingName);
    building.rondas += 1;
    building.openFindings += open;
    building.storesSeen.add(storeKey);
    if (open > 0) building.storesWithIssues.add(storeKey);
    byBuilding.set(buildingKey, building);
  }

  const stores = [...byStore.values()].map((bucket) => {
    const summary = riskOf(bucket.openFindings);
    return {
      site: bucket.name,
      rondas: bucket.rondas,
      openFindings: bucket.openFindings,
      risk: summary.nivel_de_riesgo,
      origenProbable: 'local',
    };
  });

  const buildings = [...byBuilding.values()].map((bucket) => {
    const storeCount = bucket.storesSeen.size;
    const dirty = bucket.storesWithIssues.size;
    const ratio = storeCount === 0 ? 0 : dirty / storeCount;
    const origenProbable =
      storeCount >= 2 && ratio >= 0.5 ? 'edificio' : storeCount <= 1 ? 'indeterminado' : 'locales';
    const summary = riskOf(bucket.openFindings);
    return {
      edificio: bucket.name,
      localesInspeccionados: storeCount,
      localesConHallazgos: dirty,
      rondas: bucket.rondas,
      openFindings: bucket.openFindings,
      risk: summary.nivel_de_riesgo,
      origenProbable,
      lectura:
        origenProbable === 'edificio'
          ? 'El mismo tipo de desvio aparece en la mayoria de los locales: revisar control del predio.'
          : origenProbable === 'locales'
            ? 'Los desvios estan concentrados en pocos locales: revisar operacion de esos stores.'
            : 'Hace falta mas de un local bajo el mismo edificio para separar predio vs local.',
    };
  });

  console.log(
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        windowDays: 7,
        rondaCount: docs.length,
        stores,
        buildings,
      },
      null,
      2,
    ),
  );
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
