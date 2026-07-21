"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
const jwt_1 = __importDefault(require("@fastify/jwt"));
const env_1 = require("../config/env");
exports.default = (0, fastify_plugin_1.default)(async function jwtPlugin(app) {
    app.register(jwt_1.default, {
        secret: env_1.env.JWT_SECRET,
        sign: {
            expiresIn: "15m",
        },
    });
    app.decorate("authenticate", async function (request, reply) {
        console.log("Authorization:", request.headers.authorization);
        try {
            await request.jwtVerify();
            console.log("Verified User:", request.user);
        }
        catch (err) {
            console.error("JWT VERIFY ERROR:");
            console.error(err);
            return reply.code(401).send({
                message: "Unauthorized",
                reason: err instanceof Error ? err.message : err,
            });
        }
    });
});
