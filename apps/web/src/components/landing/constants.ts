export interface PricingPlan {
  name: string;
  price: string;
  description: string;
  features: string[];
  recommended?: boolean;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    name: "Starter",
    price: "499 PLN",
    description: "Idealny start dla malych firm handlowych.",
    features: ["Baza 1,000 Klientow", "Katalog 500 Produktow", "Zarzadzanie Ofertami", "Do 5 Uzytkownikow", "Auto-Branding"],
  },
  {
    name: "Pro",
    price: "1299 PLN",
    description: "Pelna automatyzacja sprzedazy i magazynu.",
    features: ["Wszystko w Starter", "Modul Zamowien AI", "Zaawansowane WMS", "Do 25 Uzytkownikow", "Inteligentny Asystent", "Eksporty PDF/CSV"],
    recommended: true
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "Nielimitowane mozliwosci dla Twojego przemyslu.",
    features: ["Nielimitowani Uzytkownicy", "Modul Produkcji ERP", "Izolowana Instancja DB", "Gwarancja SLA 99.9%", "Opiekun Konta 24/7", "API & Webhooks"],
  }
];

export const FAQ_ITEMS: FAQItem[] = [
  {
    question: "Czy moje dane sa naprawde odizolowane?",
    answer: "Tak. W przeciwienstwie do tradycyjnych systemow SaaS, DockPulse przydziela kazdemu klientowi (tenantowi) osobna baze danych. Twoje dane nigdy nie mieszaja sie z danymi innych firm."
  },
  {
    question: "Jak dlugo trwa wdrozenie systemu?",
    answer: "Dzieki podejsciu No-Code i Auto-Brandingowi, podstawowa konfiguracja trwa okolo 15 minut. System sam pobierze Twoje barwy i logo, a Ty po prostu wlaczasz potrzebne moduly."
  },
  {
    question: "Czy moge dodawac wlasne pola do modulow?",
    answer: "Oczywiscie! Kazdy modul posiada edytor schematow, ktory pozwala dodawac wlasne pola tekstowe, numeryczne czy daty bez koniecznosci angazowania programisty."
  },
  {
    question: "Co jesli moja firma potrzebuje specyficznego workflow?",
    answer: "Nasz silnik triggerow (On/Off) pozwala na automatyzacje procesow. Mozesz np. ustawic automatyczne generowanie zamowienia po akceptacji wyceny przez klienta w portalu."
  }
];

export const FEATURE_CARDS = [
  {
    title: "Izolowane bazy danych",
    desc: "Kazdy klient posiada dedykowana baze PostgreSQL. Bezpieczenstwo klasy korporacyjnej dla malych i srednich firm.",
    icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
  },
  {
    title: "No-Code Config",
    desc: "Wlaczaj i wylaczaj moduly jak przelaczniki w iPhone. Bez wdrazania kodu, bez przestojow, czysta wydajnosc.",
    icon: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
  },
  {
    title: "Auto-Branding AI",
    desc: "System automatycznie pobiera Twoje logo i kolory z Twojej strony internetowej. System staje sie czescia Twojej marki.",
    icon: "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
  },
  {
    title: "Asystent Konfiguracji",
    desc: "Wbudowana logika AI analizuje Twoja branze i sugeruje optymalne workflow oraz pola danych.",
    icon: "M13 10V3L4 14h7v7l9-11h-7z"
  },
  {
    title: "Event Bus (Real-time)",
    desc: "Dzieki PostgreSQL LISTEN/NOTIFY dane synchronizuja sie na wszystkich urzadzeniach w czasie rzeczywistym.",
    icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
  },
  {
    title: "Design iOS Glass",
    desc: "Przepiekny interfejs z glebokim rozmyciem i precyzyjna typografia sprawia, ze praca staje sie przyjemnoscia.",
    icon: "M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5z"
  }
];
