export async function createPullRequestReview( accessToken: string, owner: string, repo: string, pullNumber: number, body: string,) {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}/reviews`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        body,
        event: 'COMMENT',
      }),
    },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create PR review: ${error}`);
  }

  return response.json();
}