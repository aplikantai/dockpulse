/**
 * DockPulse Branding Interfaces
 */

export interface BrandColors {
  primary: string;    // #RRGGBB
  secondary: string;  // #RRGGBB
  accent: string;     // #RRGGBB
}

export interface BrandFonts {
  heading?: string;
  body?: string;
}

export interface Address {
  street?: string;
  city?: string;
  postalCode?: string;
  country?: string;
}

export interface SocialMedia {
  facebook?: string;
  linkedin?: string;
  instagram?: string;
  twitter?: string;
  youtube?: string;
}

export interface CompanyData {
  companyName: string;
  slogan?: string;
  description?: string;
  nip?: string;
  address?: Address;
  phone?: string;
  email?: string;
  website?: string;
  socialMedia?: SocialMedia;
  logoUrl?: string;
  faviconUrl?: string;
}

export interface BrandingSettings {
  logoUrl: string;
  faviconUrl: string;
  companyName: string;
  colors: BrandColors;
  fonts?: BrandFonts;
  companyData?: Omit<CompanyData, 'companyName' | 'logoUrl' | 'faviconUrl'>;
}

export interface BrandingResult {
  companyData: {
    name: string;
    slogan?: string;
    description?: string;
    nip?: string;
    address?: Address;
    phone?: string;
    email?: string;
    website?: string;
    socialMedia?: SocialMedia;
  };
  branding: {
    logoUrl: string;
    faviconUrl: string;
    colors: BrandColors;
  };
}

export interface ExtractedCompanyData {
  companyName: string;
  slogan?: string;
  description?: string;
  nip?: string;
  address?: Address;
  phone?: string;
  email?: string;
  website?: string;
  socialMedia?: SocialMedia;
  logoUrl?: string;
  faviconUrl?: string;
}
