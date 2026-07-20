export async function createInlineReviewComment( accessToken: string, owner: string, repo: string, pullNumber: number, commitId: string, path: string, line: number, body: string,) {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}/comments`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        body,
        commit_id: commitId,
        path,
        line,
        side: 'RIGHT',
      }),
    },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create inline comment: ${error}`);
  }

  return response.json();
}