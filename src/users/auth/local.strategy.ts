import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User } from '../users.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { RefreshTokenStoreProvider } from './RefreshToken.provider';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private refreshTokenStoreProvider: RefreshTokenStoreProvider,
  ) {
    super({ usernameField: 'email' });
  }

  async validate(email: string, password: string): Promise<any> {
    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }

  //validate user for login
  async validateUser(email: string, hashedPassword: string): Promise<User> {
    // const user = await this.usersRepository.findOne({
    //   where: { email: email },
    //   select: {
    //     id: true,
    //     email: true,
    //     password: true,
    //     userType: true,
    //   },
    // });
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();

    if (user) {
      const isMatch = await bcrypt.compare(hashedPassword, user.password);
      if (!isMatch) {
        throw new BadRequestException('incorrect email or password');
      }
      return user;
    } else {
      throw new BadRequestException('incorrect email or password');
    }
  }
}
