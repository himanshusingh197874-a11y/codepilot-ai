import { Octokit } from "@octokit/rest";

export async function createWebhook(
  accessToken: string,
  owner: string,
  repo: string,
) {
  const octokit = new Octokit({
    auth: accessToken,
  });

  const response = await octokit.repos.createWebhook({
    owner,
    repo,

    config: {
      url: `${process.env.APP_URL}/api/v1/webhooks/github`,
      content_type: "json",
      secret: process.env.WEBHOOK_SECRET!,
      insecure_ssl: "0",
    },

    events: ["pull_request"],

    active: true,
  });

  return response.data;
}

export async function deleteWebhook(
  accessToken: string,
  owner: string,
  repo: string,
  hookId: number,
) {
  const octokit = new Octokit({
    auth: accessToken,
  });

  await octokit.repos.deleteWebhook({
    owner,
    repo,
    hook_id: hookId,
  });
}

export async function listWebhooks(
  accessToken: string,
  owner: string,
  repo: string,
) {
  const octokit = new Octokit({
    auth: accessToken,
  });

  const response = await octokit.repos.listWebhooks({
    owner,
    repo,
  });

  return response.data;
}