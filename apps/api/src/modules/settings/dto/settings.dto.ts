import {
  IsBoolean,
  IsString,
  IsOptional,
  IsNumber,
  IsObject,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ===========================================
// MODULES
// ===========================================

export class ToggleModuleDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  isEnabled: boolean;
}

// ===========================================
// FIELD CONFIGS
// ===========================================

export class UpdateFieldConfigDto {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsNumber()
  displayOrder?: number;

  @ApiPropertyOptional({ example: 'NIP firmy' })
  @IsOptional()
  @IsString()
  label?: string;
}

// ===========================================
// TRIGGERS
// ===========================================

export class ToggleTriggerDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  isEnabled: boolean;
}

export enum ActionType {
  SMS = 'sms',
  EMAIL = 'email',
  WEBHOOK = 'webhook',
  CREATE_ENTITY = 'create_entity',
}

export class CreateTriggerDto {
  @ApiProperty({ example: 'order.ready.sms_customer' })
  @IsString()
  code: string;

  @ApiProperty({ example: 'SMS do klienta - zamówienie gotowe' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'order.status_changed' })
  @IsString()
  eventType: string;

  @ApiProperty({ enum: ActionType, example: ActionType.SMS })
  @IsEnum(ActionType)
  actionType: ActionType;

  @ApiPropertyOptional({
    example: {
      template: 'Twoje zamówienie {{orderNumber}} jest gotowe do odbioru!',
      recipientField: 'customer.phone',
    },
  })
  @IsOptional()
  @IsObject()
  actionConfig?: object;

  @ApiPropertyOptional({
    example: {
      status: 'ready',
    },
  })
  @IsOptional()
  @IsObject()
  conditions?: object;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}
