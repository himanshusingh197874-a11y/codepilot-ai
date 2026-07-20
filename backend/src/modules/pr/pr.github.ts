import { PullRequestFile } from './pr.types';

// Fetch changed files in a PR
export async function getPullRequestFiles(
  accessToken: string,
  owner: string,
  repo: string,
  pullNumber: number,
): Promise<PullRequestFile[]> {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}/files`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
      },
    },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch PR files: ${error}`);
  }

  return response.json();
}

// Fetch PR metadata (including latest commit SHA)
export async function getPullRequest(
  accessToken: string,
  owner: string,
  repo: string,
  pullNumber: number,
) {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
      },
    },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch pull request: ${error}`);
  }

  return response.json();
}