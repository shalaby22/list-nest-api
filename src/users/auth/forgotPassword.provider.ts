import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users.entity';
import { Repository } from 'typeorm';
import { MailerService } from '@nestjs-modules/mailer';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { REDIS_CLIENT } from '../../utils/constants';
import Redis from 'ioredis';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ForgotPasswordProvider {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private readonly mailerService: MailerService,
    @Inject(REDIS_CLIENT) private readonly redisClient: Redis,
  ) {}

  private async sendPasswordResetEmail(
    email: string,
    name: string,
    url: string,
  ) {
    await this.mailerService.sendMail({
      to: email,
      from: `<admin@nestList.com>`,
      subject: 'RESET PASSWORD - LIST NEST',
      template: 'forgot-password',
      context: {
        name: name,
        url: url,
      },
    });
  }

  async forgotPassword(email: string) {
    const user = await this.usersRepository.findOneBy({ email });
    if (!user)
      return 'we sent a password reset link for your e-mail if you are user';

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hash = crypto.createHash('sha256').update(resetToken).digest('hex');

    const expireInMilleSeconds =
      +this.configService.get('REFRESH_RESET_PASSWORD_IN_MINUTES') * 60;

    await this.redisClient.set(
      `reset-token:${hash}`,
      user.id,
      'EX',
      expireInMilleSeconds,
    );

    const resetUrl = `${this.configService.get<string>('APP_HOST')}/front-end/reset-password?token=${resetToken}`;

    await this.sendPasswordResetEmail(user.email, user.username, resetUrl);

    return 'we sent a password reset link for your e-mail if you are user';
  }

  async resetPassword(token: string, newPassword: string) {
    const hash = crypto.createHash('sha256').update(token).digest('hex');

    const redisKey = `reset-token:${hash}`;

    const userId = await this.redisClient.get(redisKey);

    if (!userId) {
      throw new BadRequestException('Invalid or expired reset token');
    }
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    const user = await this.usersRepository.findOneBy({ id: parseInt(userId) });
    if (!user) throw new BadRequestException("can't found your user");
    user.password = hashedNewPassword;

    await this.usersRepository.save(user);
    await this.redisClient.del(redisKey);

    return 'Password has been successfully reset';
  }
}
