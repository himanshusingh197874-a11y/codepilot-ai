import { PullRequestFile } from './pr.types';

export async function getPullRequestFiles( accessToken: string, owner: string, repo: string, pullNumber: number,): Promise<PullRequestFile[]> {
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