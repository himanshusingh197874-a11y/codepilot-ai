"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGithubRepositories = getGithubRepositories;
const axios_1 = __importDefault(require("axios"));
const GITHUB_API_URL = "https://api.github.com";
async function getGithubRepositories(accessToken) {
    try {
        const response = await axios_1.default.get(`${GITHUB_API_URL}/user/repos`, {
            params: {
                per_page: 100,
                sort: "updated",
            },
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28",
            },
        });
        console.log("GitHub Repositories:", response.data);
        return response.data;
    }
    catch (error) {
        if (axios_1.default.isAxiosError(error)) {
            console.error("GitHub API Error:", error.response?.status, error.response?.data);
        }
        throw new Error("Failed to fetch GitHub repositories");
    }
}
