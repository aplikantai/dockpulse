// DockPulse Constants
// Copied from @dockpulse/shared for API use

// ===========================================
// MODULES
// ===========================================

export const MODULES = {
  CUSTOMERS: '@customers',
  ORDERS: '@orders',
  PRODUCTS: '@products',
  QUOTES: '@quotes',
  PORTAL: '@portal',
  STOCK: '@stock',
  PRODUCTION: '@production',
  CALENDAR: '@calendar',
  INVOICING: '@invoicing',
  NOTIFICATIONS: '@notifications',
  REPORTS: '@reports',
} as const;

// ===========================================
// ORDER STATUSES BY TEMPLATE
// ===========================================

export const ORDER_STATUSES = {
  services: [
    { code: 'new', name: 'Nowe', color: '#3B82F6' },
    { code: 'quoted', name: 'Wycenione', color: '#8B5CF6' },
    { code: 'accepted', name: 'Zaakceptowane', color: '#10B981' },
    { code: 'in_progress', name: 'W realizacji', color: '#F59E0B' },
    { code: 'review', name: 'Do akceptacji', color: '#EC4899' },
    { code: 'completed', name: 'Zakonczone', color: '#059669' },
    { code: 'cancelled', name: 'Anulowane', color: '#EF4444' },
  ],
  production: [
    { code: 'new', name: 'Nowe', color: '#3B82F6' },
    { code: 'confirmed', name: 'Potwierdzone', color: '#8B5CF6' },
    { code: 'in_production', name: 'W produkcji', color: '#F59E0B' },
    { code: 'quality_check', name: 'Kontrola jakosci', color: '#EC4899' },
    { code: 'ready', name: 'Gotowe', color: '#10B981' },
    { code: 'shipped', name: 'Wyslane', color: '#059669' },
    { code: 'delivered', name: 'Dostarczone', color: '#047857' },
    { code: 'cancelled', name: 'Anulowane', color: '#EF4444' },
  ],
  trade: [
    { code: 'new', name: 'Nowe', color: '#3B82F6' },
    { code: 'confirmed', name: 'Potwierdzone', color: '#8B5CF6' },
    { code: 'picking', name: 'Kompletowanie', color: '#F59E0B' },
    { code: 'packed', name: 'Spakowane', color: '#EC4899' },
    { code: 'shipped', name: 'Wyslane', color: '#10B981' },
    { code: 'delivered', name: 'Dostarczone', color: '#059669' },
    { code: 'returned', name: 'Zwrocone', color: '#F97316' },
    { code: 'cancelled', name: 'Anulowane', color: '#EF4444' },
  ],
} as const;

// ===========================================
// ENTITY NAMING BY TEMPLATE
// ===========================================

export const ENTITY_NAMING = {
  services: {
    Order: { name: 'Zlecenie', prefix: 'ZLC', plural: 'Zlecenia' },
    Customer: { name: 'Klient', prefix: 'KLI', plural: 'Klienci' },
    Product: { name: 'Usluga', prefix: 'USL', plural: 'Uslugi' },
    Quote: { name: 'Wycena', prefix: 'WYC', plural: 'Wyceny' },
    Task: { name: 'Zadanie', prefix: 'ZAD', plural: 'Zadania' },
    Ticket: { name: 'Zgloszenie', prefix: 'ZGL', plural: 'Zgloszenia' },
  },
  production: {
    Order: { name: 'Zamowienie produkcyjne', prefix: 'ZP', plural: 'Zamowienia' },
    Customer: { name: 'Odbiorca', prefix: 'ODB', plural: 'Odbiorcy' },
    Product: { name: 'Wyrob', prefix: 'WYR', plural: 'Wyroby' },
    Quote: { name: 'Kalkulacja', prefix: 'KAL', plural: 'Kalkulacje' },
    Task: { name: 'Operacja', prefix: 'OPR', plural: 'Operacje' },
    Ticket: { name: 'Reklamacja', prefix: 'REK', plural: 'Reklamacje' },
  },
  trade: {
    Order: { name: 'Zamowienie', prefix: 'ZAM', plural: 'Zamowienia' },
    Customer: { name: 'Kontrahent', prefix: 'KON', plural: 'Kontrahenci' },
    Product: { name: 'Towar', prefix: 'TOW', plural: 'Towary' },
    Quote: { name: 'Oferta', prefix: 'OFR', plural: 'Oferty' },
    Task: { name: 'Czynnosc', prefix: 'CZY', plural: 'Czynnosci' },
    Ticket: { name: 'Sprawa', prefix: 'SPR', plural: 'Sprawy' },
  },
} as const;

// ===========================================
// DEFAULT MODULES BY TEMPLATE
// ===========================================

export const DEFAULT_MODULES = {
  services: ['@customers', '@orders', '@products', '@quotes', '@calendar', '@portal'],
  production: ['@customers', '@orders', '@products', '@stock', '@portal'],
  trade: ['@customers', '@orders', '@products', '@stock', '@quotes', '@portal'],
} as const;

// ===========================================
// EVENT TYPES
// ===========================================

export const EVENT_TYPES = {
  // Entity CRUD
  ENTITY_CREATED: 'entity.created',
  ENTITY_UPDATED: 'entity.updated',
  ENTITY_DELETED: 'entity.deleted',

  // Orders
  ORDER_CREATED: 'order.created',
  ORDER_CONFIRMED: 'order.confirmed',
  ORDER_IN_PROGRESS: 'order.in_progress',
  ORDER_READY: 'order.ready',
  ORDER_SHIPPED: 'order.shipped',
  ORDER_DELIVERED: 'order.delivered',
  ORDER_CANCELLED: 'order.cancelled',
  ORDER_STATUS_CHANGED: 'order.status_changed',

  // Quotes
  QUOTE_CREATED: 'quote.created',
  QUOTE_SENT: 'quote.sent',
  QUOTE_ACCEPTED: 'quote.accepted',
  QUOTE_REJECTED: 'quote.rejected',
  QUOTE_EXPIRED: 'quote.expired',

  // Customers
  CUSTOMER_CREATED: 'customer.created',
  CUSTOMER_UPDATED: 'customer.updated',
  CUSTOMER_PORTAL_LOGIN: 'customer.portal_login',

  // Stock
  STOCK_RESERVED: 'stock.reserved',
  STOCK_RELEASED: 'stock.released',
  STOCK_LOW: 'stock.low',
} as const;
