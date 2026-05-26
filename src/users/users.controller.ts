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
  RequestWithUserAndTokens,
  RequestWithWholeUser,
} from '../utils/interfaces';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { Roles } from './auth/decorators/roles.decorator';
import { UserType } from '../utils/enums';
import { RolesGuard } from './auth/guards/roles.guard';
import { User } from './auth/decorators/user.decorator';
import type { JwtPayloadType } from '../utils/types';
import { GoogleAuthGuard } from './auth/guards/oAuth.guard';
import { type Response } from 'express';
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

  // =========================================================================
  // AUTHENTICATION ENDPOINTS
  // =========================================================================

  /**
   * [POST] /api/users/auth/register
   * Access: Public
   * Description: Register user, generate tokens
   */
  @ApiOperation({
    summary: 'register new user',
  })
  @Post('auth/register')
  public async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.usersService.register(registerDto);
    this.addRefreshTokenToCookie(res, result.refreshToken);
    return { user: result.user, accessToken: result.accessToken };
  }
  // =========================================================================

  /**
   * [POST] /api/users/auth/login
   * Access: Public
   * Description: Authenticate user via local strategy and generate tokens
   */
  @ApiOperation({ summary: 'Authenticate user and generate tokens' })
  @ApiBody({ type: LoginDto })
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  @Post('auth/login')
  public async login(
    @Req() req: RequestWithWholeUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.usersService.login(req.user);
    this.addRefreshTokenToCookie(res, result.refreshToken);
    return { user: result.user, accessToken: result.accessToken };
  }

  // =========================================================================

  /**
   * [GET] /api/users/auth/google/login
   * Access: Public
   * Description: Initiate Google OAuth2 login flow
   */
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
  // =========================================================================

  /**
   * [GET] /api/users/auth/google/callback
   * Access: Public
   * Description: Google OAuth2 callback landing endpoint
   */
  @ApiOperation({ summary: 'Google OAuth2 callback landing endpoint' })
  @UseGuards(GoogleAuthGuard)
  @Get('auth/google/callback')
  public googleLoginCallback(
    @Req() req: RequestWithUserAndTokens,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.addRefreshTokenToCookie(res, req.user.refreshToken);
    return { user: req.user.user, accessToken: req.user.accessToken };
  }

  // =========================================================================

  /**
   * [GET] /api/users/auth/refresh
   * Access: Public (Requires Refresh Token Cookie)
   * Description: get a new access token using a valid HTTP-only refresh token cookie
   */
  @ApiOperation({
    summary: 'Refresh access token',
    description:
      'Reads the refresh_token from incoming HttpOnly cookies and issues a new access token.',
  })
  @Get('auth/refresh')
  public async refreshToken(@Req() req: RequestWithCookies) {
    return this.usersService.refreshAccessToken(req.cookies['refresh_token']);
  }

  // =========================================================================

  /**
   * [POST] /api/users/auth/logout
   * Access: Users
   * Description: Invalidate current refresh token and clear the auth cookie
   */
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

  // =========================================================================

  /**
   * [POST] /api/users/auth/logout-all
   * Access: Users
   * Description: Invalidate all active refresh tokens for the user and clear the cookie
   */
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

  // =========================================================================
  // EMAIL VERIFICATION ENDPOINTS
  // =========================================================================

  /**
   * [GET] /api/users/send-email-verification
   * Access: Users
   * Description: Dispatch an email containing the verification token link
   */
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
  // =========================================================================

  /**
   * [GET] /api/users/verify-email
   * Access: Public
   * Description: Verify user email using the provided query token
   */
  @Get('verify-email')
  @ApiOperation({
    summary: 'Verify user email using the token provided via query link',
  })
  public verifyEmail(@Query('token') token: string) {
    return this.usersService.verifyEmail(token);
  }

  // =========================================================================
  // PASSWORD RECOVERY ENDPOINTS
  // =========================================================================

  /**
   * [POST] /api/users/forgot-password
   * Access: Public
   * Description: Request a password reset link to be sent via email
   */
  @Throttle({ short: { limit: 1, ttl: 60000 } })
  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset email link' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.usersService.forgotPassword(forgotPasswordDto.email);
  }

  // =========================================================================

  /**
   * [POST] /api/users/reset-password
   * Access: Public
   * Description: Reset the user password utilizing the token sent via email
   */
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
  // =========================================================================
  // USER MANAGEMENT ENDPOINTS
  // =========================================================================

  /**
   * [GET] /api/users
   * Access: Admins Only
   * Description: Retrieve a list of all registered users
   */
  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: '(Admin only) Get All users' })
  @Roles([UserType.ADMIN])
  @UseGuards(JwtAuthGuard, RolesGuard)
  public findAll() {
    return this.usersService.getAllUsers();
  }

  // =========================================================================

  /**
   * [GET] /api/users/me
   * Access: Users
   * Description: Get the profile data of the currently logged-in user
   */
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current logged-in user profile' })
  @Get('me')
  @UseGuards(JwtAuthGuard)
  public getMyUser(@User() jwtPayload: JwtPayloadType) {
    return this.usersService.getUserBy(jwtPayload.id);
  }

  // =========================================================================

  /**
   * [GET] /api/users/:id
   * Access: Public
   * Description: Get the public profile data of any specific user by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get any user profile by ID (Public)' })
  public getUser(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.getUserBy(id);
  }

  // =========================================================================

  /**
   * [PUT] /api/users/me
   * Access: Users
   * Description: Update the profile details of the currently logged-in user
   */
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

  // =========================================================================

  /**
   * [PUT] /api/users/:id
   * Access: Admins Only
   * Description: Modify the profile data of any user by ID
   */
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

  // =========================================================================

  /**
   * [DELETE] /api/users/me
   * Access: Users
   * Description: Delete the current user's account and associated data
   */
  @ApiBearerAuth()
  @Delete('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete current logged-in user account' })
  public deleteMyUser(@User() jwtPayload: JwtPayloadType) {
    return this.usersService.deleteUser(jwtPayload.id);
  }

  // =========================================================================

  /**
   * [DELETE] /api/users/:id
   * Access: Admins Only
   * Description: delete any user account and associated data by ID
   */
  @ApiBearerAuth()
  @Delete(':id')
  @Roles([UserType.ADMIN])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: '(Admin only) Delete any user account by ID' })
  public deleteUser(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.deleteUser(id);
  }

  // =========================================================================

  /**
   * Helper utility to securely append the refresh token HTTP-only cookie to the response object.
   * @param res - Express response object reference
   * @param refreshToken - The newly issued refresh token
   */
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
