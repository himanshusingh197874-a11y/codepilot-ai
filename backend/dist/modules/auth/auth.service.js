"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGithubLoginUrl = getGithubLoginUrl;
exports.loginWithGithub = loginWithGithub;
const github_oauth_1 = require("../../providers/github/github.oauth");
const github_client_1 = require("../../providers/github/github.client");
const auth_repository_1 = require("./auth.repository");
const jwt_1 = require("../../lib/jwt");
function getGithubLoginUrl() {
    return (0, github_oauth_1.getGithubAuthUrl)();
}
async function loginWithGithub(app, code) {
    const githubAccessToken = await (0, github_oauth_1.exchangeCodeForToken)(code);
    const githubUser = await (0, github_client_1.getGithubUser)(githubAccessToken);
    let user = await (0, auth_repository_1.findUserByGithubId)(githubUser.id.toString());
    if (!user) {
        user = await (0, auth_repository_1.createGithubUser)({
            githubUserId: githubUser.id.toString(),
            accessToken: githubAccessToken,
            username: githubUser.login,
            name: githubUser.name,
            email: githubUser.email,
            avatarUrl: githubUser.avatar_url,
        });
    }
    else {
        user = await (0, auth_repository_1.updateGithubUser)(user.id, {
            githubUserId: githubUser.id.toString(),
            accessToken: githubAccessToken,
            username: githubUser.login,
            name: githubUser.name,
            email: githubUser.email,
            avatarUrl: githubUser.avatar_url,
        });
    }
    const accessToken = await (0, jwt_1.generateAccessToken)(app, {
        id: user.id,
        username: user.username,
    });
    return {
        accessToken,
        user,
    };
}
