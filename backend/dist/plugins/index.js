"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerPlugins = registerPlugins;
const cors_1 = __importDefault(require("./cors"));
const swagger_1 = __importDefault(require("./swagger"));
const prisma_1 = __importDefault(require("./prisma"));
const jwt_1 = __importDefault(require("./jwt"));
async function registerPlugins(app) {
    await app.register(cors_1.default);
    await app.register(swagger_1.default);
    await app.register(prisma_1.default);
    await app.register(jwt_1.default);
}
