import { FastifyInstance } from 'fastify';
import corsPlugin from "./cors";
import swaggerPlugin from './swagger';
import prismaPlugin from './prisma';
import jwtPlugin from './jwt';

export async function registerPlugins(app: FastifyInstance) {
  await app.register(corsPlugin);
  await app.register(swaggerPlugin);
   await app.register(prismaPlugin);
   await app.register(jwtPlugin);
}
