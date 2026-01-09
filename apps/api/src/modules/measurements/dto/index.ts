import { IsString, IsOptional, IsDateString, IsEnum, IsInt, IsPositive, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum MeasurementStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export class CreateMeasurementDto {
  @ApiProperty({ description: 'Order ID' })
  @IsString()
  orderId: string;

  @ApiProperty({ description: 'Technician (user) ID' })
  @IsString()
  technicianId: string;

  @ApiPropertyOptional({ description: 'Scheduled date and time' })
  @IsDateString()
  @IsOptional()
  scheduledAt?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateMeasurementDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  technicianId?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  scheduledAt?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ enum: MeasurementStatus })
  @IsEnum(MeasurementStatus)
  @IsOptional()
  status?: MeasurementStatus;
}

export class MeasurementItemDto {
  @ApiProperty({ description: 'Location/room name' })
  @IsString()
  location: string;

  @ApiPropertyOptional({ description: 'Floor number/name' })
  @IsString()
  @IsOptional()
  floor?: string;

  @ApiProperty({ description: 'Product name' })
  @IsString()
  product: string;

  @ApiPropertyOptional({ description: 'Product code/SKU' })
  @IsString()
  @IsOptional()
  productCode?: string;

  @ApiProperty({ description: 'Width in millimeters' })
  @IsInt()
  @IsPositive()
  widthMm: number;

  @ApiProperty({ description: 'Height in millimeters' })
  @IsInt()
  @IsPositive()
  heightMm: number;

  @ApiPropertyOptional({ description: 'Depth in millimeters' })
  @IsInt()
  @IsPositive()
  @IsOptional()
  depthMm?: number;

  @ApiPropertyOptional({ default: 1 })
  @IsInt()
  @IsPositive()
  @IsOptional()
  quantity?: number;

  @ApiPropertyOptional({ description: 'Color code/name' })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({ description: 'Mount type' })
  @IsString()
  @IsOptional()
  mountType?: string;

  @ApiPropertyOptional({ description: 'Drive type' })
  @IsString()
  @IsOptional()
  driveType?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;
}

export class UpdateMeasurementItemDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  floor?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  product?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  productCode?: string;

  @ApiPropertyOptional()
  @IsInt()
  @IsPositive()
  @IsOptional()
  widthMm?: number;

  @ApiPropertyOptional()
  @IsInt()
  @IsPositive()
  @IsOptional()
  heightMm?: number;

  @ApiPropertyOptional()
  @IsInt()
  @IsPositive()
  @IsOptional()
  depthMm?: number;

  @ApiPropertyOptional()
  @IsInt()
  @IsPositive()
  @IsOptional()
  quantity?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  mountType?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  driveType?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional()
  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;
}
