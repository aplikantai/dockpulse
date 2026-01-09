import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;
}

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Jan Kowalski' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ enum: UserRole, default: UserRole.EMPLOYEE })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

export class AuthResponse {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    tenantId: string;
  };
}

export class JwtPayload {
  sub: string;
  email: string;
  role: string;
  tenantId: string;
}

// ============================================
// REFRESH TOKEN
// ============================================

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh token' })
  @IsString()
  refreshToken: string;
}

export class AuthResponseWithRefresh extends AuthResponse {
  @ApiProperty()
  refreshToken: string;
}

// ============================================
// CHANGE PASSWORD
// ============================================

export class ChangePasswordDto {
  @ApiProperty({ example: 'oldPassword123', minLength: 6 })
  @IsString()
  @MinLength(6)
  currentPassword: string;

  @ApiProperty({ example: 'newPassword456', minLength: 8 })
  @IsString()
  @MinLength(8)
  newPassword: string;
}

export class ChangePasswordResponse {
  @ApiProperty({ example: 'Password changed successfully' })
  message: string;
}

// ============================================
// LOGOUT
// ============================================

export class LogoutResponse {
  @ApiProperty({ example: 'Logged out successfully' })
  message: string;
}

// ============================================
// FORGOT PASSWORD / RESET PASSWORD
// ============================================

export class ForgotPasswordDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;
}

export class ForgotPasswordResponse {
  @ApiProperty({ example: 'Password reset email sent' })
  message: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'abc-123-def-456' })
  @IsString()
  token: string;

  @ApiProperty({ example: 'newPassword456', minLength: 8 })
  @IsString()
  @MinLength(8)
  newPassword: string;
}

export class ResetPasswordResponse {
  @ApiProperty({ example: 'Password reset successfully' })
  message: string;
}
