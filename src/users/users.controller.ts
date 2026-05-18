import { UpdateUserDto } from './dtos/update-user.dto';
import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Post,
  UseGuards,
  UseInterceptors,
  Param,
  Put,
  ParseIntPipe,
  Delete,
  HttpStatus,
  HttpCode,
  Res,
  Req,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { RegisterDto } from './dtos/register.dto';
import { LocalAuthGuard } from './auth/guards/local-auth.guard';
import type {
  RequestWithCookies,
  RequestWithWholeUser,
} from '../utils/interfaces';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { Roles } from './auth/decorators/roles.decorator';
import { UserType } from '../utils/enums';
import { RolesGuard } from './auth/guards/roles.guard';
import { User } from './auth/decorators/user.decorator';
import type { JwtPayloadType } from '../utils/types';
import { GoogleAuthGuard } from './auth/guards/oAuth.guard';
import { type Request, type Response } from 'express';

import { ConfigService } from '@nestjs/config';
import { ForgotPasswordDto } from './dtos/forgot-password.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { Throttle } from '@nestjs/throttler';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('api/users')
export class UsersController {
  constructor(
    private usersService: UsersService,
    private configService: ConfigService,
  ) {}

  /////////////////////////////////////
  // auth controllers
  /////////////////////////////////////

  //post :~/api/users/auth/register
  @Post('auth/register')
  public async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.usersService.register(registerDto);
    this.addRefreshTokenToCookie(res, user['refreshToken']);
    return user;
  }

  //post :~/api/users/auth/login
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  @Post('auth/login')
  public async login(
    @Req() req: RequestWithWholeUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.usersService.login(req.user);
    this.addRefreshTokenToCookie(res, user['refreshToken']);
    return user;
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
  public googleLoginCallback(
    @Req() req: RequestWithWholeUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.addRefreshTokenToCookie(res, req.user['refreshToken']);
    return req.user;
  }

  //Get :~/api/users/auth/refresh
  @Get('auth/refresh')
  public async refreshToken(@Req() req: RequestWithCookies) {
    return this.usersService.refreshAccessToken(req.cookies['refresh_token']);
  }

  //post :~/api/users/auth/logout
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @Post('auth/logout')
  async logout(
    @Req() req: RequestWithCookies,
    @User() jwtPayload: JwtPayloadType,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies['refresh_token'];
    await this.usersService.logout(jwtPayload.id, refreshToken);

    res.clearCookie('refresh_token');
    return 'logged out successfully';
  }

  //post :~/api/users/auth/logout-all
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @Post('auth/logout-all')
  async logoutAllDevices(
    @Req() req: RequestWithCookies,
    @User() jwtPayload: JwtPayloadType,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.usersService.logoutFromAllDevices(jwtPayload.id);
    res.clearCookie('refresh_token');

    return 'logged out From all Devices successfully';
  }
  /////////////////////////////////////
  // verify email controllers
  /////////////////////////////////////
  //Get :~/api/users/send-email-verification
  @Throttle({ short: { limit: 1, ttl: 60000 } })
  @Get('send-email-verification')
  @UseGuards(JwtAuthGuard)
  public getVerificationToken(@User() jwtPayload: JwtPayloadType) {
    return this.usersService.getVerificationToken(jwtPayload.id);
  }

  //Get :~/api/users/verify-email
  @Get('verify-email')
  public verifyEmail(@Query('token') token: string) {
    return this.usersService.verifyEmail(token);
  }

  /////////////////////////////////////
  // forgot password controllers
  /////////////////////////////////////
  //Post :~/api/users/forgot-password
  @Throttle({ short: { limit: 1, ttl: 60000 } })
  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.usersService.forgotPassword(forgotPasswordDto.email);
  }

  //Post :~/api/users/reset-password
  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.usersService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.password,
    );
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

  private addRefreshTokenToCookie(res: Response, refreshToken: any) {
    const isProduction = this.configService.get('NODE_ENV') === 'production';
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      //edit production to ssl
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'strict',
      maxAge:
        +this.configService.get('REFRESH_EXPIRATION_IN_DAYS') *
        24 *
        60 *
        60 *
        1000,
    });
  }
}
