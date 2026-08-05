"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listOpenPullRequests = listOpenPullRequests;
const axios_1 = __importDefault(require("axios"));
async function listOpenPullRequests(token, owner, repo) {
    const res = await axios_1.default.get(`https://api.github.com/repos/${owner}/${repo}/pulls`, {
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github+json',
        },
        params: {
            state: 'open',
        },
    });
    return res.data;
}
