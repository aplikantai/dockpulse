import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed Script for Module and Submodule Prices
 *
 * This script populates the ModulePrice and SubmodulePrice tables
 * with pricing data for all 14 modules and their 140+ submodules.
 */

interface ModuleWithSubmodules {
  moduleCode: string;
  moduleName: string;
  description: string;
  basePrice: number;
  displayOrder: number;
  submodules: {
    submoduleCode: string;
    submoduleName: string;
    description: string;
    price: number;
    isIncluded: boolean;
    displayOrder: number;
  }[];
}

const modulesData: ModuleWithSubmodules[] = [
  // 1. CRM MODULE (10 submodules)
  {
    moduleCode: 'CRM',
    moduleName: 'Zarządzanie klientami (CRM)',
    description: 'Kompleksowe zarządzanie relacjami z klientami',
    basePrice: 99.00,
    displayOrder: 1,
    submodules: [
      { submoduleCode: 'CRM_BASIC', submoduleName: 'Podstawowe dane klientów', description: 'Imię, nazwisko, email, telefon, firma', price: 0, isIncluded: true, displayOrder: 1 },
      { submoduleCode: 'CRM_SEGMENTS', submoduleName: 'Segmentacja klientów', description: 'Grupy, tagi, segmenty zaawansowane', price: 29.00, isIncluded: false, displayOrder: 2 },
      { submoduleCode: 'CRM_HISTORY', submoduleName: 'Historia interakcji', description: 'Notatki, spotkania, telefony, emaile', price: 19.00, isIncluded: false, displayOrder: 3 },
      { submoduleCode: 'CRM_TASKS', submoduleName: 'Zadania i przypomnienia', description: 'Automatyczne przypomnienia o kontakcie', price: 19.00, isIncluded: false, displayOrder: 4 },
      { submoduleCode: 'CRM_FILES', submoduleName: 'Pliki i dokumenty', description: 'Przechowywanie załączników per klient', price: 15.00, isIncluded: false, displayOrder: 5 },
      { submoduleCode: 'CRM_CUSTOM_FIELDS', submoduleName: 'Pola niestandardowe', description: 'Dodatkowe pola dostosowane do branży', price: 25.00, isIncluded: false, displayOrder: 6 },
      { submoduleCode: 'CRM_DASHBOARD', submoduleName: 'Dashboard CRM', description: 'Statystyki, wykresy, aktywność', price: 0, isIncluded: true, displayOrder: 7 },
      { submoduleCode: 'CRM_IMPORT_EXPORT', submoduleName: 'Import/Export', description: 'CSV, Excel - import i eksport danych', price: 15.00, isIncluded: false, displayOrder: 8 },
      { submoduleCode: 'CRM_DUPLICATES', submoduleName: 'Wykrywanie duplikatów', description: 'Automatyczne wykrywanie i łączenie', price: 39.00, isIncluded: false, displayOrder: 9 },
      { submoduleCode: 'CRM_API', submoduleName: 'API dostęp', description: 'REST API dla integracji zewnętrznych', price: 49.00, isIncluded: false, displayOrder: 10 },
    ],
  },

  // 2. ORDERS MODULE (15 submodules)
  {
    moduleCode: 'ORDERS',
    moduleName: 'Zamówienia',
    description: 'Zarządzanie zamówieniami i ich stanem',
    basePrice: 129.00,
    displayOrder: 2,
    submodules: [
      { submoduleCode: 'ORDERS_BASIC', submoduleName: 'Podstawowe zamówienia', description: 'Tworzenie, edycja, usuwanie zamówień', price: 0, isIncluded: true, displayOrder: 1 },
      { submoduleCode: 'ORDERS_STATUSES', submoduleName: 'Statusy zamówień', description: 'Niestandardowe statusy i przepływ', price: 19.00, isIncluded: false, displayOrder: 2 },
      { submoduleCode: 'ORDERS_TEMPLATES', submoduleName: 'Szablony zamówień', description: 'Zapisane szablony do szybkiego tworzenia', price: 15.00, isIncluded: false, displayOrder: 3 },
      { submoduleCode: 'ORDERS_RECURRING', submoduleName: 'Zamówienia cykliczne', description: 'Automatyczne powtarzanie co X dni/miesięcy', price: 49.00, isIncluded: false, displayOrder: 4 },
      { submoduleCode: 'ORDERS_ATTACHMENTS', submoduleName: 'Załączniki', description: 'Załączanie plików do zamówień', price: 15.00, isIncluded: false, displayOrder: 5 },
      { submoduleCode: 'ORDERS_COMMENTS', submoduleName: 'Komentarze', description: 'Wewnętrzne notatki do zamówień', price: 10.00, isIncluded: false, displayOrder: 6 },
      { submoduleCode: 'ORDERS_PRODUCTION', submoduleName: 'Zlecenia produkcyjne', description: 'Generowanie zleceń do produkcji', price: 69.00, isIncluded: false, displayOrder: 7 },
      { submoduleCode: 'ORDERS_DELIVERY', submoduleName: 'Planowanie dostaw', description: 'Kalendarz dostaw, przesyłki', price: 39.00, isIncluded: false, displayOrder: 8 },
      { submoduleCode: 'ORDERS_TRACKING', submoduleName: 'Tracking zamówień', description: 'Numery przesyłek, status dostawy', price: 29.00, isIncluded: false, displayOrder: 9 },
      { submoduleCode: 'ORDERS_PAYMENTS', submoduleName: 'Płatności', description: 'Śledzenie wpłat, statusy płatności', price: 25.00, isIncluded: false, displayOrder: 10 },
      { submoduleCode: 'ORDERS_DISCOUNTS', submoduleName: 'Rabaty i promocje', description: 'Kody rabatowe, promocje sezonowe', price: 35.00, isIncluded: false, displayOrder: 11 },
      { submoduleCode: 'ORDERS_BULK', submoduleName: 'Masowe operacje', description: 'Zmiana statusu wielu zamówień naraz', price: 25.00, isIncluded: false, displayOrder: 12 },
      { submoduleCode: 'ORDERS_ANALYTICS', submoduleName: 'Analityka zamówień', description: 'Raporty sprzedaży, wykresy trendów', price: 0, isIncluded: true, displayOrder: 13 },
      { submoduleCode: 'ORDERS_PRINT', submoduleName: 'Drukowanie i PDF', description: 'Szablony wydruków, generowanie PDF', price: 19.00, isIncluded: false, displayOrder: 14 },
      { submoduleCode: 'ORDERS_EMAIL_NOTIFY', submoduleName: 'Powiadomienia email', description: 'Automatyczne emaile o statusie', price: 29.00, isIncluded: false, displayOrder: 15 },
    ],
  },

  // 3. PRODUCTS MODULE (12 submodules)
  {
    moduleCode: 'PRODUCTS',
    moduleName: 'Produkty',
    description: 'Zarządzanie katalogiem produktów',
    basePrice: 89.00,
    displayOrder: 3,
    submodules: [
      { submoduleCode: 'PRODUCTS_BASIC', submoduleName: 'Podstawowe produkty', description: 'SKU, nazwa, opis, cena', price: 0, isIncluded: true, displayOrder: 1 },
      { submoduleCode: 'PRODUCTS_CATEGORIES', submoduleName: 'Kategorie', description: 'Hierarchia kategorii i podkategorii', price: 15.00, isIncluded: false, displayOrder: 2 },
      { submoduleCode: 'PRODUCTS_VARIANTS', submoduleName: 'Warianty produktów', description: 'Rozmiary, kolory, wersje', price: 39.00, isIncluded: false, displayOrder: 3 },
      { submoduleCode: 'PRODUCTS_IMAGES', submoduleName: 'Galeria zdjęć', description: 'Wiele zdjęć per produkt', price: 19.00, isIncluded: false, displayOrder: 4 },
      { submoduleCode: 'PRODUCTS_STOCK', submoduleName: 'Stany magazynowe', description: 'Śledzenie dostępności', price: 29.00, isIncluded: false, displayOrder: 5 },
      { submoduleCode: 'PRODUCTS_PRICING', submoduleName: 'Zaawansowane ceny', description: 'Ceny hurtowe, rabaty grupowe', price: 35.00, isIncluded: false, displayOrder: 6 },
      { submoduleCode: 'PRODUCTS_BUNDLES', submoduleName: 'Zestawy produktów', description: 'Tworzenie pakietów, bundli', price: 29.00, isIncluded: false, displayOrder: 7 },
      { submoduleCode: 'PRODUCTS_CUSTOM_FIELDS', submoduleName: 'Pola niestandardowe', description: 'Dodatkowe atrybuty produktów', price: 25.00, isIncluded: false, displayOrder: 8 },
      { submoduleCode: 'PRODUCTS_IMPORT_EXPORT', submoduleName: 'Import/Export', description: 'Masowy import z CSV/Excel', price: 15.00, isIncluded: false, displayOrder: 9 },
      { submoduleCode: 'PRODUCTS_BARCODE', submoduleName: 'Kody kreskowe', description: 'Generowanie i skanowanie kodów', price: 49.00, isIncluded: false, displayOrder: 10 },
      { submoduleCode: 'PRODUCTS_SEO', submoduleName: 'SEO i integracja sklepu', description: 'Meta tagi dla sklepu online', price: 35.00, isIncluded: false, displayOrder: 11 },
      { submoduleCode: 'PRODUCTS_ANALYTICS', submoduleName: 'Analityka produktów', description: 'Top produkty, obroty, marże', price: 0, isIncluded: true, displayOrder: 12 },
    ],
  },

  // 4. QUOTES MODULE (12 submodules)
  {
    moduleCode: 'QUOTES',
    moduleName: 'Oferty cenowe',
    description: 'Tworzenie i zarządzanie ofertami',
    basePrice: 79.00,
    displayOrder: 4,
    submodules: [
      { submoduleCode: 'QUOTES_BASIC', submoduleName: 'Podstawowe oferty', description: 'Tworzenie ofert z pozycjami', price: 0, isIncluded: true, displayOrder: 1 },
      { submoduleCode: 'QUOTES_TEMPLATES', submoduleName: 'Szablony ofert', description: 'Zapisane szablony do szybkiego użycia', price: 19.00, isIncluded: false, displayOrder: 2 },
      { submoduleCode: 'QUOTES_EXPIRY', submoduleName: 'Data ważności', description: 'Automatyczne wygasanie ofert', price: 10.00, isIncluded: false, displayOrder: 3 },
      { submoduleCode: 'QUOTES_APPROVAL', submoduleName: 'Workflow akceptacji', description: 'Wielopoziomowe zatwierdzanie', price: 49.00, isIncluded: false, displayOrder: 4 },
      { submoduleCode: 'QUOTES_PDF', submoduleName: 'Export do PDF', description: 'Profesjonalne szablony PDF', price: 19.00, isIncluded: false, displayOrder: 5 },
      { submoduleCode: 'QUOTES_EMAIL', submoduleName: 'Wysyłka email', description: 'Wysyłanie ofert bezpośrednio do klienta', price: 15.00, isIncluded: false, displayOrder: 6 },
      { submoduleCode: 'QUOTES_CONVERT', submoduleName: 'Konwersja na zamówienie', description: 'Szybkie przekształcenie w zamówienie', price: 0, isIncluded: true, displayOrder: 7 },
      { submoduleCode: 'QUOTES_VERSIONS', submoduleName: 'Wersje ofert', description: 'Historia zmian, wersjonowanie', price: 29.00, isIncluded: false, displayOrder: 8 },
      { submoduleCode: 'QUOTES_DISCOUNTS', submoduleName: 'Rabaty', description: 'Procentowe i kwotowe rabaty', price: 15.00, isIncluded: false, displayOrder: 9 },
      { submoduleCode: 'QUOTES_ATTACHMENTS', submoduleName: 'Załączniki', description: 'Dołączanie plików do ofert', price: 15.00, isIncluded: false, displayOrder: 10 },
      { submoduleCode: 'QUOTES_ANALYTICS', submoduleName: 'Analityka ofert', description: 'Współczynnik konwersji, wartość ofert', price: 0, isIncluded: true, displayOrder: 11 },
      { submoduleCode: 'QUOTES_BRANDING', submoduleName: 'Własny branding', description: 'Logo, kolory, stopka firmowa', price: 35.00, isIncluded: false, displayOrder: 12 },
    ],
  },

  // 5. WMS MODULE (17 submodules)
  {
    moduleCode: 'WMS',
    moduleName: 'Magazyn (WMS)',
    description: 'Zarządzanie magazynem i logistyką',
    basePrice: 149.00,
    displayOrder: 5,
    submodules: [
      { submoduleCode: 'WMS_BASIC', submoduleName: 'Podstawowe stany magazynowe', description: 'Śledzenie ilości w magazynie', price: 0, isIncluded: true, displayOrder: 1 },
      { submoduleCode: 'WMS_MULTI_WAREHOUSE', submoduleName: 'Wiele magazynów', description: 'Obsługa wielu lokalizacji', price: 69.00, isIncluded: false, displayOrder: 2 },
      { submoduleCode: 'WMS_ZONES', submoduleName: 'Strefy magazynowe', description: 'Podział na strefy i lokalizacje', price: 49.00, isIncluded: false, displayOrder: 3 },
      { submoduleCode: 'WMS_RECEIVING', submoduleName: 'Przyjęcia towaru', description: 'Dokumenty PZ, weryfikacja dostaw', price: 29.00, isIncluded: false, displayOrder: 4 },
      { submoduleCode: 'WMS_SHIPPING', submoduleName: 'Wydania towaru', description: 'Dokumenty WZ, picking list', price: 29.00, isIncluded: false, displayOrder: 5 },
      { submoduleCode: 'WMS_TRANSFERS', submoduleName: 'Przesunięcia międzymagazynowe', description: 'Transfer między magazynami', price: 39.00, isIncluded: false, displayOrder: 6 },
      { submoduleCode: 'WMS_INVENTORY', submoduleName: 'Inwentaryzacja', description: 'Liczenie stanu, korekty', price: 49.00, isIncluded: false, displayOrder: 7 },
      { submoduleCode: 'WMS_BATCH_TRACKING', submoduleName: 'Śledzenie partii', description: 'Numery partii, daty produkcji', price: 59.00, isIncluded: false, displayOrder: 8 },
      { submoduleCode: 'WMS_SERIAL_NUMBERS', submoduleName: 'Numery seryjne', description: 'Indywidualne numery produktów', price: 59.00, isIncluded: false, displayOrder: 9 },
      { submoduleCode: 'WMS_EXPIRY', submoduleName: 'Terminy ważności', description: 'Śledzenie dat przydatności', price: 39.00, isIncluded: false, displayOrder: 10 },
      { submoduleCode: 'WMS_RESERVATIONS', submoduleName: 'Rezerwacje', description: 'Blokowanie stanów pod zamówienia', price: 29.00, isIncluded: false, displayOrder: 11 },
      { submoduleCode: 'WMS_BARCODE', submoduleName: 'Kody kreskowe', description: 'Skanowanie, etykiety, picking', price: 69.00, isIncluded: false, displayOrder: 12 },
      { submoduleCode: 'WMS_MOBILE', submoduleName: 'Aplikacja mobilna', description: 'Skanowanie przez telefon/tablet', price: 89.00, isIncluded: false, displayOrder: 13 },
      { submoduleCode: 'WMS_ANALYTICS', submoduleName: 'Analityka magazynu', description: 'Obroty, rotacja, wartość zapasów', price: 0, isIncluded: true, displayOrder: 14 },
      { submoduleCode: 'WMS_REPLENISHMENT', submoduleName: 'Uzupełnianie stanów', description: 'Automatyczne sugestie uzupełnienia', price: 49.00, isIncluded: false, displayOrder: 15 },
      { submoduleCode: 'WMS_FORECASTING', submoduleName: 'Prognozowanie zapotrzebowania', description: 'AI przewidywanie potrzeb magazynowych', price: 99.00, isIncluded: false, displayOrder: 16 },
      { submoduleCode: 'WMS_INTEGRATION', submoduleName: 'Integracja z kurierami', description: 'InPost, DPD, DHL, UPS', price: 79.00, isIncluded: false, displayOrder: 17 },
    ],
  },

  // 6. INVOICES MODULE (13 submodules)
  {
    moduleCode: 'INVOICES',
    moduleName: 'Faktury',
    description: 'Wystawianie i zarządzanie fakturami',
    basePrice: 119.00,
    displayOrder: 6,
    submodules: [
      { submoduleCode: 'INVOICES_BASIC', submoduleName: 'Podstawowe faktury', description: 'Faktury VAT, FV proforma', price: 0, isIncluded: true, displayOrder: 1 },
      { submoduleCode: 'INVOICES_AUTO_NUMBER', submoduleName: 'Automatyczna numeracja', description: 'Numery zgodne z przepisami', price: 0, isIncluded: true, displayOrder: 2 },
      { submoduleCode: 'INVOICES_CORRECTIONS', submoduleName: 'Faktury korygujące', description: 'Korekty, storno', price: 29.00, isIncluded: false, displayOrder: 3 },
      { submoduleCode: 'INVOICES_RECURRING', submoduleName: 'Faktury cykliczne', description: 'Automatyczne wystawianie co miesiąc', price: 49.00, isIncluded: false, displayOrder: 4 },
      { submoduleCode: 'INVOICES_PAYMENT_REMIND', submoduleName: 'Przypomnienia o płatności', description: 'Automatyczne maile', price: 29.00, isIncluded: false, displayOrder: 5 },
      { submoduleCode: 'INVOICES_ONLINE_PAYMENT', submoduleName: 'Płatności online', description: 'Integracja Stripe, PayU, Przelewy24', price: 69.00, isIncluded: false, displayOrder: 6 },
      { submoduleCode: 'INVOICES_PDF', submoduleName: 'Export PDF', description: 'Profesjonalne szablony PDF', price: 19.00, isIncluded: false, displayOrder: 7 },
      { submoduleCode: 'INVOICES_EMAIL', submoduleName: 'Wysyłka email', description: 'Automatyczna wysyłka do klientów', price: 15.00, isIncluded: false, displayOrder: 8 },
      { submoduleCode: 'INVOICES_KSeF', submoduleName: 'Integracja KSeF', description: 'Faktury elektroniczne dla MF', price: 99.00, isIncluded: false, displayOrder: 9 },
      { submoduleCode: 'INVOICES_JPK', submoduleName: 'Eksport JPK', description: 'JPK_FA, JPK_VAT do US', price: 79.00, isIncluded: false, displayOrder: 10 },
      { submoduleCode: 'INVOICES_MULTI_CURRENCY', submoduleName: 'Wiele walut', description: 'Faktury w EUR, USD, GBP', price: 49.00, isIncluded: false, displayOrder: 11 },
      { submoduleCode: 'INVOICES_TEMPLATES', submoduleName: 'Szablony faktur', description: 'Własne szablony graficzne', price: 35.00, isIncluded: false, displayOrder: 12 },
      { submoduleCode: 'INVOICES_ANALYTICS', submoduleName: 'Analityka faktur', description: 'Raport obrotów, VAT, należności', price: 0, isIncluded: true, displayOrder: 13 },
    ],
  },

  // 7. PROJECTS MODULE (8 submodules)
  {
    moduleCode: 'PROJECTS',
    moduleName: 'Projekty',
    description: 'Zarządzanie projektami i zadaniami',
    basePrice: 109.00,
    displayOrder: 7,
    submodules: [
      { submoduleCode: 'PROJECTS_BASIC', submoduleName: 'Podstawowe projekty', description: 'Tworzenie projektów, zadania', price: 0, isIncluded: true, displayOrder: 1 },
      { submoduleCode: 'PROJECTS_GANTT', submoduleName: 'Wykres Gantta', description: 'Harmonogram projektów', price: 49.00, isIncluded: false, displayOrder: 2 },
      { submoduleCode: 'PROJECTS_KANBAN', submoduleName: 'Tablica Kanban', description: 'Wizualizacja przepływu pracy', price: 39.00, isIncluded: false, displayOrder: 3 },
      { submoduleCode: 'PROJECTS_TIME_TRACKING', submoduleName: 'Śledzenie czasu pracy', description: 'Rejestracja czasu na zadaniach', price: 59.00, isIncluded: false, displayOrder: 4 },
      { submoduleCode: 'PROJECTS_BUDGET', submoduleName: 'Budżet projektu', description: 'Koszty, przychody, rentowność', price: 49.00, isIncluded: false, displayOrder: 5 },
      { submoduleCode: 'PROJECTS_MILESTONES', submoduleName: 'Kamienie milowe', description: 'Etapy i cele projektu', price: 29.00, isIncluded: false, displayOrder: 6 },
      { submoduleCode: 'PROJECTS_COLLABORATION', submoduleName: 'Współpraca zespołowa', description: 'Komentarze, wspólne pliki', price: 39.00, isIncluded: false, displayOrder: 7 },
      { submoduleCode: 'PROJECTS_REPORTS', submoduleName: 'Raporty projektowe', description: 'Status, czas, koszty, efektywność', price: 0, isIncluded: true, displayOrder: 8 },
    ],
  },

  // 8. CALENDAR MODULE (6 submodules)
  {
    moduleCode: 'CALENDAR',
    moduleName: 'Kalendarz',
    description: 'Planowanie i kalendarz wydarzeń',
    basePrice: 59.00,
    displayOrder: 8,
    submodules: [
      { submoduleCode: 'CALENDAR_BASIC', submoduleName: 'Podstawowy kalendarz', description: 'Wydarzenia, zadania, terminy', price: 0, isIncluded: true, displayOrder: 1 },
      { submoduleCode: 'CALENDAR_SHARED', submoduleName: 'Kalendarz zespołowy', description: 'Wspólny kalendarz dla zespołu', price: 29.00, isIncluded: false, displayOrder: 2 },
      { submoduleCode: 'CALENDAR_SYNC', submoduleName: 'Synchronizacja', description: 'Sync z Google Calendar, Outlook', price: 39.00, isIncluded: false, displayOrder: 3 },
      { submoduleCode: 'CALENDAR_BOOKING', submoduleName: 'Rezerwacja terminów', description: 'Umówienia wizyt przez klientów', price: 49.00, isIncluded: false, displayOrder: 4 },
      { submoduleCode: 'CALENDAR_REMINDERS', submoduleName: 'Przypomnienia', description: 'Email/SMS przed wydarzeniem', price: 19.00, isIncluded: false, displayOrder: 5 },
      { submoduleCode: 'CALENDAR_RECURRING', submoduleName: 'Wydarzenia cykliczne', description: 'Powtarzające się spotkania', price: 15.00, isIncluded: false, displayOrder: 6 },
    ],
  },

  // 9. REPORTS MODULE (10 submodules)
  {
    moduleCode: 'REPORTS',
    moduleName: 'Raporty i analityka',
    description: 'Zaawansowane raporty biznesowe',
    basePrice: 79.00,
    displayOrder: 9,
    submodules: [
      { submoduleCode: 'REPORTS_BASIC', submoduleName: 'Podstawowe raporty', description: 'Sprzedaż, przychody, zamówienia', price: 0, isIncluded: true, displayOrder: 1 },
      { submoduleCode: 'REPORTS_CUSTOM', submoduleName: 'Raporty niestandardowe', description: 'Własne definicje raportów', price: 49.00, isIncluded: false, displayOrder: 2 },
      { submoduleCode: 'REPORTS_SCHEDULED', submoduleName: 'Raporty zaplanowane', description: 'Automatyczne wysyłanie co tydzień/miesiąc', price: 39.00, isIncluded: false, displayOrder: 3 },
      { submoduleCode: 'REPORTS_EXPORT', submoduleName: 'Export raportów', description: 'PDF, Excel, CSV', price: 19.00, isIncluded: false, displayOrder: 4 },
      { submoduleCode: 'REPORTS_DASHBOARD', submoduleName: 'Dashboard zarządczy', description: 'Kluczowe wskaźniki w czasie rzeczywistym', price: 0, isIncluded: true, displayOrder: 5 },
      { submoduleCode: 'REPORTS_CHARTS', submoduleName: 'Wykresy i wizualizacje', description: 'Interaktywne wykresy', price: 0, isIncluded: true, displayOrder: 6 },
      { submoduleCode: 'REPORTS_PIVOT', submoduleName: 'Tabele przestawne', description: 'Zaawansowane analizy danych', price: 59.00, isIncluded: false, displayOrder: 7 },
      { submoduleCode: 'REPORTS_FORECAST', submoduleName: 'Prognozy', description: 'Predykcje sprzedaży i trendów', price: 99.00, isIncluded: false, displayOrder: 8 },
      { submoduleCode: 'REPORTS_KPI', submoduleName: 'KPI i cele', description: 'Śledzenie kluczowych wskaźników', price: 49.00, isIncluded: false, displayOrder: 9 },
      { submoduleCode: 'REPORTS_BI', submoduleName: 'Business Intelligence', description: 'Integracja z Power BI, Tableau', price: 149.00, isIncluded: false, displayOrder: 10 },
    ],
  },

  // 10. NOTIFICATIONS MODULE (8 submodules)
  {
    moduleCode: 'NOTIFICATIONS',
    moduleName: 'Powiadomienia',
    description: 'System powiadomień i alertów',
    basePrice: 49.00,
    displayOrder: 10,
    submodules: [
      { submoduleCode: 'NOTIFICATIONS_BASIC', submoduleName: 'Powiadomienia w systemie', description: 'Podstawowe alerty w aplikacji', price: 0, isIncluded: true, displayOrder: 1 },
      { submoduleCode: 'NOTIFICATIONS_EMAIL', submoduleName: 'Powiadomienia email', description: 'Wysyłka alertów na email', price: 19.00, isIncluded: false, displayOrder: 2 },
      { submoduleCode: 'NOTIFICATIONS_SMS', submoduleName: 'Powiadomienia SMS', description: 'Wysyłka SMS (integracja z bramką)', price: 49.00, isIncluded: false, displayOrder: 3 },
      { submoduleCode: 'NOTIFICATIONS_PUSH', submoduleName: 'Push notifications', description: 'Powiadomienia push w przeglądarce', price: 29.00, isIncluded: false, displayOrder: 4 },
      { submoduleCode: 'NOTIFICATIONS_SLACK', submoduleName: 'Integracja Slack', description: 'Powiadomienia na kanał Slack', price: 39.00, isIncluded: false, displayOrder: 5 },
      { submoduleCode: 'NOTIFICATIONS_WEBHOOK', submoduleName: 'Webhooks', description: 'Własne endpointy do powiadomień', price: 49.00, isIncluded: false, displayOrder: 6 },
      { submoduleCode: 'NOTIFICATIONS_RULES', submoduleName: 'Reguły powiadomień', description: 'Warunki i filtry alertów', price: 29.00, isIncluded: false, displayOrder: 7 },
      { submoduleCode: 'NOTIFICATIONS_HISTORY', submoduleName: 'Historia powiadomień', description: 'Archiwum wysłanych alertów', price: 15.00, isIncluded: false, displayOrder: 8 },
    ],
  },

  // 11. INTEGRATIONS MODULE (12 submodules)
  {
    moduleCode: 'INTEGRATIONS',
    moduleName: 'Integracje',
    description: 'Integracje z zewnętrznymi systemami',
    basePrice: 69.00,
    displayOrder: 11,
    submodules: [
      { submoduleCode: 'INT_API', submoduleName: 'REST API', description: 'Pełne API do integracji', price: 0, isIncluded: true, displayOrder: 1 },
      { submoduleCode: 'INT_WEBHOOKS', submoduleName: 'Webhooks', description: 'Powiadomienia o wydarzeniach', price: 0, isIncluded: true, displayOrder: 2 },
      { submoduleCode: 'INT_ZAPIER', submoduleName: 'Integracja Zapier', description: 'Łączenie z 3000+ aplikacji', price: 49.00, isIncluded: false, displayOrder: 3 },
      { submoduleCode: 'INT_WOOCOMMERCE', submoduleName: 'WooCommerce', description: 'Synchronizacja ze sklepem WooCommerce', price: 79.00, isIncluded: false, displayOrder: 4 },
      { submoduleCode: 'INT_SHOPIFY', submoduleName: 'Shopify', description: 'Synchronizacja ze sklepem Shopify', price: 79.00, isIncluded: false, displayOrder: 5 },
      { submoduleCode: 'INT_ALLEGRO', submoduleName: 'Allegro', description: 'Integracja z Allegro (zamówienia, stany)', price: 99.00, isIncluded: false, displayOrder: 6 },
      { submoduleCode: 'INT_BASELINKER', submoduleName: 'Baselinker', description: 'Integracja z Baselinkerem', price: 89.00, isIncluded: false, displayOrder: 7 },
      { submoduleCode: 'INT_ACCOUNTING', submoduleName: 'Systemy księgowe', description: 'Wapro, Comarch, Symfonia', price: 149.00, isIncluded: false, displayOrder: 8 },
      { submoduleCode: 'INT_GOOGLE_SHEETS', submoduleName: 'Google Sheets', description: 'Export/import z Google Sheets', price: 39.00, isIncluded: false, displayOrder: 9 },
      { submoduleCode: 'INT_MAILCHIMP', submoduleName: 'MailChimp', description: 'Synchronizacja kontaktów', price: 49.00, isIncluded: false, displayOrder: 10 },
      { submoduleCode: 'INT_COURIERS', submoduleName: 'Firmy kurierskie', description: 'InPost, DPD, DHL, UPS', price: 79.00, isIncluded: false, displayOrder: 11 },
      { submoduleCode: 'INT_CUSTOM', submoduleName: 'Integracje dedykowane', description: 'Dedykowane API dla klienta', price: 299.00, isIncluded: false, displayOrder: 12 },
    ],
  },

  // 12. HR MODULE (7 submodules)
  {
    moduleCode: 'HR',
    moduleName: 'Zarządzanie pracownikami (HR)',
    description: 'Kadry i zarządzanie zespołem',
    basePrice: 89.00,
    displayOrder: 12,
    submodules: [
      { submoduleCode: 'HR_BASIC', submoduleName: 'Dane pracowników', description: 'Podstawowe informacje o pracownikach', price: 0, isIncluded: true, displayOrder: 1 },
      { submoduleCode: 'HR_ATTENDANCE', submoduleName: 'Ewidencja czasu pracy', description: 'RCP, godziny pracy', price: 49.00, isIncluded: false, displayOrder: 2 },
      { submoduleCode: 'HR_LEAVE', submoduleName: 'Urlopy i nieobecności', description: 'Wnioski urlopowe, L4, urlopy', price: 39.00, isIncluded: false, displayOrder: 3 },
      { submoduleCode: 'HR_CONTRACTS', submoduleName: 'Umowy i dokumenty', description: 'Przechowywanie umów pracowniczych', price: 29.00, isIncluded: false, displayOrder: 4 },
      { submoduleCode: 'HR_PAYROLL', submoduleName: 'Rozliczenia wynagrodzeń', description: 'Lista płac, raporty ZUS', price: 99.00, isIncluded: false, displayOrder: 5 },
      { submoduleCode: 'HR_PERFORMANCE', submoduleName: 'Ocena pracowników', description: 'Oceny okresowe, cele', price: 59.00, isIncluded: false, displayOrder: 6 },
      { submoduleCode: 'HR_RECRUITMENT', submoduleName: 'Rekrutacja', description: 'Ogłoszenia, kandydaci, proces rekrutacji', price: 69.00, isIncluded: false, displayOrder: 7 },
    ],
  },

  // 13. BRANCHES MODULE (5 submodules)
  {
    moduleCode: 'BRANCHES',
    moduleName: 'Oddziały i lokalizacje',
    description: 'Zarządzanie wieloma oddziałami firmy',
    basePrice: 99.00,
    displayOrder: 13,
    submodules: [
      { submoduleCode: 'BRANCHES_BASIC', submoduleName: 'Podstawowe oddziały', description: 'Tworzenie i zarządzanie oddziałami', price: 0, isIncluded: true, displayOrder: 1 },
      { submoduleCode: 'BRANCHES_PERMISSIONS', submoduleName: 'Uprawnienia per oddział', description: 'Ograniczanie dostępu do oddziałów', price: 49.00, isIncluded: false, displayOrder: 2 },
      { submoduleCode: 'BRANCHES_REPORTING', submoduleName: 'Raporty per oddział', description: 'Statystyki i wyniki per lokalizacja', price: 39.00, isIncluded: false, displayOrder: 3 },
      { submoduleCode: 'BRANCHES_TRANSFER', submoduleName: 'Transfer między oddziałami', description: 'Przenoszenie zamówień, dokumentów', price: 49.00, isIncluded: false, displayOrder: 4 },
      { submoduleCode: 'BRANCHES_CONSOLIDATION', submoduleName: 'Konsolidacja danych', description: 'Zbiorcze raporty dla wszystkich oddziałów', price: 59.00, isIncluded: false, displayOrder: 5 },
    ],
  },

  // 14. SUPPLIERS MODULE (6 submodules)
  {
    moduleCode: 'SUPPLIERS',
    moduleName: 'Dostawcy',
    description: 'Zarządzanie dostawcami i zakupami',
    basePrice: 79.00,
    displayOrder: 14,
    submodules: [
      { submoduleCode: 'SUPPLIERS_BASIC', submoduleName: 'Dane dostawców', description: 'Podstawowe informacje o dostawcach', price: 0, isIncluded: true, displayOrder: 1 },
      { submoduleCode: 'SUPPLIERS_ORDERS', submoduleName: 'Zamówienia zakupu', description: 'Zamówienia do dostawców', price: 49.00, isIncluded: false, displayOrder: 2 },
      { submoduleCode: 'SUPPLIERS_INVOICES', submoduleName: 'Faktury zakupu', description: 'Rejestracja faktur od dostawców', price: 39.00, isIncluded: false, displayOrder: 3 },
      { submoduleCode: 'SUPPLIERS_CONTRACTS', submoduleName: 'Umowy z dostawcami', description: 'Przechowywanie umów i warunków', price: 29.00, isIncluded: false, displayOrder: 4 },
      { submoduleCode: 'SUPPLIERS_EVALUATION', submoduleName: 'Ocena dostawców', description: 'Oceny, terminy dostaw, jakość', price: 49.00, isIncluded: false, displayOrder: 5 },
      { submoduleCode: 'SUPPLIERS_ANALYTICS', submoduleName: 'Analityka zakupów', description: 'Koszty, obroty, najlepsi dostawcy', price: 0, isIncluded: true, displayOrder: 6 },
    ],
  },
];

async function main() {
  console.log('🌱 Seeding module and submodule prices...\n');

  for (const moduleData of modulesData) {
    console.log(`📦 Creating module: ${moduleData.moduleName} (${moduleData.moduleCode})`);

    // Create or update module
    const module = await prisma.modulePrice.upsert({
      where: { moduleCode: moduleData.moduleCode },
      update: {
        moduleName: moduleData.moduleName,
        description: moduleData.description,
        basePrice: moduleData.basePrice,
        displayOrder: moduleData.displayOrder,
      },
      create: {
        moduleCode: moduleData.moduleCode,
        moduleName: moduleData.moduleName,
        description: moduleData.description,
        basePrice: moduleData.basePrice,
        displayOrder: moduleData.displayOrder,
      },
    });

    console.log(`   ✅ Module created with base price: ${module.basePrice} PLN`);

    // Create or update submodules
    for (const submoduleData of moduleData.submodules) {
      await prisma.submodulePrice.upsert({
        where: {
          moduleCode_submoduleCode: {
            moduleCode: moduleData.moduleCode,
            submoduleCode: submoduleData.submoduleCode,
          },
        },
        update: {
          submoduleName: submoduleData.submoduleName,
          description: submoduleData.description,
          price: submoduleData.price,
          isIncluded: submoduleData.isIncluded,
          displayOrder: submoduleData.displayOrder,
        },
        create: {
          moduleCode: moduleData.moduleCode,
          submoduleCode: submoduleData.submoduleCode,
          submoduleName: submoduleData.submoduleName,
          description: submoduleData.description,
          price: submoduleData.price,
          isIncluded: submoduleData.isIncluded,
          displayOrder: submoduleData.displayOrder,
        },
      });
    }

    console.log(`   ✅ Created ${moduleData.submodules.length} submodules\n`);
  }

  // Summary
  const totalModules = await prisma.modulePrice.count();
  const totalSubmodules = await prisma.submodulePrice.count();

  console.log('✅ Seeding completed successfully!');
  console.log(`📊 Total modules: ${totalModules}`);
  console.log(`📊 Total submodules: ${totalSubmodules}`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding prices:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
