# CLAUDE.md - Instrukcja dla Claude Code

## Kim jestem

Jestem Bartosz - polski przedsiębiorca technologiczny prowadzący:
- **BiznesBezKlikania** - automatyzacja procesów biznesowych (n8n, Make)
- **OdpiszNaPismo.pl** - AI do generowania dokumentów prawnych (LegalTech)
- **AplikantAI** - asystenci AI dla kancelarii prawnych
- **SneakerPeeker** - e-commerce
- **G.A.C.A.** - Generative AI Crypto Agent (trading bot)
- **GACA PUMP** - moduł do tradingu na pump.fun (Solana)

Moja filozofia: **"system over process over human"** - systematyczna automatyzacja ponad manualne procesy.

---

## Zasady pracy (ZAWSZE STOSUJ)

### 1. PLAN MODE FIRST
Zanim napiszesz jakikolwiek kod:
- Przedstaw plan działania w punktach
- Poczekaj na moje zatwierdzenie lub feedback
- Dopiero po akceptacji planu przechodź do implementacji
- Dobry plan = 1-shot execution

### 2. WERYFIKACJA (NAJWAŻNIEJSZE)
**Zawsze dawaj sobie sposób na weryfikację swojej pracy:**
- Po napisaniu kodu - uruchom go i sprawdź czy działa
- Po edycji pliku - sprawdź czy syntax jest poprawny
- Po zmianach w workflow n8n - opisz jak przetestować
- Jeśli masz dostęp do terminala - testuj swój kod
- To podnosi jakość 2-3x

### 3. ITERUJ AŻ DZIAŁA
Nie kończ na "powinno działać". Testuj, iteruj, naprawiaj aż kod faktycznie działa.

### 4. KONTEKST SESJI
Na początku każdej sesji:
- Przypomnij mi gdzie skończyliśmy ostatnio (jeśli wiesz)
- Zapytaj o aktualny cel jeśli nie jest jasny
- Zaproponuj plan działania

---

## Mój stack technologiczny

### Automatyzacja
- **n8n** (self-hosted) - główne narzędzie workflow
- **Make.com** - dla prostszych integracji
- **Google Apps Script** - automatyzacje w ekosystemie Google

### Backend
- **Node.js / TypeScript** - preferowany
- **Python** - dla AI/ML i skryptów
- **PostgreSQL** - główna baza danych
- **Prisma ORM** - dla TypeScript
- **Supabase** - BaaS gdy potrzebny

### Frontend
- **React / Next.js** - aplikacje webowe
- **Tailwind CSS** - stylowanie

### AI/LLM
- **OpenRouter** - agregator modeli AI
- **Claude API** - główny model
- **OpenAI API** - embeddings, whisper

### Crypto (G.A.C.A.)
- **Solana** - blockchain
- **pump.fun** - memecoin trading
- **Jupiter** - DEX aggregator

---

## Standardy kodu

### TypeScript/JavaScript
```typescript
// Preferuję:
- async/await nad callbacks
- const nad let
- named exports
- explicit types (nie any)
- error handling z try/catch
- descriptive variable names (polski lub angielski OK)
```

### Python
```python
# Preferuję:
- type hints
- dataclasses lub Pydantic
- async gdzie sensowne
- f-strings
- pathlib nad os.path
```

### n8n Workflows
- Nazywaj node'y opisowo (nie "HTTP Request", tylko "Pobierz dane klienta")
- Używaj sticky notes do dokumentacji
- Error handling na każdym krytycznym node
- Testuj z sample data przed produkcją

---

## Częste błędy do unikania

### NIE RÓB
- Nie używaj `any` w TypeScript bez uzasadnienia
- Nie hardcoduj credentials - używaj env variables
- Nie ignoruj error handling
- Nie zostawiaj console.log w produkcyjnym kodzie
- Nie twórz wielkich monolitycznych funkcji

### RÓB
- Dziel kod na małe, testowalane funkcje
- Dokumentuj skomplikowaną logikę
- Waliduj input data
- Loguj błędy z kontekstem
- Używaj meaningful commit messages

---

## Workflow dla typowych tasków

### Nowy feature
1. Plan Mode -> przedstaw architekturę
2. Zacznij od data model / types
3. Implementuj core logic
4. Dodaj error handling
5. Napisz testy (jeśli to ma sens)
6. Zweryfikuj że działa

### Bug fix
1. Najpierw zrozum problem - zapytaj o logi/błąd
2. Zlokalizuj źródło problemu
3. Zaproponuj fix z wyjaśnieniem
4. Zaimplementuj
5. Zweryfikuj że bug zniknął
6. Sprawdź czy nie zepsuło czegoś innego

### Code review
1. Przeczytaj kod ze zrozumieniem
2. Sprawdź: czy robi to co ma robić?
3. Sprawdź: error handling, edge cases
4. Sprawdź: czytelność i maintainability
5. Zaproponuj konkretne ulepszenia

---

## Slash commands (jeśli dostępne)

Używaj tych komend gdy masz do nich dostęp:
- `/commit-push-pr` - po skończeniu feature'a
- `/test` - uruchom testy
- `/lint` - sprawdź formatowanie
- `/build` - zbuduj projekt

---

## Subagenty (jeśli dostępne)

Dla skomplikowanych tasków rozważ:
- **code-simplifier** - po skończeniu kodu, uprość go
- **verify-app** - szczegółowe testy end-to-end
- **code-review** - niech inny agent zrobi review

Tip od Borisa: "Niech subagenty walczą ze sobą" - odpal kilka i porównaj wyniki.

---

## Komunikacja

### Język
- Polski lub angielski - oba OK
- Kod i komentarze w kodzie - angielski
- Komunikacja ze mną - polski preferowany

### Format odpowiedzi
- Bądź konkretny i zwięzły
- Kod > opis (pokaż, nie mów)
- Jeśli nie wiesz - powiedz, nie zgaduj
- Proponuj alternatywy gdy to sensowne

### Gdy utkniesz
- Powiedz co próbowałeś
- Powiedz co nie działa
- Zaproponuj następne kroki lub zapytaj o kierunek

---

## Aktualizacje tego dokumentu

Gdy zobaczysz, że robię coś często lub poprawiam Cię w ten sam sposób wielokrotnie - zaproponuj dodanie tego do CLAUDE.md.

---

*Ostatnia aktualizacja: Styczeń 2026*
*Inspiracja: Workflow Borisa Cherny'ego, twórcy Claude Code*
