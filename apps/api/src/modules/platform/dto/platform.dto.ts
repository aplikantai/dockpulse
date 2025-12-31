import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  IsEmail,
  MinLength,
  IsEnum,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TenantStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  DELETED = 'deleted',
}

export enum TenantPlan {
  FREE = 'free',
  STARTER = 'starter',
  BUSINESS = 'business',
  ENTERPRISE = 'enterprise',
}

export class CreateTenantDto {
  @ApiProperty({ example: 'my-company' })
  @IsString()
  @MinLength(3)
  slug: string;

  @ApiProperty({ example: 'My Company Sp. z o.o.' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'https://mycompany.pl' })
  @IsOptional()
  @IsString()
  domain?: string;

  @ApiProperty({ example: 'admin@mycompany.pl' })
  @IsEmail()
  adminEmail: string;

  @ApiProperty({ example: 'Jan Kowalski' })
  @IsString()
  adminName: string;

  @ApiPropertyOptional({ enum: TenantPlan, default: TenantPlan.FREE })
  @IsOptional()
  @IsEnum(TenantPlan)
  plan?: TenantPlan;

  @ApiPropertyOptional({ description: 'Moduły do aktywacji', example: ['customers', 'products', 'orders'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  modules?: string[];
}

export class UpdateTenantDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  domain?: string;

  @ApiPropertyOptional({ enum: TenantStatus })
  @IsOptional()
  @IsEnum(TenantStatus)
  status?: TenantStatus;

  @ApiPropertyOptional({ enum: TenantPlan })
  @IsOptional()
  @IsEnum(TenantPlan)
  plan?: TenantPlan;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  modules?: string[];

  @ApiPropertyOptional({ description: 'Branding configuration' })
  @IsOptional()
  @IsObject()
  branding?: {
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
    companyName?: string;
  };
}

export class TenantBrandingDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiPropertyOptional({ example: '#2563eb' })
  @IsOptional()
  @IsString()
  primaryColor?: string;

  @ApiPropertyOptional({ example: '#1e40af' })
  @IsOptional()
  @IsString()
  secondaryColor?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  favicon?: string;
}

export class PlatformLoginDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  password: string;
}

export class CreatePlatformAdminDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isSuperAdmin?: boolean;
}

export class RegisterTenantDto {
  @ApiProperty({ example: 'ACME Corporation' })
  @IsString()
  companyName: string;

  @ApiProperty({ example: 'acme' })
  @IsString()
  @MinLength(3)
  slug: string;

  @ApiProperty({ enum: ['services', 'production', 'trade'], example: 'services' })
  @IsString()
  @IsEnum(['services', 'production', 'trade'])
  template: 'services' | 'production' | 'trade';

  @ApiPropertyOptional({ example: 'https://acme.com' })
  @IsOptional()
  @IsString()
  websiteUrl?: string;

  @ApiProperty({ example: 'Jan Kowalski' })
  @IsString()
  adminName: string;

  @ApiProperty({ example: 'jan@acme.com' })
  @IsEmail()
  adminEmail: string;

  @ApiProperty({ example: '+48 123 456 789' })
  @IsString()
  adminPhone: string;
}
