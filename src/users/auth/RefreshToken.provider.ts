import { Inject, Injectable } from '@nestjs/common';
import { REDIS_CLIENT } from '../../utils/constants';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class RefreshTokenStoreProvider {
  constructor(
    @Inject(REDIS_CLIENT) private readonly redisClient: Redis,
    private configService: ConfigService,
  ) {}
  //todo can add token rotation in the future

  async storeRefreshToken(userId: number, refreshToken: string) {
    const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const key = `refresh:${hash}`;

    const expiresInSeconds =
      +this.configService.get('REFRESH_EXPIRATION_IN_DAYS') * 24 * 60 * 60;

    await this.redisClient.set(
      key,
      JSON.stringify({
        userId,
        createdAt: Date.now(),
      }),
      'EX',
      expiresInSeconds,
    );
    await this.redisClient.sadd(`user_sessions:${userId}`, hash);
    await this.redisClient.expire(`user_sessions:${userId}`, expiresInSeconds);

    return 'added to redis successfully';
  }

  async isRefreshTokenValid(refreshToken: string): Promise<string> {
    const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    const key = `refresh:${hash}`;
    const data = await this.redisClient.get(key);
    if (!data) return '';
    const { userId } = JSON.parse(data) as { userId: string };
    return userId;
  }

  async deleteRefreshToken(
    userId: number,
    refreshToken: string,
  ): Promise<void> {
    if (!refreshToken) return;
    const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    await this.redisClient.del(`refresh:${hash}`);
    await this.redisClient.srem(`user_sessions:${userId}`, hash);
  }

  async deleteAllSessions(userId: number): Promise<void> {
    const hashes = await this.redisClient.smembers(`user_sessions:${userId}`);

    if (hashes.length > 0) {
      const refreshKeys = hashes.map((hash) => `refresh:${hash}`);
      await this.redisClient.del(...refreshKeys);
    }

    await this.redisClient.del(`user_sessions:${userId}`);
  }
}
