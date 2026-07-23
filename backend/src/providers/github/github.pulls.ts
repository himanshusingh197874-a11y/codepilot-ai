import axios from 'axios';

export async function listOpenPullRequests(
  token: string,
  owner: string,
  repo: string,
) {
  const res = await axios.get(
    `https://api.github.com/repos/${owner}/${repo}/pulls`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
      },
      params: {
        state: 'open',
      },
    },
  );

  return res.data;
}