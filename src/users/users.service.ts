import { UpdateUserDto } from './dtos/update-user.dto';
import { Injectable } from '@nestjs/common';
import { UsersProvider } from './users.provider';
import { AuthProvider } from './auth/auth.provider';
import { RegisterDto } from './dtos/register.dto';
import { User } from './users.entity';

@Injectable()
export class UsersService {
  constructor(
    private usersProvider: UsersProvider,
    private authProvider: AuthProvider,
  ) {}

  register(registerDto: RegisterDto) {
    return this.authProvider.Register(registerDto);
  }

  login(user: User) {
    return this.authProvider.login(user);
  }

  refreshAccessToken(refreshToken: string) {
    return this.authProvider.refreshAccessToken(refreshToken);
  }

  logout(userId: number, refreshToken: string) {
    return this.authProvider.deleteRefreshToken(userId, refreshToken);
  }

  logoutFromAllDevices(userId: number) {
    return this.authProvider.deleteAllSessions(userId);
  }

  getAllUsers() {
    return this.usersProvider.getAllUsers();
  }

  getUserBy(id: number) {
    return this.usersProvider.getUserBy(id);
  }

  editUser(id: number, updateUserDto: UpdateUserDto) {
    return this.usersProvider.editUserBy(id, updateUserDto);
  }

  deleteUser(id: number) {
    return this.usersProvider.deleteUserBy(id);
  }
}

