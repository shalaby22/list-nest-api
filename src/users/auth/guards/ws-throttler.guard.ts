import { Injectable } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerRequest } from '@nestjs/throttler';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class WsThrottlerGuard extends ThrottlerGuard {
  async handleRequest(requestProps: ThrottlerRequest): Promise<boolean> {
    const { context, limit, ttl, throttler, blockDuration, generateKey } =
      requestProps;

    const client: { conn: { remoteAddress: string } } = context
      .switchToWs()
      .getClient();

    const tracker: string = client.conn.remoteAddress;
    const key = generateKey(context, tracker, throttler.name as string);
    const { isBlocked } = await this.storageService.increment(
      key,
      ttl,
      limit,
      blockDuration,
      throttler.name as string,
    );

    // Throw an error when the user reached their limit.
    if (isBlocked) {
      throw new WsException({
        status: 'fail',
        message: 'Too many requests',
      });
    }

    return true;
  }
}
