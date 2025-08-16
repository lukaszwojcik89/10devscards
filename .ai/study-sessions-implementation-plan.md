# API Endpoint Implementation Plan: GET /api/study/session (Study Sessions)

## 1. Przegląd punktu końcowego

Endpoint służy do pobierania fiszek przeznaczonych do powtórki w bieżącej sesji nauki. Jest to kluczowa funkcjonalność aplikacji AI Flashcards, która implementuje system Spaced Repetition (SRS) oparty na metodzie Leitner. Endpoint analizuje harmonogram powtórek użytkownika, uwzględnia dzienne limity oraz opcjonalnie włącza fiszki zaległe (catch-up). Zwraca uporządkowaną listę fiszek gotowych do nauki wraz z metadanymi sesji.

## 2. Szczegóły żądania

- **Metoda HTTP**: GET
- **Struktura URL**: `/api/study/session`
- **Parametry**:
  - **Opcjonalne** (query params):
    - `include_catchup` (boolean, domyślnie false, czy włączyć zaległe fiszki)
    - `deck_slug` (string, opcjonalne ograniczenie do konkretnej talii)
    - `limit` (number, 1-50, domyślnie 20, max fiszek w sesji)

## 3. Wykorzystywane typy

### Response DTOs

- `StudySessionResponseDTO` (główna odpowiedź)
- `StudyFlashcardData` (uproszczone dane fiszki dla sesji)
- `StudySessionMetadata` (metadane sesji i limitów)
- `ErrorResponseDTO` (błędy)

### Command Models

- `StartStudySessionCommand` (business logic layer)

### Validation Schemas (Zod)

- `studySessionQuerySchema` (walidacja query parameters)

## 4. Szczegóły odpowiedzi

### Sukces (200 OK)

```json
{
  "data": {
    "session_id": "uuid",
    "flashcards": [
      {
        "id": "uuid",
        "question": "What is a closure in JavaScript?",
        "deck_name": "JavaScript Basics",
        "box": "box1",
        "due_date": "2025-06-11T10:00:00Z"
      },
      {
        "id": "uuid",
        "question": "Explain the difference between let and var",
        "deck_name": "JavaScript Basics",
        "box": "box2",
        "due_date": "2025-06-09T10:00:00Z"
      }
    ],
    "metadata": {
      "total_due": 15,
      "session_limit": 50,
      "catchup_available": 5,
      "daily_reviews_completed": 23,
      "daily_limit": 50
    }
  }
}
```

### Kody błędów

- **401 Unauthorized**: Brak autoryzacji lub nieprawidłowy token
- **429 Too Many Requests**: Przekroczony dzienny limit powtórek (50 + 20 catch-up)
- **500 Internal Server Error**: Błąd serwera (database, system)

## 5. Przepływ danych

1. **Walidacja JWT token** - sprawdzenie autentykacji użytkownika
2. **Parsowanie query parameters** - walidacja include_catchup, deck_slug, limit
3. **Sprawdzenie dziennych limitów** - odczyt z tabeli reviews dla bieżącego dnia
4. **Kalkulacja dostępnych slotów** - 50 standardowych + 20 catch-up (jeśli enabled)
5. **Query fiszek do powtórki** - SELECT z warunkami due date, status accepted, RLS
6. **Sortowanie priorytetów** - overdue first, potem według due_date ASC
7. **Filtrowanie według limitu sesji** - ograniczenie do dostępnych slotów
8. **Generowanie session_id** - UUID dla trackingu sesji
9. **Przygotowanie metadanych** - obliczenie statystyk i limitów
10. **Zwrócenie odpowiedzi** - StudySessionResponseDTO

## 6. Względy bezpieczeństwa

### Autentykacja i autoryzacja

- **JWT Bearer token** - wymagany w nagłówku Authorization
- **Row Level Security** - automatyczne filtrowanie fiszek przez owner_id
- **User-specific data** - tylko fiszki należące do zalogowanego użytkownika

### Walidacja danych

- **Query parameters validation** - Zod schema dla wszystkich parametrów opcjonalnych
- **Input sanitization** - escape deck_slug dla bezpiecznego SQL query
- **Limit constraints** - max 50 fiszek per session, max 20 catch-up

### Rate limiting i limity biznesowe

- **Daily review limits** - 50 standardowych + 20 catch-up per day
- **Session size limits** - max 50 fiszek per request
- **Catch-up restrictions** - tylko raz dziennie, tylko dla overdue cards
- **API rate limiting** - 1000 requests/hour per user

### Security headers

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`

## 7. Obsługa błędów

### Błędy walidacji (400 Bad Request)

- Nieprawidłowy format deck_slug
- Limit poza dozwolonym zakresem (1-50)
- Include_catchup nie jest boolean
- Nieprawidłowe query parameters

### Błędy autoryzacji (401 Unauthorized)

- Brak nagłówka Authorization
- Nieprawidłowy format tokenu Bearer
- Token wygasły lub nieprawidłowy
- Błąd weryfikacji użytkownika w Supabase

### Błędy limitów (429 Too Many Requests)

- Przekroczony dzienny limit 50 standardowych reviews
- Próba użycia catch-up po wykorzystaniu dziennego limitu
- Catch-up już wykorzystany dzisiaj (tylko raz dziennie)

### Błędy zasobów (404 Not Found)

- Deck o podanym slug nie istnieje lub nie należy do użytkownika
- Brak fiszek spełniających kryteria sesji

### Błędy serwera (500 Internal Server Error)

- Błąd połączenia z bazą danych
- Błąd w kalkulacji due dates lub limitów
- Nieoczekiwane błędy w logice SRS
- Timeout operacji bazodanowych

### Format błędów

```json
{
  "error": {
    "code": "DAILY_LIMIT_EXCEEDED",
    "message": "Daily review limit of 50 cards has been reached",
    "details": {
      "daily_limit": 50,
      "completed_today": 50,
      "catchup_available": false,
      "reset_time": "2025-06-13T00:00:00Z"
    }
  }
}
```

## 8. Rozważania dotyczące wydajności

### Optymalizacje bazy danych

- **Composite index** - (owner_id, next_due_date, status) dla szybkich queries
- **Partial index** - tylko dla status='accepted' cards
- **Due date index** - optymalizacja sortowania według harmonogramu
- **Connection pooling** - efektywne zarządzanie połączeniami

### Optymalizacje queries

- **Efficient date filtering** - WHERE next_due_date <= NOW() dla due cards
- **Smart pagination** - LIMIT z OFFSET dla dużych datasets
- **Selective fields** - tylko potrzebne kolumny dla study view
- **COUNT optimization** - efficient counting dla metadanych

### Caching strategia

- **Session caching** - cache wygenerowanych sesji na 12h (TTL)
- **Daily limits caching** - cache dziennych statystyk na 1h
- **Deck metadata caching** - cache nazw talii dla performance
- **User statistics caching** - cache user progress metrics

### Business logic optimization

- **SRS calculation caching** - cache obliczonych due dates
- **Batch processing** - grupowanie operacji dla większych datasets
- **Lazy loading** - ładowanie szczegółów tylko dla aktywnych sesji
- **Smart scheduling** - optymalizacja algorytmu Leitner

### Monitoring i metryki

- **Response time tracking** - <200ms dla standardowych sesji
- **Session completion rates** - tracking skuteczności SRS
- **Daily limit utilization** - monitoring użycia limitów
- **Cache hit rates** - efektywność cache strategy

## 9. Etapy wdrożenia

### Faza 1: Przygotowanie infrastruktury (1 dzień)

1. **Utworzenie endpoint file** - `/api/study/session.ts`
2. **Rozszerzenie lub utworzenie StudyService** - logika sesji SRS
   - `generateStudySession()`
   - `calculateDailyLimits()`
   - `getOverdueFlashcards()`
   - `getDueFlashcards()`
3. **Zod schema implementacja** - `studySessionQuerySchema`
4. **Typy implementacja** - sprawdzenie StudySessionResponseDTO w types.ts

### Faza 2: Implementacja logiki SRS (2 dni)

1. **Daily limits calculation**

   - Query reviews tabeli dla current day
   - Obliczenie completed reviews vs limits
   - Implementacja catch-up logic
   - Validation dziennych ograniczeń

2. **Due flashcards query**

   - Complex query z JOIN na decks table
   - Filtering według due dates i statusów
   - Deck ownership verification przez RLS
   - Optional deck_slug filtering

3. **Session generation logic**
   - Sortowanie według priorytetu (overdue first)
   - Limit enforcement dla session size
   - Session ID generation
   - Metadata preparation

### Faza 3: Business rules implementation (1 dzień)

1. **Leitner system integration**

   - Due date calculation based on box levels
   - Progress tracking przez review history
   - Box advancement logic verification
   - SRS algorithm fine-tuning

2. **Catch-up functionality**

   - Overdue cards identification
   - Once-per-day catch-up enforcement
   - Separate limits tracking
   - Smart prioritization

3. **Deck filtering logic**
   - Optional deck_slug handling
   - Performance optimization dla single deck
   - Cross-deck session balancing

### Faza 4: Error handling i validation (1 dzień)

1. **Input validation**

   - Query parameters Zod validation
   - Business rules validation
   - Edge cases handling
   - Error message standardization

2. **Authorization i security**

   - JWT token validation
   - RLS policy verification
   - Rate limiting implementation
   - Security headers setup

3. **Error scenarios testing**
   - Daily limits exceeded scenarios
   - No due cards available
   - Invalid deck_slug handling
   - Network i database errors

### Faza 5: Performance optimization (1 dzień)

1. **Database optimization**

   - Index optimization dla SRS queries
   - Query performance analysis
   - Connection pooling verification
   - Slow query identification

2. **Caching implementation**

   - Session result caching
   - Daily statistics caching
   - Cache invalidation strategy
   - Memory usage optimization

3. **Response optimization**
   - JSON response compression
   - Field selection optimization
   - Payload size minimization

### Faza 6: Testing i integration (1 dzień)

1. **Unit testing**

   - StudyService methods testing
   - Business logic validation
   - Edge cases coverage
   - Mock data scenarios

2. **Integration testing**

   - API endpoint testing
   - Database integration verification
   - Authentication flow testing
   - Error handling validation

3. **Performance testing**
   - Load testing dla concurrent sessions
   - Response time measurement
   - Memory leak detection
   - Cache performance validation

### Faza 7: Monitoring i deployment (0.5 dnia)

1. **Monitoring setup**

   - Session metrics collection
   - Daily limits monitoring
   - Performance metrics tracking
   - Error rate monitoring

2. **Production deployment**
   - Staging environment testing
   - Production deployment
   - Health checks implementation
   - Post-deployment verification

**Całkowity czas implementacji: 7.5 dnia**

### Dependencies i Prerequisites

- ✅ Istniejąca struktura bazy danych (flashcards, reviews tables)
- ✅ Supabase client i authentication setup
- ✅ Podstawowe typy w types.ts (StudySessionResponseDTO)
- ⏳ StudyService creation lub extension
- ⏳ SRS algorithm implementation
- ⏳ Caching infrastructure setup
- ⏳ Monitoring i alerting configuration

### Integration z innymi endpointami

- **POST /api/reviews** - submission po zakończeniu sesji
- **GET /api/flashcards/{id}** - szczegóły fiszek podczas nauki
- **PATCH /api/flashcards/{id}/status** - akceptacja pending cards
- **GET /api/decks** - lista dostępnych talii dla filtrowania
