"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
require("./realtime/logger");
const socket_1 = require("./realtime/socket");
const start = async () => {
    const app = await (0, app_1.buildApp)();
    (0, socket_1.registerSocket)(app);
    try {
        await app.listen({
            port: Number(process.env.PORT) || 3000,
            host: '0.0.0.0',
        });
        app.log.info(`Server running at http://localhost:${process.env.PORT || 3000}`);
    }
    catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};
start();
