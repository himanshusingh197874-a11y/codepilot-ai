"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRoutes = registerRoutes;
const health_route_1 = require("./health.route");
const auth_routes_1 = __importDefault(require("../modules/auth/auth.routes"));
const repository_routes_1 = __importDefault(require("../modules/repository/repository.routes"));
const webhook_routes_1 = __importDefault(require("../modules/webhook/webhook.routes"));
const review_routes_1 = __importDefault(require("../modules/review/review.routes"));
async function registerRoutes(app) {
    app.register(health_route_1.healthRoutes, {
        prefix: "/api/v1",
    });
    app.register(auth_routes_1.default, {
        prefix: "/api/v1/auth",
    });
    app.register(repository_routes_1.default, {
        prefix: "/api/v1/repositories",
    });
    await app.register(webhook_routes_1.default, {
        prefix: '/api/v1/webhooks',
    });
    await app.register(review_routes_1.default, { prefix: '/api/v1' });
}
