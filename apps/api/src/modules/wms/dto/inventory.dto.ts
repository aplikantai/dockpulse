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
import { InventoryCountStatus } from '@prisma/client';

export class CreateInventoryCountItemDto {
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
  locationCode?: string;

  @IsInt()
  @Min(0)
  expectedQty: number;

  @IsString()
  @IsOptional()
  batchNumber?: string;

  @IsInt()
  @IsOptional()
  sortOrder?: number;
}

export class CreateInventoryCountDto {
  @IsString()
  @IsOptional()
  locationId?: string;

  @IsString()
  @IsOptional()
  categoryCode?: string;

  @IsDateString()
  @IsOptional()
  plannedDate?: string;

  @IsString()
  @IsOptional()
  assignedToId?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInventoryCountItemDto)
  @IsOptional()
  items?: CreateInventoryCountItemDto[];
}

export class UpdateInventoryCountDto {
  @IsEnum(InventoryCountStatus)
  @IsOptional()
  status?: InventoryCountStatus;

  @IsString()
  @IsOptional()
  locationId?: string;

  @IsString()
  @IsOptional()
  categoryCode?: string;

  @IsDateString()
  @IsOptional()
  plannedDate?: string;

  @IsString()
  @IsOptional()
  assignedToId?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class CountInventoryItemDto {
  @IsString()
  itemId: string;

  @IsInt()
  @Min(0)
  countedQty: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class SubmitInventoryCountDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CountInventoryItemDto)
  items: CountInventoryItemDto[];
}

export class ApproveInventoryCountDto {
  @IsString()
  @IsOptional()
  notes?: string;
}
