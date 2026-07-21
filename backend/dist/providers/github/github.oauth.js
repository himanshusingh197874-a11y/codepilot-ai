"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGithubAuthUrl = getGithubAuthUrl;
exports.exchangeCodeForToken = exchangeCodeForToken;
const axios_1 = __importDefault(require("axios"));
const env_1 = require("../../config/env");
function getGithubAuthUrl() {
    const params = new URLSearchParams({
        client_id: env_1.env.GITHUB_CLIENT_ID,
        redirect_uri: env_1.env.GITHUB_CALLBACK_URL,
        scope: "repo read:user user:email",
    });
    return `https://github.com/login/oauth/authorize?${params.toString()}`;
}
async function exchangeCodeForToken(code) {
    const { data } = await axios_1.default.post("https://github.com/login/oauth/access_token", {
        client_id: env_1.env.GITHUB_CLIENT_ID,
        client_secret: env_1.env.GITHUB_CLIENT_SECRET,
        code,
    }, {
        headers: {
            Accept: "application/json",
        },
    });
    return data.access_token;
}
