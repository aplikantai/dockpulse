# Modul @dictionaries - Specyfikacja

## 1. Cel modulu

Modul @dictionaries zarzadza slownikami systemowymi - predefiniowanymi wartosciami
dla roznych pol (statusy, kategorie, typy, jednostki, itp.).

## 2. Model danych (Prisma)

```prisma
model Dictionary {
  id          String   @id @default(uuid())
  tenantId    String?  // null = systemowy, wartosci = per-tenant
  tenant      Tenant?  @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  // Identyfikacja
  type        String   // "order_status", "product_category", "unit", etc.
  code        String   // "new", "in_progress", "completed"

  // Etykiety
  label       String   // "Nowe", "W trakcie", "Zakonczone"
  labelEn     String?  // "New", "In Progress", "Completed"

  // Wygląd
  color       String?  // "#10B981" (hex) lub "green" (nazwa)
  icon        String?  // "clock", "check", "x"

  // Metadane
  description String?  // Opis wartosci
  metadata    Json?    // Dodatkowe dane JSON

  // Ustawienia
  isDefault   Boolean  @default(false)  // Domyslna wartosc dla typu
  isSystem    Boolean  @default(false)  // Systemowa (nie mozna usunac)
  isActive    Boolean  @default(true)
  sortOrder   Int      @default(0)

  // Daty
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([tenantId, type, code])
  @@index([tenantId])
  @@index([type])
  @@index([isActive])
  @@map("dictionaries")
}
```

## 3. Typy slownikow (predefiniowane)

```typescript
const DICTIONARY_TYPES = {
  // Zamowienia
  ORDER_STATUS: 'order_status',
  ORDER_TYPE: 'order_type',
  ORDER_SOURCE: 'order_source',

  // Produkty
  PRODUCT_CATEGORY: 'product_category',
  PRODUCT_UNIT: 'product_unit',

  // Klienci
  CUSTOMER_TYPE: 'customer_type',
  CUSTOMER_GROUP: 'customer_group',

  // Wyceny
  QUOTE_STATUS: 'quote_status',

  // Pomiary
  MEASUREMENT_STATUS: 'measurement_status',
  MOUNT_TYPE: 'mount_type',
  DRIVE_TYPE: 'drive_type',

  // Projekty (dla template: design)
  PROJECT_STATUS: 'project_status',
  PROJECT_TYPE: 'project_type',

  // Ogolne
  PRIORITY: 'priority',
  PAYMENT_STATUS: 'payment_status',
  PAYMENT_METHOD: 'payment_method',
} as const;
```

## 4. Endpointy API

### Dictionaries CRUD
- GET    /api/dictionaries              - Wszystkie slowniki
- GET    /api/dictionaries/:type        - Slownik po typie
- GET    /api/dictionaries/:type/:code  - Pojedyncza wartosc
- POST   /api/dictionaries              - Utworz wartosc
- PATCH  /api/dictionaries/:id          - Aktualizuj wartosc
- DELETE /api/dictionaries/:id          - Usun wartosc

### Specjalne
- GET    /api/dictionaries/types        - Lista typow slownikow
- GET    /api/dictionaries/by-type/:type/default - Domyslna wartosc
- POST   /api/dictionaries/seed/:template - Zaladuj domyslne dla szablonu

## 5. DTO (Zod)

```typescript
const createDictionarySchema = z.object({
  type: z.string().min(2).max(50),
  code: z.string().min(1).max(50),
  label: z.string().min(1).max(100),
  labelEn: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  description: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  isDefault: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});
```

## 6. Domyslne wartosci (seed)

```typescript
const DEFAULT_DICTIONARIES = {
  order_status: [
    { code: 'new', label: 'Nowe', color: '#3B82F6', icon: 'inbox', isDefault: true },
    { code: 'confirmed', label: 'Potwierdzone', color: '#8B5CF6', icon: 'check' },
    { code: 'in_progress', label: 'W realizacji', color: '#F59E0B', icon: 'clock' },
    { code: 'ready', label: 'Gotowe', color: '#10B981', icon: 'package' },
    { code: 'completed', label: 'Zakonczone', color: '#059669', icon: 'check-circle' },
    { code: 'cancelled', label: 'Anulowane', color: '#EF4444', icon: 'x-circle' },
  ],
  product_unit: [
    { code: 'szt', label: 'Sztuka', isDefault: true },
    { code: 'kg', label: 'Kilogram' },
    { code: 'mb', label: 'Metr biezacy' },
    { code: 'm2', label: 'Metr kwadratowy' },
    { code: 'kpl', label: 'Komplet' },
    { code: 'opak', label: 'Opakowanie' },
  ],
  priority: [
    { code: 'low', label: 'Niski', color: '#6B7280', icon: 'minus' },
    { code: 'medium', label: 'Sredni', color: '#F59E0B', icon: 'minus', isDefault: true },
    { code: 'high', label: 'Wysoki', color: '#EF4444', icon: 'arrow-up' },
    { code: 'urgent', label: 'Pilne', color: '#DC2626', icon: 'alert-triangle' },
  ],
  payment_status: [
    { code: 'unpaid', label: 'Nieoplacone', color: '#EF4444', isDefault: true },
    { code: 'deposit', label: 'Zaliczka', color: '#F59E0B' },
    { code: 'paid', label: 'Oplacone', color: '#10B981' },
    { code: 'refunded', label: 'Zwrocone', color: '#6B7280' },
  ],
};
```

## 7. Integracje

Slowniki sa uzywane przez wszystkie moduly:
- @orders - statusy zamowien
- @products - kategorie, jednostki
- @quotes - statusy wycen
- @measurements - typy montazu, napedow
- @projects - statusy projektow

## 8. Konfiguracja modulu

```typescript
interface DictionariesModuleConfig {
  allowCustomValues: boolean;   // Czy tenant moze dodawac wlasne wartosci
  inheritSystem: boolean;       // Czy dziedziczyc wartosci systemowe
  cacheTimeSeconds: number;     // Czas cache slownikow (300)
}
```

## 9. Helper do uzycia w kodzie

```typescript
// Uzycie w serwisie
const status = await this.dictionariesService.getValue('order_status', 'new');
// { code: 'new', label: 'Nowe', color: '#3B82F6' }

// Walidacja
const isValid = await this.dictionariesService.isValidValue('order_status', 'new');
// true

// Lista wartosci
const statuses = await this.dictionariesService.getByType('order_status');
// [{ code: 'new', ... }, { code: 'confirmed', ... }, ...]
```
