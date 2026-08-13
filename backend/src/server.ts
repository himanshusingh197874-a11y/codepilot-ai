import { buildApp } from './app';
import "./realtime/logger";
import { registerSocket } from "./realtime/socket";

const start = async () => {
  const app = await buildApp();

   registerSocket(app);

  try {
    await app.listen({
      port: Number(process.env.PORT) || 3000,
      host: '0.0.0.0',
    });

    app.log.info(`Server running at http://localhost:${process.env.PORT || 3000}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
