import { FastifyReply, FastifyRequest } from "fastify";
import * as authService from "./auth.service";

export async function githubLogin(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const url = authService.getGithubLoginUrl();

  return reply.redirect(url);
}

export async function githubCallback(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { code } = request.query as { code: string };

  const result = await authService.loginWithGithub(request.server, code);

  return reply.send(result);
}

export async function me(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  return reply.send(request.user);
}