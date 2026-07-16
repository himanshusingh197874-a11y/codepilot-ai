import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';

export default fp(async function (app: FastifyInstance) {
  await prisma.$connect();

  app.decorate('prisma', prisma);

  app.addHook('onClose', async () => {
    await prisma.$disconnect();
  });
});