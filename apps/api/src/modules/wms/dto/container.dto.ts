import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsInt,
  IsNumber,
  Min,
  IsArray,
  ValidateNested,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ContainerType, ContainerStatus } from '@prisma/client';

export class CreateContainerDto {
  @IsString()
  code: string;

  @IsString()
  @IsOptional()
  barcode?: string;

  @IsEnum(ContainerType)
  @IsOptional()
  type?: ContainerType;

  @IsString()
  @IsOptional()
  locationId?: string;

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

  @IsString()
  @IsOptional()
  orderId?: string;

  @IsString()
  @IsOptional()
  customerId?: string;

  @IsBoolean()
  @IsOptional()
  isReusable?: boolean;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  color?: string;
}

export class UpdateContainerDto {
  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  barcode?: string;

  @IsEnum(ContainerType)
  @IsOptional()
  type?: ContainerType;

  @IsEnum(ContainerStatus)
  @IsOptional()
  status?: ContainerStatus;

  @IsString()
  @IsOptional()
  locationId?: string;

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

  @IsString()
  @IsOptional()
  orderId?: string;

  @IsString()
  @IsOptional()
  customerId?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  isReusable?: boolean;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  color?: string;
}

export class AddContainerContentDto {
  @IsString()
  productId: string;

  @IsString()
  @IsOptional()
  productName?: string;

  @IsString()
  @IsOptional()
  productSku?: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsString()
  @IsOptional()
  batchNumber?: string;

  @IsString()
  @IsOptional()
  serialNumber?: string;

  @IsDateString()
  @IsOptional()
  expiryDate?: string;
}

export class RemoveContainerContentDto {
  @IsString()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsString()
  @IsOptional()
  batchNumber?: string;
}
