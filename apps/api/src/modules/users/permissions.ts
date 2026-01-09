/**
 * Permissions System
 *
 * Granular permissions for the DockPulse platform
 * Based on FAZA A: USERS.ROLES specification
 */

import { UserRole } from '@prisma/client';

// ===========================================
// PERMISSION DEFINITIONS
// ===========================================

export const PERMISSIONS = {
  // === CRM ===
  'crm:view': 'Podgląd klientów',
  'crm:create': 'Tworzenie klientów',
  'crm:edit': 'Edycja klientów',
  'crm:delete': 'Usuwanie klientów',
  'crm:import': 'Import klientów',
  'crm:export': 'Eksport klientów',
  'crm:tags': 'Zarządzanie tagami',
  'crm:notes': 'Notatki do klientów',
  'crm:segments': 'Segmentacja klientów',
  'crm:portal': 'Portal klienta',

  // === ORDERS ===
  'orders:view': 'Podgląd zamówień',
  'orders:create': 'Tworzenie zamówień',
  'orders:edit': 'Edycja zamówień',
  'orders:delete': 'Usuwanie zamówień',
  'orders:assign': 'Przypisywanie zamówień',
  'orders:status': 'Zmiana statusu',
  'orders:measurement': 'Obsługa pomiarów',
  'orders:installation': 'Obsługa montaży',
  'orders:attachments': 'Zarządzanie załącznikami',
  'orders:photos': 'Zarządzanie zdjęciami',
  'orders:templates': 'Szablony zamówień',

  // === QUOTES ===
  'quotes:view': 'Podgląd wycen',
  'quotes:create': 'Tworzenie wycen',
  'quotes:edit': 'Edycja wycen',
  'quotes:send': 'Wysyłanie wycen',
  'quotes:approve': 'Akceptacja wycen',
  'quotes:delete': 'Usuwanie wycen',
  'quotes:templates': 'Szablony wycen',

  // === PRODUCTS ===
  'products:view': 'Podgląd produktów',
  'products:create': 'Tworzenie produktów',
  'products:edit': 'Edycja produktów',
  'products:delete': 'Usuwanie produktów',
  'products:prices': 'Zarządzanie cenami',
  'products:stock': 'Zarządzanie stanem',
  'products:categories': 'Zarządzanie kategoriami',
  'products:import': 'Import produktów',
  'products:export': 'Eksport produktów',

  // === WMS (Warehouse) ===
  'wms:view': 'Podgląd magazynu',
  'wms:receive': 'Przyjęcia (PZ)',
  'wms:ship': 'Wydania (WZ)',
  'wms:transfer': 'Przesunięcia (MM)',
  'wms:inventory': 'Inwentaryzacja',
  'wms:locations': 'Zarządzanie lokalizacjami',
  'wms:containers': 'Zarządzanie kuwetami',
  'wms:barcodes': 'Skanowanie kodów',
  'wms:labels': 'Druk etykiet',

  // === INVOICES ===
  'invoices:view': 'Podgląd faktur',
  'invoices:create': 'Tworzenie faktur',
  'invoices:edit': 'Edycja faktur',
  'invoices:send': 'Wysyłanie faktur',
  'invoices:delete': 'Usuwanie faktur',
  'invoices:payments': 'Zarządzanie płatnościami',
  'invoices:corrections': 'Korekty faktur',

  // === PROJECTS ===
  'projects:view': 'Podgląd projektów',
  'projects:create': 'Tworzenie projektów',
  'projects:edit': 'Edycja projektów',
  'projects:delete': 'Usuwanie projektów',
  'projects:tasks': 'Zarządzanie zadaniami',
  'projects:milestones': 'Kamienie milowe',
  'projects:resources': 'Zarządzanie zasobami',

  // === CALENDAR ===
  'calendar:view': 'Podgląd kalendarza',
  'calendar:create': 'Tworzenie wydarzeń',
  'calendar:edit': 'Edycja wydarzeń',
  'calendar:delete': 'Usuwanie wydarzeń',
  'calendar:share': 'Udostępnianie kalendarza',
  'calendar:reminders': 'Przypomnienia',

  // === REPORTS ===
  'reports:view': 'Podgląd raportów',
  'reports:export': 'Eksport raportów',
  'reports:advanced': 'Raporty zaawansowane',
  'reports:custom': 'Własne raporty',
  'reports:analytics': 'Analityka',

  // === BRANCHES ===
  'branches:view': 'Podgląd oddziałów',
  'branches:manage': 'Zarządzanie oddziałami',
  'branches:transfer': 'Transfer zleceń',
  'branches:reports': 'Raporty per oddział',

  // === SETTINGS ===
  'settings:view': 'Podgląd ustawień',
  'settings:edit': 'Edycja ustawień',
  'settings:modules': 'Zarządzanie modułami',
  'settings:submodules': 'Zarządzanie podmodułami',
  'settings:fields': 'Konfiguracja pól',
  'settings:workflows': 'Konfiguracja workflow',
  'settings:branding': 'Branding tenanta',

  // === USERS ===
  'users:view': 'Podgląd użytkowników',
  'users:create': 'Tworzenie użytkowników',
  'users:edit': 'Edycja użytkowników',
  'users:delete': 'Usuwanie użytkowników',
  'users:roles': 'Zarządzanie rolami',
  'users:permissions': 'Zarządzanie uprawnieniami',
  'users:audit': 'Podgląd audit log',

  // === DICTIONARIES ===
  'dictionaries:view': 'Podgląd słowników',
  'dictionaries:manage': 'Zarządzanie słownikami',

  // === PLATFORM (Super Admin) ===
  'platform:tenants': 'Zarządzanie tenantami',
  'platform:billing': 'Zarządzanie subskrypcjami',
  'platform:analytics': 'Analityka platformy',
  'platform:support': 'Panel supportu',
} as const;

export type Permission = keyof typeof PERMISSIONS;

// ===========================================
// DEFAULT ROLE PERMISSIONS
// ===========================================

export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  // OWNER - Właściciel (pełne uprawnienia do swojego tenanta)
  OWNER: [
    // CRM
    'crm:view',
    'crm:create',
    'crm:edit',
    'crm:delete',
    'crm:import',
    'crm:export',
    'crm:tags',
    'crm:notes',
    'crm:segments',
    'crm:portal',

    // ORDERS
    'orders:view',
    'orders:create',
    'orders:edit',
    'orders:delete',
    'orders:assign',
    'orders:status',
    'orders:measurement',
    'orders:installation',
    'orders:attachments',
    'orders:photos',
    'orders:templates',

    // QUOTES
    'quotes:view',
    'quotes:create',
    'quotes:edit',
    'quotes:send',
    'quotes:approve',
    'quotes:delete',
    'quotes:templates',

    // PRODUCTS
    'products:view',
    'products:create',
    'products:edit',
    'products:delete',
    'products:prices',
    'products:stock',
    'products:categories',
    'products:import',
    'products:export',

    // WMS
    'wms:view',
    'wms:receive',
    'wms:ship',
    'wms:transfer',
    'wms:inventory',
    'wms:locations',
    'wms:containers',
    'wms:barcodes',
    'wms:labels',

    // INVOICES
    'invoices:view',
    'invoices:create',
    'invoices:edit',
    'invoices:send',
    'invoices:delete',
    'invoices:payments',
    'invoices:corrections',

    // PROJECTS
    'projects:view',
    'projects:create',
    'projects:edit',
    'projects:delete',
    'projects:tasks',
    'projects:milestones',
    'projects:resources',

    // CALENDAR
    'calendar:view',
    'calendar:create',
    'calendar:edit',
    'calendar:delete',
    'calendar:share',
    'calendar:reminders',

    // REPORTS
    'reports:view',
    'reports:export',
    'reports:advanced',
    'reports:custom',
    'reports:analytics',

    // BRANCHES
    'branches:view',
    'branches:manage',
    'branches:transfer',
    'branches:reports',

    // SETTINGS
    'settings:view',
    'settings:edit',
    'settings:modules',
    'settings:submodules',
    'settings:fields',
    'settings:workflows',
    'settings:branding',

    // USERS
    'users:view',
    'users:create',
    'users:edit',
    'users:delete',
    'users:roles',
    'users:permissions',
    'users:audit',

    // DICTIONARIES
    'dictionaries:view',
    'dictionaries:manage',
  ],

  // ADMIN - Administrator (prawie wszystko oprócz zarządzania użytkownikami)
  ADMIN: [
    // CRM
    'crm:view',
    'crm:create',
    'crm:edit',
    'crm:delete',
    'crm:import',
    'crm:export',
    'crm:tags',
    'crm:notes',
    'crm:segments',

    // ORDERS
    'orders:view',
    'orders:create',
    'orders:edit',
    'orders:delete',
    'orders:assign',
    'orders:status',
    'orders:measurement',
    'orders:installation',
    'orders:attachments',
    'orders:photos',
    'orders:templates',

    // QUOTES
    'quotes:view',
    'quotes:create',
    'quotes:edit',
    'quotes:send',
    'quotes:approve',
    'quotes:delete',
    'quotes:templates',

    // PRODUCTS
    'products:view',
    'products:create',
    'products:edit',
    'products:delete',
    'products:prices',
    'products:stock',
    'products:categories',
    'products:import',
    'products:export',

    // WMS
    'wms:view',
    'wms:receive',
    'wms:ship',
    'wms:transfer',
    'wms:inventory',
    'wms:locations',
    'wms:containers',

    // INVOICES
    'invoices:view',
    'invoices:create',
    'invoices:edit',
    'invoices:send',
    'invoices:delete',
    'invoices:payments',

    // PROJECTS
    'projects:view',
    'projects:create',
    'projects:edit',
    'projects:delete',
    'projects:tasks',
    'projects:milestones',

    // CALENDAR
    'calendar:view',
    'calendar:create',
    'calendar:edit',
    'calendar:delete',

    // REPORTS
    'reports:view',
    'reports:export',
    'reports:advanced',
    'reports:analytics',

    // BRANCHES
    'branches:view',
    'branches:transfer',
    'branches:reports',

    // SETTINGS
    'settings:view',
    'settings:edit',
    'settings:modules',
    'settings:submodules',
    'settings:fields',
    'settings:workflows',

    // USERS (limited)
    'users:view',

    // DICTIONARIES
    'dictionaries:view',
    'dictionaries:manage',
  ],

  // MANAGER - Manager zespołu
  MANAGER: [
    // CRM
    'crm:view',
    'crm:create',
    'crm:edit',
    'crm:tags',
    'crm:notes',
    'crm:export',

    // ORDERS
    'orders:view',
    'orders:create',
    'orders:edit',
    'orders:assign',
    'orders:status',
    'orders:measurement',
    'orders:installation',
    'orders:attachments',
    'orders:photos',

    // QUOTES
    'quotes:view',
    'quotes:create',
    'quotes:edit',
    'quotes:send',
    'quotes:approve',

    // PRODUCTS
    'products:view',
    'products:prices',
    'products:stock',

    // INVOICES
    'invoices:view',
    'invoices:create',
    'invoices:send',

    // PROJECTS
    'projects:view',
    'projects:create',
    'projects:edit',
    'projects:tasks',

    // CALENDAR
    'calendar:view',
    'calendar:create',
    'calendar:edit',

    // REPORTS
    'reports:view',
    'reports:export',

    // BRANCHES
    'branches:view',
    'branches:reports',

    // SETTINGS (limited)
    'settings:view',

    // USERS (view only)
    'users:view',

    // DICTIONARIES
    'dictionaries:view',
  ],

  // EMPLOYEE - Pracownik
  EMPLOYEE: [
    // CRM
    'crm:view',
    'crm:create',
    'crm:notes',

    // ORDERS
    'orders:view',
    'orders:create',
    'orders:measurement',
    'orders:installation',
    'orders:attachments',
    'orders:photos',

    // QUOTES
    'quotes:view',

    // PRODUCTS
    'products:view',

    // CALENDAR
    'calendar:view',
    'calendar:create',

    // REPORTS (limited)
    'reports:view',

    // DICTIONARIES
    'dictionaries:view',
  ],

  // VIEWER - Tylko podgląd
  VIEWER: [
    'crm:view',
    'orders:view',
    'quotes:view',
    'products:view',
    'calendar:view',
    'reports:view',
    'branches:view',
    'dictionaries:view',
  ],

  // PLATFORM_ADMIN - Administrator platformy (wszystko + zarządzanie tenantami)
  PLATFORM_ADMIN: (Object.keys(PERMISSIONS) as Permission[]),
};

// ===========================================
// HELPER FUNCTIONS
// ===========================================

/**
 * Get permissions for a role
 */
export function getRolePermissions(role: UserRole): Permission[] {
  return DEFAULT_ROLE_PERMISSIONS[role] || [];
}

/**
 * Check if a role has a permission
 */
export function roleHasPermission(role: UserRole, permission: Permission): boolean {
  const rolePerms = getRolePermissions(role);
  return rolePerms.includes(permission);
}

/**
 * Get all permissions (for admin panels)
 */
export function getAllPermissions(): Array<{ key: Permission; description: string }> {
  return Object.entries(PERMISSIONS).map(([key, description]) => ({
    key: key as Permission,
    description,
  }));
}

/**
 * Group permissions by module
 */
export function getPermissionsByModule(): Record<string, Array<{ key: Permission; description: string }>> {
  const grouped: Record<string, Array<{ key: Permission; description: string }>> = {};

  Object.entries(PERMISSIONS).forEach(([key, description]) => {
    const module = key.split(':')[0];
    if (!grouped[module]) {
      grouped[module] = [];
    }
    grouped[module].push({ key: key as Permission, description });
  });

  return grouped;
}
