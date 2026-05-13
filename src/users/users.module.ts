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
  ],
  providers: [
    UsersService,
    UsersProvider,
    AuthProvider,
    LocalStrategy,
    JwtStrategy,
    WsJwtStrategy,
    RefreshTokenStoreProvider,
    googleStrategy,
    {
      provide: REDIS_CLIENT,
      useFactory: (configService: ConfigService) => {
        return new Redis({
          host: configService.get<string>('REDIS_HOST'),
          port: configService.get<number>('REDIS_PORT'),
          //add password here todo in production
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [REDIS_CLIENT, UsersService],
})
export class UsersModule {}
