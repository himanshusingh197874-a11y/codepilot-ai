"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerErrorHandler = registerErrorHandler;
async function registerErrorHandler(app) {
    app.setErrorHandler((error, request, reply) => {
        request.log.error(error);
        const statusCode = typeof error === 'object' && error !== null && 'statusCode' in error
            ? Number(error.statusCode) || 500
            : 500;
        const message = error instanceof Error ? error.message : 'Internal server error';
        reply.status(statusCode).send({
            success: false,
            message,
        });
    });
}
