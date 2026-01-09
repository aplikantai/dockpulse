import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
  IsInt,
  IsNumber,
  IsDateString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProductionPlanStatus, ProductionItemStatus } from '@prisma/client';

export class CreatePlanItemDto {
  @IsString()
  productId: string;

  @IsString()
  @IsOptional()
  productName?: string;

  @IsString()
  @IsOptional()
  productSku?: string;

  @IsInt()
  @Min(0)
  orderedQuantity: number;

  @IsNumber()
  @IsOptional()
  orderedWeight?: number;

  @IsString()
  @IsOptional()
  orderedUnit?: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  targetQuantity?: number;

  @IsNumber()
  @IsOptional()
  targetWeight?: number;

  @IsString()
  @IsOptional()
  targetUnit?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  orderIds?: string[];

  @IsString()
  @IsOptional()
  assignedToId?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsInt()
  @IsOptional()
  sortOrder?: number;
}

export class CreatePlanDto {
  @IsDateString()
  planDate: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePlanItemDto)
  @IsOptional()
  items?: CreatePlanItemDto[];
}

export class UpdatePlanDto {
  @IsEnum(ProductionPlanStatus)
  @IsOptional()
  status?: ProductionPlanStatus;

  @IsDateString()
  @IsOptional()
  planDate?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdatePlanItemDto {
  @IsInt()
  @IsOptional()
  @Min(0)
  targetQuantity?: number;

  @IsNumber()
  @IsOptional()
  targetWeight?: number;

  @IsString()
  @IsOptional()
  targetUnit?: string;

  @IsString()
  @IsOptional()
  assignedToId?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class ProducePlanItemDto {
  @IsString()
  itemId: string;

  @IsInt()
  @Min(0)
  producedQuantity: number;

  @IsNumber()
  @IsOptional()
  producedWeight?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class GeneratePlanFromOrdersDto {
  @IsDateString()
  planDate: string;

  @IsDateString()
  @IsOptional()
  orderDateFrom?: string;

  @IsDateString()
  @IsOptional()
  orderDateTo?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  orderStatuses?: string[];

  @IsString()
  @IsOptional()
  notes?: string;
}
