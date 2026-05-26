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
import { MailerService } from '@nestjs-modules/mailer';
import { VerifyEmailProvider } from './verifyEmail.provider';
import { ForgotPasswordProvider } from './forgotPassword.provider';

@Injectable()
export class AuthProvider {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
    private verifyEmailProvider: VerifyEmailProvider,
    private refreshTokenStoreProvider: RefreshTokenStoreProvider,
    private forgotPasswordProvider: ForgotPasswordProvider,
    private readonly mailerService: MailerService,
  ) {}

  // =========================================================================

  /**
   * Registers a new user
   * @param registerDto - The payload containing new user details
   * @returns The newly created user with access and refresh tokens
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
    const result = this.login(resultUser);
    // await this.verifyEmailProvider.getVerificationToken(resultUser.id);
    // didn't send verify Email for all when registered because oAuth needs to add phone number first
    return result;
  }

  // =========================================================================

  /**
   * Attaches JWT access and refresh tokens to an authenticated user instance.
   * depends on passport guard on local strategy
   * @param user - The authenticated user entity
   * @returns The user with with active tokens
   */
  async login(user: User) {
    const payload = { id: user.id, userType: user.userType };
    const refreshToken = await this.makeRefreshToken(payload);
    const accessToken = this.jwtService.sign(payload);
    return { user, accessToken, refreshToken };
  }

  // =========================================================================

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
    const accessToken = this.jwtService.sign(payload);

    return { user, accessToken };
  }

  // =========================================================================

  /**
   * Generates secure random string (Refresh Token).
   * @param payload - JwtPayloadType
   * @returns The plain refresh token
   */
  private async makeRefreshToken(payload: JwtPayloadType) {
    const refreshToken = crypto.randomBytes(32).toString('hex');
    await this.refreshTokenStoreProvider.storeRefreshToken(
      payload.id,
      refreshToken,
    );
    return refreshToken;
  }

  // =========================================================================
  // DELEGATION METHODS
  // =========================================================================

  deleteRefreshToken(userId: number, refreshToken: string) {
    return this.refreshTokenStoreProvider.deleteRefreshToken(
      userId,
      refreshToken,
    );
  }

  deleteAllSessions(userId: number) {
    return this.refreshTokenStoreProvider.deleteAllSessions(userId);
  }

  getVerificationToken(id: number) {
    return this.verifyEmailProvider.getVerificationToken(id);
  }
  verifyEmail(token: string) {
    return this.verifyEmailProvider.verifyEmail(token);
  }

  forgotPassword(email: string) {
    return this.forgotPasswordProvider.forgotPassword(email);
  }
  resetPassword(token: string, newPassword: string) {
    return this.forgotPasswordProvider.resetPassword(token, newPassword);
  }
}
