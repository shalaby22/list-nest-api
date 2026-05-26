import { Inject, Injectable } from '@nestjs/common';
import { REDIS_CLIENT } from '../../utils/constants';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

//todo can add token rotation in the future
@Injectable()
export class RefreshTokenStoreProvider {
  constructor(
    @Inject(REDIS_CLIENT) private readonly redisClient: Redis,
    private configService: ConfigService,
  ) {}

  // =========================================================================

  /**
   * Hashes and securely stores a user's refresh token in Redis with an expiration TTL.
   * @param userId - The ID of the authenticated user
   * @param refreshToken - The plain refresh token string to be stored
   * @returns A success message object
   */
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

    return { message: 'added to redis successfully' };
  }

  // =========================================================================

  /**
   * Validates a refresh token against the Redis store.
   * @param refreshToken - The provided plain refresh token
   * @returns The user ID associated with the token, or an empty string if invalid
   */
  async isRefreshTokenValid(refreshToken: string): Promise<string> {
    const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    const key = `refresh:${hash}`;
    const data = await this.redisClient.get(key);
    if (!data) return '';
    const { userId } = JSON.parse(data) as { userId: string };
    return userId;
  }

  // =========================================================================

  /**
   * Revokes a specific refresh token session by removing it from Redis.
   * @param userId - The ID of the user
   * @param refreshToken - The specific token to revoke
   */
  async deleteRefreshToken(
    userId: number,
    refreshToken: string,
  ): Promise<void> {
    if (!refreshToken) return;
    const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    await this.redisClient.del(`refresh:${hash}`);
    await this.redisClient.srem(`user_sessions:${userId}`, hash);
  }
  // =========================================================================

  /**
   * Wipes out all active sessions for a specific user across the system.
   * @param userId - The targeted user ID
   */
  async deleteAllSessions(userId: number): Promise<void> {
    const hashes = await this.redisClient.smembers(`user_sessions:${userId}`);

    if (hashes.length > 0) {
      const refreshKeys = hashes.map((hash) => `refresh:${hash}`);
      await this.redisClient.del(...refreshKeys);
    }

    await this.redisClient.del(`user_sessions:${userId}`);
  }
}
