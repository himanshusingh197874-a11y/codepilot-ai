"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.githubClient = void 0;
exports.getGithubUser = getGithubUser;
const axios_1 = __importDefault(require("axios"));
exports.githubClient = axios_1.default.create({
    baseURL: "https://api.github.com",
    headers: {
        Accept: "application/vnd.github+json",
    },
});
async function getGithubUser(token) {
    const { data } = await exports.githubClient.get("/user", {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return data;
}
