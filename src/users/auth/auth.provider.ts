import { BadRequestException, Injectable } from '@nestjs/common';
import { RegisterDto } from '../dtos/register.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthProvider {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
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
  login(user: User) {
    const payload = { id: user.id, userType: user.userType };
    user['access_token'] = this.jwtService.sign(payload);
    return user;
  }
}
