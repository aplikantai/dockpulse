/**
 * MODULE REGISTRY
 * Centralna definicja wszystkich modułów dostępnych w systemie
 * Nowe moduły dodawać tutaj - automatycznie pojawią się w UI
 */

export enum ModuleCode {
  // ========== CORE MODULES (zawsze dostępne) ==========
  CRM = 'CRM',
  ORDERS = 'ORDERS',
  PRODUCTS = 'PRODUCTS',

  // ========== ADDON MODULES (można aktywować) ==========
  INVENTORY = 'INVENTORY',
  QUOTES = 'QUOTES',
  INVOICES = 'INVOICES',
  REPORTS = 'REPORTS',

  // ========== FUTURE MODULES (planowane) ==========
  PRODUCTION = 'PRODUCTION',
  ANALYTICS = 'ANALYTICS',
  WEBHOOKS = 'WEBHOOKS',
  API_ACCESS = 'API_ACCESS',
}

export enum ModuleCategory {
  CORE = 'core',
  ADDON = 'addon',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise',
}

export interface ModuleDefinition {
  code: ModuleCode;
  name: string;
  namePl: string;
  description: string;
  descriptionPl: string;
  icon: string;
  category: ModuleCategory;
  price?: number; // Miesięczna opłata (null = darmowy)
  isActive: boolean; // Czy moduł jest gotowy do użycia
  routes: string[]; // Frontend routes dla tego modułu
  apiEndpoints: string[]; // Backend API endpoints
  dependencies?: ModuleCode[]; // Wymagane moduły
  features: string[]; // Lista funkcji modułu
}

/**
 * WSZYSTKIE DOSTĘPNE MODUŁY
 * Dodawaj tutaj nowe moduły - automatycznie pojawią się w systemie
 */
export const MODULE_REGISTRY: Record<ModuleCode, ModuleDefinition> = {
  // ========== CORE MODULES ==========
  [ModuleCode.CRM]: {
    code: ModuleCode.CRM,
    name: 'Customer Management',
    namePl: 'Zarządzanie klientami',
    description: 'Manage your customers, contacts, and relationships',
    descriptionPl: 'Zarządzaj klientami, kontaktami i relacjami biznesowymi',
    icon: 'Users',
    category: ModuleCategory.CORE,
    price: null, // Darmowy w każdym planie
    isActive: true,
    routes: ['/customers', '/customers/[id]'],
    apiEndpoints: [
      'GET /api/customers',
      'POST /api/customers',
      'GET /api/customers/:id',
      'PUT /api/customers/:id',
      'DELETE /api/customers/:id',
    ],
    features: [
      'Lista klientów',
      'Dodawanie/edycja klientów',
      'Historia kontaktów',
      'Grupy klientów',
      'Import/eksport CSV',
    ],
  },

  [ModuleCode.ORDERS]: {
    code: ModuleCode.ORDERS,
    name: 'Order Management',
    namePl: 'Zamówienia',
    description: 'Handle orders, track status, and manage fulfillment',
    descriptionPl: 'Obsługa zamówień, śledzenie statusów, zarządzanie realizacją',
    icon: 'ShoppingCart',
    category: ModuleCategory.CORE,
    price: null,
    isActive: true,
    routes: ['/orders', '/orders/[id]'],
    apiEndpoints: [
      'GET /api/orders',
      'POST /api/orders',
      'GET /api/orders/:id',
      'PUT /api/orders/:id',
      'PATCH /api/orders/:id/status',
    ],
    dependencies: [ModuleCode.CRM], // Wymaga CRM (klienci)
    features: [
      'Lista zamówień',
      'Tworzenie zamówień',
      'Statusy zamówień',
      'Historia zmian',
      'Powiadomienia email',
    ],
  },

  [ModuleCode.PRODUCTS]: {
    code: ModuleCode.PRODUCTS,
    name: 'Product Catalog',
    namePl: 'Katalog produktów',
    description: 'Product management, pricing, and categories',
    descriptionPl: 'Zarządzanie produktami, cenami i kategoriami',
    icon: 'Package',
    category: ModuleCategory.CORE,
    price: null,
    isActive: true,
    routes: ['/products', '/products/[id]', '/products/categories'],
    apiEndpoints: [
      'GET /api/products',
      'POST /api/products',
      'GET /api/products/:id',
      'PUT /api/products/:id',
      'GET /api/products/categories',
    ],
    features: [
      'Katalog produktów',
      'Kategorie produktów',
      'Cenniki',
      'Zdjęcia produktów',
      'Warianty produktów',
    ],
  },

  // ========== ADDON MODULES ==========
  [ModuleCode.INVENTORY]: {
    code: ModuleCode.INVENTORY,
    name: 'Warehouse Management',
    namePl: 'Magazyn (WMS)',
    description: 'Track inventory, manage stock levels, and warehouses',
    descriptionPl: 'Zarządzanie stanami magazynowymi, lokalizacjami, przyjęciami i wydaniami',
    icon: 'Warehouse',
    category: ModuleCategory.ADDON,
    price: 299, // 299 PLN/msc
    isActive: true,
    routes: ['/inventory', '/inventory/locations', '/inventory/movements'],
    apiEndpoints: [
      'GET /api/inventory',
      'POST /api/inventory/adjust',
      'GET /api/inventory/movements',
    ],
    dependencies: [ModuleCode.PRODUCTS],
    features: [
      'Stany magazynowe',
      'Wiele magazynów',
      'Historia przemieszczeń',
      'Inwentaryzacja',
      'Alerty o niskim stanie',
    ],
  },

  [ModuleCode.QUOTES]: {
    code: ModuleCode.QUOTES,
    name: 'Quotes & Proposals',
    namePl: 'Wyceny i oferty',
    description: 'Create quotes, send proposals, track conversions',
    descriptionPl: 'Tworzenie wycen, wysyłanie ofert, śledzenie konwersji',
    icon: 'FileText',
    category: ModuleCategory.ADDON,
    price: 199,
    isActive: true,
    routes: ['/quotes', '/quotes/[id]', '/quotes/templates'],
    apiEndpoints: [
      'GET /api/quotes',
      'POST /api/quotes',
      'GET /api/quotes/:id',
      'POST /api/quotes/:id/send',
      'POST /api/quotes/:id/accept',
    ],
    dependencies: [ModuleCode.CRM, ModuleCode.PRODUCTS],
    features: [
      'Tworzenie wycen',
      'Szablony wycen',
      'Wysyłka email',
      'Akceptacja online',
      'Konwersja do zamówienia',
    ],
  },

  [ModuleCode.INVOICES]: {
    code: ModuleCode.INVOICES,
    name: 'Invoicing',
    namePl: 'Faktury',
    description: 'Generate invoices, track payments, accounting integration',
    descriptionPl: 'Generowanie faktur, śledzenie płatności, integracja z księgowością',
    icon: 'Receipt',
    category: ModuleCategory.ADDON,
    price: 249,
    isActive: true,
    routes: ['/invoices', '/invoices/[id]'],
    apiEndpoints: [
      'GET /api/invoices',
      'POST /api/invoices',
      'GET /api/invoices/:id',
      'POST /api/invoices/:id/send',
    ],
    dependencies: [ModuleCode.ORDERS],
    features: [
      'Faktury VAT',
      'Faktury pro-forma',
      'Export PDF',
      'Wysyłka email',
      'Rejestr VAT',
    ],
  },

  [ModuleCode.REPORTS]: {
    code: ModuleCode.REPORTS,
    name: 'Reports & Analytics',
    namePl: 'Raporty i analityka',
    description: 'Business intelligence, charts, custom reports',
    descriptionPl: 'Raporty biznesowe, wykresy, analiza sprzedaży',
    icon: 'BarChart3',
    category: ModuleCategory.ADDON,
    price: 199,
    isActive: true,
    routes: ['/reports', '/reports/sales', '/reports/customers'],
    apiEndpoints: ['GET /api/reports/sales', 'GET /api/reports/customers'],
    features: [
      'Raporty sprzedaży',
      'Analiza klientów',
      'Wykresy i dashboardy',
      'Export do Excel',
      'Niestandardowe raporty',
    ],
  },

  // ========== FUTURE MODULES (w przygotowaniu) ==========
  [ModuleCode.PRODUCTION]: {
    code: ModuleCode.PRODUCTION,
    name: 'Production Planning',
    namePl: 'Planowanie produkcji',
    description: 'Manufacturing orders, BOM, production tracking',
    descriptionPl: 'Zlecenia produkcyjne, receptury, śledzenie produkcji',
    icon: 'Factory',
    category: ModuleCategory.PREMIUM,
    price: 499,
    isActive: false, // Nieaktywny - w przygotowaniu
    routes: ['/production', '/production/bom'],
    apiEndpoints: [],
    features: ['Zlecenia produkcyjne', 'BOM', 'Śledzenie produkcji'],
  },

  [ModuleCode.ANALYTICS]: {
    code: ModuleCode.ANALYTICS,
    name: 'Advanced Analytics',
    namePl: 'Zaawansowana analityka',
    description: 'AI-powered insights, predictions, recommendations',
    descriptionPl: 'Analityka AI, predykcje, rekomendacje',
    icon: 'TrendingUp',
    category: ModuleCategory.PREMIUM,
    price: 399,
    isActive: false,
    routes: ['/analytics'],
    apiEndpoints: [],
    features: ['AI insights', 'Predykcje sprzedaży', 'Rekomendacje'],
  },

  [ModuleCode.WEBHOOKS]: {
    code: ModuleCode.WEBHOOKS,
    name: 'Webhooks & Integrations',
    namePl: 'Webhooki i integracje',
    description: 'Custom webhooks, API integrations, automation',
    descriptionPl: 'Własne webhooki, integracje API, automatyzacja',
    icon: 'Zap',
    category: ModuleCategory.ENTERPRISE,
    price: 299,
    isActive: false,
    routes: ['/settings/webhooks'],
    apiEndpoints: [],
    features: ['Custom webhooks', 'API integrations', 'Triggers'],
  },

  [ModuleCode.API_ACCESS]: {
    code: ModuleCode.API_ACCESS,
    name: 'API Access',
    namePl: 'Dostęp do API',
    description: 'RESTful API access, API keys, documentation',
    descriptionPl: 'Dostęp do REST API, klucze API, dokumentacja',
    icon: 'Code',
    category: ModuleCategory.ENTERPRISE,
    price: 199,
    isActive: false,
    routes: ['/settings/api'],
    apiEndpoints: [],
    features: ['REST API', 'API keys', 'Dokumentacja API'],
  },
};

/**
 * Helper functions
 */
export function getAllModules(): ModuleDefinition[] {
  return Object.values(MODULE_REGISTRY);
}

export function getAvailableModules(): ModuleDefinition[] {
  return Object.values(MODULE_REGISTRY).filter((m) => m.isActive);
}

export function getModuleByCode(code: ModuleCode): ModuleDefinition | undefined {
  return MODULE_REGISTRY[code];
}

export function getCoreModules(): ModuleDefinition[] {
  return getAvailableModules().filter((m) => m.category === ModuleCategory.CORE);
}

export function getAddonModules(): ModuleDefinition[] {
  return getAvailableModules().filter((m) => m.category === ModuleCategory.ADDON);
}

export function checkModuleDependencies(
  code: ModuleCode,
  enabledModules: ModuleCode[],
): { isValid: boolean; missing: ModuleCode[] } {
  const module = getModuleByCode(code);
  if (!module || !module.dependencies) {
    return { isValid: true, missing: [] };
  }

  const missing = module.dependencies.filter((dep) => !enabledModules.includes(dep));
  return {
    isValid: missing.length === 0,
    missing,
  };
}
