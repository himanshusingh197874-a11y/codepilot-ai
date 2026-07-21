"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthRoutes = healthRoutes;
async function healthRoutes(app) {
    app.get('/health', async () => {
        return {
            success: true,
            message: 'API is healthy',
            timestamp: new Date().toISOString(),
        };
    });
}
