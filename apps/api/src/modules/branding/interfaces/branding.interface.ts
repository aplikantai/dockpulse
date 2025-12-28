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

export interface CompanyData {
  companyName: string;
  nip?: string;
  address?: Address;
  phone?: string;
  email?: string;
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
    nip?: string;
    address?: Address;
    phone?: string;
    email?: string;
  };
  branding: {
    logoUrl: string;
    faviconUrl: string;
    colors: BrandColors;
  };
}

export interface ExtractedCompanyData {
  companyName: string;
  nip?: string;
  address?: Address;
  phone?: string;
  email?: string;
  logoUrl?: string;
  faviconUrl?: string;
}
