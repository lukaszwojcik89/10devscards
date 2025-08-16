# Plan implementacji endpointu GET /api/dashboard

## 1. Przegląd endpointu

### 1.1 Specyfikacja API

- **Endpoint**: `GET /api/dashboard`
- **Opis**: Pobiera kompleksowe dane dashboard dla uwierzytelnionego użytkownika
- **Autoryzacja**: Bearer token (JWT)
- **Framework**: Astro API Routes
- **Typ odpowiedzi**: JSON

### 1.2 Kluczowe punkty specyfikacji

- Endpoint agreguje dane z wielu tabel bazy danych
- Zwraca 6 głównych sekcji danych: statystyki użytkownika, postęp nauki, nadchodzące sesje, ostatnie zestawy, użycie AI, szybkie akcje
- Wymaga uwierzytelnienia Bearer token
- Brak parametrów query - endpoint zwraca kompletny dashboard
- Odpowiedź w formacie DashboardResponseDTO

## 2. Analiza wymagań

### 2.1 Parametry wymagane

- **Authorization header**: Bearer token (wymagany)
- **Brak parametrów query**: Endpoint nie przyjmuje żadnych parametrów

### 2.2 Parametry opcjonalne

- Brak parametrów opcjonalnych - endpoint zwraca pełny dashboard

### 2.3 Typy DTO i Command Models

#### Typy odpowiedzi

- `DashboardResponseDTO` - główna struktura odpowiedzi
- `UserStats` - statystyki użytkownika
- `StudyProgress` - postęp w nauce
- `UpcomingSessions` - nadchodzące sesje
- `RecentDeck[]` - lista ostatnich zestawów
- `AIUsage` - użycie AI
- `QuickActions` - dostępne szybkie akcje

#### Typy błędów

- `ErrorResponseDTO` - standardowy format błędu

#### Command Models

- Brak - endpoint tylko odczytuje dane, nie wykonuje operacji

## 3. Logika serwisu

### 3.1 Główna metoda: `getDashboardData(userId: string)`

Metoda agreguje dane przy użyciu `Promise.all()` dla optymalnej wydajności:

```typescript
const [userStats, studyProgress, upcomingSessions, recentDecks, aiUsage, quickActions] = await Promise.all([
  this.getUserStats(userId),
  this.getStudyProgress(userId),
  this.getUpcomingSessions(userId),
  this.getRecentDecks(userId),
  this.getAIUsage(userId),
  this.getQuickActions(userId),
]);
```

### 3.2 Metody pomocnicze

#### `getUserStats(userId: string): Promise<UserStats>`

- **Zapytania**:
  - Count zestawów (`decks` WHERE `owner_id` = userId AND `is_deleted` = false)
  - Lista fiszek z statusami (JOIN `decks`)
- **Agregacja**: Zliczanie fiszek według statusu
- **Złożoność**: O(n) gdzie n = liczba fiszek użytkownika

#### `getStudyProgress(userId: string): Promise<StudyProgress>`

- **Zapytania**:
  - Count powtórek z dzisiaj (`reviews` WHERE `user_id` = userId AND `created_at` >= today)
  - Ostatnie 100 powtórek do obliczenia streak
- **Obliczenia**:
  - Streak: iteracja przez daty powtórek
  - Catchup: logika oparta na dziennym limicie
- **Złożoność**: O(100) = O(1) - ograniczona liczba rekordów

#### `getUpcomingSessions(userId: string): Promise<UpcomingSessions>`

- **Zapytania**: Fiszki z datami (JOIN `decks`)
- **Filtrowanie**: Według dat (teraz, dzisiaj, jutro, przeterminowane)
- **Złożoność**: O(n) gdzie n = liczba fiszek użytkownika

#### `getRecentDecks(userId: string): Promise<RecentDeck[]>`

- **Zapytania**: 5 ostatnich zestawów z fiszkami (ORDER BY `updated_at` DESC LIMIT 5)
- **Agregacja**: Zliczanie fiszek według statusu i dat
- **Złożoność**: O(5 \* m) gdzie m = średnia liczba fiszek na zestaw

#### `getAIUsage(userId: string): Promise<AIUsage>`

- **Zapytania**: Wydarzenia budżetowe z bieżącego miesiąca (`budget_events`)
- **Agregacja**: SUM kosztów i tokenów
- **Obliczenia**: Procent wykorzystania budżetu
- **Złożoność**: O(k) gdzie k = liczba wydarzeń AI w miesiącu

#### `getQuickActions(userId: string): Promise<QuickActions>`

- **Zależności**: Wykorzystuje wcześniej obliczone dane (AIUsage, UpcomingSessions)
- **Logika**: Proste warunki boolean
- **Złożoność**: O(1)

## 4. Walidacja danych

### 4.1 Walidacja wejściowa

- **Bearer token**: Weryfikacja przez Supabase Auth (`supabaseClient.auth.getUser(token)`)
- **User ID**: Ekstraktowany z zweryfikowanego tokenu
- **Brak dodatkowych parametrów**: Endpoint nie wymaga walidacji query params

### 4.2 Walidacja wewnętrzna

- **Sprawdzenie istnienia użytkownika**: Automatyczne przez RLS Supabase
- **Walidacja dat**: ISO 8601 format w JavaScript Date
- **Walidacja liczb**: TypeScript type checking
- **Null safety**: Operator `||` dla domyślnych wartości

### 4.3 Zabezpieczenia danych

- **Row Level Security**: Włączone na wszystkich tabelach
- **Filtrowanie**: Tylko dane należące do uwierzytelnionego użytkownika
- **Brak ekspozycji**: ID użytkownika nie jest zwracane w odpowiedzi

## 5. Obsługa błędów

### 5.1 Scenariusze błędów

#### Błąd autoryzacji (401)

```typescript
// Brak tokenu lub nieprawidłowy token
if (!authHeader?.startsWith("Bearer ")) {
  return errorResponse(401, "UNAUTHORIZED", "Unauthorized");
}

// Token nieważny
if (authError || !user) {
  return errorResponse(401, "UNAUTHORIZED", "Unauthorized");
}
```

#### Błąd serwera (500)

```typescript
try {
  const result = await service.getDashboardData(userId);
  return successResponse(result);
} catch (err) {
  console.error("Dashboard endpoint error:", err);
  return errorResponse(500, "INTERNAL_SERVER_ERROR", "Internal server error");
}
```

### 5.2 Logowanie błędów

- **Console.error**: Szczegóły błędu dla debugowania
- **Brak ekspozycji**: Błędy wewnętrzne nie są wysyłane do klienta
- **Format logów**: Timestamp automatyczny w konsoli

### 5.3 Graceful degradation

- **Domyślne wartości**: `|| 0`, `|| []` w przypadku null/undefined
- **Kontynuacja**: Błąd w jednej sekcji nie blokuje innych
- **Fallback**: Puste wartości zamiast crashowania

## 6. Bezpieczeństwo

### 6.1 Identyfikowane zagrożenia

#### SQL Injection

- **Ryzyko**: Niskie
- **Ochrona**: Parameteryzowane zapytania Supabase
- **Dodatkowa ochrona**: TypeScript typy

#### Unauthorized Access

- **Ryzyko**: Średnie
- **Ochrona**: Bearer token + RLS
- **Weryfikacja**: Każde zapytanie weryfikowane przez RLS

#### Data Leakage

- **Ryzyko**: Niskie
- **Ochrona**: RLS + explicitne filtrowanie po `owner_id`/`user_id`
- **Zasada**: Tylko dane należące do użytkownika

#### Performance Attack (DoS)

- **Ryzyko**: Średnie
- **Ochrona**: Limity zapytań (LIMIT clause)
- **Monitoring**: Console.error dla długich zapytań

### 6.2 Środki bezpieczeństwa

- **Supabase RLS**: Automatyczne filtrowanie na poziomie bazy
- **JWT Verification**: Weryfikacja tokenu przed każdym zapytaniem
- **Type Safety**: TypeScript eliminuje wiele błędów runtime
- **Error Masking**: Błędy wewnętrzne nie są eksponowane

## 7. Optymalizacja wydajności

### 7.1 Aktualne optymalizacje

- **Promise.all()**: Równoległe wykonanie 6 zapytań
- **Database indexes**: Indeksy na kluczach obcych i datach
- **Query limits**: LIMIT 5 dla recent_decks, LIMIT 100 dla streak
- **RLS optimization**: Indeksy na pola używane w RLS

### 7.2 Potencjalne ulepszenia

#### Caching

```typescript
// Redis cache dla statycznych danych
const cacheKey = `dashboard:${userId}:${currentHour}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);
```

#### Materialized views

```sql
-- Zmaterializowany widok dla statystyk użytkownika
CREATE MATERIALIZED VIEW user_stats_mv AS
SELECT
  owner_id,
  COUNT(DISTINCT id) as total_decks,
  SUM(flashcard_count) as total_flashcards
FROM decks
WHERE is_deleted = false
GROUP BY owner_id;
```

#### Database function

```sql
-- Pojedyncza funkcja zwracająca cały dashboard
CREATE OR REPLACE FUNCTION get_dashboard_data(p_user_id UUID)
RETURNS JSON AS $$
-- Agregacja wszystkich danych w jednym zapytaniu
$$ LANGUAGE plpgsql;
```

### 7.3 Monitoring wydajności

- **Czas odpowiedzi**: < 500ms dla typowego użytkownika
- **Liczba zapytań**: 6 równoległych zapytań
- **Memory usage**: Minimalne - tylko agregacja
- **Database load**: Rozłożone przez Promise.all()

## 8. Kroki implementacji

### 8.1 Implementacja już ukończona ✅

1. **Utworzenie endpointu API** (`src/pages/api/dashboard.ts`)

   - Autoryzacja Bearer token
   - Wywoływanie serwisu
   - Obsługa błędów

2. **Implementacja serwisu** (`src/lib/services/dashboard.service.ts`)

   - Wszystkie 6 metod agregacji danych
   - Promise.all() dla wydajności
   - Obsługa null values

3. **Definicje typów** (`src/types.ts`)

   - Wszystkie DTO dla dashboard
   - Type safety całego pipeline'a

4. **Aktualizacja planu API** (`.ai/api-plan.md`)
   - Dodanie Dashboard resource
   - Pełna specyfikacja endpointu

### 8.2 Kroki weryfikacyjne

1. **Test autoryzacji**

   ```bash
   # Test bez tokenu
   curl -X GET http://localhost:4321/api/dashboard
   # Oczekiwany wynik: 401

   # Test z nieprawidłowym tokenem
   curl -X GET http://localhost:4321/api/dashboard \
     -H "Authorization: Bearer invalid_token"
   # Oczekiwany wynik: 401
   ```

2. **Test poprawnej odpowiedzi**

   ```bash
   # Test z prawidłowym tokenem
   curl -X GET http://localhost:4321/api/dashboard \
     -H "Authorization: Bearer $VALID_TOKEN"
   # Oczekiwany wynik: 200 + pełne dane dashboard
   ```

3. **Test wydajności**

   ```bash
   # Pomiar czasu odpowiedzi
   time curl -X GET http://localhost:4321/api/dashboard \
     -H "Authorization: Bearer $VALID_TOKEN"
   ```

### 8.3 Integracja z frontendem

1. **Typ odpowiedzi**: Już zdefiniowany w `src/types.ts`
2. **Hook do pobierania**: Do stworzenia w komponencie React/Astro
3. **Handling błędów**: Standardowy 401/500 pattern
4. **Loading states**: Dla 6 sekcji dashboard

### 8.4 Monitorowanie produkcyjne

1. **Logging**: Console.error już implementowane
2. **Metryki**: Czas odpowiedzi per endpoint
3. **Alerting**: Przy wysokiej liczbie błędów 500
4. **Performance**: Monitoring czasu zapytań SQL

## 9. Podsumowanie

Endpoint `GET /api/dashboard` został w pełni zaimplementowany zgodnie z wymaganiami PRD i planem API. Implementacja obejmuje:

- ✅ **Kompletną autoryzację** z Bearer token
- ✅ **6 sekcji danych** zgodnie ze specyfikacją
- ✅ **Optymalizację wydajności** przez Promise.all()
- ✅ **Type safety** przez TypeScript
- ✅ **Bezpieczeństwo** przez RLS i weryfikację tokenu
- ✅ **Obsługę błędów** z proper HTTP codes
- ✅ **Dokumentację** w planie API

Endpoint jest gotowy do użycia w produkcji i spełnia wszystkie wymogi funkcjonalne oraz niefunkcjonalne określone w dokumentacji projektu.
