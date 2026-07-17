import { FastifyInstance } from "fastify";
import * as authController from "./auth.controller";

export default async function authRoutes(app: FastifyInstance) {
  app.get("/github", authController.githubLogin);

  app.get("/github/callback", authController.githubCallback);

  app.get(
    "/me",
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ["Auth"],
        summary: "Get current authenticated user",
        security: [{ bearerAuth: [] }],
      },
    },
    authController.me,
  );
}