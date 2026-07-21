"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
const prisma_1 = require("../lib/prisma");
exports.default = (0, fastify_plugin_1.default)(async function (app) {
    await prisma_1.prisma.$connect();
    app.decorate('prisma', prisma_1.prisma);
    app.addHook('onClose', async () => {
        await prisma_1.prisma.$disconnect();
    });
});
