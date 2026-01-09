import { IsString, IsBoolean, IsOptional, IsInt, IsObject, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDictionaryDto {
  @ApiProperty({ description: 'Dictionary type (e.g., order_status, product_unit)' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  type: string;

  @ApiProperty({ description: 'Unique code within type' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  code: string;

  @ApiProperty({ description: 'Display label (Polish)' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  label: string;

  @ApiPropertyOptional({ description: 'Display label (English)' })
  @IsString()
  @IsOptional()
  labelEn?: string;

  @ApiPropertyOptional({ description: 'Color hex code (e.g., #3B82F6)' })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({ description: 'Icon name (e.g., inbox, check)' })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Additional metadata as JSON' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsInt()
  @IsOptional()
  sortOrder?: number;
}

export class UpdateDictionaryDto {
  @ApiPropertyOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @IsOptional()
  type?: string;

  @ApiPropertyOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @IsOptional()
  code?: string;

  @ApiPropertyOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @IsOptional()
  label?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  labelEn?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  sortOrder?: number;
}

// Predefined dictionary types
export const DICTIONARY_TYPES = {
  ORDER_STATUS: 'order_status',
  ORDER_TYPE: 'order_type',
  ORDER_SOURCE: 'order_source',
  PRODUCT_CATEGORY: 'product_category',
  PRODUCT_UNIT: 'product_unit',
  CUSTOMER_TYPE: 'customer_type',
  CUSTOMER_GROUP: 'customer_group',
  QUOTE_STATUS: 'quote_status',
  MEASUREMENT_STATUS: 'measurement_status',
  MOUNT_TYPE: 'mount_type',
  DRIVE_TYPE: 'drive_type',
  PROJECT_STATUS: 'project_status',
  PROJECT_TYPE: 'project_type',
  PRIORITY: 'priority',
  PAYMENT_STATUS: 'payment_status',
  PAYMENT_METHOD: 'payment_method',
} as const;

// Default values for seeding
export const DEFAULT_DICTIONARIES = {
  order_status: [
    { code: 'new', label: 'Nowe', labelEn: 'New', color: '#3B82F6', icon: 'inbox', isDefault: true, sortOrder: 0 },
    { code: 'confirmed', label: 'Potwierdzone', labelEn: 'Confirmed', color: '#8B5CF6', icon: 'check', sortOrder: 1 },
    { code: 'in_progress', label: 'W realizacji', labelEn: 'In Progress', color: '#F59E0B', icon: 'clock', sortOrder: 2 },
    { code: 'ready', label: 'Gotowe', labelEn: 'Ready', color: '#10B981', icon: 'package', sortOrder: 3 },
    { code: 'completed', label: 'Zakonczone', labelEn: 'Completed', color: '#059669', icon: 'check-circle', sortOrder: 4 },
    { code: 'cancelled', label: 'Anulowane', labelEn: 'Cancelled', color: '#EF4444', icon: 'x-circle', sortOrder: 5 },
  ],
  product_unit: [
    { code: 'szt', label: 'Sztuka', labelEn: 'Piece', isDefault: true, sortOrder: 0 },
    { code: 'kg', label: 'Kilogram', labelEn: 'Kilogram', sortOrder: 1 },
    { code: 'mb', label: 'Metr biezacy', labelEn: 'Running meter', sortOrder: 2 },
    { code: 'm2', label: 'Metr kwadratowy', labelEn: 'Square meter', sortOrder: 3 },
    { code: 'kpl', label: 'Komplet', labelEn: 'Set', sortOrder: 4 },
    { code: 'opak', label: 'Opakowanie', labelEn: 'Package', sortOrder: 5 },
  ],
  priority: [
    { code: 'low', label: 'Niski', labelEn: 'Low', color: '#6B7280', icon: 'minus', sortOrder: 0 },
    { code: 'medium', label: 'Sredni', labelEn: 'Medium', color: '#F59E0B', icon: 'minus', isDefault: true, sortOrder: 1 },
    { code: 'high', label: 'Wysoki', labelEn: 'High', color: '#EF4444', icon: 'arrow-up', sortOrder: 2 },
    { code: 'urgent', label: 'Pilne', labelEn: 'Urgent', color: '#DC2626', icon: 'alert-triangle', sortOrder: 3 },
  ],
  payment_status: [
    { code: 'unpaid', label: 'Nieoplacone', labelEn: 'Unpaid', color: '#EF4444', isDefault: true, sortOrder: 0 },
    { code: 'deposit', label: 'Zaliczka', labelEn: 'Deposit', color: '#F59E0B', sortOrder: 1 },
    { code: 'paid', label: 'Oplacone', labelEn: 'Paid', color: '#10B981', sortOrder: 2 },
    { code: 'refunded', label: 'Zwrocone', labelEn: 'Refunded', color: '#6B7280', sortOrder: 3 },
  ],
  mount_type: [
    { code: 'on_frame', label: 'Na ramie', labelEn: 'On frame', sortOrder: 0 },
    { code: 'in_reveal', label: 'W oscieze', labelEn: 'In reveal', sortOrder: 1 },
    { code: 'on_wall', label: 'Na scianie', labelEn: 'On wall', sortOrder: 2 },
    { code: 'ceiling', label: 'Sufitowy', labelEn: 'Ceiling', sortOrder: 3 },
  ],
  drive_type: [
    { code: 'manual', label: 'Reczny', labelEn: 'Manual', isDefault: true, sortOrder: 0 },
    { code: 'electric', label: 'Elektryczny', labelEn: 'Electric', sortOrder: 1 },
    { code: 'solar', label: 'Solarny', labelEn: 'Solar', sortOrder: 2 },
  ],
};
