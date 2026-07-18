import { FastifyInstance } from "fastify";

import {
  getGithubAuthUrl,
  exchangeCodeForToken,
} from "../../providers/github/github.oauth";

import { getGithubUser } from "../../providers/github/github.client";

import {
  findUserByGithubId,
  createGithubUser,
  updateGithubUser,
} from "./auth.repository";

import { generateAccessToken } from "../../lib/jwt";

export function getGithubLoginUrl() {
  return getGithubAuthUrl();
}

export async function loginWithGithub(
  app: FastifyInstance,
  code: string,
) {
  const githubAccessToken = await exchangeCodeForToken(code);

  const githubUser = await getGithubUser(githubAccessToken);

  let user = await findUserByGithubId(githubUser.id.toString());

  if (!user) {
    user = await createGithubUser({
      githubUserId: githubUser.id.toString(),
      accessToken: githubAccessToken,

      username: githubUser.login,
      name: githubUser.name,
      email: githubUser.email,
      avatarUrl: githubUser.avatar_url,
    });
  } else {
    user = await updateGithubUser(user.id, {
      githubUserId: githubUser.id.toString(),
      accessToken: githubAccessToken,

      username: githubUser.login,
      name: githubUser.name,
      email: githubUser.email,
      avatarUrl: githubUser.avatar_url,
    });
  }

  const accessToken = await generateAccessToken(app, {
    id: user.id,
    username: user.username,
  });

  return {
    accessToken,
    user,
  };
}