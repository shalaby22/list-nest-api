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

  // =========================================================================

  /**
   * Generates a verification token and dispatches an email via BullMQ.
   * @param id - The ID of the user
   * @returns A success message object
   */
  async getVerificationToken(id: number) {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) throw new NotFoundException('not found your users');
    if (user.isVerified)
      throw new BadRequestException('your email is already verified');

    if (!user.phone)
      throw new BadRequestException(
        'You must add a phone number before verifying your email',
      );

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
    return { message: 'sent you an email check your inbox' };
  }

  // =========================================================================

  /**
   * Validates the provided email verification token and updates the user's status.
   * @param token - The JWT token received via email link
   * @returns A success message object detailing the verification outcome
   */
  async verifyEmail(token: string) {
    if (!token) throw new BadRequestException('no token provided');

    let payload: { email: string; verify: boolean };

    try {
      payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_VERIFY_EMAIL_SECRET'),
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'TokenExpiredError') {
        throw new BadRequestException(
          'The verification link has expired. Please request a new one.',
        );
      }
      throw new BadRequestException('Invalid verification token.');
    }
    if (!payload.verify) throw new BadRequestException('wrong token provided');
    const user = await this.usersRepository.findOneBy({ email: payload.email });
    if (!user) throw new BadRequestException('could not found your user');
    if (!user.isVerified) {
      user.isVerified = true;
      await this.usersRepository.save(user);
      return { message: 'Your email has been verified successfully' };
    } else {
      return { message: 'your email already verified ' };
    }
  }
}

// delete safely
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
