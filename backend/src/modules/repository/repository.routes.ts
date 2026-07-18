import { FastifyInstance } from "fastify";

import * as repositoryController from "./repository.controller";

export default async function repositoryRoutes(
  app: FastifyInstance,
) {
  app.post(
    "/sync",
    {
      preHandler: [app.authenticate],
    },
    repositoryController.syncRepositories,
  );

  app.get(
    "/",
    {
      preHandler: [app.authenticate],
    },
    repositoryController.listRepositories,
  );

  app.patch(
  "/:id/enable",
  {
    preHandler: [app.authenticate],

    schema: {
      tags: ["Repositories"],
      summary: "Enable AI review",
      security: [{ bearerAuth: [] }],
    },
  },
  repositoryController.enableRepository,
);

app.patch(
  "/:id/disable",
  {
    preHandler: [app.authenticate],

    schema: {
      tags: ["Repositories"],
      summary: "Disable AI review",
      security: [{ bearerAuth: [] }],
    },
  },
  repositoryController.disableRepository,
);
}

