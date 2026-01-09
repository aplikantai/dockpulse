# Modul @locations - Specyfikacja

## 1. Cel modulu

Modul @locations zarzadza punktami odbioru, sklepami, lokalizacjami dla zamowien.
Umozliwia klientom wybor miejsca odbioru zamowienia.

## 2. Model danych (Prisma)

```prisma
model Location {
  id            String   @id @default(uuid())
  tenantId      String
  tenant        Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  // Identyfikacja
  code          String?  // LOK-001
  name          String   // Sklep Gorzow Centrum
  type          LocationType @default(SHOP)

  // Adres
  address       String
  city          String?
  postalCode    String?
  country       String   @default("PL")

  // Geolokalizacja
  latitude      Float?
  longitude     Float?
  googleMapsUrl String?

  // Kontakt
  phone         String?
  email         String?

  // Godziny otwarcia (JSON)
  openingHours  Json?    // {"mon":"8:00-16:00","tue":"8:00-16:00",...}
  closedDates   Json?    // ["2024-12-25","2024-12-26"]

  // Ustawienia
  prepTimeMinutes Int    @default(30)  // Czas przygotowania zamowienia
  isActive      Boolean  @default(true)
  isDefault     Boolean  @default(false)
  sortOrder     Int      @default(0)

  // Metadane
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relacje
  orders        Order[]

  @@unique([tenantId, code])
  @@index([tenantId])
  @@index([type])
  @@map("locations")
}

enum LocationType {
  SHOP      // Sklep stacjonarny
  WAREHOUSE // Magazyn
  PICKUP    // Punkt odbioru
  SERVICE   // Punkt serwisowy
}
```

## 3. Endpointy API

### Locations CRUD
- GET    /api/locations              - Lista lokalizacji
- GET    /api/locations/:id          - Szczegoly lokalizacji
- POST   /api/locations              - Utworz lokalizacje
- PATCH  /api/locations/:id          - Aktualizuj lokalizacje
- DELETE /api/locations/:id          - Usun lokalizacje

### Specjalne
- GET    /api/locations/active       - Tylko aktywne lokalizacje
- GET    /api/locations/default      - Domyslna lokalizacja
- GET    /api/locations/by-type/:type - Filtr po typie
- GET    /api/locations/nearest      - Najblizsze (wymaga lat/lng)

## 4. DTO (Zod)

```typescript
const createLocationSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(2).max(100),
  type: z.enum(['SHOP', 'WAREHOUSE', 'PICKUP', 'SERVICE']).optional(),
  address: z.string().min(5),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  openingHours: z.record(z.string()).optional(),
  closedDates: z.array(z.string()).optional(),
  prepTimeMinutes: z.number().int().positive().optional(),
  isDefault: z.boolean().optional(),
});
```

## 5. Integracje

### Z modulem @orders
- Order.pickupLocationId -> Location.id
- Walidacja czy lokalizacja jest aktywna przy skladaniu zamowienia

### Z modulem @delivery
- Location moze byc punktem startowym dla tras dostaw

## 6. Konfiguracja modulu

```typescript
interface LocationsModuleConfig {
  allowCustomAddress: boolean;  // Czy pozwolic na wlasny adres dostawy
  showOpeningHours: boolean;    // Czy pokazywac godziny otwarcia
  requireLocation: boolean;     // Czy lokalizacja jest wymagana
}
```
