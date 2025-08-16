# Plan Testów - AI Flashcards

## Analiza Projektu

### Kluczowe komponenty projektu

1. **System uwierzytelniania** - Supabase Auth z JWT tokens
2. **Generowanie flashcards AI** - OpenRouter.ai + GPT-4o-Mini
3. **Zarządzanie talią kart** - CRUD operacje na deckach i flashcards
4. **Monitorowanie budżetu** - Tracking kosztów AI z limitami
5. **SRS (Spaced Repetition System)** - System powtarzania z boxes
6. **Dashboard użytkownika** - KPI, statystyki, ostatnie aktywności

### Stos technologiczny i implikacje testowe

- **Astro 5 + React 19**: Testy komponentów hybrydowych (SSR + Client)
- **TypeScript 5**: Mocne typowanie wymaga testów walidacji
- **Supabase + PostgreSQL**: Testy integracyjne z bazą danych
- **Tailwind CSS + shadcn/ui**: Testy wizualne i dostępności
- **Vitest**: Framework testowy dla środowiska Vite/Astro
- **Playwright**: E2E testy dla pełnych przepływów użytkownika

### Priorytety testowe

1. **Krytyczne**: Uwierzytelnianie, generowanie AI, płatności
2. **Wysokie**: CRUD flashcards, zarządzanie talią, SRS
3. **Średnie**: Dashboard, statystyki, UI komponenty
4. **Niskie**: Stylowanie, animacje, optymalizacje

### Obszary ryzyka

1. **Bezpieczeństwo**: JWT validation, RLS policies, input sanitization
2. **Finansowe**: Budget monitoring, API rate limiting, cost tracking
3. **Performance**: AI response times, database queries, large datasets
4. **Integracyjne**: Supabase connectivity, OpenRouter API reliability

---

## Plan Testów

### 1. Wprowadzenie i cele testowania

**Cel główny**: Zapewnienie stabilności, bezpieczeństwa i funkcjonalności aplikacji AI Flashcards przed wdrożeniem produkcyjnym.

**Cele szczegółowe**:

- Weryfikacja poprawności systemu uwierzytelniania
- Walidacja procesu generowania flashcards przez AI
- Testowanie operacji CRUD na flashcards i deckach
- Sprawdzenie mechanizmów monitorowania budżetu
- Weryfikacja systemu powtarzania (SRS)
- Testowanie responsywności i dostępności UI

### 2. Zakres testów

**W zakresie**:

- Komponenty React i strony Astro
- API endpoints (/api/\*)
- Serwisy biznesowe (AuthService, FlashcardsService)
- Hooki React (useBudgetMonitoring, useDashboard)
- Walidacja Zod schemas
- Integracja z Supabase
- Przepływy użytkownika E2E

**Poza zakresem**:

- Testowanie infrastruktury Supabase
- Testowanie API OpenRouter.ai
- Testowanie bibliotek zewnętrznych
- Performance testing na dużą skalę

### 3. Typy testów do przeprowadzenia

#### 3.1 Testy jednostkowe (Unit Tests)

- **Framework**: Vitest
- **Pokrycie**: Services, hooks, utility functions, validators
- **Cel**: Izolowane testowanie logiki biznesowej

#### 3.2 Testy integracyjne (Integration Tests)

- **Framework**: Vitest + Supabase Test Database
- **Pokrycie**: API endpoints, database operations, external services
- **Cel**: Testowanie współpracy między komponentami

#### 3.3 Testy komponentów (Component Tests)

- **Framework**: Vitest + React Testing Library
- **Pokrycie**: React components, user interactions, state management
- **Cel**: Testowanie UI logic i interakcji użytkownika

#### 3.4 Testy E2E (End-to-End Tests)

- **Framework**: Playwright
- **Pokrycie**: Pełne przepływy użytkownika
- **Cel**: Testowanie aplikacji z perspektywy użytkownika

### 4. Scenariusze testowe dla kluczowych funkcjonalności

#### 4.1 System uwierzytelniania

- **UT001**: Walidacja danych logowania (AuthService.login)
- **UT002**: Obsługa błędów uwierzytelniania
- **UT003**: Weryfikacja JWT token generation/validation
- **IT001**: Integracja z Supabase Auth
- **E2E001**: Pełny przepływ rejestracji i logowania

#### 4.2 Generowanie flashcards AI

- **UT004**: Walidacja request schema (generateFlashcardsRequestSchema)
- **UT005**: Budget checking logic
- **UT006**: AI response parsing i error handling
- **IT002**: Integracja z OpenRouter API (mock)
- **E2E002**: Proces generowania od input do saved flashcards

#### 4.3 Zarządzanie flashcards

- **UT007**: CRUD operations w FlashcardsService
- **UT008**: Deck ownership verification
- **UT009**: SRS box progression logic
- **IT003**: Database transactions i RLS policies
- **E2E003**: Zarządzanie talią od utworzenia do usunięcia

#### 4.4 Monitorowanie budżetu

- **UT010**: Kalkulacje kosztów w useBudgetMonitoring
- **UT011**: Alert thresholds (80% limitu)
- **UT012**: Cost tracking per generation
- **IT004**: Budget events recording
- **CT001**: BudgetInfo component rendering

### 5. Środowisko testowe

#### 5.1 Środowisko lokalne

- **Node.js**: 18+
- **Vitest**: Konfiguracja w `vitest.config.ts`
- **Test Database**: Supabase local instance
- **Browser**: Chromium dla Playwright

#### 5.2 Środowisko CI/CD

- **GitHub Actions**: Automated test runs
- **Containers**: Docker dla consistency
- **Database**: Ephemeral Supabase instances
- **Browsers**: Headless Chromium, Firefox, Safari

#### 5.3 Test Data Management

- **Fixtures**: JSON files z sample data
- **Factories**: Programmatic test data generation
- **Cleanup**: Database reset między testami
- **Mocks**: External API responses

### 6. Narzędzia do testowania

#### 6.1 Unit & Integration Testing

- **Vitest**: Main test runner
- **@vitest/ui**: Visual test interface
- **happy-dom**: DOM environment dla Vitest
- **MSW**: API mocking

#### 6.2 Component Testing

- **React Testing Library**: Component interactions
- **@testing-library/jest-dom**: Extended matchers
- **@testing-library/user-event**: User interactions simulation

#### 6.3 E2E Testing

- **Playwright**: Cross-browser testing
- **@playwright/test**: Test runner i assertions
- **Playwright Inspector**: Debugging tool

#### 6.4 Code Quality

- **c8/v8**: Coverage reporting
- **ESLint**: Code quality rules
- **TypeScript**: Type checking

### 7. Harmonogram testów

#### Faza 1: Setup i Infrastructure (1-2 dni)

- Konfiguracja Vitest i Playwright
- Setup test database i mocking
- Podstawowe utility functions

#### Faza 2: Unit Tests (3-4 dni)

- AuthService i auth.zod tests
- FlashcardsService core methods
- Budget monitoring hooks
- Utility functions i validators

#### Faza 3: Integration Tests (2-3 dni)

- API endpoints testing
- Database operations
- External service integrations

#### Faza 4: Component Tests (2 dni)

- Key React components
- Form validation i interactions
- State management

#### Faza 5: E2E Tests (2-3 dni)

- Critical user journeys
- Cross-browser compatibility
- Performance assertions

#### Faza 6: Optimization (1 dzień)

- Test performance tuning
- Coverage analysis i gaps
- CI/CD pipeline integration

### 8. Kryteria akceptacji testów

#### 8.1 Coverage Requirements

- **Unit Tests**: ≥ 80% line coverage
- **Integration Tests**: All API endpoints covered
- **E2E Tests**: All critical user paths covered

#### 8.2 Performance Criteria

- **Unit Tests**: < 5s execution time
- **Integration Tests**: < 30s execution time
- **E2E Tests**: < 2min full suite

#### 8.3 Quality Gates

- All tests must pass przed merge
- No critical security vulnerabilities
- No regression w kluczowych funkcjach
- TypeScript compilation bez błędów

### 9. Role i odpowiedzialności

#### 9.1 Test Engineer (Primary)

- Projektowanie i implementacja test cases
- Maintenance test suite
- Test automation i CI/CD integration
- Coverage analysis i reporting

#### 9.2 Frontend Developer

- Component tests review
- UI/UX test scenarios validation
- Accessibility requirements verification

#### 9.3 Backend Developer

- API tests review
- Database schema tests
- Performance tests validation

#### 9.4 DevOps Engineer

- CI/CD pipeline configuration
- Test environment provisioning
- Test data management

### 10. Procedury raportowania błędów

#### 10.1 Bug Classification

- **Critical**: Security, data loss, system crash
- **High**: Core functionality broken
- **Medium**: Feature partially working
- **Low**: UI/UX issues, performance degradation

#### 10.2 Bug Report Template

```
**Bug ID**: BUG-YYYY-MM-DD-XXX
**Severity**: Critical/High/Medium/Low
**Component**: Auth/Flashcards/Dashboard/AI
**Environment**: Local/CI/Production
**Steps to Reproduce**:
1.
2.
3.
**Expected Result**:
**Actual Result**:
**Screenshots/Logs**:
**Additional Info**:
```

#### 10.3 Bug Lifecycle

1. **Detection** - Automated test failure lub manual testing
2. **Reporting** - GitHub Issue z template
3. **Triage** - Severity assignment i owner
4. **Fix** - Developer implementation
5. **Verification** - Test case update i re-test
6. **Closure** - Bug resolution i documentation

#### 10.4 Regression Testing

- Automated regression suite po każdym deploy
- Manual regression dla critical bugs
- Performance regression monitoring
- Security regression scanning

---

## Podsumowanie

Ten plan testów zapewnia kompleksowe pokrycie aplikacji AI Flashcards, z naciskiem na kluczowe obszary ryzyka: bezpieczeństwo, operacje finansowe i stabilność AI integration. Kombinacja unit, integration, component i E2E testów gwarantuje wysoką jakość kodu i niezawodność systemu.

Plan jest skalowany do wieloetapowej implementacji, pozwalając na stopniowe budowanie test coverage przy zachowaniu ciągłej delivery capability.
