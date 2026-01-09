import { IsString, IsOptional, IsEnum, IsBoolean, IsInt, IsNumber, Min } from 'class-validator';
import { WarehouseLocationType } from '@prisma/client';

export class CreateLocationDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsEnum(WarehouseLocationType)
  @IsOptional()
  type?: WarehouseLocationType = WarehouseLocationType.BIN;

  @IsString()
  @IsOptional()
  parentId?: string;

  @IsString()
  @IsOptional()
  barcode?: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  widthCm?: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  heightCm?: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  depthCm?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  maxWeight?: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  maxItems?: number;

  @IsBoolean()
  @IsOptional()
  isPickable?: boolean;

  @IsBoolean()
  @IsOptional()
  isReceivable?: boolean;

  @IsInt()
  @IsOptional()
  sortOrder?: number;
}

export class UpdateLocationDto {
  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(WarehouseLocationType)
  @IsOptional()
  type?: WarehouseLocationType;

  @IsString()
  @IsOptional()
  parentId?: string;

  @IsString()
  @IsOptional()
  barcode?: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  widthCm?: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  heightCm?: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  depthCm?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  maxWeight?: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  maxItems?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  isPickable?: boolean;

  @IsBoolean()
  @IsOptional()
  isReceivable?: boolean;

  @IsInt()
  @IsOptional()
  sortOrder?: number;
}
