# DockPulse - Dokumentacja API

> REST API dla platformy DockPulse

---

## 1. OVERVIEW

### Base URLs

| Environment | URL |
|-------------|-----|
| Production | `https://api.dockpulse.com` |
| Tenant API | `https://{tenant}.dockpulse.com/api` |
| Development | `http://localhost:4000` |

### Autentykacja

Wszystkie endpointy (oprocz publicznych) wymagaja tokenu JWT w headerze:

```
Authorization: Bearer <token>
```

### Formaty

- Request: `application/json`
- Response: `application/json`
- Daty: ISO 8601 (`2024-01-15T10:30:00Z`)
- ID: UUID v4

### Struktura odpowiedzi

```json
// Success
{
  "success": true,
  "data": { ... },
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20
  }
}

// Error
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Nieprawidlowe dane wejsciowe",
    "details": [
      { "field": "email", "message": "Nieprawidlowy format email" }
    ]
  }
}
```

---

## 2. AUTENTYKACJA

### 2.1. Login (Admin Panel)

```http
POST /auth/login
Content-Type: application/json

{
  "email": "admin@firma.pl",
  "password": "secret123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
    "expires_in": 3600,
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "admin@firma.pl",
      "name": "Jan Kowalski",
      "role": "admin"
    }
  }
}
```

### 2.2. Login (Portal Klienta)

```http
POST /portal/auth/login
Content-Type: application/json

{
  "phone": "+48123456789",
  "password": "abc123XY"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "customer": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Anna Nowak",
      "phone": "+48123456789",
      "first_login": true
    }
  }
}
```

### 2.3. Zmiana hasla (Portal - pierwsze logowanie)

```http
POST /portal/auth/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "current_password": "abc123XY",
  "new_password": "MojeNoweHaslo123!"
}
```

### 2.4. Refresh Token

```http
POST /auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### 2.5. Logout

```http
POST /auth/logout
Authorization: Bearer <token>
```

---

## 3. KLIENCI (@customers)

### 3.1. Lista klientow

```http
GET /customers?page=1&limit=20&search=kowalski&sort=-created_at
Authorization: Bearer <token>
```

**Query Parameters:**

| Param | Typ | Opis |
|-------|-----|------|
| page | number | Numer strony (default: 1) |
| limit | number | Liczba wynikow (default: 20, max: 100) |
| search | string | Wyszukiwanie (nazwa, email, telefon) |
| sort | string | Sortowanie (np. `-created_at`, `name`) |
| tags | string[] | Filtr po tagach |

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "phone": "+48123456789",
      "email": "jan@firma.pl",
      "name": "Jan Kowalski",
      "company_name": "Firma XYZ Sp. z o.o.",
      "nip": "1234567890",
      "address": {
        "street": "ul. Przykladowa 10",
        "city": "Warszawa",
        "postal_code": "00-001"
      },
      "tags": ["vip", "hurtownia"],
      "is_portal_active": true,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "pages": 8
  }
}
```

### 3.2. Szczegoly klienta

```http
GET /customers/:id
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "phone": "+48123456789",
    "email": "jan@firma.pl",
    "name": "Jan Kowalski",
    "company_name": "Firma XYZ Sp. z o.o.",
    "nip": "1234567890",
    "address": {
      "street": "ul. Przykladowa 10",
      "city": "Warszawa",
      "postal_code": "00-001"
    },
    "notes": "Klient preferuje platnosc przelewem",
    "tags": ["vip", "hurtownia"],
    "is_portal_active": true,
    "portal_first_login": false,
    "metadata": {},
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-02-10T14:20:00Z",
    "_stats": {
      "orders_count": 25,
      "orders_total": 45000.00,
      "last_order_at": "2024-02-08T09:15:00Z"
    }
  }
}
```

### 3.3. Tworzenie klienta

```http
POST /customers
Authorization: Bearer <token>
Content-Type: application/json

{
  "phone": "+48123456789",
  "email": "jan@firma.pl",
  "name": "Jan Kowalski",
  "company_name": "Firma XYZ Sp. z o.o.",
  "nip": "1234567890",
  "address": {
    "street": "ul. Przykladowa 10",
    "city": "Warszawa",
    "postal_code": "00-001"
  },
  "notes": "Klient preferuje platnosc przelewem",
  "tags": ["hurtownia"],
  "enable_portal": true
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "phone": "+48123456789",
    "portal_password": "abc123XY"
  }
}
```

### 3.4. Aktualizacja klienta

```http
PUT /customers/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Jan Kowalski-Nowak",
  "tags": ["vip", "hurtownia"]
}
```

### 3.5. Usuwanie klienta

```http
DELETE /customers/:id
Authorization: Bearer <token>
```

### 3.6. Reset hasla portalu

```http
POST /customers/:id/reset-portal-password
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "new_password": "xyz789AB"
  }
}
```

---

## 4. ZAMOWIENIA (@orders)

### 4.1. Lista zamowien

```http
GET /orders?page=1&limit=20&status=pending&customer_id=xxx
Authorization: Bearer <token>
```

**Query Parameters:**

| Param | Typ | Opis |
|-------|-----|------|
| page | number | Numer strony |
| limit | number | Liczba wynikow |
| status | string | Filtr statusu |
| customer_id | uuid | Filtr klienta |
| date_from | date | Data od |
| date_to | date | Data do |
| source | string | Zrodlo (admin/portal/api) |
| sort | string | Sortowanie |

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440010",
      "number": "ZAM-2024-0042",
      "customer": {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "name": "Jan Kowalski",
        "phone": "+48123456789"
      },
      "status": "confirmed",
      "items_count": 3,
      "total_amount": 1250.00,
      "delivery_date": "2024-02-15",
      "source": "portal",
      "created_at": "2024-02-10T09:30:00Z"
    }
  ],
  "meta": {
    "total": 450,
    "page": 1,
    "limit": 20
  }
}
```

### 4.2. Szczegoly zamowienia

```http
GET /orders/:id
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440010",
    "number": "ZAM-2024-0042",
    "customer": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Jan Kowalski",
      "phone": "+48123456789",
      "email": "jan@firma.pl"
    },
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Admin"
    },
    "status": "confirmed",
    "status_history": [
      { "status": "new", "at": "2024-02-10T09:30:00Z", "by": "portal" },
      { "status": "confirmed", "at": "2024-02-10T10:15:00Z", "by": "Admin" }
    ],
    "items": [
      {
        "product_id": "550e8400-e29b-41d4-a716-446655440020",
        "product_name": "Produkt A",
        "quantity": 10,
        "unit": "szt",
        "unit_price": 50.00,
        "total_price": 500.00
      },
      {
        "product_id": "550e8400-e29b-41d4-a716-446655440021",
        "product_name": "Produkt B",
        "quantity": 5,
        "unit": "kg",
        "unit_price": 150.00,
        "total_price": 750.00
      }
    ],
    "total_amount": 1250.00,
    "notes": "Prosze o dostaw\u0119 rano",
    "delivery_date": "2024-02-15",
    "delivery_address": {
      "street": "ul. Dostawcza 5",
      "city": "Warszawa",
      "postal_code": "00-002"
    },
    "source": "portal",
    "metadata": {},
    "created_at": "2024-02-10T09:30:00Z",
    "updated_at": "2024-02-10T10:15:00Z"
  }
}
```

### 4.3. Tworzenie zamowienia

```http
POST /orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "customer_id": "550e8400-e29b-41d4-a716-446655440001",
  "items": [
    {
      "product_id": "550e8400-e29b-41d4-a716-446655440020",
      "quantity": 10
    },
    {
      "product_id": "550e8400-e29b-41d4-a716-446655440021",
      "quantity": 5
    }
  ],
  "notes": "Prosze o dostaw\u0119 rano",
  "delivery_date": "2024-02-15",
  "delivery_address": {
    "street": "ul. Dostawcza 5",
    "city": "Warszawa",
    "postal_code": "00-002"
  }
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440010",
    "number": "ZAM-2024-0042",
    "status": "new",
    "total_amount": 1250.00
  }
}
```

### 4.4. Zmiana statusu

```http
PATCH /orders/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "confirmed",
  "note": "Potwierdzono telefonicznie"
}
```

### 4.5. Aktualizacja zamowienia

```http
PUT /orders/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "notes": "Zmienione uwagi",
  "delivery_date": "2024-02-16"
}
```

### 4.6. Anulowanie zamowienia

```http
POST /orders/:id/cancel
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "Klient zrezygnowal"
}
```

---

## 5. PRODUKTY (@products)

### 5.1. Lista produktow

```http
GET /products?page=1&limit=50&category=elektronika&active=true
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440020",
      "code": "PROD-001",
      "name": "Produkt A",
      "description": "Opis produktu A",
      "category": "Kategoria 1",
      "price": 50.00,
      "unit": "szt",
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "total": 200,
    "page": 1,
    "limit": 50
  }
}
```

### 5.2. Szczegoly produktu

```http
GET /products/:id
Authorization: Bearer <token>
```

### 5.3. Tworzenie produktu

```http
POST /products
Authorization: Bearer <token>
Content-Type: application/json

{
  "code": "PROD-001",
  "name": "Produkt A",
  "description": "Opis produktu A",
  "category": "Kategoria 1",
  "price": 50.00,
  "unit": "szt"
}
```

### 5.4. Aktualizacja produktu

```http
PUT /products/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "price": 55.00,
  "is_active": true
}
```

### 5.5. Usuwanie produktu

```http
DELETE /products/:id
Authorization: Bearer <token>
```

---

## 6. WYCENY (@quotes)

### 6.1. Lista wycen

```http
GET /quotes?page=1&status=pending&customer_id=xxx
Authorization: Bearer <token>
```

### 6.2. Szczegoly wyceny

```http
GET /quotes/:id
Authorization: Bearer <token>
```

### 6.3. Tworzenie wyceny

```http
POST /quotes
Authorization: Bearer <token>
Content-Type: application/json

{
  "customer_id": "550e8400-e29b-41d4-a716-446655440001",
  "items": [
    {
      "product_id": "550e8400-e29b-41d4-a716-446655440020",
      "quantity": 10,
      "unit_price": 45.00
    }
  ],
  "valid_until": "2024-03-01",
  "notes": "Cena promocyjna"
}
```

### 6.4. Wyslij wycene do klienta

```http
POST /quotes/:id/send
Authorization: Bearer <token>
Content-Type: application/json

{
  "method": "email",
  "message": "Przesylamy wycene zgodnie z ustaleniami"
}
```

### 6.5. Akceptacja wyceny (przez klienta)

```http
POST /quotes/:id/accept
Authorization: Bearer <token>
```

Automatycznie tworzy zamowienie na podstawie wyceny.

### 6.6. Odrzucenie wyceny

```http
POST /quotes/:id/reject
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "Zbyt wysoka cena"
}
```

---

## 7. PORTAL KLIENTA

### 7.1. Moje zamowienia

```http
GET /portal/orders
Authorization: Bearer <token>
```

### 7.2. Szczegoly zamowienia

```http
GET /portal/orders/:id
Authorization: Bearer <token>
```

### 7.3. Nowe zamowienie z portalu

```http
POST /portal/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "items": [
    {
      "product_id": "550e8400-e29b-41d4-a716-446655440020",
      "quantity": 10
    }
  ],
  "notes": "Standardowe zamowienie",
  "delivery_date": "2024-02-20"
}
```

### 7.4. Moje wyceny

```http
GET /portal/quotes
Authorization: Bearer <token>
```

### 7.5. Akceptacja wyceny

```http
POST /portal/quotes/:id/accept
Authorization: Bearer <token>
```

### 7.6. Moje dane

```http
GET /portal/me
Authorization: Bearer <token>
```

### 7.7. Aktualizacja danych

```http
PUT /portal/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "nowy@email.pl",
  "address": {
    "street": "Nowa 10",
    "city": "Krakow",
    "postal_code": "30-001"
  }
}
```

### 7.8. Wyslij wiadomosc

```http
POST /portal/messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "subject": "Pytanie o zamowienie",
  "content": "Czy mozna zmienic termin dostawy?"
}
```

---

## 8. KONFIGURACJA (Admin)

### 8.1. Pobierz konfiguracje modulow

```http
GET /settings/modules
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "code": "@customers",
      "name": "Klienci",
      "is_enabled": true,
      "config": {}
    },
    {
      "code": "@orders",
      "name": "Zamowienia",
      "is_enabled": true,
      "config": {
        "statuses": ["new", "confirmed", "in_progress", "shipped", "delivered", "cancelled"],
        "default_status": "new"
      }
    },
    {
      "code": "@stock",
      "name": "Magazyn",
      "is_enabled": false,
      "config": {}
    }
  ]
}
```

### 8.2. Wlacz/Wylacz modul

```http
PATCH /settings/modules/:code
Authorization: Bearer <token>
Content-Type: application/json

{
  "is_enabled": true
}
```

### 8.3. Konfiguracja pol

```http
GET /settings/fields?entity=customer
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "field_name": "phone",
      "label": "Telefon",
      "is_visible": true,
      "is_required": true,
      "display_order": 1
    },
    {
      "field_name": "email",
      "label": "Email",
      "is_visible": true,
      "is_required": false,
      "display_order": 2
    },
    {
      "field_name": "nip",
      "label": "NIP",
      "is_visible": true,
      "is_required": false,
      "display_order": 5
    }
  ]
}
```

### 8.4. Aktualizacja widocznosci pola

```http
PATCH /settings/fields/:entity/:field
Authorization: Bearer <token>
Content-Type: application/json

{
  "is_visible": false
}
```

### 8.5. Lista triggerow

```http
GET /settings/triggers
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "code": "order.new.sms_admin",
      "name": "SMS do admina przy nowym zamowieniu",
      "event_type": "order.created",
      "action_type": "sms",
      "is_enabled": true
    },
    {
      "code": "order.confirmed.email_customer",
      "name": "Email do klienta po potwierdzeniu",
      "event_type": "order.confirmed",
      "action_type": "email",
      "is_enabled": true
    }
  ]
}
```

### 8.6. Wlacz/Wylacz trigger

```http
PATCH /settings/triggers/:code
Authorization: Bearer <token>
Content-Type: application/json

{
  "is_enabled": false
}
```

---

## 9. PLATFORM API (Superadmin)

### 9.1. Lista tenantow

```http
GET /platform/tenants
Authorization: Bearer <platform_admin_token>
```

### 9.2. Tworzenie tenanta

```http
POST /platform/tenants
Authorization: Bearer <platform_admin_token>
Content-Type: application/json

{
  "slug": "acme",
  "name": "ACME Corporation",
  "template": "services",
  "plan_id": "550e8400-e29b-41d4-a716-446655440100",
  "admin_email": "admin@acme.com",
  "admin_name": "John Admin"
}
```

### 9.3. Usuwanie tenanta

```http
DELETE /platform/tenants/:id
Authorization: Bearer <platform_admin_token>
```

### 9.4. Zmiana planu

```http
PATCH /platform/tenants/:id/plan
Authorization: Bearer <platform_admin_token>
Content-Type: application/json

{
  "plan_id": "550e8400-e29b-41d4-a716-446655440101"
}
```

---

## 10. KODY BLEDOW

| Kod | HTTP | Opis |
|-----|------|------|
| `VALIDATION_ERROR` | 400 | Nieprawidlowe dane wejsciowe |
| `UNAUTHORIZED` | 401 | Brak autoryzacji |
| `FORBIDDEN` | 403 | Brak uprawnien |
| `NOT_FOUND` | 404 | Zasob nie istnieje |
| `CONFLICT` | 409 | Konflikt (np. duplikat) |
| `TENANT_NOT_FOUND` | 404 | Tenant nie istnieje |
| `TENANT_SUSPENDED` | 403 | Tenant zawieszony |
| `RATE_LIMITED` | 429 | Przekroczono limit requestow |
| `INTERNAL_ERROR` | 500 | Blad serwera |

---

## 11. RATE LIMITING

| Endpoint | Limit |
|----------|-------|
| `/auth/*` | 10/min per IP |
| `/portal/*` | 60/min per token |
| `/api/*` | 100/min per token |
| `/platform/*` | 30/min per token |

---

## 12. WEBHOOKS

Tenant moze skonfigurowac webhooks do otrzymywania eventow:

```http
POST /settings/webhooks
Authorization: Bearer <token>
Content-Type: application/json

{
  "url": "https://moja-firma.pl/webhook",
  "events": ["order.created", "order.confirmed"],
  "secret": "webhook_secret_123"
}
```

Payload webhooka:

```json
{
  "event_id": "550e8400-e29b-41d4-a716-446655440999",
  "event_type": "order.created",
  "timestamp": "2024-02-10T09:30:00Z",
  "data": { ... }
}
```

Signature header:
```
X-DockPulse-Signature: sha256=abc123...
```

---

**Wersja API**: v1
**Data**: Grudzien 2024
