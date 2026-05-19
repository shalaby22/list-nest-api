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
import { ApiBearerAuth, ApiBody, ApiOperation } from '@nestjs/swagger';
import { LoginDto } from './dtos/login.dto';

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
  @ApiOperation({
    summary: 'register user, generate tokens and send verification email',
  })
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
  @ApiOperation({ summary: 'Authenticate user and generate tokens' })
  @ApiBody({ type: LoginDto })
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

  @ApiOperation({
    summary: 'Initiate Google OAuth2 login flow',
    description:
      'Redirects the browser to Google authentication page. Best tested directly via browser link rather than Swagger execute.',
  })
  @UseGuards(GoogleAuthGuard)
  @Get('auth/google/login')
  public googleLogin() {
    return 'done google/login';
  }

  //Get :~/api/users/auth/google/callback
  @ApiOperation({ summary: 'Google OAuth2 callback landing endpoint' })
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
  @ApiOperation({
    summary: 'Refresh access token',
    description:
      'Reads the refresh_token from incoming HttpOnly cookies and issues a new access token.',
  })
  @Get('auth/refresh')
  public async refreshToken(@Req() req: RequestWithCookies) {
    return this.usersService.refreshAccessToken(req.cookies['refresh_token']);
  }

  //post :~/api/users/auth/logout
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Logout current session',
    description:
      'Invalidates the current refresh token and clears the authentication cookie.',
  })
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
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Logout from all devices',
    description:
      'Invalidates all active refresh tokens for this user and clears the cookie.',
  })
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
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Send email verification token to the logged-in user',
  })
  public getVerificationToken(@User() jwtPayload: JwtPayloadType) {
    return this.usersService.getVerificationToken(jwtPayload.id);
  }

  //Get :~/api/users/verify-email
  @Get('verify-email')
  @ApiOperation({
    summary: 'Verify user email using the token provided via query link',
  })
  public verifyEmail(@Query('token') token: string) {
    return this.usersService.verifyEmail(token);
  }

  /////////////////////////////////////
  // forgot password controllers
  /////////////////////////////////////
  //Post :~/api/users/forgot-password
  @Throttle({ short: { limit: 1, ttl: 60000 } })
  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset email link' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.usersService.forgotPassword(forgotPasswordDto.email);
  }

  //Post :~/api/users/reset-password
  @Post('reset-password')
  @ApiOperation({
    summary: 'Reset user password using the token sent to the email',
  })
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
  @ApiBearerAuth()
  @ApiOperation({ summary: '(Admin only) Get All users' })
  @Roles([UserType.ADMIN])
  @UseGuards(JwtAuthGuard, RolesGuard)
  public findAll() {
    return this.usersService.getAllUsers();
  }

  //Get :~/api/users/me
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current logged-in user profile' })
  @Get('me')
  @UseGuards(JwtAuthGuard)
  public getMyUser(@User() jwtPayload: JwtPayloadType) {
    return this.usersService.getUserBy(jwtPayload.id);
  }

  //Get :~/api/users/:id
  @Get(':id')
  @ApiOperation({ summary: 'Get any user profile by ID (Public)' })
  public getUser(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.getUserBy(id);
  }

  //Put :~/api/users/me
  @ApiBearerAuth()
  @Put('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update current logged-in user profile' })
  public updateMyUser(
    @User() jwtPayload: JwtPayloadType,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.editUser(jwtPayload.id, updateUserDto);
  }

  //Put :~/api/users/:id
  @ApiBearerAuth()
  @Put(':id')
  @Roles([UserType.ADMIN])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: '(Admin only) Update any user profile by ID ' })
  public updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.editUser(id, updateUserDto);
  }

  //Delete :~/api/users/me
  @ApiBearerAuth()
  @Delete('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete current logged-in user account' })
  public deleteMyUser(@User() jwtPayload: JwtPayloadType) {
    return this.usersService.deleteUser(jwtPayload.id);
  }

  //Delete :~/api/users/:id
  @ApiBearerAuth()
  @Delete(':id')
  @Roles([UserType.ADMIN])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: '(Admin only) Delete any user account by ID' })
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
