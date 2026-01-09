import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
  IsInt,
  IsDateString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { WarehouseDocumentType, WarehouseDocumentStatus } from '@prisma/client';

export class CreateDocumentItemDto {
  @IsString()
  productId: string;

  @IsString()
  @IsOptional()
  productName?: string;

  @IsString()
  @IsOptional()
  productSku?: string;

  @IsString()
  @IsOptional()
  locationId?: string;

  @IsInt()
  @Min(0)
  expectedQuantity: number;

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

  @IsString()
  @IsOptional()
  notes?: string;

  @IsInt()
  @IsOptional()
  sortOrder?: number;
}

export class CreateDocumentDto {
  @IsEnum(WarehouseDocumentType)
  type: WarehouseDocumentType;

  @IsString()
  @IsOptional()
  sourceLocationId?: string;

  @IsString()
  @IsOptional()
  targetLocationId?: string;

  @IsString()
  @IsOptional()
  orderId?: string;

  @IsString()
  @IsOptional()
  supplierId?: string;

  @IsDateString()
  @IsOptional()
  documentDate?: string;

  @IsDateString()
  @IsOptional()
  expectedDate?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  externalRef?: string;

  @IsString()
  @IsOptional()
  deliveryNote?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDocumentItemDto)
  @IsOptional()
  items?: CreateDocumentItemDto[];
}

export class UpdateDocumentDto {
  @IsEnum(WarehouseDocumentStatus)
  @IsOptional()
  status?: WarehouseDocumentStatus;

  @IsString()
  @IsOptional()
  sourceLocationId?: string;

  @IsString()
  @IsOptional()
  targetLocationId?: string;

  @IsDateString()
  @IsOptional()
  expectedDate?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  externalRef?: string;

  @IsString()
  @IsOptional()
  deliveryNote?: string;
}

export class ProcessDocumentItemDto {
  @IsString()
  itemId: string;

  @IsInt()
  @Min(0)
  actualQuantity: number;

  @IsString()
  @IsOptional()
  locationId?: string;

  @IsString()
  @IsOptional()
  batchNumber?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class ProcessDocumentDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProcessDocumentItemDto)
  items: ProcessDocumentItemDto[];
}
