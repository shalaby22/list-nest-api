import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './users.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './auth/local.strategy';
import { AuthProvider } from './auth/auth.provider';
import { UsersProvider } from './users.provider';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './auth/jwt.strategy';
import { googleStrategy } from './auth/oAuth.strategy';
import { RefreshTokenStoreProvider } from './auth/RefreshToken.provider';
import type { StringValue } from 'ms';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { WsJwtStrategy } from './auth/ws-jwt.strategy';
import { VerifyEmailProvider } from './auth/verifyEmail.provider';
import { ForgotPasswordProvider } from './auth/forgotPassword.provider';
import { BullModule } from '@nestjs/bullmq';
import { ForgotPasswordProcessor } from './auth/queues/forgotPassword.processor';
import { verifyEmailProcessor } from './auth/queues/verifyEmail.processor';
// import { Redis } from 'ioredis';
// import {
//   getRedisConnectionOptions,
//   registerRedisEvents,
// } from '../redis/redis.config';
// import { REDIS_CLIENT } from '../utils/constants';

import { QueueUsersEventsService } from './auth/queues/queue-events.service';
import { RedisModule } from '../redis/redis.module';

@Module({
  controllers: [UsersController],
  imports: [
    RedisModule,
    CloudinaryModule,
    TypeOrmModule.forFeature([User]),
    PassportModule,
    JwtModule.registerAsync({
      global: true,
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>(
            'JWT_ACCESS_EXPIRATION',
          ) as StringValue,
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      {
        name: 'forgotPassword-queue',
        defaultJobOptions: {
          removeOnComplete: true,
          removeOnFail: 100,
        },
      },
      {
        name: 'verifyEmail-queue',
        defaultJobOptions: {
          removeOnComplete: true,
          removeOnFail: 100,
        },
      },
    ),
  ],
  providers: [
    ForgotPasswordProcessor,
    verifyEmailProcessor,
    QueueUsersEventsService,
    UsersService,
    UsersProvider,
    AuthProvider,
    VerifyEmailProvider,
    ForgotPasswordProvider,
    LocalStrategy,
    JwtStrategy,
    WsJwtStrategy,
    RefreshTokenStoreProvider,
    googleStrategy,
    // {
    //   provide: REDIS_CLIENT,
    //   useFactory: (configService: ConfigService) => {
    //     const client = new Redis(
    //       getRedisConnectionOptions(configService, false),
    //     );
    //     registerRedisEvents(client, 'Auth');
    //     return client;
    //   },
    //   inject: [ConfigService],
    // },
  ],
  exports: [UsersService],
})
export class UsersModule {}
