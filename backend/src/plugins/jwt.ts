import fp from "fastify-plugin";
import fastifyJwt from "@fastify/jwt";
import { FastifyInstance } from "fastify";
import { env } from "../config/env";

export default fp(async function jwtPlugin(app: FastifyInstance) {
  app.register(fastifyJwt, {
    secret: env.JWT_SECRET,
    sign: {
      expiresIn: "15m",
    },
  });

 app.decorate("authenticate", async function (request, reply) {
  console.log("Authorization:", request.headers.authorization);

  try {
    await request.jwtVerify();

    console.log("Verified User:", request.user);
  } catch (err) {
    console.error("JWT VERIFY ERROR:");
    console.error(err);

    return reply.code(401).send({
      message: "Unauthorized",
      reason: err instanceof Error ? err.message : err,
    });
  }
});
});