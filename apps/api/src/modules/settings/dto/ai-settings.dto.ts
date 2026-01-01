import { IsString, IsOptional, IsObject, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AIModelsConfigDto {
  @ApiPropertyOptional({ example: 'google/gemini-2.0-flash-exp:free' })
  @IsOptional()
  @IsString()
  textModel?: string;

  @ApiPropertyOptional({ example: 'google/gemini-2.0-flash-exp:free' })
  @IsOptional()
  @IsString()
  visionModel?: string;

  @ApiPropertyOptional({ example: 'mistralai/devstral-2512:free' })
  @IsOptional()
  @IsString()
  codeModel?: string;
}

export class AISettingsDto {
  @ApiPropertyOptional({ example: 'sk-or-v1-your-api-key-here' })
  @IsOptional()
  @IsString()
  openrouterApiKey?: string;

  @ApiProperty({ type: AIModelsConfigDto })
  @IsOptional()
  @IsObject()
  models?: AIModelsConfigDto;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  enableAIBranding?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  enableAIAssistant?: boolean;
}

export interface TenantAISettings {
  openrouterApiKey?: string;
  models?: {
    text?: string;
    vision?: string;
    code?: string;
  };
  enableAIBranding?: boolean;
  enableAIAssistant?: boolean;
}
