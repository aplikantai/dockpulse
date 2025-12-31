import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ReportType {
  ORDERS = 'orders',
  CUSTOMERS = 'customers',
  PRODUCTS = 'products',
  QUOTES = 'quotes',
}

export enum ReportFormat {
  CSV = 'csv',
  PDF = 'pdf',
  HTML = 'html',
}

export class GenerateReportDto {
  @ApiProperty({ enum: ReportType, description: 'Typ raportu' })
  @IsEnum(ReportType)
  type: ReportType;

  @ApiProperty({ enum: ReportFormat, description: 'Format eksportu' })
  @IsEnum(ReportFormat)
  format: ReportFormat;

  @ApiPropertyOptional({ description: 'Data od (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Data do (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Status do filtrowania' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'ID klienta' })
  @IsOptional()
  @IsString()
  customerId?: string;
}

export class ReportFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;
}
