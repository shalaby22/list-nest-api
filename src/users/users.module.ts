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

@Module({
  controllers: [UsersController],
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule,
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '5d' },
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
    googleStrategy,
  ],
})
export class UsersModule {}
