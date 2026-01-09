import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  Min,
} from 'class-validator';

export class CreateConversionDto {
  @IsString()
  @IsOptional()
  productId?: string;

  @IsString()
  fromUnit: string;

  @IsString()
  toUnit: string;

  @IsNumber()
  @Min(0.000001)
  conversionRate: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}

export class UpdateConversionDto {
  @IsNumber()
  @IsOptional()
  @Min(0.000001)
  conversionRate?: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}

export class ConvertUnitsDto {
  @IsString()
  @IsOptional()
  productId?: string;

  @IsString()
  fromUnit: string;

  @IsString()
  toUnit: string;

  @IsNumber()
  @Min(0)
  quantity: number;
}
