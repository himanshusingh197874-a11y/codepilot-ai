import axios from "axios";
import type { FastifyBaseLogger } from "fastify";

const GITHUB_API_URL = "https://api.github.com";

export async function getGithubRepositories(
  accessToken: string,
  log: FastifyBaseLogger,
) {
  try {
    const response = await axios.get(
      `${GITHUB_API_URL}/user/repos`,
      {
        params: {
          per_page: 100,
          sort: "updated",
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      },
    );
    log.info(
      {
        repositoryCount: response.data.length,
        oauthScopes: response.headers["x-oauth-scopes"] ?? null,
      },
      "GitHub repository request completed",
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      log.error(
        {
          statusCode: error.response?.status,
          githubMessage:
            typeof error.response?.data === "object" && error.response?.data
              ? (error.response.data as { message?: string }).message
              : undefined,
        },
        "GitHub repository request failed",
      );
    }

    throw new Error("Failed to fetch GitHub repositories");
  }
}
