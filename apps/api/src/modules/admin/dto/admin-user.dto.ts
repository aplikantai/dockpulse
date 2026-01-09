import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional } from 'class-validator';

/**
 * DTOs for Admin User Management
 */

export class CreateAdminDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @IsNotEmpty()
  name: string;
}

export class UpdateAdminDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;
}

export class ChangeAdminPasswordDto {
  @IsString()
  @MinLength(8)
  newPassword: string;
}

export class AdminUserResponse {
  id: string;
  email: string;
  name: string | null;
  role: string;
  active: boolean;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
