"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAccessToken = generateAccessToken;
async function generateAccessToken(app, user) {
    return app.jwt.sign({
        sub: user.id,
        username: user.username,
    });
}
