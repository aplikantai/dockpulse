# DockPulse - Szablony Branzowe

> Kompletna dokumentacja szablonow branzowych dla platformy DockPulse

---

## 1. OVERVIEW

Szablony branzowe to predefiniowane konfiguracje systemu dostosowane do specyfiki danej branzy. Kazdy szablon definiuje:

- **Moduly** - ktore moduly sa wlaczone domyslnie
- **Nazewnictwo** - jak nazywane sa encje (Order = Zamowienie / Zlecenie)
- **Pola** - jakie pola sa dostepne i wymagane
- **Statusy** - jakie statusy maja zamowienia/zlecenia
- **Triggery** - jakie automatyzacje sa dostepne

---

## 2. SZABLON: USLUGI

### 2.1. Charakterystyka

| Parametr | Wartosc |
|----------|---------|
| Kod | `services` |
| Nazwa | Uslugi |
| Branze | IT, marketing, konsulting, projektowanie, serwis, agencje |
| Charakter | Praca projektowa, zlecenia jednorazowe i cykliczne |

### 2.2. Moduly

| Modul | Domyslnie | Opis |
|-------|-----------|------|
| @zlecenia | ON | Zarzadzanie zleceniami uslugowymi |
| @klienci | ON | Baza klientow |
| @wyceny | ON | Tworzenie i wysylanie wycen |
| @harmonogram | ON | Kalendarz, zasoby, terminy |
| @rozliczenia | OFF | Faktury, platnosci |
| @portal | ON | Portal klienta |
| @raporty | OFF | Raporty i analizy |

### 2.3. Nazewnictwo

| Encja uniwersalna | Nazwa w szablonie | Prefix |
|-------------------|-------------------|--------|
| Order | Zlecenie | ZLC |
| Customer | Klient | KLI |
| Product | Usluga | USL |
| Quote | Wycena | WYC |
| Task | Zadanie | ZAD |
| Ticket | Zgloszenie | ZGL |

### 2.4. Statusy zlecen

```typescript
const ORDER_STATUSES = [
  { code: 'new', name: 'Nowe', color: '#3B82F6' },
  { code: 'quoted', name: 'Wycenione', color: '#8B5CF6' },
  { code: 'accepted', name: 'Zaakceptowane', color: '#10B981' },
  { code: 'in_progress', name: 'W realizacji', color: '#F59E0B' },
  { code: 'review', name: 'Do akceptacji', color: '#EC4899' },
  { code: 'completed', name: 'Zakonczone', color: '#059669' },
  { code: 'cancelled', name: 'Anulowane', color: '#EF4444' },
];
```

### 2.5. Pola - Klient

| Pole | Typ | Wymagane | Domyslnie widoczne |
|------|-----|----------|-------------------|
| phone | string | TAK | TAK |
| email | string | NIE | TAK |
| name | string | TAK | TAK |
| company_name | string | NIE | TAK |
| nip | string | NIE | TAK |
| address | object | NIE | TAK |
| notes | text | NIE | TAK |
| tags | array | NIE | TAK |

### 2.6. Pola - Zlecenie

| Pole | Typ | Wymagane | Domyslnie widoczne |
|------|-----|----------|-------------------|
| number | string | AUTO | TAK |
| customer_id | uuid | TAK | TAK |
| status | string | TAK | TAK |
| items | array | TAK | TAK |
| total_amount | decimal | NIE | TAK |
| deadline | date | NIE | TAK |
| description | text | NIE | TAK |
| assigned_to | uuid | NIE | TAK |
| priority | string | NIE | TAK |
| notes | text | NIE | TAK |

### 2.7. Triggery

| Trigger | Domyslnie | Akcja |
|---------|-----------|-------|
| Nowe zlecenie z portalu | ON | SMS do admina |
| Zlecenie zaakceptowane | ON | Email do klienta |
| Zmiana statusu | OFF | Push do klienta |
| Zlecenie zakonczone | ON | Email z podsumowaniem |
| Brak aktywnosci 7 dni | OFF | Email przypomnienie |
| Wycena zaakceptowana | ON | Utworz zlecenie |

---

## 3. SZABLON: PRODUKCJA

### 3.1. Charakterystyka

| Parametr | Wartosc |
|----------|---------|
| Kod | `production` |
| Nazwa | Produkcja |
| Branze | Przetworstwo spozywcze, stolarka, meble, wyroby metalowe |
| Charakter | Zamowienia produkcyjne B2B, stale relacje z odbiorcami |

### 3.2. Moduly

| Modul | Domyslnie | Opis |
|-------|-----------|------|
| @zamowienia | ON | Zamowienia produkcyjne |
| @odbiorcy | ON | Baza odbiorcow B2B |
| @wyroby | ON | Katalog wyrobow |
| @operacje | OFF | Operacje produkcyjne |
| @magazyn | ON | Stany magazynowe |
| @portal | ON | Portal odbiorcy |
| @raporty | OFF | Raporty produkcji |

### 3.3. Nazewnictwo

| Encja uniwersalna | Nazwa w szablonie | Prefix |
|-------------------|-------------------|--------|
| Order | Zamowienie produkcyjne | ZP |
| Customer | Odbiorca | ODB |
| Product | Wyrob | WYR |
| Quote | Kalkulacja | KAL |
| Task | Operacja | OPR |
| Ticket | Reklamacja | REK |

### 3.4. Statusy zamowien

```typescript
const ORDER_STATUSES = [
  { code: 'new', name: 'Nowe', color: '#3B82F6' },
  { code: 'confirmed', name: 'Potwierdzone', color: '#8B5CF6' },
  { code: 'in_production', name: 'W produkcji', color: '#F59E0B' },
  { code: 'quality_check', name: 'Kontrola jakosci', color: '#EC4899' },
  { code: 'ready', name: 'Gotowe', color: '#10B981' },
  { code: 'shipped', name: 'Wyslane', color: '#059669' },
  { code: 'delivered', name: 'Dostarczone', color: '#047857' },
  { code: 'cancelled', name: 'Anulowane', color: '#EF4444' },
];
```

### 3.5. Pola - Odbiorca

| Pole | Typ | Wymagane | Domyslnie widoczne |
|------|-----|----------|-------------------|
| phone | string | TAK | TAK |
| email | string | NIE | TAK |
| name | string | TAK | TAK |
| company_name | string | TAK | TAK |
| nip | string | TAK | TAK |
| address | object | TAK | TAK |
| delivery_address | object | NIE | TAK |
| payment_terms | string | NIE | TAK |
| price_list | string | NIE | NIE |
| notes | text | NIE | TAK |
| tags | array | NIE | TAK |

### 3.6. Pola - Zamowienie

| Pole | Typ | Wymagane | Domyslnie widoczne |
|------|-----|----------|-------------------|
| number | string | AUTO | TAK |
| customer_id | uuid | TAK | TAK |
| status | string | TAK | TAK |
| items | array | TAK | TAK |
| total_amount | decimal | TAK | TAK |
| total_weight | decimal | NIE | TAK |
| delivery_date | date | TAK | TAK |
| delivery_address | object | NIE | TAK |
| production_notes | text | NIE | TAK |
| transport | string | NIE | TAK |
| invoice_number | string | NIE | NIE |

### 3.7. Pola - Wyrob

| Pole | Typ | Wymagane | Domyslnie widoczne |
|------|-----|----------|-------------------|
| code | string | TAK | TAK |
| name | string | TAK | TAK |
| category | string | NIE | TAK |
| unit | string | TAK | TAK |
| weight | decimal | NIE | TAK |
| price | decimal | TAK | TAK |
| min_order | decimal | NIE | NIE |
| lead_time | integer | NIE | NIE |
| is_active | boolean | TAK | TAK |

### 3.8. Triggery

| Trigger | Domyslnie | Akcja |
|---------|-----------|-------|
| Nowe zamowienie z portalu | ON | SMS do admina |
| Zamowienie potwierdzone | ON | Email do odbiorcy |
| Zamowienie gotowe | ON | SMS z informacja |
| Zamowienie wyslane | ON | SMS z numerem przesylki |
| Niski stan magazynowy | ON | Alert do admina |
| Nowy odbiorca | OFF | Email powitalny |

---

## 4. SZABLON: HANDEL

### 4.1. Charakterystyka

| Parametr | Wartosc |
|----------|---------|
| Kod | `trade` |
| Nazwa | Handel |
| Branze | Hurt, dystrybucja, e-commerce B2B |
| Charakter | Sprzedaz towarow, szybka realizacja |

### 4.2. Moduly

| Modul | Domyslnie | Opis |
|-------|-----------|------|
| @zamowienia | ON | Zamowienia handlowe |
| @kontrahenci | ON | Baza kontrahentow |
| @towary | ON | Katalog towarow |
| @oferty | ON | Oferty handlowe |
| @faktury | OFF | Fakturowanie (KSeF) |
| @magazyn | ON | Stany magazynowe |
| @portal | ON | Portal kontrahenta |

### 4.3. Nazewnictwo

| Encja uniwersalna | Nazwa w szablonie | Prefix |
|-------------------|-------------------|--------|
| Order | Zamowienie | ZAM |
| Customer | Kontrahent | KON |
| Product | Towar | TOW |
| Quote | Oferta | OFR |
| Task | Czynnosc | CZY |
| Ticket | Sprawa | SPR |

### 4.4. Statusy zamowien

```typescript
const ORDER_STATUSES = [
  { code: 'new', name: 'Nowe', color: '#3B82F6' },
  { code: 'confirmed', name: 'Potwierdzone', color: '#8B5CF6' },
  { code: 'picking', name: 'Kompletowanie', color: '#F59E0B' },
  { code: 'packed', name: 'Spakowane', color: '#EC4899' },
  { code: 'shipped', name: 'Wyslane', color: '#10B981' },
  { code: 'delivered', name: 'Dostarczone', color: '#059669' },
  { code: 'returned', name: 'Zwrocone', color: '#F97316' },
  { code: 'cancelled', name: 'Anulowane', color: '#EF4444' },
];
```

### 4.5. Pola - Kontrahent

| Pole | Typ | Wymagane | Domyslnie widoczne |
|------|-----|----------|-------------------|
| phone | string | TAK | TAK |
| email | string | TAK | TAK |
| name | string | TAK | TAK |
| company_name | string | TAK | TAK |
| nip | string | TAK | TAK |
| regon | string | NIE | NIE |
| address | object | TAK | TAK |
| shipping_addresses | array | NIE | TAK |
| payment_terms | string | NIE | TAK |
| credit_limit | decimal | NIE | NIE |
| discount | decimal | NIE | NIE |
| notes | text | NIE | TAK |

### 4.6. Pola - Zamowienie

| Pole | Typ | Wymagane | Domyslnie widoczne |
|------|-----|----------|-------------------|
| number | string | AUTO | TAK |
| customer_id | uuid | TAK | TAK |
| status | string | TAK | TAK |
| items | array | TAK | TAK |
| subtotal | decimal | TAK | TAK |
| discount | decimal | NIE | TAK |
| total_amount | decimal | TAK | TAK |
| shipping_method | string | NIE | TAK |
| shipping_address | object | TAK | TAK |
| tracking_number | string | NIE | TAK |
| expected_delivery | date | NIE | TAK |
| payment_status | string | NIE | TAK |
| notes | text | NIE | TAK |

### 4.7. Pola - Towar

| Pole | Typ | Wymagane | Domyslnie widoczne |
|------|-----|----------|-------------------|
| sku | string | TAK | TAK |
| ean | string | NIE | TAK |
| name | string | TAK | TAK |
| description | text | NIE | TAK |
| category | string | NIE | TAK |
| brand | string | NIE | TAK |
| price_net | decimal | TAK | TAK |
| price_gross | decimal | TAK | TAK |
| vat_rate | decimal | TAK | TAK |
| stock_quantity | integer | NIE | TAK |
| min_stock | integer | NIE | NIE |
| weight | decimal | NIE | NIE |
| is_active | boolean | TAK | TAK |

### 4.8. Triggery

| Trigger | Domyslnie | Akcja |
|---------|-----------|-------|
| Nowe zamowienie | ON | Email potwierdzenie |
| Zamowienie wyslane | ON | Email z trackinkiem |
| Niska dostepnosc towaru | ON | Alert do admina |
| Oferta zaakceptowana | ON | Utworz zamowienie |
| Nowy kontrahent | ON | Email powitalny |
| Platnosc otrzymana | OFF | Email potwierdzenie |

---

## 5. MAPOWANIE ENCJI

### 5.1. Tabela mapowania

```typescript
const ENTITY_MAPPING = {
  services: {
    Order: { name: 'Zlecenie', prefix: 'ZLC', table: 'orders' },
    Customer: { name: 'Klient', prefix: 'KLI', table: 'customers' },
    Product: { name: 'Usluga', prefix: 'USL', table: 'products' },
    Quote: { name: 'Wycena', prefix: 'WYC', table: 'quotes' },
  },
  production: {
    Order: { name: 'Zamowienie produkcyjne', prefix: 'ZP', table: 'orders' },
    Customer: { name: 'Odbiorca', prefix: 'ODB', table: 'customers' },
    Product: { name: 'Wyrob', prefix: 'WYR', table: 'products' },
    Quote: { name: 'Kalkulacja', prefix: 'KAL', table: 'quotes' },
  },
  trade: {
    Order: { name: 'Zamowienie', prefix: 'ZAM', table: 'orders' },
    Customer: { name: 'Kontrahent', prefix: 'KON', table: 'customers' },
    Product: { name: 'Towar', prefix: 'TOW', table: 'products' },
    Quote: { name: 'Oferta', prefix: 'OFR', table: 'quotes' },
  },
};
```

### 5.2. Generowanie numerow

```typescript
// Przyklad: ZAM-2024-0042
function generateNumber(prefix: string, year: number, sequence: number): string {
  return `${prefix}-${year}-${String(sequence).padStart(4, '0')}`;
}
```

---

## 6. KONFIGURACJA SZABLONU

### 6.1. Seed Data

Przy tworzeniu tenanta z szablonem, system automatycznie:

1. Tworzy baze danych `dockpulse_tenant_{slug}`
2. Uruchamia migracje
3. Wstawia konfiguracje modulow
4. Wstawia konfiguracje pol
5. Wstawia predefiniowane triggery
6. Tworzy konto admina

### 6.2. Przyklad seeda (production)

```typescript
// seeds/template-production.ts
export async function seedProductionTemplate(prisma: PrismaClient) {
  // 1. Moduly
  await prisma.tenantModule.createMany({
    data: [
      { module_code: '@orders', is_enabled: true },
      { module_code: '@customers', is_enabled: true },
      { module_code: '@products', is_enabled: true },
      { module_code: '@stock', is_enabled: true },
      { module_code: '@portal', is_enabled: true },
      { module_code: '@quotes', is_enabled: false },
      { module_code: '@reports', is_enabled: false },
    ],
  });

  // 2. Konfiguracja pol klienta
  await prisma.fieldConfig.createMany({
    data: [
      { entity_type: 'customer', field_name: 'phone', is_visible: true, is_required: true, display_order: 1 },
      { entity_type: 'customer', field_name: 'company_name', is_visible: true, is_required: true, display_order: 2 },
      { entity_type: 'customer', field_name: 'nip', is_visible: true, is_required: true, display_order: 3 },
      { entity_type: 'customer', field_name: 'payment_terms', is_visible: true, is_required: false, display_order: 10 },
      // ...
    ],
  });

  // 3. Triggery
  await prisma.workflowTrigger.createMany({
    data: [
      {
        code: 'order.new.sms_admin',
        name: 'SMS do admina przy nowym zamowieniu',
        event_type: 'order.created',
        action_type: 'sms',
        is_enabled: true,
      },
      {
        code: 'order.ready.sms_customer',
        name: 'SMS do odbiorcy - zamowienie gotowe',
        event_type: 'order.ready',
        action_type: 'sms',
        is_enabled: true,
      },
      {
        code: 'stock.low.alert',
        name: 'Alert przy niskim stanie magazynowym',
        event_type: 'stock.low',
        action_type: 'email',
        is_enabled: true,
      },
      // ...
    ],
  });
}
```

---

## 7. ROZSZERZANIE SZABLONOW

### 7.1. Dodawanie nowego szablonu

1. Dodaj wpis do `module_registry` w bazie platformy
2. Utworz plik seed: `seeds/template-{name}.ts`
3. Dodaj mapping w `ENTITY_MAPPING`
4. Dodaj statusy w `ORDER_STATUSES`
5. Zdefiniuj domyslne moduly i pola

### 7.2. Przyklad: Szablon FLORYSTYKA

```typescript
const FLORYSTYKA_TEMPLATE = {
  code: 'floristry',
  name: 'Florystyka',
  modules: ['@zamowienia', '@klienci', '@bukiety', '@okazje', '@portal'],
  entities: {
    Order: { name: 'Zamowienie', prefix: 'ZAM' },
    Customer: { name: 'Klient', prefix: 'KLI' },
    Product: { name: 'Bukiet', prefix: 'BUK' },
  },
  statuses: [
    { code: 'new', name: 'Nowe' },
    { code: 'confirmed', name: 'Potwierdzone' },
    { code: 'preparing', name: 'W przygotowaniu' },
    { code: 'ready', name: 'Gotowe' },
    { code: 'delivering', name: 'W dostawie' },
    { code: 'delivered', name: 'Dostarczone' },
  ],
  custom_fields: {
    order: [
      { name: 'occasion', label: 'Okazja', type: 'select', options: ['urodziny', 'slub', 'rocznica', 'kondolencje'] },
      { name: 'delivery_time', label: 'Godzina dostawy', type: 'time' },
      { name: 'card_message', label: 'Tresc bileciku', type: 'textarea' },
    ],
  },
};
```

---

## 8. POROWNANIE SZABLONOW

| Cecha | USLUGI | PRODUKCJA | HANDEL |
|-------|--------|-----------|--------|
| Glowna encja | Zlecenie | Zamowienie prod. | Zamowienie |
| Charakter | Projektowy | Procesowy | Transakcyjny |
| Magazyn | Opcjonalnie | Kluczowy | Kluczowy |
| Wyceny | Kluczowe | Opcjonalne | Oferty |
| Harmonogram | Kluczowy | Opcjonalny | Brak |
| Fakturowanie | Po zakonczeniu | Po dostawie | Po wyslaniu |
| Portal | Sledzenie | Zamawianie | Zamawianie |

---

**Wersja**: 2.0
**Data**: Grudzien 2024
