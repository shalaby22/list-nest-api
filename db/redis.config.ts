import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
// import { config } from 'dotenv';
// config({ path: ['.env', '.env.development.local'] });

const logger = new Logger('RedisConfig');

export const getRedisConnectionOptions = (
  configService: ConfigService,
  isBull: boolean = false,
) => {
  const redisUrl = configService.get<string>('REDIS_URL');
  const isProduction = configService.get<string>('NODE_ENV') === 'production';

  if (redisUrl && isProduction) {
    const { hostname, port, password, username } = new URL(redisUrl);

    return {
      host: hostname,
      port: Number(port),
      password,
      username: username,
      ...(isBull && { maxRetriesPerRequest: null }),
      keepAlive: 15000,
      connectTimeout: 30000,
      commandTimeout: 20000,
      retryStrategy: (times: number) => {
        if (times > 20) {
          logger.error(`Redis failed after ${times} retries — giving up`);
          return null;
        }
        const delay = Math.min(times * 200, 5000);
        logger.warn(`Redis retry attempt ${times} — waiting ${delay}ms`);
        return delay;
      },
    };
  }

  // local development
  return {
    host: configService.get<string>('REDIS_HOST'),
    port: configService.get<number>('REDIS_PORT'),
  };
};
export const registerRedisEvents = (client: Redis, context: string) => {
  client.on('close', () =>
    logger.warn(`[${context}] Connection lost — queuing commands`),
  );
  client.on('reconnecting', (delay: number) =>
    logger.warn(`[${context}] Reconnecting in ${delay}ms...`),
  );
  client.on('ready', () =>
    logger.log(`[${context}] Connection restored — flushing queue`),
  );
  client.on('error', (err: Error) => {
    if (err.message.includes('ECONNRESET')) {
      logger.warn(`[${context}] Connection reset — retrying automatically`);
      return;
    }
    if (err.message.includes('ECONNREFUSED')) {
      logger.error(`[${context}] Connection refused — is Redis running?`);
      return;
    }
    logger.error(`[${context}] Redis error: ${err.message}`);
  });
};
