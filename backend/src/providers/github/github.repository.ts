import axios from "axios";

const GITHUB_API_URL = "https://api.github.com";

export async function getGithubRepositories(accessToken: string) {
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
    console.log("GitHub Repositories:", response.data);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(
        "GitHub API Error:",
        error.response?.status,
        error.response?.data,
      );
    }

    throw new Error("Failed to fetch GitHub repositories");
  }
}