import {
  IsString,
  IsOptional,
  IsArray,
  IsBoolean,
  IsInt,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ===========================================
// CREATE ROLE DTO
// ===========================================

export class CreateRoleDto {
  @ApiProperty({ example: 'Sprzedawca' })
  @IsString()
  @MinLength(3)
  name: string;

  @ApiPropertyOptional({ example: 'Pracownik działu sprzedaży' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '#3B82F6', default: '#6B7280' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiProperty({ example: ['crm:view', 'crm:create', 'orders:view'] })
  @IsArray()
  @IsString({ each: true })
  permissions: string[];

  @ApiPropertyOptional({ example: 'role-id-to-inherit-from' })
  @IsOptional()
  @IsString()
  inheritsFrom?: string;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

// ===========================================
// UPDATE ROLE DTO
// ===========================================

export class UpdateRoleDto {
  @ApiPropertyOptional({ example: 'Sprzedawca' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  name?: string;

  @ApiPropertyOptional({ example: 'Pracownik działu sprzedaży' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '#3B82F6' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiProperty({ example: ['crm:view', 'crm:create', 'orders:view'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];

  @ApiPropertyOptional({ example: 'role-id-to-inherit-from' })
  @IsOptional()
  @IsString()
  inheritsFrom?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

// ===========================================
// ROLE RESPONSE DTO
// ===========================================

export class RoleResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  tenantId: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  color: string;

  @ApiProperty({ example: ['crm:view', 'crm:create'] })
  permissions: string[];

  @ApiPropertyOptional()
  inheritsFrom?: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  sortOrder: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

// ===========================================
// ROLE LIST RESPONSE DTO
// ===========================================

export class RoleListResponseDto {
  @ApiProperty({ type: [RoleResponseDto] })
  roles: RoleResponseDto[];

  @ApiProperty()
  total: number;
}
