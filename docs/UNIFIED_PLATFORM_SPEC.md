# DockPulse Unified Platform v3.0 - Specyfikacja

## 1. Analiza projektow zrodlowych

| Projekt | Branza | Backend | Frontend | Baza | Kluczowe cechy |
|---------|--------|---------|----------|------|----------------|
| **ebukieteria.pl** | Kwiaciarnia | Express + Prisma | React + Vite | PostgreSQL | Zamowienia normalne + pogrzebowe, warianty produktow, lojalnosc, grafik pracy, trasy dostaw |
| **wedlinyodkaroliny.pl** | Wedliny/Food | Express + Prisma | 2x React (admin + client) | PostgreSQL | QR kody zamowien, punkty odbioru, dostawa |
| **wms.ebukieteria.pl** | Magazyn | Express + tsx | React + Zustand | PostgreSQL | WMS: lokalizacje, kontenery, dokumenty PZ/WZ/MM, inwentaryzacja |
| **zamowienia-studioinconcept.pl** | Studio projektowe | Express + Prisma | React + Vite | SQLite | Projekty, briefs, kosztorysy, timeline, dostawcy |
| **zamowienia-tapparella.pl** | Rolety/Moskitiery | Express + Prisma | React + Vite | PostgreSQL | Oddzialy, pomiary, wyceny, montaz, cennik tabelaryczny, Google Calendar |

---

## 2. Architektura docelowa

```
+-------------------------------------------------------------+
|                      FRONTEND                                |
|  Next.js 15 + React 19 + Tailwind + TanStack Query + Zustand|
|  - Admin Panel (multi-tenant)                                |
|  - Client Portal (per tenant)                                |
|  - Landing Page                                              |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|                      API GATEWAY                             |
|  NestJS 11 + Prisma 6 + PostgreSQL 16 + Redis 7 + BullMQ    |
|  - Multi-tenancy (subdomena + x-tenant-id)                   |
|  - Modular architecture                                      |
|  - Event-driven (PostgreSQL LISTEN/NOTIFY)                   |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|                    SHARED PACKAGES                           |
|  @dockpulse/database - Prisma schema                         |
|  @dockpulse/shared - Types, validators (Zod)                 |
|  @dockpulse/ui - Shared components                           |
|  @dockpulse/templates - Branzowe szablony                    |
+-------------------------------------------------------------+
```

---

## 3. Istniejace moduly DockPulse

| Modul | Kod | Status | Opis |
|-------|-----|--------|------|
| auth | @auth | DONE | Autentykacja, JWT, role |
| users | @users | DONE | Uzytkownicy |
| tenant | @tenant | DONE | Multi-tenancy |
| customers | @customers | DONE | Klienci/CRM |
| orders | @orders | DONE | Zamowienia |
| quotes | @quotes | DONE | Wyceny |
| products | @products | DONE | Produkty |
| stock | @stock | DONE | Stany magazynowe (podstawowe) |
| calendar | @calendar | DONE | Kalendarz |
| settings | @settings | DONE | Ustawienia |
| invoicing | @invoicing | DONE | Fakturowanie |
| webhooks | @webhooks | DONE | Webhooki |
| notifications | @notifications | DONE | Powiadomienia |
| branding | @branding | DONE | Branding/White-label |
| platform | @platform | DONE | Administracja platformy |
| module-registry | @module-registry | DONE | Rejestr modulow |
| events/data-bus | @events | DONE | Event bus |

---

## 4. Nowe moduly do implementacji

### TIER 1 - Priorytet wysoki

| Modul | Kod | Zrodlo | Opis |
|-------|-----|--------|------|
| Oddzialy | @branches | tapparella | Oddzialy firmy z przypisaniem userow |
| Lokalizacje | @locations | ebuk, wedl | Punkty odbioru / sklepy |
| Pomiary | @measurements | tapparella | Pomiary u klienta z pozycjami |
| Dostawa | @delivery | ebuk, wedl | Trasy dostaw, ustawienia dostawy |
| Slowniki | @dictionaries | inconcept, tapparella | Slowniki systemowe |

### TIER 2 - Priorytet sredni

| Modul | Kod | Zrodlo | Opis |
|-------|-----|--------|------|
| Projekty | @projects | inconcept | Projekty z briefem, timeline, budzetami |
| Kosztorysy | @estimates | inconcept | Kosztorysy z opcjami i wariantami |
| Cennik tabelaryczny | @price-matrix | tapparella | Cenniki wg wymiarow |
| Montaz | @installations | tapparella | Montaz z dokumentacja foto |
| Rabaty | @discounts | ebuk | Kody rabatowe |
| Lojalnosc | @loyalty | ebuk | Program lojalnosciowy |

### TIER 3 - WMS

| Modul | Kod | Zrodlo | Opis |
|-------|-----|--------|------|
| Magazyny | @warehouses | wms | Wielomagazynowosc |
| Lokalizacje WMS | @wms-locations | wms | Lokalizacje (regal/polka/poziom) |
| Kontenery | @containers | wms | Kontenery/kuwety |
| Dokumenty WMS | @wms-documents | wms | Dokumenty PZ/WZ/MM |
| Inwentaryzacja | @inventory-count | wms | Inwentaryzacja |

---

## 5. Rozszerzenia istniejacych modulow

### @products
- +variants (S/M/L/XL z cena)
- +unit (kg/szt/mb/m2)
- +ean (kod kreskowy)
- +kgPerPiece (przelicznik)

### @orders
- +orderType (DAILY/FUNERAL/SERVICE)
- +qrCode
- +pickupPointId
- +funeralDetails (JSON)
- +measurement_scheduled_at
- +mount_scheduled_at

### @quotes
- +versioning (parent_quote_id)
- +client_token (dla podgladu)
- +footer_text
- +validity_days

### @stock
- +locationId (dla WMS)
- +containerId (dla WMS)
- +batchNo (partie)

### @calendar
- +Google Calendar sync
- +grafik pracy uzytkownikow
- +recurring events

### @users
- +branch_ids[]
- +calendar_color_id
- +assigned_warehouses[]

---

## 6. Szablony branzowe

### A) KWIACIARNIA (template: florist)
```json
{
  "modules": ["@crm", "@orders", "@products", "@inventory", "@calendar", "@delivery", "@loyalty"],
  "customFields": {
    "order": ["orderType", "ribbonText", "ceremonyPlace"],
    "product": ["variants"]
  }
}
```

### B) FOOD/WEDLINY (template: food)
```json
{
  "modules": ["@crm", "@orders", "@products", "@inventory", "@delivery", "@notifications"],
  "customFields": {
    "order": ["pickupPoint", "pickupTime", "qrCode"],
    "product": ["unit", "kgPerPiece"]
  }
}
```

### C) USLUGI BUDOWLANE/ROLETY (template: construction)
```json
{
  "modules": ["@crm", "@orders", "@quotes", "@measurements", "@price-matrix", "@calendar", "@installations"],
  "customFields": {
    "order": ["branchId", "technicianId", "installerId"],
    "quote": ["validityDays", "surcharges"]
  }
}
```

### D) STUDIO PROJEKTOWE (template: design)
```json
{
  "modules": ["@crm", "@projects", "@quotes", "@calendar", "@reports", "@estimates"],
  "customFields": {
    "project": ["brief", "timeline", "budgetZones"],
    "order": ["estimateItems", "kitchenAppliances"]
  }
}
```

### E) MAGAZYN/WMS (template: warehouse)
```json
{
  "modules": ["@products", "@wms", "@inventory", "@reports", "@warehouses"],
  "customFields": {
    "location": ["rack", "shelf", "level", "zone"],
    "document": ["type", "referenceNo"]
  }
}
```

---

## 7. Priorytety implementacji

### Faza 1: Nowe moduly TIER 1
1. @branches - Oddzialy
2. @locations - Punkty odbioru
3. @measurements - Pomiary
4. @delivery - Dostawa
5. @dictionaries - Slowniki

### Faza 2: Rozszerzenia istniejacych
1. @products - warianty, jednostki
2. @orders - typy zamowien, QR
3. @quotes - wersjonowanie
4. @users - oddzialy

### Faza 3: Moduly TIER 2
1. @projects
2. @estimates
3. @price-matrix
4. @installations
5. @discounts
6. @loyalty

### Faza 4: WMS (TIER 3)
1. @warehouses
2. @wms-locations
3. @containers
4. @wms-documents
5. @inventory-count

---

## 8. Cennik modulow

| Tier | Modul | Cena/mies |
|------|-------|-----------|
| CORE | @auth, @users, @customers, @orders, @products | 0 zl (darmowe) |
| ADDON | @quotes | 99 zl |
| ADDON | @inventory | 149 zl |
| ADDON | @calendar | 79 zl |
| ADDON | @reports | 99 zl |
| ADDON | @notifications | 49 zl |
| PREMIUM | @wms | 299 zl |
| PREMIUM | @measurements | 149 zl |
| PREMIUM | @price-matrix | 199 zl |
| PREMIUM | @projects | 249 zl |
| PREMIUM | @delivery | 179 zl |
| ENTERPRISE | @branches | 399 zl |
| ENTERPRISE | @api | 299 zl |
| ENTERPRISE | @webhooks | 199 zl |
| ENTERPRISE | @ai | 199 zl |
| ENTERPRISE | @whitelabel | 499 zl |

---

## 9. Mapowanie funkcji per aplikacja

### ebukieteria.pl
- auth.ts -> @auth (DONE)
- users.ts -> @users (DONE)
- products.ts -> @products + variants (EXTEND)
- orders.ts -> @orders + orderType (EXTEND)
- discounts.ts -> @discounts (NEW)
- locations.ts -> @locations (NEW)
- settings.ts -> @settings (DONE)
- reports.ts -> @reports (DONE)
- loyalty (prisma) -> @loyalty (NEW)
- schedules (prisma) -> @calendar (EXTEND)
- deliveryRoutes (prisma) -> @delivery (NEW)

### wedlinyodkaroliny.pl
- admin.routes.js -> @users (DONE)
- auth.routes.js -> @auth (DONE)
- order.routes.js -> @orders + qrCode (EXTEND)
- product.routes.js -> @products + unit (EXTEND)
- pickup-points.routes.js -> @locations (NEW)
- delivery-settings.routes.js -> @delivery (NEW)
- upload.routes.js -> @storage (DONE)
- inventory (prisma) -> @stock (DONE)

### wms.ebukieteria.pl
- auth -> @auth (DONE)
- users -> @users + warehouses (EXTEND)
- warehouses -> @warehouses (NEW)
- locations -> @wms-locations (NEW)
- containers -> @containers (NEW)
- products -> @products + ean (EXTEND)
- stock -> @stock + location (EXTEND)
- documents -> @wms-documents (NEW)
- inventory -> @inventory-count (NEW)
- inventory-intro -> @inventory-intro (NEW)
- audit -> @events (DONE)

### zamowienia-studioinconcept.pl
- auth.js -> @auth (DONE)
- clients.js -> @customers (DONE)
- projects.js -> @projects (NEW)
- orders.js -> @orders (DONE)
- suppliers.js -> @suppliers (NEW)
- dictionaries.js -> @dictionaries (NEW)
- tasks.js -> @tasks (NEW)
- calendar.js -> @calendar (DONE)
- pdf.js -> @reports (DONE)
- upload.js -> @storage (DONE)

### zamowienia-tapparella.pl
- Branch -> @branches (NEW)
- User -> @users + branches (EXTEND)
- Customer -> @customers (DONE)
- Order -> @orders + measurements (EXTEND)
- Measurement -> @measurements (NEW)
- Quote -> @quotes + versioning (EXTEND)
- Installation -> @installations (NEW)
- PriceMatrix -> @price-matrix (NEW)
- GoogleCalendar -> @calendar + google (EXTEND)
- CompanySettings -> @settings (DONE)

---

## 10. Kolejne kroki

1. [x] Analiza wszystkich projektow
2. [x] Mapowanie modulow
3. [ ] Implementacja @branches
4. [ ] Implementacja @locations
5. [ ] Implementacja @measurements
6. [ ] Implementacja @dictionaries
7. [ ] Rozszerzenie @products o warianty
8. [ ] Rozszerzenie @orders o typy
9. [ ] Testy integracyjne
10. [ ] Migracja danych z projektow

---

*Wygenerowano: 2026-01-03*
*Wersja: 3.0.0-alpha*
