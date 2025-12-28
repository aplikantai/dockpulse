import { IsUrl, IsString, MinLength, IsOptional } from 'class-validator';

export class ExtractBrandingDto {
  @IsUrl({}, { message: 'Invalid website URL' })
  websiteUrl: string;

  @IsString()
  @MinLength(3)
  tenantSlug: string;
}

export class PreviewBrandingDto {
  @IsUrl({}, { message: 'Invalid website URL' })
  websiteUrl: string;
}

export class UpdateBrandingDto {
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  faviconUrl?: string;

  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
}
