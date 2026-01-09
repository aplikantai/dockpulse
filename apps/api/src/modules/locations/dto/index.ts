import { IsString, IsBoolean, IsOptional, IsEmail, IsNumber, IsInt, IsEnum, IsUrl, IsObject, IsArray, MinLength, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum LocationType {
  SHOP = 'SHOP',
  WAREHOUSE = 'WAREHOUSE',
  PICKUP = 'PICKUP',
  SERVICE = 'SERVICE',
}

export class CreateLocationDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  code?: string;

  @ApiProperty({ description: 'Location name' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiPropertyOptional({ enum: LocationType, default: LocationType.SHOP })
  @IsEnum(LocationType)
  @IsOptional()
  type?: LocationType;

  @ApiProperty({ description: 'Full address' })
  @IsString()
  @MinLength(5)
  address: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  postalCode?: string;

  @ApiPropertyOptional({ default: 'PL' })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  longitude?: number;

  @ApiPropertyOptional()
  @IsUrl()
  @IsOptional()
  googleMapsUrl?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional()
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: 'Opening hours as JSON object' })
  @IsObject()
  @IsOptional()
  openingHours?: Record<string, string>;

  @ApiPropertyOptional({ description: 'List of closed dates' })
  @IsArray()
  @IsOptional()
  closedDates?: string[];

  @ApiPropertyOptional({ default: 30 })
  @IsInt()
  @Min(0)
  @IsOptional()
  prepTimeMinutes?: number;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsInt()
  @IsOptional()
  sortOrder?: number;
}

export class UpdateLocationDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  code?: string;

  @ApiPropertyOptional()
  @IsString()
  @MinLength(2)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ enum: LocationType })
  @IsEnum(LocationType)
  @IsOptional()
  type?: LocationType;

  @ApiPropertyOptional()
  @IsString()
  @MinLength(5)
  @IsOptional()
  address?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  postalCode?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  longitude?: number;

  @ApiPropertyOptional()
  @IsUrl()
  @IsOptional()
  googleMapsUrl?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional()
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  openingHours?: Record<string, string>;

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  closedDates?: string[];

  @ApiPropertyOptional()
  @IsInt()
  @Min(0)
  @IsOptional()
  prepTimeMinutes?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  sortOrder?: number;
}
