import dns from 'node:dns';
import mongoose from 'mongoose';
import { env } from '../config/env.js';

export async function mongoosePlugin(fastify, _opts) {
  try {
    if (env.MONGODB_URI.startsWith('mongodb+srv://')) {
      try {
        dns.setServers(['8.8.8.8', '1.1.1.1']);
      } catch (_e) {
        // ignore
      }
    }
    mongoose.set('strictQuery', true);
    await mongoose.connect(env.MONGODB_URI);
    fastify.log.info('✅ Connected to MongoDB');

    fastify.addHook('onClose', async () => {
      await mongoose.connection.close();
      fastify.log.info('🔌 Disconnected from MongoDB');
    });
  } catch (err) {
    fastify.log.error(err, '❌ MongoDB connection error');
    // In test environment, allow tests to mock or connect separately
    if (env.NODE_ENV !== 'test') {
      throw err;
    }
  }
}
