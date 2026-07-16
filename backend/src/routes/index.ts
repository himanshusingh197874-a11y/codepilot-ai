import { FastifyInstance } from "fastify";
import { healthRoutes } from "./health.route";

export async function registerRoutes(app: FastifyInstance) {
  app.register(healthRoutes, {
    prefix: "/api/v1",
  });
}