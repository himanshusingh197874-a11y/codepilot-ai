import axios from "axios";
import { GithubUser } from "./github.types";

export const githubClient = axios.create({
  baseURL: "https://api.github.com",
  headers: {
    Accept: "application/vnd.github+json",
  },
});

export async function getGithubUser(token: string) {
  const { data } = await githubClient.get<GithubUser>("/user", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return data;
}