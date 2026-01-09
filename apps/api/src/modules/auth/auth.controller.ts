import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Headers,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiHeader,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  LoginDto,
  RegisterDto,
  AuthResponseWithRefresh,
  RefreshTokenDto,
  ChangePasswordDto,
  ChangePasswordResponse,
  LogoutResponse,
  ForgotPasswordDto,
  ForgotPasswordResponse,
  ResetPasswordDto,
  ResetPasswordResponse,
} from './dto/auth.dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser, CurrentUserData } from './decorators/current-user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @ApiHeader({ name: 'x-tenant-id', required: true, description: 'Tenant slug' })
  @ApiResponse({ status: 200, description: 'Login successful', type: AuthResponseWithRefresh })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() dto: LoginDto,
    @Headers('x-tenant-id') tenantId: string,
  ): Promise<AuthResponseWithRefresh> {
    return this.authService.login(dto, tenantId);
  }

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register new user' })
  @ApiHeader({ name: 'x-tenant-id', required: true, description: 'Tenant slug' })
  @ApiResponse({ status: 201, description: 'User created', type: AuthResponseWithRefresh })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async register(
    @Body() dto: RegisterDto,
    @Headers('x-tenant-id') tenantId: string,
  ): Promise<AuthResponseWithRefresh> {
    return this.authService.register(dto, tenantId);
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Tokens refreshed' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user' })
  @ApiResponse({ status: 200, description: 'Current user data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async me(@CurrentUser() user: CurrentUserData) {
    return this.authService.getUserById(user.userId);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change password' })
  @ApiResponse({ status: 200, description: 'Password changed', type: ChangePasswordResponse })
  @ApiResponse({ status: 401, description: 'Current password incorrect' })
  async changePassword(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: ChangePasswordDto,
  ): Promise<ChangePasswordResponse> {
    return this.authService.changePassword(
      user.userId,
      dto.currentPassword,
      dto.newPassword,
    );
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'Logged out', type: LogoutResponse })
  async logout(@CurrentUser() user: CurrentUserData): Promise<LogoutResponse> {
    return this.authService.logout(user.userId);
  }

  @Public()
  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ status: 200, description: 'Reset email sent', type: ForgotPasswordResponse })
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<ForgotPasswordResponse> {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({ status: 200, description: 'Password reset', type: ResetPasswordResponse })
  @ApiResponse({ status: 401, description: 'Invalid or expired token' })
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<ResetPasswordResponse> {
    return this.authService.resetPassword(dto);
  }
}
