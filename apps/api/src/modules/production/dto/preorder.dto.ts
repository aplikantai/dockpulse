import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsInt,
  IsNumber,
  IsDateString,
  Min,
  Matches,
} from 'class-validator';
import { PreorderSlotStatus } from '@prisma/client';

export class CreatePreorderSlotDto {
  @IsDateString()
  slotDate: string;

  @IsInt()
  @IsOptional()
  @Min(1)
  maxOrders?: number;

  @IsInt()
  @IsOptional()
  @Min(1)
  maxQuantity?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  maxWeight?: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  closeBeforeDays?: number;

  @IsString()
  @IsOptional()
  @Matches(/^\d{2}:\d{2}$/)
  pickupTimeStart?: string;

  @IsString()
  @IsOptional()
  @Matches(/^\d{2}:\d{2}$/)
  pickupTimeEnd?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  categoryIds?: string[];

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdatePreorderSlotDto {
  @IsEnum(PreorderSlotStatus)
  @IsOptional()
  status?: PreorderSlotStatus;

  @IsInt()
  @IsOptional()
  @Min(1)
  maxOrders?: number;

  @IsInt()
  @IsOptional()
  @Min(1)
  maxQuantity?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  maxWeight?: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  closeBeforeDays?: number;

  @IsString()
  @IsOptional()
  @Matches(/^\d{2}:\d{2}$/)
  pickupTimeStart?: string;

  @IsString()
  @IsOptional()
  @Matches(/^\d{2}:\d{2}$/)
  pickupTimeEnd?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  categoryIds?: string[];

  @IsString()
  @IsOptional()
  notes?: string;
}

export class AddOrderToSlotDto {
  @IsString()
  orderId: string;

  @IsString()
  @IsOptional()
  orderNumber?: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  quantity?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  weight?: number;
}

export class GenerateSlotsDto {
  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsInt()
  @IsOptional()
  @Min(1)
  maxOrders?: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  closeBeforeDays?: number;

  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  excludeWeekdays?: number[]; // 0=Sunday, 6=Saturday
}
