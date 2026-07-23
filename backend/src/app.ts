import Fastify from 'fastify';
import { registerPlugins } from './plugins';
import { registerRoutes } from './routes';

export async function buildApp() {
  const app = Fastify({
    logger: {
      transport: {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      },
    },
  });

  await registerPlugins(app);
  await registerRoutes(app);

  return app;
}