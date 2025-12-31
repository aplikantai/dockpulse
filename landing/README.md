# DockPulse Landing Page

> Modern iOS-style landing page z integracją rejestracji nowych tenantów

---

## 🎨 Funkcje

- **Modern Design**: Glassmorphism w stylu iOS/Apple
- **Responsywne**: Pełna responsywność mobile-first
- **Rejestracja Tenantów**: Wieloetapowy formularz rejestracji
- **Wybór Szablonu**: 3 szablony branżowe (Usługi, Produkcja, Handel)
- **Live Preview**: Podgląd konfiguracji przed utworzeniem konta
- **Auto-Redirect**: Automatyczne przekierowanie do panelu po rejestracji

---

## 🚀 Quick Start

### Development

```bash
# Install dependencies
npm install

# Run dev server (port 3001)
npm run dev

# Open http://localhost:3001
```

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

Build wyjściowy: `dist/`

---

## 🔗 Integracja z API

Landing page komunikuje się z backendem przez:

```
POST /api/platform/tenants/register
```

**Request:** companyName, slug, template, websiteUrl, adminName, adminEmail, adminPhone

**Response:** success, slug, tenantId, loginUrl

---

## 📁 Struktura

```
landing/
├── components/
│   ├── Header.tsx           # Navigation
│   ├── Hero.tsx             # Hero z CTA
│   ├── Features.tsx         # Funkcje
│   ├── Pricing.tsx          # Cennik
│   ├── FAQ.tsx              # FAQ
│   ├── AppDemo.tsx          # Demo
│   ├── Logo.tsx             # Logo
│   └── Registration.tsx     # Rejestracja ⭐
├── App.tsx
├── types.ts
├── constants.tsx
└── index.html
```

---

**Więcej**: Zobacz `docs/DEPLOYMENT-FULL.md` dla pełnej instrukcji.
