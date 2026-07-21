"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerErrorHandler = registerErrorHandler;
async function registerErrorHandler(app) {
    app.setErrorHandler((error, request, reply) => {
        request.log.error(error);
        reply.status(error.statusCode ?? 500).send({
            success: false,
            message: error.message,
        });
    });
}
