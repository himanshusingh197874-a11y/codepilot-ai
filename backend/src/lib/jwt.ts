import { FastifyInstance } from "fastify";

export async function generateAccessToken(
  app: FastifyInstance,
  user: {
    id: string;
    username: string;
  },
) {
  return app.jwt.sign({
    sub: user.id,
    username: user.username,
  });
}