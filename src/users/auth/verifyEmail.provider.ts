import { StringValue } from 'ms';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users.entity';
import { Repository } from 'typeorm';
import { MailerService } from '@nestjs-modules/mailer';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class VerifyEmailProvider {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,

    private configService: ConfigService,
    private readonly mailerService: MailerService,
    @InjectQueue('verifyEmail-queue')
    private emailQueue: Queue,
  ) {}

  //todo delete safely
  // private async sendVerificationEmail(
  //   email: string,
  //   name: string,
  //   verificationUrl: string,
  // ) {
  //   await this.mailerService.sendMail({
  //     to: email,
  //     from: `<admin@nestList.com>`,
  //     subject: 'Welcome to ListNest - Verify Your Account',
  //     template: 'verify-email',
  //     context: {
  //       name: name,
  //       url: verificationUrl,
  //     },
  //   });
  // }

  async getVerificationToken(id: number) {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) throw new NotFoundException('not found your users');
    if (user.isVerified)
      throw new BadRequestException('your email is already verified');

    if (!user.phone) return 'you have to add a phone number first';

    const payload = { email: user.email, verify: true };
    const token = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_VERIFY_EMAIL_SECRET'),
      expiresIn: this.configService.get<string>(
        'JWT_VERIFY_EMAIL_EXPIRATION',
      ) as StringValue,
    });
    const url = `${this.configService.get<string>('APP_HOST')}/api/users/verify-email?token=${token}`;

    await this.emailQueue.add('send-verify-email', {
      email: user.email,
      name: user.username,
      url,
    });
    // await this.sendVerificationEmail(user.email, user.username, url);
    return 'sent you an email check your inbox';
  }

  async verifyEmail(token: string) {
    if (!token) throw new BadRequestException('no token provided');
    const payload: { email: string; verify: boolean } =
      await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_VERIFY_EMAIL_SECRET'),
      });
    if (!payload.verify) throw new BadRequestException('wrong token provided');
    const user = await this.usersRepository.findOneBy({ email: payload.email });
    if (!user) throw new BadRequestException('could not found your user');
    if (!user.isVerified) {
      user.isVerified = true;
      await this.usersRepository.save(user);
      return 'your email verified successfully';
    } else {
      return 'your email already verified ';
    }
  }
}
