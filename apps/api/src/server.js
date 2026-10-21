import { buildApp } from './app.js';
import { env } from './config/env.js';

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
