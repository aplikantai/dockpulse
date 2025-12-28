'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { generateColorShades } from '@/lib/colors';

/**
 * Brand Colors Interface
 */
export interface BrandColors {
  primary: string;
  secondary: string;
  accent: string;
}

/**
 * Branding Settings Interface
 */
export interface BrandingSettings {
  logoUrl: string;
  faviconUrl: string;
  companyName: string;
  colors: BrandColors;
}

/**
 * Theme Context Value
 */
interface ThemeContextValue {
  colors: BrandColors;
  logo: string;
  favicon: string;
  companyName: string;
  isLoaded: boolean;
  updateBranding: (branding: Partial<BrandingSettings>) => void;
}

/**
 * Default Theme Values
 */
const DEFAULT_THEME: ThemeContextValue = {
  colors: {
    primary: '#2B579A',
    secondary: '#4472C4',
    accent: '#70AD47',
  },
  logo: '/assets/default-logo.png',
  favicon: '/favicon.ico',
  companyName: 'DockPulse',
  isLoaded: false,
  updateBranding: () => {},
};

const ThemeContext = createContext<ThemeContextValue>(DEFAULT_THEME);

interface ThemeProviderProps {
  children: ReactNode;
  initialBranding?: BrandingSettings;
}

export function ThemeProvider({ children, initialBranding }: ThemeProviderProps) {
  const [branding, setBranding] = useState<BrandingSettings | null>(
    initialBranding || null
  );
  const [isLoaded, setIsLoaded] = useState(false);

  // Apply CSS variables when branding changes
  useEffect(() => {
    if (!branding) {
      // Apply default theme
      applyThemeToDOM(DEFAULT_THEME.colors);
      setIsLoaded(true);
      return;
    }

    applyThemeToDOM(branding.colors);

    // Update favicon
    const faviconLink = document.querySelector(
      "link[rel='icon']"
    ) as HTMLLinkElement;
    if (faviconLink && branding.faviconUrl) {
      faviconLink.href = branding.faviconUrl;
    }

    // Update document title
    if (branding.companyName) {
      document.title = `${branding.companyName} - DockPulse`;
    }

    setIsLoaded(true);
  }, [branding]);

  const updateBranding = (newBranding: Partial<BrandingSettings>) => {
    setBranding((prev) => ({
      ...(prev || {
        logoUrl: DEFAULT_THEME.logo,
        faviconUrl: DEFAULT_THEME.favicon,
        companyName: DEFAULT_THEME.companyName,
        colors: DEFAULT_THEME.colors,
      }),
      ...newBranding,
    }));
  };

  const value: ThemeContextValue = {
    colors: branding?.colors || DEFAULT_THEME.colors,
    logo: branding?.logoUrl || DEFAULT_THEME.logo,
    favicon: branding?.faviconUrl || DEFAULT_THEME.favicon,
    companyName: branding?.companyName || DEFAULT_THEME.companyName,
    isLoaded,
    updateBranding,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to access theme values
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

/**
 * Apply theme colors to DOM as CSS variables
 */
function applyThemeToDOM(colors: BrandColors) {
  const root = document.documentElement;

  // Primary color and shades
  const primaryShades = generateColorShades(colors.primary);
  Object.entries(primaryShades).forEach(([shade, value]) => {
    root.style.setProperty(`--color-primary-${shade}`, value);
  });
  root.style.setProperty('--color-primary', colors.primary);

  // Secondary color
  root.style.setProperty('--color-secondary', colors.secondary);

  // Accent color
  root.style.setProperty('--color-accent', colors.accent);
}
