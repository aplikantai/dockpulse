# Modul @measurements - Specyfikacja

## 1. Cel modulu

Modul @measurements umozliwia rejestrowanie pomiarow u klienta (dla branzy budowlanej, rolet, moskitier).
Kazdy pomiar moze zawierac wiele pozycji z wymiarami i zdjecia.

## 2. Model danych (Prisma)

```prisma
model Measurement {
  id            String   @id @default(uuid())
  tenantId      String
  orderId       String
  order         Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)

  // Technik wykonujacy pomiar
  technicianId  String
  technician    User     @relation(fields: [technicianId], references: [id])

  // Terminy
  scheduledAt   DateTime?  // Zaplanowana data pomiaru
  startedAt     DateTime?  // Kiedy rozpoczeto
  completedAt   DateTime?  // Kiedy zakonczono

  // Status
  status        MeasurementStatus @default(SCHEDULED)

  // Dokumentacja
  photos        String[]   // URLs do zdjec
  notes         String?    // Notatki z pomiaru

  // Metadane
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relacje
  items         MeasurementItem[]

  @@index([tenantId])
  @@index([orderId])
  @@index([technicianId])
  @@index([status])
  @@map("measurements")
}

model MeasurementItem {
  id            String   @id @default(uuid())
  measurementId String
  measurement   Measurement @relation(fields: [measurementId], references: [id], onDelete: Cascade)

  // Lokalizacja w budynku
  location      String   // "Salon okno 1", "Sypialnia drzwi balkonowe"
  floor         String?  // "Parter", "1 pietro"

  // Produkt
  product       String   // "Moskitiera ramowa", "Roleta wolnowiszaca"
  productCode   String?  // Kod z cennika

  // Wymiary (w mm)
  widthMm       Int
  heightMm      Int
  depthMm       Int?     // Glebokosc (np. dla rolety)

  // Ilosc
  quantity      Int      @default(1)

  // Opcje
  color         String?  // Kolor
  mountType     String?  // Typ montazu: na ramie, w oscieze, itp.
  driveType     String?  // Typ napdu: reczny, elektryczny

  // Dodatkowe
  notes         String?
  photos        String[] // Zdjecia tej pozycji

  // Metadane
  sortOrder     Int      @default(0)
  createdAt     DateTime @default(now())

  @@index([measurementId])
  @@map("measurement_items")
}

enum MeasurementStatus {
  SCHEDULED    // Zaplanowany
  IN_PROGRESS  // W trakcie
  COMPLETED    // Zakonczony
  CANCELLED    // Anulowany
}
```

## 3. Endpointy API

### Measurements CRUD
- GET    /api/measurements                    - Lista pomiarow
- GET    /api/measurements/:id                - Szczegoly pomiaru
- POST   /api/measurements                    - Utworz pomiar
- PATCH  /api/measurements/:id                - Aktualizuj pomiar
- DELETE /api/measurements/:id                - Usun pomiar

### Status
- POST   /api/measurements/:id/start          - Rozpocznij pomiar
- POST   /api/measurements/:id/complete       - Zakoncz pomiar
- POST   /api/measurements/:id/cancel         - Anuluj pomiar

### Items
- GET    /api/measurements/:id/items          - Pozycje pomiaru
- POST   /api/measurements/:id/items          - Dodaj pozycje
- PATCH  /api/measurements/:id/items/:itemId  - Aktualizuj pozycje
- DELETE /api/measurements/:id/items/:itemId  - Usun pozycje

### Zdjecia
- POST   /api/measurements/:id/photos         - Upload zdjec
- DELETE /api/measurements/:id/photos/:photoId - Usun zdjecie

### Kalendarz
- GET    /api/measurements/calendar           - Widok kalendarza
- GET    /api/measurements/by-technician/:id  - Pomiary technika

## 4. DTO (Zod)

```typescript
const createMeasurementSchema = z.object({
  orderId: z.string().uuid(),
  technicianId: z.string().uuid(),
  scheduledAt: z.string().datetime().optional(),
  notes: z.string().optional(),
});

const measurementItemSchema = z.object({
  location: z.string().min(2),
  floor: z.string().optional(),
  product: z.string().min(2),
  productCode: z.string().optional(),
  widthMm: z.number().int().positive(),
  heightMm: z.number().int().positive(),
  depthMm: z.number().int().positive().optional(),
  quantity: z.number().int().positive().default(1),
  color: z.string().optional(),
  mountType: z.string().optional(),
  driveType: z.string().optional(),
  notes: z.string().optional(),
});
```

## 5. Integracje

### Z modulem @orders
- Order -> Measurement (1:many)
- Status zamowienia zmienia sie na POMIAR_UMOWIONY po zaplanowaniu

### Z modulem @quotes
- Pozycje pomiaru moga byc automatycznie przeniesione do wyceny

### Z modulem @calendar
- Pomiary widoczne w kalendarzu technikow

### Z modulem @price-matrix
- Automatyczne wycenianie pozycji na podstawie wymiarow

## 6. Konfiguracja modulu

```typescript
interface MeasurementsModuleConfig {
  autoCreateQuote: boolean;     // Tworz wycene po pomiarze
  requirePhotos: boolean;       // Wymagaj zdjec
  defaultDurationMinutes: number; // Domyslny czas pomiaru (60)
}
```
