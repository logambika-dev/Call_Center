import { createApp } from './app';
import { env } from './config/env';
import { checkDbConnection } from './config/database';
import { redis } from './config/redis';
import { logger } from './utils/logger';

async function bootstrap() {
  await checkDbConnection();
  logger.info('✅  PostgreSQL connected');

  await redis.connect();
  logger.info('✅  Redis connected');

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    logger.info(`🚀  VIA API running on http://localhost:${env.PORT} [${env.NODE_ENV}]`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Shutting down…`);
    server.close(async () => {
      await redis.quit();
      logger.info('Bye.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
}

bootstrap().catch(err => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
