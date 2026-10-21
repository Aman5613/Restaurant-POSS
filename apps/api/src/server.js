import dns from 'node:dns';
import { buildApp } from './app.js';
import { env } from './config/env.js';

if (env.MONGODB_URI?.startsWith('mongodb+srv://')) {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch (_e) {
    // ignore
  }
}

async function start() {
  const app = await buildApp();

  try {
    await app.listen({ port: env.PORT, host: env.HOST });
    console.info(`🚀 Restaurant POS API server running on http://${env.HOST}:${env.PORT}`);
    console.info(`📚 Swagger OpenAPI documentation at http://localhost:${env.PORT}/docs`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
