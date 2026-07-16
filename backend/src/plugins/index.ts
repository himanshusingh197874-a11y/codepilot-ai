import { FastifyInstance } from "fastify";
import swaggerPlugin from "./swagger";

export async function registerPlugins(app: FastifyInstance) {
  await app.register(swaggerPlugin);
}