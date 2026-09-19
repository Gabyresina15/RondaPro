import { loadConfig } from './config.js';
import { createApp } from './createApp.js';
import { connectMongo } from './adapters/persistence/mongoConnection.js';

async function main(): Promise<void> {
  const config = loadConfig();
  await connectMongo(config.MONGODB_URI);

  const app = await createApp(config);

  try {
    await app.listen({ host: config.HOST, port: config.PORT });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
