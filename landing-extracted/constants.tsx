
import { PricingPlan, FAQItem, ModuleState } from './types.ts';

export const PRICING_PLANS: PricingPlan[] = [
  {
    name: "Starter",
    price: "499 PLN",
    description: "Idealny start dla małych firm handlowych.",
    features: ["Baza 1,000 Klientów", "Katalog 500 Produktów", "Zarządzanie Ofertami", "Do 5 Użytkowników", "Auto-Branding"],
  },
  {
    name: "Pro",
    price: "1299 PLN",
    description: "Pełna automatyzacja sprzedaży i magazynu.",
    features: ["Wszystko w Starter", "Moduł Zamówień AI", "Zaawansowane WMS", "Do 25 Użytkowników", "Inteligentny Asystent", "Eksporty PDF/CSV"],
    recommended: true
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "Nielimitowane możliwości dla Twojego przemysłu.",
    features: ["Nielimitowani Użytkownicy", "Moduł Produkcji ERP", "Izolowana Instancja DB", "Gwarancja SLA 99.9%", "Opiekun Konta 24/7", "API & Webhooks"],
  }
];

export const FAQ_ITEMS: FAQItem[] = [
  {
    question: "Czy moje dane są naprawdę odizolowane?",
    answer: "Tak. W przeciwieństwie do tradycyjnych systemów SaaS, DockPulse przydziela każdemu klientowi (tenantowi) osobną bazę danych. Twoje dane nigdy nie mieszają się z danymi innych firm."
  },
  {
    question: "Jak długo trwa wdrożenie systemu?",
    answer: "Dzięki podejściu No-Code i Auto-Brandingowi, podstawowa konfiguracja trwa około 15 minut. System sam pobierze Twoje barwy i logo, a Ty po prostu włączasz potrzebne moduły."
  },
  {
    question: "Czy mogę dodawać własne pola do modułów?",
    answer: "Oczywiście! Każdy moduł posiada edytor schematów, który pozwala dodawać własne pola tekstowe, numeryczne czy daty bez konieczności angażowania programisty."
  },
  {
    question: "Co jeśli moja firma potrzebuje specyficznego workflow?",
    answer: "Nasz silnik triggerów (On/Off) pozwala na automatyzację procesów. Możesz np. ustawić automatyczne generowanie zamówienia po akceptacji wyceny przez klienta w portalu."
  }
];

export const INITIAL_MODULES: ModuleState[] = [
  { id: 'customers', name: 'Baza Klientów', active: true, icon: 'Users', description: 'Inteligentne zarządzanie CRM i tagowanie klientów' },
  { id: 'products', name: 'Katalog SKU', active: true, icon: 'Package', description: 'Centrum zarządzania produktami, EAN i cenami' },
  { id: 'orders', name: 'Obsługa Zamówień', active: false, icon: 'ShoppingCart', description: 'Zautomatyzowany obieg zamówień sprzedaży' },
  { id: 'warehouse', name: 'Magazyn WMS', active: false, icon: 'Database', description: 'Real-time stany magazynowe i lokalizacje' },
  { id: 'quotes', name: 'Wyceny & Oferty', active: true, icon: 'FileText', description: 'Błyskawiczne generowanie profesjonalnych ofert' },
  { id: 'ai', name: 'AI Configuration', active: false, icon: 'Sparkles', description: 'Automatyczna pomoc w ustawieniach systemu' }
];
