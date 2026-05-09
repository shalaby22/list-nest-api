import { Strategy } from 'passport-google-oauth20';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users.entity';
import { Repository } from 'typeorm';
import { AuthProvider } from './auth.provider';
import { RegisterDto } from '../dtos/register.dto';
import { Profile } from '../../utils/types';

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
      callbackURL: configService.get<string>('GOOGLE_callbackURL') as string,
      scope: ['email', 'profile'],
    });
  }
  async validate(accessToken: string, refreshToken: string, profile: Profile) {
    // console.log(accessToken);
    // console.log(refreshToken);
    // console.log(profile);

    if (!profile)
      throw new BadRequestException('there is a problem with google auth');

    const foundUser = await this.usersRepository.findOneBy({
      email: profile.emails[0].value,
    });
    if (foundUser) {
      return this.authProvider.login(foundUser);
    } else {
      const registerDto: RegisterDto = {
        email: profile.emails[0].value,
        password: accessToken,
        phone: '',
        username: profile.id,
        firstName: profile.name.givenName,
        lastName: profile.name.familyName,
      };
      const user = await this.authProvider.Register(registerDto);
      //keep verified false until but phone number
      // user.isVerified = true;
      // await this.usersRepository.save(user);
      return user;
    }
  }
  //todo edit phone
  //add verify email and forgot password
}
