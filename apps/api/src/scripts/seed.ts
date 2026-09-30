import { loadConfig } from '../config.js';
import { connectMongo, disconnectMongo } from '../adapters/persistence/mongoConnection.js';
import { MongoUserRepository } from '../adapters/persistence/MongoUserRepository.js';
import { MongoChecklistTemplateRepository } from '../adapters/persistence/MongoChecklistTemplateRepository.js';
import { MongoSiteRepository } from '../adapters/persistence/MongoSiteRepository.js';
import { RondaModel } from '../adapters/persistence/RondaModel.js';
import { randomUUID } from 'node:crypto';
import { BcryptPasswordHasher } from '../adapters/security/BcryptPasswordHasher.js';

const DEMO_EMAIL = 'demo@rondapro.local';
const DEMO_PASSWORD = 'Demo1234!';
const DEMO_NAME = 'Demo Auditor';
const SUPER_EMAIL = 'supervisor@rondapro.local';

async function seed(): Promise<void> {
  const config = loadConfig();
  await connectMongo(config.MONGODB_URI);

  const users = new MongoUserRepository();
  const templates = new MongoChecklistTemplateRepository();
  const sites = new MongoSiteRepository();
  const hasher = new BcryptPasswordHasher();

  let user = await users.findByEmail(DEMO_EMAIL);
  if (!user) {
    const passwordHash = await hasher.hash(DEMO_PASSWORD);
    user = await users.create({
      email: DEMO_EMAIL,
      passwordHash,
      name: DEMO_NAME,
      role: 'auditor',
    });
    console.log(`Created demo user: ${DEMO_EMAIL}`);
  } else {
    console.log(`Demo user already exists: ${DEMO_EMAIL}`);
  }

  let supervisor = await users.findByEmail(SUPER_EMAIL);
  if (!supervisor) {
    supervisor = await users.create({
      email: SUPER_EMAIL,
      passwordHash: await hasher.hash(DEMO_PASSWORD),
      name: 'Demo Supervisor',
      role: 'supervisor',
    });
    console.log(`Created supervisor: ${SUPER_EMAIL}`);
  } else {
    console.log(`Supervisor already exists: ${SUPER_EMAIL}`);
  }

  const existing = await templates.findByOwner(user.id);
  const retailName = 'Checklist de piso retail';
  let template = existing.find((t) => t.name === retailName);
  if (!template) {
    template = await templates.create({
      ownerId: user.id,
      name: retailName,
      description: 'Walkthrough diario de sucursal: entrada, góndola, evidencias y salida.',
      items: [
        { label: 'Entrada libre y limpia', required: true, type: 'bool' },
        { label: 'Notas de gondola', required: false, type: 'text' },
        { label: 'Foto de display promo', required: true, type: 'photo' },
        { label: 'Foto de extintor', required: true, type: 'photo' },
        { label: 'Salida de emergencia despejada', required: true, type: 'bool' },
      ],
    });
    console.log(`Created template: ${template.name} (${template.id})`);
  } else {
    console.log('Checklist de piso retail already exists');
  }

  const existingSites = await sites.findByOwner(user.id);
  if (!existingSites.some((s) => s.name === 'Store 12 — Palermo')) {
    const site = await sites.create({
      ownerId: user.id,
      name: 'Store 12 — Palermo',
      address: 'Av. Santa Fe 3200, CABA',
      notes: 'Sucursal flagship. Cerrar walkthrough después de las 21:00.',
    });
    console.log(`Created site: ${site.name} (${site.id})`);
  } else {
    console.log('Demo site already exists');
  }

  const site = (await sites.findByOwner(user.id)).find((s) => s.name === 'Store 12 — Palermo');
  const existingRondas = await RondaModel.find({ ownerId: user.id }).exec();

  async function seedHistory(opts: {
    marker: string;
    daysAgo: number;
    location: string;
    failExit: boolean;
    notes: string;
    finding?: { title: string; notes: string; severity: 'low' | 'medium' | 'high' };
    summary: string;
    risk: string;
    keyFindings: string[];
    actions: string[];
  }) {
    const already = existingRondas.some((r) => {
      const findings = (r.findings ?? []) as Array<{ title?: string }>;
      return findings.some((f) => f.title === opts.marker) || r.location === opts.marker;
    });
    if (!template || !site || already) return;
    const completedAt = new Date(Date.now() - opts.daysAgo * 24 * 60 * 60 * 1000);
    await RondaModel.create({
      templateId: template.id,
      templateName: template.name,
      ownerId: user.id,
      siteId: site.id,
      siteName: site.name,
      location: opts.location,
      status: 'completed',
      answers: template.items.map((item, itemIndex) => ({
        itemIndex,
        label: item.label,
        type: item.type,
        boolValue:
          item.type === 'bool'
            ? item.label.includes('emergencia')
              ? !opts.failExit
              : true
            : undefined,
        textValue: item.type === 'text' ? opts.notes : undefined,
      })),
      photos: [],
      findings: opts.finding
        ? [
            {
              id: randomUUID(),
              title: opts.finding.title,
              notes: opts.finding.notes,
              severity: opts.finding.severity,
              status: 'open',
              createdAt: completedAt,
            },
          ]
        : [],
      summary: opts.summary,
      summarySource: 'heuristic',
      summaryRisk: opts.risk,
      summaryKeyFindings: opts.keyFindings,
      summaryActions: opts.actions,
      completedAt,
    });
    console.log(`Created history ronda: ${opts.marker}`);
  }

  await seedHistory({
    marker: 'Salida de emergencia bloqueada',
    daysAgo: 1,
    location: 'Pasillo 4 / deposito',
    failExit: true,
    notes: 'Gondola de bebidas incompleta en cabecera',
    finding: {
      title: 'Salida de emergencia bloqueada',
      notes: 'Cajas apiladas frente a la salida trasera.',
      severity: 'high',
    },
    summary:
      'La ronda en Store 12 — Palermo relevó una salida bloqueada y un hallazgo de gravedad alta.',
    risk: 'Alto',
    keyFindings: ['Salida de emergencia bloqueada'],
    actions: ['Liberar la salida y fotografiar la corrección', 'Cerrar el hallazgo con evidencia'],
  });

  await seedHistory({
    marker: 'Extintor vencido',
    daysAgo: 3,
    location: 'Cajas / deposito',
    failExit: false,
    notes: 'Display promo ok',
    finding: {
      title: 'Extintor vencido',
      notes: 'Fecha de recarga 03/2024. Colocado detras de cajas.',
      severity: 'high',
    },
    summary: 'Se detectó un extintor vencido detrás de cajas.',
    risk: 'Alto',
    keyFindings: ['Extintor vencido'],
    actions: ['Reemplazar el extintor en 24 h', 'Reubicar el equipo a la vista'],
  });

  await seedHistory({
    marker: 'Gondola incompleta',
    daysAgo: 5,
    location: 'Cabecera bebidas',
    failExit: false,
    notes: 'Faltan SKU de agua 2L',
    finding: {
      title: 'Gondola incompleta',
      notes: 'Cabecera con huecos visibles.',
      severity: 'medium',
    },
    summary: 'Cumplimiento parcial por quiebre de góndola.',
    risk: 'Medio',
    keyFindings: ['Gondola incompleta'],
    actions: ['Reponer SKU faltantes', 'Revisar planograma'],
  });

  await seedHistory({
    marker: 'Ronda limpia Palermo',
    daysAgo: 7,
    location: 'Piso completo',
    failExit: false,
    notes: 'Gondolas completas',
    summary: 'Ronda conforme. Sin hallazgos abiertos.',
    risk: 'Bajo',
    keyFindings: ['Sin desvíos'],
    actions: ['Mantener el estándar en la próxima visita'],
  });

  await seedHistory({
    marker: 'Iluminacion pasillo 2',
    daysAgo: 10,
    location: 'Pasillo 2',
    failExit: false,
    notes: 'Un artefacto intermitente',
    finding: {
      title: 'Iluminacion pasillo 2',
      notes: 'Un artefacto parpadea sobre galletitas.',
      severity: 'low',
    },
    summary: 'Hallazgo menor de facilities.',
    risk: 'Bajo',
    keyFindings: ['Iluminación intermitente'],
    actions: ['Reportar a mantenimiento'],
  });

  console.log('');
  console.log('Seed complete. Login with:');
  console.log(`  auditor:     ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  console.log(`  supervisor:  ${SUPER_EMAIL} / ${DEMO_PASSWORD}`);

  await disconnectMongo();
}

seed().catch(async (err: unknown) => {
  console.error(err);
  await disconnectMongo().catch(() => undefined);
  process.exit(1);
});
