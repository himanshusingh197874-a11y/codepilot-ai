import { FastifyInstance } from "fastify";

export async function registerErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((error, request, reply) => {
    request.log.error(error);

    reply.status(error.statusCode ?? 500).send({
      success: false,
      message: error.message,
    });
  });
}