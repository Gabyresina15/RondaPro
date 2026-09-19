import { loadConfig } from '../config.js';
import { connectMongo, disconnectMongo } from '../adapters/persistence/mongoConnection.js';
import { MongoUserRepository } from '../adapters/persistence/MongoUserRepository.js';
import { MongoChecklistTemplateRepository } from '../adapters/persistence/MongoChecklistTemplateRepository.js';
import { MongoSiteRepository } from '../adapters/persistence/MongoSiteRepository.js';
import { BcryptPasswordHasher } from '../adapters/security/BcryptPasswordHasher.js';

const DEMO_EMAIL = 'demo@rondapro.local';
const DEMO_PASSWORD = 'Demo1234!';
const DEMO_NAME = 'Demo Auditor';

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
    });
    console.log(`Created demo user: ${DEMO_EMAIL}`);
  } else {
    console.log(`Demo user already exists: ${DEMO_EMAIL}`);
  }

  const existing = await templates.findByOwner(user.id);
  const hasRetail = existing.some((t) => t.name === 'Retail floor checklist');
  if (!hasRetail) {
    const template = await templates.create({
      ownerId: user.id,
      name: 'Retail floor checklist',
      description: 'Daily store walkthrough for retail facilities',
      items: [
        { label: 'Entrance clean and clear', required: true, type: 'bool' },
        { label: 'Shelf stock notes', required: false, type: 'text' },
        { label: 'Photo of promo display', required: true, type: 'photo' },
        { label: 'Photo of emergency exit', required: true, type: 'photo' },
        { label: 'Emergency exits unobstructed', required: true, type: 'bool' },
      ],
    });
    console.log(`Created template: ${template.name} (${template.id})`);
  } else {
    console.log('Retail floor checklist template already exists');
  }

  const existingSites = await sites.findByOwner(user.id);
  if (!existingSites.some((s) => s.name === 'Store 12 — Palermo')) {
    const site = await sites.create({
      ownerId: user.id,
      name: 'Store 12 — Palermo',
      address: 'Av. Santa Fe 3200, CABA',
      notes: 'Flagship retail floor. Close walkthrough after 21:00.',
    });
    console.log(`Created site: ${site.name} (${site.id})`);
  } else {
    console.log('Demo site already exists');
  }

  console.log('');
  console.log('Seed complete. Login with:');
  console.log(`  email:    ${DEMO_EMAIL}`);
  console.log(`  password: ${DEMO_PASSWORD}`);

  await disconnectMongo();
}

seed().catch(async (err: unknown) => {
  console.error(err);
  await disconnectMongo().catch(() => undefined);
  process.exit(1);
});
