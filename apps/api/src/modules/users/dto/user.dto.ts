import {
  IsEmail,
  IsString,
  IsOptional,
  IsEnum,
  MinLength,
  IsBoolean,
  IsArray,
  IsUrl,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Permission } from '../permissions';

// ===========================================
// CREATE USER DTO
// ===========================================

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: '+48123456789' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'SecureP@ssw0rd', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({ example: 'Jan' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Kowalski' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ example: 'Jan Kowalski' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiProperty({ enum: UserRole, default: UserRole.EMPLOYEE })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiPropertyOptional({ example: ['crm:view', 'orders:create'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];

  @ApiPropertyOptional({ example: 'Sprzedawca' })
  @IsOptional()
  @IsString()
  customRole?: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  mustChangePw?: boolean;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

// ===========================================
// UPDATE USER DTO
// ===========================================

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'user@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+48123456789' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'Jan' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Kowalski' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ example: 'Jan Kowalski' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ example: ['crm:view', 'orders:create'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];

  @ApiPropertyOptional({ example: 'Sprzedawca' })
  @IsOptional()
  @IsString()
  customRole?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  mustChangePw?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

// ===========================================
// CHANGE PASSWORD DTO
// ===========================================

export class ChangePasswordDto {
  @ApiProperty({ example: 'OldP@ssw0rd', minLength: 8 })
  @IsString()
  @MinLength(8)
  oldPassword: string;

  @ApiProperty({ example: 'NewP@ssw0rd', minLength: 8 })
  @IsString()
  @MinLength(8)
  newPassword: string;
}

// ===========================================
// RESET PASSWORD DTO (Admin only)
// ===========================================

export class ResetPasswordDto {
  @ApiProperty({ example: 'NewP@ssw0rd', minLength: 8 })
  @IsString()
  @MinLength(8)
  newPassword: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  mustChangePw?: boolean;
}

// ===========================================
// UPDATE PERMISSIONS DTO
// ===========================================

export class UpdatePermissionsDto {
  @ApiProperty({ example: ['crm:view', 'orders:create', 'quotes:view'] })
  @IsArray()
  @IsString({ each: true })
  permissions: string[];
}

// ===========================================
// USER RESPONSE DTO
// ===========================================

export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiPropertyOptional()
  phone?: string;

  @ApiPropertyOptional()
  firstName?: string;

  @ApiPropertyOptional()
  lastName?: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  avatar?: string;

  @ApiProperty({ enum: UserRole })
  role: UserRole;

  @ApiProperty({ example: [] })
  permissions: string[];

  @ApiPropertyOptional()
  customRole?: string;

  @ApiProperty()
  active: boolean;

  @ApiProperty()
  mustChangePw: boolean;

  @ApiPropertyOptional()
  lastLogin?: Date;

  @ApiProperty()
  failedLogins: number;

  @ApiPropertyOptional()
  lockedUntil?: Date;

  @ApiProperty()
  tenantId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

// ===========================================
// USER LIST RESPONSE DTO
// ===========================================

export class UserListResponseDto {
  @ApiProperty({ type: [UserResponseDto] })
  users: UserResponseDto[];

  @ApiProperty()
  total: number;

  @ApiPropertyOptional()
  page?: number;

  @ApiPropertyOptional()
  pageSize?: number;
}
