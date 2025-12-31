import { IsString, IsOptional, IsObject, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendNotificationDto {
  @ApiProperty({ enum: ['email', 'sms', 'push'] })
  @IsIn(['email', 'sms', 'push'])
  channel: 'email' | 'sms' | 'push';

  @ApiProperty({ description: 'Email address or phone number' })
  @IsString()
  recipient: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiProperty({ description: 'Template name' })
  @IsString()
  template: string;

  @ApiPropertyOptional({ description: 'Template data' })
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;
}

export class TestNotificationDto {
  @ApiProperty({ enum: ['email', 'sms'] })
  @IsIn(['email', 'sms'])
  channel: 'email' | 'sms';

  @ApiProperty()
  @IsString()
  recipient: string;
}
