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
import { Redis } from 'ioredis';
import { REDIS_CLIENT } from '../utils/constants';
import { RefreshTokenStoreProvider } from './auth/RefreshToken.provider';

import type { StringValue } from 'ms';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { WsJwtStrategy } from './auth/ws-jwt.strategy';
import { VerifyEmailProvider } from './auth/verifyEmail.provider';
import { ForgotPasswordProvider } from './auth/forgotPassword.provider';
import { BullModule } from '@nestjs/bullmq';
import { ForgotPasswordProcessor } from './auth/queues/forgotPassword.processor';
import { verifyEmailProcessor } from './auth/queues/verifyEmail.processor';

@Module({
  controllers: [UsersController],
  imports: [
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
      },
      {
        name: 'verifyEmail-queue',
      },
    ),
  ],
  providers: [
    ForgotPasswordProcessor,
    verifyEmailProcessor,
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
    {
      provide: REDIS_CLIENT,
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL');

        if (redisUrl) {
          const parsedUrl = new URL(redisUrl);

          return new Redis({
            host: parsedUrl.hostname,
            port: Number(parsedUrl.port),
            password: parsedUrl.password,
            username: parsedUrl.username || 'default',
            maxRetriesPerRequest: null,
            keepAlive: 30000,
            connectTimeout: 30000,
            retryStrategy: (times: number) => Math.min(times * 100, 3000),
          });
        } else {
          return new Redis({
            host: configService.get<string>('REDIS_HOST'),
            port: configService.get<number>('REDIS_PORT'),
          });
        }
      },
      inject: [ConfigService],
    },
  ],
  exports: [REDIS_CLIENT, UsersService],
})
export class UsersModule {}
