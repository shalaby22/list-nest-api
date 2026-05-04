import { JwtPayloadType } from './../../utils/types';
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { RegisterDto } from '../dtos/register.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { RefreshTokenStoreProvider } from './RefreshToken.provider';
import * as crypto from 'crypto';

@Injectable()
export class AuthProvider {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
    private refreshTokenStoreProvider: RefreshTokenStoreProvider,
  ) {}

  /**
   * Register new user
   * @param registerDto
   * @returns user with token
   */
  async Register(registerDto: RegisterDto) {
    const foundUser = await this.usersRepository.findOne({
      where: { email: registerDto.email },
    });
    if (foundUser)
      throw new BadRequestException('this email already have an account');

    const hash = await bcrypt.hash(registerDto.password, 10);

    const user = this.usersRepository.create({
      username: registerDto.username,
      email: registerDto.email,
      phone: registerDto.phone,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      password: hash,
    });
    const resultUser = await this.usersRepository.save(user);
    const userWithToken = this.login(resultUser);

    return userWithToken;
  }

  /**
   *login functions depends on passport guard on local strategy
   *its job : adding jwt token to user
   * @param user
   * @returns user with token
   */
  async login(user: User) {
    const payload = { id: user.id, userType: user.userType };
    const refreshToken = await this.makeRefreshToken(payload);
    user['access_token'] = this.jwtService.sign(payload);
    user['refreshToken'] = refreshToken;
    return user;
  }

  /**
   * refresh access token
   * @param refreshToken
   * @returns user with access token
   */
  async refreshAccessToken(refreshToken: string) {
    if (!refreshToken)
      throw new UnauthorizedException('there is no refresh token');
    const userId =
      await this.refreshTokenStoreProvider.isRefreshTokenValid(refreshToken);

    if (!userId) {
      throw new UnauthorizedException('Session expired or revoked');
    }

    const user = await this.usersRepository.findOne({
      where: { id: +userId },
    });

    if (!user) throw new UnauthorizedException('not found this user');
    const payload = { id: user.id, userType: user.userType };
    user['access_token'] = this.jwtService.sign(payload);

    return user;
  }

  private async makeRefreshToken(payload: JwtPayloadType) {
    const refreshToken = crypto.randomBytes(32).toString('hex');
    await this.refreshTokenStoreProvider.storeRefreshToken(
      payload.id,
      refreshToken,
    );
    return refreshToken;
  }

  deleteRefreshToken(userId: number, refreshToken: string) {
    return this.refreshTokenStoreProvider.deleteRefreshToken(
      userId,
      refreshToken,
    );
  }

  deleteAllSessions(userId: number) {
    return this.refreshTokenStoreProvider.deleteAllSessions(userId);
  }
}
