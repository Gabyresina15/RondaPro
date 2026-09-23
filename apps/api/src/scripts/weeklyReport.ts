import mongoose from 'mongoose';
import { loadConfig } from '../config.js';
import { RondaModel } from '../adapters/persistence/RondaModel.js';
import { fromRonda } from '../adapters/llm/HeuristicSummaryGenerator.js';
import type { Ronda } from '../domain/entities/Ronda.js';

async function main() {
  const config = loadConfig();
  await mongoose.connect(config.MONGODB_URI);

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const docs = await RondaModel.find({
    status: 'completed',
    deletedAt: { $in: [null, undefined] },
    completedAt: { $gte: since },
  })
    .sort({ completedAt: -1 })
    .lean()
    .exec();

  type Bucket = {
    site: string;
    rondas: number;
    openFindings: number;
    llm: number;
    heuristic: number;
    latencies: number[];
  };
  const bySite = new Map<string, Bucket>();

  for (const doc of docs) {
    const site = String(doc.siteName || doc.location || 'sin-sitio');
    const bucket = bySite.get(site) ?? {
      site,
      rondas: 0,
      openFindings: 0,
      llm: 0,
      heuristic: 0,
      latencies: [],
    };
    bucket.rondas += 1;
    bucket.openFindings += (doc.findings ?? []).filter((f: { status: string }) => f.status === 'open').length;
    if (doc.summarySource === 'llm') bucket.llm += 1;
    else bucket.heuristic += 1;
    if (typeof doc.summaryLatencyMs === 'number') bucket.latencies.push(doc.summaryLatencyMs);
    bySite.set(site, bucket);
  }

  const sites = [...bySite.values()].map((bucket) => {
    const fake = {
      templateName: 'Consolidado semanal',
      siteName: bucket.site,
      location: bucket.site,
      status: 'completed',
      answers: [] as Ronda['answers'],
      photos: [] as Ronda['photos'],
      findings: Array.from({ length: bucket.openFindings }, (_, i) => ({
        id: String(i),
        title: 'abierto',
        notes: '',
        severity: bucket.openFindings >= 3 ? 'high' : 'medium',
        status: 'open',
        createdAt: new Date(),
      })),
    } as Ronda;
    const summary = fromRonda(fake);
    const avgLatency =
      bucket.latencies.length === 0
        ? null
        : Math.round(bucket.latencies.reduce((a, b) => a + b, 0) / bucket.latencies.length);
    return {
      site: bucket.site,
      rondas: bucket.rondas,
      openFindings: bucket.openFindings,
      summaries: { llm: bucket.llm, heuristic: bucket.heuristic, avgLatencyMs: avgLatency },
      risk: summary.nivel_de_riesgo,
      resumen: summary.resumen_ejecutivo,
      acciones: summary.acciones_recomendadas,
    };
  });

  const report = {
    generatedAt: new Date().toISOString(),
    windowDays: 7,
    rondaCount: docs.length,
    sites,
  };
  console.log(JSON.stringify(report, null, 2));
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
