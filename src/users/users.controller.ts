import { UpdateUserDto } from './dtos/update-user.dto';
import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Post,
  UseGuards,
  UseInterceptors,
  Request,
  Param,
  Put,
  ParseIntPipe,
  Delete,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { RegisterDto } from './dtos/register.dto';
import { LocalAuthGuard } from './auth/guards/local-auth.guard';
import type { RequestWithWholeUser } from '../utils/interfaces';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { Roles } from './auth/decorators/roles.decorator';
import { UserType } from '../utils/enums';
import { RolesGuard } from './auth/guards/roles.guard';
import { User } from './auth/decorators/user.decorator';
import type { JwtPayloadType } from '../utils/types';
import { GoogleAuthGuard } from './auth/guards/oAuth.guard';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('api/users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  /////////////////////////////////////
  // auth controllers
  /////////////////////////////////////

  //post :~/api/users/auth/register
  @Post('auth/register')
  public register(@Body() registerDto: RegisterDto) {
    return this.usersService.register(registerDto);
  }

  //post :~/api/users/auth/login
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  @Post('auth/login')
  public login(@Request() req: RequestWithWholeUser) {
    return this.usersService.login(req.user);
  }

  //Get :~/api/users/auth/google/login
  @UseGuards(GoogleAuthGuard)
  @Get('auth/google/login')
  public googleLogin() {
    return 'done google/login';
  }

  //Get :~/api/users/auth/google/callback
  @UseGuards(GoogleAuthGuard)
  @Get('auth/google/callback')
  public googleLoginCallback(@Request() req: RequestWithWholeUser) {
    return req.user;
  }

  /////////////////////////////////////
  // users controllers
  /////////////////////////////////////

  //Get :~/api/users
  @Get()
  @Roles([UserType.ADMIN])
  @UseGuards(JwtAuthGuard, RolesGuard)
  public findAll() {
    return this.usersService.getAllUsers();
  }

  //Get :~/api/users/me
  @Get('me')
  @UseGuards(JwtAuthGuard)
  public getMyUser(@User() jwtPayload: JwtPayloadType) {
    return this.usersService.getUserBy(jwtPayload.id);
  }

  //Get :~/api/users/:id
  @Get(':id')
  public getUser(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.getUserBy(id);
  }

  //Put :~/api/users/me
  @Put('me')
  @UseGuards(JwtAuthGuard)
  public updateMyUser(
    @User() jwtPayload: JwtPayloadType,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.editUser(jwtPayload.id, updateUserDto);
  }

  //Put :~/api/users/:id
  @Put(':id')
  @Roles([UserType.ADMIN])
  @UseGuards(JwtAuthGuard, RolesGuard)
  public updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.editUser(id, updateUserDto);
  }

  //Delete :~/api/users/me
  @Delete('me')
  @UseGuards(JwtAuthGuard)
  public deleteMyUser(@User() jwtPayload: JwtPayloadType) {
    return this.usersService.deleteUser(jwtPayload.id);
  }

  //Delete :~/api/users/:id
  @Delete(':id')
  @Roles([UserType.ADMIN])
  @UseGuards(JwtAuthGuard, RolesGuard)
  public deleteUser(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.deleteUser(id);
  }
}
