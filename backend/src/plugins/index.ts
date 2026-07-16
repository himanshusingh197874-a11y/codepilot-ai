import { FastifyInstance } from 'fastify';
import swaggerPlugin from './swagger';
import prismaPlugin from './prisma';

export async function registerPlugins(app: FastifyInstance) {
  await app.register(swaggerPlugin);
   await app.register(prismaPlugin);
}
