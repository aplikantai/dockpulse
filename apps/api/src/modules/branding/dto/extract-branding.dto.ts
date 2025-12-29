import { IsUrl, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ExtractBrandingDto {
  @ApiProperty({
    description: 'Website URL to extract branding from',
    example: 'https://example.com',
  })
  @IsUrl({}, { message: 'Invalid website URL' })
  websiteUrl: string;

  @ApiProperty({
    description: 'Tenant slug to save branding to',
    example: 'my-company',
    minLength: 3,
  })
  @IsString()
  @MinLength(3)
  tenantSlug: string;
}

export class PreviewBrandingDto {
  @ApiProperty({
    description: 'Website URL to preview branding from',
    example: 'https://example.com',
  })
  @IsUrl({}, { message: 'Invalid website URL' })
  websiteUrl: string;
}

export class ColorShadesDto {
  @ApiProperty({
    description: 'Base HEX color to generate shades from',
    example: '#2B579A',
  })
  @IsString()
  color: string;
}

export class UpdateBrandingDto {
  @ApiPropertyOptional({
    description: 'Logo URL',
    example: 'https://cdn.example.com/logo.png',
  })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional({
    description: 'Favicon URL',
    example: '/favicon.ico',
  })
  @IsOptional()
  @IsString()
  faviconUrl?: string;

  @ApiPropertyOptional({
    description: 'Company name',
    example: 'My Company Sp. z o.o.',
  })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiPropertyOptional({
    description: 'Brand colors',
    example: { primary: '#2B579A', secondary: '#4472C4', accent: '#70AD47' },
  })
  @IsOptional()
  colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
}
