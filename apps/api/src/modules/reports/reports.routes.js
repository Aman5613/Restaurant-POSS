import { getSalesSummary, getItemWiseReport, getDayEndReport } from './reports.controller.js';
import { authenticate } from '../../middleware/authenticate.js';

export async function reportsRoutes(fastify) {
  fastify.addHook('preHandler', authenticate);

  fastify.get('/sales', getSalesSummary);
  fastify.get('/item-wise', getItemWiseReport);
  fastify.get('/day-end', getDayEndReport);
}
