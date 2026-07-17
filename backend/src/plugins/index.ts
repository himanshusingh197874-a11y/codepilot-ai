import { FastifyInstance } from 'fastify';
import swaggerPlugin from './swagger';
import prismaPlugin from './prisma';
import jwtPlugin from './jwt';

export async function registerPlugins(app: FastifyInstance) {
  await app.register(swaggerPlugin);
   await app.register(prismaPlugin);
   await app.register(jwtPlugin);
}
