'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// ========== INTERFACES ==========

interface BrandColors {
  primary: string;
  secondary: string;
  accent: string;
}

interface Address {
  street?: string;
  city?: string;
  postalCode?: string;
  country?: string;
}

interface SocialMedia {
  facebook?: string;
  linkedin?: string;
  instagram?: string;
  twitter?: string;
  youtube?: string;
}

interface CompanyData {
  name: string;
  nip?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: Address;
  socialMedia?: SocialMedia;
  slogan?: string;
  description?: string;
}

interface BrandingData {
  logoUrl: string;
  faviconUrl: string;
  companyName: string;
  slogan?: string;
  description?: string;
  colors: BrandColors;
}

interface TenantModule {
  id: string;
  moduleCode: string;
  isEnabled: boolean;
  config: any;
}

export interface TenantData {
  id: string;
  slug: string;
  name: string;
  template: string;
  branding: BrandingData;
  companyData: CompanyData;
  modules: TenantModule[];
  settings: any;
  createdAt: string;
  updatedAt: string;
}

interface TenantContextValue {
  tenant: TenantData | null;
  isLoading: boolean;
  error: string | null;
  refreshTenant: () => Promise<void>;
}

// ========== CONTEXT ==========

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

// ========== PROVIDER ==========

interface TenantProviderProps {
  children: ReactNode;
}

export function TenantProvider({ children }: TenantProviderProps) {
  const [tenant, setTenant] = useState<TenantData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTenant = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Try to get tenant slug from subdomain first, then fallback to localStorage
      let tenantSlug: string | null = null;

      // Extract from subdomain (e.g., onet-demo.dockpulse.com -> onet-demo)
      if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        const parts = hostname.split('.');

        // Check if this is a subdomain (not www, app, admin, or main domain)
        if (parts.length >= 3) {
          const subdomain = parts[0];
          if (subdomain && subdomain !== 'www' && subdomain !== 'app' && subdomain !== 'admin') {
            tenantSlug = subdomain;
          }
        }

        // Fallback to localStorage if no subdomain
        if (!tenantSlug) {
          tenantSlug = localStorage.getItem('dockpulse_tenant_slug');
        }
      }

      if (!tenantSlug) {
        // No tenant slug - user hasn't completed onboarding yet
        setIsLoading(false);
        return;
      }

      // Fetch tenant data from API
      const response = await fetch(`/api/platform/tenants/by-slug/${tenantSlug}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Tenant nie został znaleziony. Rozpocznij onboarding ponownie.');
        }
        throw new Error('Nie udało się pobrać danych firmy');
      }

      const data = await response.json();

      // Transform API response to TenantData format
      const tenantData: TenantData = {
        id: data.id,
        slug: data.slug,
        name: data.name,
        template: data.template || data.settings?.template || 'services',
        branding: data.branding || {
          logoUrl: '/assets/default-logo.png',
          faviconUrl: '/favicon.ico',
          companyName: data.name,
          colors: {
            primary: '#2563eb',
            secondary: '#1e40af',
            accent: '#3b82f6',
          },
        },
        companyData: data.settings?.companyData || {
          name: data.name,
        },
        modules: data.modules || [],
        settings: data.settings || {},
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };

      setTenant(tenantData);
    } catch (err: any) {
      console.error('Failed to fetch tenant:', err);
      setError(err.message || 'Wystąpił błąd podczas ładowania danych');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshTenant = async () => {
    await fetchTenant();
  };

  useEffect(() => {
    fetchTenant();
  }, []);

  return (
    <TenantContext.Provider value={{ tenant, isLoading, error, refreshTenant }}>
      {children}
    </TenantContext.Provider>
  );
}

// ========== HOOK ==========

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}
