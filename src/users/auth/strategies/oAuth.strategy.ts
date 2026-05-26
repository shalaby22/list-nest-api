import { Strategy } from 'passport-google-oauth20';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../users.entity';
import { Repository } from 'typeorm';
import { AuthProvider } from '../auth.provider';
import { RegisterDto } from '../../dtos/register.dto';
import { Profile } from '../../../utils/types';
import * as crypto from 'crypto';

@Injectable()
export class googleStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private authProvider: AuthProvider,
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID') as string,
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET') as string,
      callbackURL: `${configService.get<string>('APP_HOST')}${configService.get<string>('GOOGLE_CALLBACK_URL')}`,
      scope: ['email', 'profile'],
    });
  }
  async validate(accessToken: string, refreshToken: string, profile: Profile) {
    if (!profile)
      throw new BadRequestException('there is a problem with google auth');

    const foundUser = await this.usersRepository.findOneBy({
      email: profile.emails[0].value,
    });
    if (foundUser) {
      if (foundUser.phone && !foundUser.isVerified) {
        foundUser.isVerified = true;
        await this.usersRepository.save(foundUser);
      }
      return this.authProvider.login(foundUser);
    } else {
      const password = crypto.randomBytes(32).toString('hex');
      const registerDto: RegisterDto = {
        email: profile.emails[0].value,
        password: password,
        phone: '',
        username: profile.id,
        firstName: profile.name.givenName,
        lastName: profile.name.familyName,
      };
      const user = await this.authProvider.Register(registerDto);
      //keep verified false until adding phone number can't create item or start chat before being verified
      // user.isVerified = true;
      // await this.usersRepository.save(user);
      return user;
    }
  }
}
