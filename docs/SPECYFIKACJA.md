# DockPulse - Specyfikacja Techniczna

> **Instrukcja dla Claude Code** - kompletna specyfikacja systemu do implementacji

---

## 1. OVERVIEW

DockPulse to modulowa platforma CRM/WMS typu multi-tenant dla malych i srednich firm B2B. System oferuje gotowe szablony branzowe z predefiniowanymi modulami, polami i workflow - **bez koniecznosci pisania kodu przez uzytkownika**.

### Kluczowe zalozenia

1. **Multi-tenancy** z izolowanymi bazami danych per tenant
2. **Subdomeny**: `tenant.dockpulse.com`
3. **Event Bus**: PostgreSQL LISTEN/NOTIFY
4. **No-Code**: gotowe moduly on/off, predefiniowane pola, triggery on/off
5. **AI**: asystent konfiguracji (sugestie), NIE generator kodu
6. **Portal klienta**: logowanie przez telefon
7. **Design**: iOS glassmorphism (blur, przezroczystosc)

### Projekty referencyjne

Wzorowane na: Bukieteria (florystyka), Wedliny (produkcja), Tapparella (rolety), Inconcept (uslugi).

---

## 2. ARCHITEKTURA MULTI-TENANCY

### 2.1. Baza Platformy (Wspoldzielona)

```
Database: dockpulse_platform
```

Zawiera dane globalne:
- `tenants` - lista tenantow
- `plans` - plany cenowe
- `billing` - rozliczenia
- `module_registry` - rejestr dostepnych modulow
- `global_settings` - ustawienia globalne

### 2.2. Bazy Tenantow (Izolowane)

```
Database: dockpulse_tenant_{slug}
```

Kazdy tenant ma wlasna baze. Zapewnia:
- Pelna izolacje danych
- Latwe usuwanie: `DROP DATABASE`
- Niezalezne backupy
- Zgodnosc z RODO

### 2.3. Connection Pooling

```
PgBouncer -> PostgreSQL
```

Zarzadza polaczeniami do wielu baz tenantow.

---

## 3. EVENT BUS (SZYNA DANYCH)

### 3.1. Zasada

Moduly komunikuja sie **WYLACZNIE** przez Event Bus - nigdy bezposrednio.

### 3.2. Technologia

```
PostgreSQL LISTEN/NOTIFY
```

Prostsze, wystarczajace dla MVP. Alternatywy (Redis Streams, RabbitMQ, Kafka) - na pozniej.

### 3.3. Struktura Eventu

```typescript
interface Event {
  event_id: string;          // UUID
  event_type: string;        // 'entity.created' | 'entity.updated' | 'entity.deleted' | 'order.confirmed' | ...
  source_module: string;     // '@orders' | '@customers' | '@portal' | ...
  entity_type: string;       // 'Order' | 'Customer' | 'Product' | 'Quote'
  entity_id: string;         // UUID
  payload: object;           // JSONB z danymi
  user_id: string;           // UUID uzytkownika
  created_at: string;        // ISO timestamp
}
```

### 3.4. Przykladowy Flow

```
1. Portal emituje: entity.created (Order)
2. @orders odbiera -> tworzy rekord -> emituje: order.confirmed
3. @stock odbiera -> rezerwuje produkty -> emituje: stock.reserved
4. @notifications odbiera -> wysyla SMS do klienta
5. @customers odbiera -> aktualizuje historie klienta
```

### 3.5. Event Log

Wszystkie eventy logowane do tabeli `event_log` dla audytu i replay.

---

## 4. SZABLONY BRANZOWE

Tenant wybiera szablon podczas onboardingu. Szablon definiuje: moduly, nazewnictwo, pola, triggery.

### 4.1. Szablon: USLUGI

**Dla**: IT, marketing, konsulting, projektowanie, serwis

**Moduly**:
- `@zlecenia` - zamowienia uslugowe
- `@klienci` - baza klientow
- `@wyceny` - tworzenie wycen
- `@harmonogram` - kalendarz, zasoby
- `@rozliczenia` - faktury, platnosci
- `@portal` - portal klienta

**Nazewnictwo encji**:

| Encja uniwersalna | Nazwa w szablonie | Przyklad |
|-------------------|-------------------|----------|
| Order | Zlecenie | ZLC-2024-001 |
| Customer | Klient | Firma ABC Sp. z o.o. |
| Product | Usluga | Audyt SEO |
| Quote | Wycena | WYC-2024-015 |
| Task | Zadanie | Przygotowanie raportu |
| Ticket | Zgloszenie | ZGL-2024-042 |

### 4.2. Szablon: PRODUKCJA

**Dla**: przetworstwo spozywcze, stolarka, meble, wyroby metalowe

**Moduly**:
- `@zamowienia` - zamowienia produkcyjne
- `@odbiorcy` - baza odbiorcow B2B
- `@wyroby` - katalog wyrobow
- `@operacje` - operacje produkcyjne
- `@magazyn` - stany magazynowe
- `@portal` - portal odbiorcy

**Nazewnictwo encji**:

| Encja uniwersalna | Nazwa w szablonie | Przyklad |
|-------------------|-------------------|----------|
| Order | Zamowienie produkcyjne | ZP-2024-001 |
| Customer | Odbiorca | Hurt-Max |
| Product | Wyrob | Kielbasa wiejska 0.5kg |
| Quote | Kalkulacja | KAL-2024-015 |
| Task | Operacja | Wedzenie partii #42 |
| Ticket | Reklamacja | REK-2024-008 |

### 4.3. Szablon: HANDEL

**Dla**: hurt, dystrybucja, e-commerce B2B

**Moduly**:
- `@zamowienia` - zamowienia handlowe
- `@kontrahenci` - baza kontrahentow
- `@towary` - katalog towarow
- `@oferty` - oferty handlowe
- `@faktury` - fakturowanie (KSeF)
- `@portal` - portal kontrahenta

**Nazewnictwo encji**:

| Encja uniwersalna | Nazwa w szablonie | Przyklad |
|-------------------|-------------------|----------|
| Order | Zamowienie | ZAM-2024-001 |
| Customer | Kontrahent | ABC Trading |
| Product | Towar | Laptop Dell XPS 15 |
| Quote | Oferta | OFR-2024-015 |
| Task | Czynnosc | Przygotowanie wysylki |
| Ticket | Sprawa | SPR-2024-042 |

---

## 5. KONFIGURACJA NO-CODE

### 5.1. Moduly On/Off

Admin wlacza/wylacza gotowe moduly. NIE ma mozliwosci tworzenia nowych.

**Dostepne moduly**:

| Modul | Funkcja | Szablony |
|-------|---------|----------|
| @customers | Zarzadzanie klientami | Wszystkie |
| @orders | Zamowienia i zlecenia | Wszystkie |
| @products | Katalog produktow/uslug | Wszystkie |
| @quotes | Wyceny i oferty | Wszystkie |
| @portal | Portal klienta | Wszystkie |
| @stock | Magazyn i stany | Produkcja, Handel |
| @production | Operacje produkcyjne | Produkcja |
| @calendar | Harmonogram i zasoby | Uslugi |
| @invoicing | Fakturowanie (KSeF) | Wszystkie |
| @notifications | Email/SMS/Push | Wszystkie |
| @reports | Raporty i analizy | Wszystkie |

### 5.2. Predefiniowane Pola

Kazdy modul ma zestaw pol zdefiniowanych w szablonie. Tenant moze tylko wlaczac/wylaczac istniejace pola.

### 5.3. Triggery Workflow (On/Off)

Zamiast budowania workflow, admin wlacza/wylacza predefiniowane triggery.

**Przykladowe triggery**:

| Trigger | Akcja |
|---------|-------|
| Nowe zamowienie z portalu | Wyslij SMS do admina |
| Zamowienie potwierdzone | Wyslij email do klienta |
| Zmiana statusu zamowienia | Wyslij powiadomienie push |
| Zamowienie wyslane | Wyslij SMS z numerem przesylki |
| Nowy klient | Wyslij email powitalny |
| Wycena zaakceptowana | Utworz zamowienie automatycznie |
| Brak aktywnosci 7 dni | Wyslij przypomnienie |
| Niski stan magazynowy | Wyslij alert do admina |

---

## 6. ROLA AI

AI = asystent konfiguracji. NIE generuje kodu ani modulow.

### 6.1. Funkcje AI

| Funkcja | Opis |
|---------|------|
| Sugestie konfiguracji | Analizuje branze, sugeruje moduly/pola |
| Onboarding wizard | Prowadzi przez konfiguracje krok po kroku |
| Odpowiedzi na pytania | Wyjasnia funkcje, rozwiazuje problemy |
| Sugestie triggerow | Rekomenduje automatyzacje |
| Analiza danych | Wyjasnia raporty, wskazuje trendy |

### 6.2. Integracja OpenRouter

| Model | Zastosowanie |
|-------|--------------|
| Claude 3.5 Sonnet | Domyslny - sugestie, onboarding |
| GPT-4 Turbo | Alternatywny - analiza danych |
| Claude Haiku | Szybkie odpowiedzi, FAQ |

---

## 7. PORTAL KLIENTA

### 7.1. Autentykacja

Model wzorowany na Bukieteria/Tapparella:

1. **Login**: numer telefonu
2. **Haslo**: losowo generowane przy pierwszym kontakcie
3. **Wymuszenie zmiany hasla** przy pierwszym logowaniu
4. **Opcjonalnie**: magic link przez SMS

### 7.2. Funkcje Portalu

- Przegladanie historii zamowien
- Skladanie nowych zamowien
- Przegladanie i akceptacja wycen
- Pobieranie faktur i dokumentow
- Wysylanie wiadomosci do firmy
- Sledzenie statusu zamowienia

---

## 8. ROUTING SUBDOMEN

| URL | Opis |
|-----|------|
| `tenant.dockpulse.com` | Strona logowania tenanta |
| `/admin/*` | Panel administracyjny (po zalogowaniu) |
| `/portal/*` | Portal klienta (po zalogowaniu) |
| `app.dockpulse.com` | Panel superadmina platformy |

---

## 9. STACK TECHNOLOGICZNY

### 9.1. Backend

| Komponent | Technologia |
|-----------|-------------|
| Runtime | Node.js 20 LTS |
| Framework | NestJS |
| Baza danych | PostgreSQL 15+ |
| Connection Pool | PgBouncer |
| Event Bus | PostgreSQL LISTEN/NOTIFY |
| Cache | Redis |
| Queue | BullMQ |
| Auth | JWT + Refresh tokens |
| Validation | class-validator, Zod |
| ORM | Prisma |

### 9.2. Frontend

| Komponent | Technologia |
|-----------|-------------|
| Framework | Next.js 14+ (App Router) |
| UI Library | shadcn/ui + Tailwind CSS |
| State | React Query + Zustand |
| Forms | React Hook Form + Zod |
| Design | iOS Glassmorphism |
| Icons | Lucide React |
| Tables | TanStack Table |
| Charts | Recharts |

### 9.3. Infrastruktura

| Komponent | Technologia |
|-----------|-------------|
| Hosting | VPS (Hetzner) lub k8s |
| Reverse Proxy | Caddy (auto SSL, wildcard subdomain) |
| Container | Docker + Docker Compose |
| CI/CD | GitHub Actions |
| Monitoring | Prometheus + Grafana |
| Logs | Loki lub Sentry |
| Storage | S3-compatible (MinIO / Cloudflare R2) |

### 9.4. AI

| Komponent | Technologia |
|-----------|-------------|
| Gateway | OpenRouter API |
| Default | Claude 3.5 Sonnet |
| Fallback | GPT-4 Turbo, Claude Haiku |

---

## 10. MVP SCOPE

### MVP (100 SP, ~3 sprinty)

- [x] Onboarding z wyborem szablonu branzowego
- [x] Core moduly: @customers, @orders, @products
- [x] Event Bus (PostgreSQL LISTEN/NOTIFY)
- [x] Portal klienta (podstawowy)
- [x] Autentykacja (JWT + telefon dla portalu)
- [x] UI glassmorphism (podstawowy)
- [x] Subdomain routing
- [x] Konfiguracja modulow on/off
- [x] Konfiguracja widocznosci pol

### Post-MVP (Priorytet 1)

- [ ] @quotes - Wyceny i oferty
- [ ] @notifications - Email/SMS/Push
- [ ] Triggery workflow on/off
- [ ] AI asystent konfiguracji
- [ ] Gotowe raporty + filtry

### Post-MVP (Priorytet 2)

- [ ] @stock - Magazyn
- [ ] @invoicing - Fakturowanie (KSeF)
- [ ] @calendar - Harmonogram
- [ ] Mobile PWA

---

## 11. DESIGN: iOS GLASSMORPHISM

### Zasady

1. **Blur background**: `backdrop-blur-xl`
2. **Przezroczystosc**: `bg-white/70` lub `bg-slate-900/70`
3. **Subtelne cienie**: `shadow-lg shadow-black/5`
4. **Zaokraglone rogi**: `rounded-2xl` lub `rounded-3xl`
5. **Cienkie obramowania**: `border border-white/20`
6. **Gradient overlays**: subtelne gradienty

### Przyklad komponentu Card

```tsx
<div className="
  backdrop-blur-xl
  bg-white/70
  dark:bg-slate-900/70
  rounded-2xl
  border border-white/20
  shadow-lg shadow-black/5
  p-6
">
  {children}
</div>
```

### Paleta kolorow

```css
:root {
  --primary: #2B579A;
  --secondary: #4472C4;
  --accent: #70AD47;
  --background: #F5F5F7;
  --surface: rgba(255, 255, 255, 0.7);
  --border: rgba(255, 255, 255, 0.2);
}
```

---

## 12. SLOWNIK POJEC

| Pojecie | Definicja |
|---------|-----------|
| **Tenant** | Firma-klient korzystajaca z DockPulse |
| **Szablon** | Predefiniowany zestaw modulow/pol dla branzy |
| **Modul** | Funkcjonalny komponent (@orders, @customers) |
| **Event Bus** | Szyna danych - kanal komunikacji modulow |
| **Portal** | Interfejs self-service dla klientow tenanta |
| **Trigger** | Automatyczna akcja po zdarzeniu (on/off) |
| **Encja** | Obiekt biznesowy (Order, Customer, Product) |
| **No-Code** | Konfiguracja przez UI bez pisania kodu |
| **Glassmorphism** | Styl UI - blur, przezroczystosc, cienie |

---

## 13. AUTO-BRANDING (Inteligentny Onboarding)

### 13.1. Koncept

Uzytkownik podaje tylko **adres strony WWW** swojej firmy, a system automatycznie:
- Pobiera logo i favicon
- Ekstraktuje dane firmy (nazwa, NIP, adres, kontakt)
- Wykrywa kolory brandingu z logo
- Automatycznie styluje UI platformy

### 13.2. Pipeline Auto-Brandingu

```
URL strony WWW
     │
     ▼
┌─────────────────────────┐
│  1. Fetch HTML          │
│     (axios + cheerio)   │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  2. LLM Extraction      │
│     (OpenRouter)        │
│  - Nazwa firmy          │
│  - NIP, adres, kontakt  │
│  - URL logo/favicon     │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  3. Vision AI           │
│  - Ekstrakcja kolorow   │
│  - primary, secondary   │
│  - accent               │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  4. Upload Assets       │
│  - Logo → S3            │
│  - Favicon → S3         │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  5. Apply Branding      │
│  - CSS Variables        │
│  - Tailwind config      │
│  - Tenant settings      │
└─────────────────────────┘
```

### 13.3. LLM Models (OpenRouter - Free Tier)

| Model | Zastosowanie | Koszt |
|-------|--------------|-------|
| `meta-llama/llama-3.2-3b-instruct:free` | Ekstrakcja danych z HTML | Free |
| `google/gemini-2.0-flash-exp:free` | Vision - ekstrakcja kolorow | Free |
| `qwen/qwen-2-7b-instruct:free` | Fallback | Free |

### 13.4. Struktura BrandingSettings

```typescript
interface BrandingSettings {
  logoUrl: string;           // URL logo w S3
  faviconUrl: string;        // URL favicon w S3
  companyName: string;       // Nazwa firmy
  colors: {
    primary: string;         // #RRGGBB - glowny kolor
    secondary: string;       // #RRGGBB - drugoplanowy
    accent: string;          // #RRGGBB - akcent
  };
  fonts?: {
    heading: string;         // Font naglowkow
    body: string;            // Font tekstu
  };
  companyData?: {
    nip?: string;
    address?: Address;
    phone?: string;
    email?: string;
  };
}
```

### 13.5. Dynamiczne CSS Variables

```css
:root {
  /* Auto-generated from branding */
  --color-primary: #2B579A;
  --color-secondary: #4472C4;
  --color-accent: #70AD47;

  /* Generated shades */
  --color-primary-50: #EBF0F7;
  --color-primary-100: #D6E1EF;
  --color-primary-500: #2B579A;
  --color-primary-600: #234A82;
  --color-primary-900: #0F1F35;
}
```

### 13.6. Komponenty Auto-Branded

**Navbar z logo klienta:**
```tsx
<nav className="glass-nav">
  <img src={tenant.branding.logoUrl} alt={tenant.name} />
  <span style={{ color: tenant.branding.colors.primary }}>
    {tenant.branding.companyName}
  </span>
</nav>
```

**Button z primary color:**
```tsx
<button style={{ background: tenant.branding.colors.primary }}>
  {children}
</button>
```

### 13.7. Fallback Behavior

Jesli ekstrakcja sie nie powiedzie:
- Logo: placeholder z inicjalami firmy
- Kolory: domyslna paleta DockPulse
- Dane: uzytkownik wprowadza recznie

---

## 14. SLOWNIK POJEC (rozszerzony)

| Pojecie | Definicja |
|---------|-----------|
| **Tenant** | Firma-klient korzystajaca z DockPulse |
| **Szablon** | Predefiniowany zestaw modulow/pol dla branzy |
| **Modul** | Funkcjonalny komponent (@orders, @customers) |
| **Event Bus** | Szyna danych - kanal komunikacji modulow |
| **Portal** | Interfejs self-service dla klientow tenanta |
| **Trigger** | Automatyczna akcja po zdarzeniu (on/off) |
| **Encja** | Obiekt biznesowy (Order, Customer, Product) |
| **No-Code** | Konfiguracja przez UI bez pisania kodu |
| **Glassmorphism** | Styl UI - blur, przezroczystosc, cienie |
| **Auto-Branding** | Automatyczne pobieranie brandingu z URL |
| **OpenRouter** | Gateway do wielu modeli LLM |

---

**Wersja**: 2.1
**Podejscie**: No-Code + Auto-Branding
**Data**: Grudzien 2024
