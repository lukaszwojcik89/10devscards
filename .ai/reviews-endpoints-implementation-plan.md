# API Endpoint Implementation Plan: Reviews Endpoints

## 1. Przegląd punktów końcowych

Ten plan obejmuje implementację 2 endpointów dla zarządzania powtórkami w aplikacji AI Flashcards:

### POST /api/reviews

Endpoint do zapisywania rezultatów nauki fiszek podczas sesji powtórek. Jest to kluczowa funkcjonalność implementująca system Spaced Repetition - na podstawie poprawności odpowiedzi (is_correct) endpoint automatycznie przelicza następną datę powtórki według algorytmu Leitner i aktualizuje pozycję fiszki w systemie pudełek (box1 → box2 → box3 → graduated).

### GET /api/reviews

Endpoint do pobierania historii powtórek użytkownika z zaawansowanym filtrowaniem. Umożliwia analizę postępów w nauce, tracking accuracy rate oraz monitorowanie wzorców uczenia się. Obsługuje filtrowanie według konkretnej fiszki, zakresu dat oraz paginację dla dużych datasets.

## 2. Szczegóły żądania

### POST /api/reviews

- **Metoda HTTP**: POST
- **Struktura URL**: `/api/reviews`
- **Request Body**:

```json
{
  "flashcard_id": "uuid",
  "is_correct": true,
  "response_time_ms": 3500
}
```

### GET /api/reviews

- **Metoda HTTP**: GET
- **Struktura URL**: `/api/reviews`
- **Parametry**:
  - **Opcjonalne** (query params):
    - `flashcard_id` (string UUID, filtrowanie według konkretnej fiszki)
    - `from_date` (string ISO date, początek zakresu czasowego)
    - `to_date` (string ISO date, koniec zakresu czasowego)
    - `limit` (number, 1-500, domyślnie 50)
    - `offset` (number, >=0, domyślnie 0)

## 3. Wykorzystywane typy

### Response DTOs

- `SubmitReviewResponseDTO` (POST reviews)
- `ReviewHistoryResponseDTO` (GET reviews)
- `ReviewWithFlashcard` (review data z informacjami o fiszce)
- `NextReviewInfo` (informacje o następnej powtórce)
- `PaginationDTO` (pagination metadata)
- `ErrorResponseDTO` (error responses)

### Request DTOs

- `SubmitReviewRequestDTO` (POST reviews)

### Command Models

- `SubmitReviewCommand` (business logic layer)

### Validation Schemas (Zod)

- `submitReviewRequestSchema`
- `reviewHistoryQuerySchema`

## 4. Szczegóły odpowiedzi

### POST /api/reviews - Sukces (201 Created)

```json
{
  "data": {
    "id": "uuid",
    "flashcard_id": "uuid",
    "user_id": "uuid",
    "is_correct": true,
    "response_time_ms": 3500,
    "created_at": "2025-06-11T10:00:00Z",
    "next_review": {
      "box": "box2",
      "next_due_date": "2025-06-14T10:00:00Z"
    }
  }
}
```

### GET /api/reviews - Sukces (200 OK)

```json
{
  "data": [
    {
      "id": "uuid",
      "flashcard_id": "uuid",
      "user_id": "uuid",
      "is_correct": true,
      "response_time_ms": 3500,
      "created_at": "2025-06-11T10:00:00Z",
      "flashcard": {
        "question": "What is a closure in JavaScript?",
        "deck_name": "JavaScript Basics"
      }
    },
    {
      "id": "uuid",
      "flashcard_id": "uuid",
      "user_id": "uuid",
      "is_correct": false,
      "response_time_ms": 8200,
      "created_at": "2025-06-10T15:30:00Z",
      "flashcard": {
        "question": "Explain the difference between let and var",
        "deck_name": "JavaScript Basics"
      }
    }
  ],
  "pagination": {
    "total": 125,
    "limit": 50,
    "offset": 0,
    "has_more": true
  }
}
```

### Kody błędów (oba endpointy)

- **400 Bad Request**: Nieprawidłowe dane wejściowe (walidacja Zod)
- **401 Unauthorized**: Brak autoryzacji lub nieprawidłowy token
- **404 Not Found**: Fiszka nie istnieje lub nie należy do użytkownika
- **429 Too Many Requests**: Przekroczony dzienny limit powtórek (POST only)
- **500 Internal Server Error**: Błąd serwera (database, system)

## 5. Przepływ danych

### POST /api/reviews

1. **Walidacja JWT token** - sprawdzenie autentykacji użytkownika
2. **Walidacja request body** - użycie Zod schema (flashcard_id, is_correct, response_time_ms)
3. **Sprawdzenie flashcard ownership** - weryfikacja przez deck ownership (RLS)
4. **Sprawdzenie dziennych limitów** - max 50 reviews + 20 catch-up per day
5. **Pobranie aktualnej fiszki** - dane potrzebne do kalkulacji SRS
6. **Implementacja algorytmu Leitner** - kalkulacja nowego box i next_due_date
   - **Correct answer**: box1→box2 (3d), box2→box3 (7d), box3→graduated (30d)
   - **Incorrect answer**: reset do box1 (1d)
7. **Zapis review** - INSERT do tabeli reviews z user_id
8. **Aktualizacja fiszki** - UPDATE flashcards z nowym box i due_date
9. **Zwrócenie odpowiedzi** - review data + next_review info

### GET /api/reviews

1. **Walidacja JWT token** - sprawdzenie autentykacji użytkownika
2. **Parsowanie query parameters** - walidacja filtrów i pagination
3. **Budowanie query z filtrami** - flashcard_id, date range, user filtering
4. **JOIN z flashcards i decks** - pobranie question i deck_name
5. **Obliczenie pagination** - COUNT query dla total + has_more flag
6. **Sortowanie według created_at DESC** - najnowsze reviews first
7. **Formatowanie odpowiedzi** - ReviewHistoryResponseDTO

## 6. Względy bezpieczeństwa

### Autentykacja i autoryzacja

- **JWT Bearer token** - wymagany we wszystkich endpointach
- **Row Level Security** - automatyczne filtrowanie przez user_id
- **Flashcard ownership** - weryfikacja przez relację deck → owner
- **Cross-user data protection** - niemożliwość dostępu do reviews innych użytkowników

### Walidacja danych

- **Zod schemas** - wszystkie request bodies i query params
- **UUID validation** - sprawdzenie format flashcard_id
- **Response time validation** - positive integer, reasonable limits (<300s)
- **Date range validation** - from_date <= to_date, reasonable limits

### Rate limiting i limity biznesowe

- **Daily review limits** - 50 standardowych + 20 catch-up per day
- **Response time limits** - max 300 seconds (5 min) per review
- **Flashcard status validation** - tylko accepted cards można review
- **API rate limiting** - 1000 requests/hour per user

### Business logic integrity

- **SRS algorithm consistency** - proper Leitner box progression
- **Due date calculation accuracy** - timezone-aware calculations
- **Review history immutability** - brak możliwości edycji/usuwania reviews
- **Daily limits enforcement** - strict counting per UTC day

### Security headers

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`

## 7. Obsługa błędów

### Błędy walidacji (400 Bad Request)

- Nieprawidłowy UUID flashcard_id
- is_correct nie jest boolean
- response_time_ms nie jest positive integer lub > 300000ms
- Nieprawidłowy format dat (from_date, to_date)
- from_date > to_date
- limit poza zakresem 1-500
- offset < 0

### Błędy autoryzacji (401 Unauthorized)

- Brak nagłówka Authorization
- Nieprawidłowy format tokenu Bearer
- Token wygasły lub nieprawidłowy
- Błąd weryfikacji użytkownika w Supabase

### Błędy zasobów (404 Not Found)

- Fiszka o podanym flashcard_id nie istnieje
- Fiszka nie należy do użytkownika (przez deck ownership)
- Fiszka ma status pending/rejected (nie można review)

### Błędy limitów (429 Too Many Requests)

- Przekroczony dzienny limit 50 standardowych reviews
- Przekroczony limit 20 catch-up reviews per day
- Próba review więcej niż allowed daily quota

### Błędy logiki biznesowej (400 Bad Request)

- Próba review fiszki która nie jest "accepted"
- Review fiszki która nie jest due (przed next_due_date)
- Duplikowana review dla tej samej fiszki w krótkim czasie (<1s)

### Błędy serwera (500 Internal Server Error)

- Błąd połączenia z bazą danych
- Błąd w kalkulacji SRS algorithm
- Błąd aktualizacji flashcard due_date
- Nieoczekiwane błędy w database constraints
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
      "catchup_remaining": 15,
      "reset_time": "2025-06-13T00:00:00Z"
    }
  }
}
```

## 8. Rozważania dotyczące wydajności

### Optymalizacje bazy danych

- **Composite index** - (user_id, created_at DESC) dla history queries
- **Flashcard_id index** - szybkie queries dla konkretnej fiszki
- **Date range index** - optymalizacja filtrowania według dat
- **Foreign key indexes** - JOIN optimization z flashcards/decks

### Optymalizacje queries

- **Efficient pagination** - LIMIT/OFFSET z proper indexing
- **JOIN optimization** - selective fields z flashcards i decks
- **COUNT optimization** - COUNT(\*) OVER() dla pagination
- **Date filtering** - index-friendly WHERE conditions

### SRS algorithm optimization

- **Due date calculation caching** - cache interval calculations
- **Batch updates** - grupowanie flashcard updates
- **Timezone handling** - UTC normalization dla consistency
- **Box progression logic** - efficient state transitions

### Caching strategia

- **Review statistics caching** - cache daily/weekly stats
- **Flashcard metadata caching** - cache question/deck_name
- **User progress caching** - cache accuracy rates, streaks
- **Daily limits caching** - cache current day counts

### Response optimization

- **JSON compression** - gzip dla large history responses
- **Field selection** - optional limit returned fields
- **Pagination tuning** - optimal default limits
- **Response streaming** - dla bardzo dużych history exports

### Monitoring i metryki

- **Response time tracking** - <100ms dla POST, <200ms dla GET
- **SRS accuracy monitoring** - tracking algorithm effectiveness
- **Daily usage patterns** - peak hours, completion rates
- **Error rate monitoring** - failed reviews, timeouts

## 9. Etapy wdrożenia

### Faza 1: Przygotowanie infrastruktury (1 dzień)

1. **Utworzenie endpoint files** - API route files

   - `/api/reviews/index.ts` (obsługa GET i POST)

2. **Rozszerzenie lub utworzenie ReviewsService** - business logic

   - `submitReview()`
   - `getReviewHistory()`
   - `calculateNextReview()` (SRS logic)
   - `validateDailyLimits()`

3. **Zod schemas implementacja** - validation

   - `submitReviewRequestSchema`
   - `reviewHistoryQuerySchema`

4. **SRS Algorithm Service** - Leitner system logic
   - `calculateNextDueDate()`
   - `advanceBox()`
   - `resetToBox1()`

### Faza 2: Implementacja POST endpoint (2 dni)

1. **POST /api/reviews core logic**

   - Request validation z Zod
   - Flashcard ownership verification
   - Daily limits checking
   - SRS algorithm implementation

2. **Leitner system implementation**

   - Box progression rules (1d, 3d, 7d, 30d)
   - Due date calculations z timezone handling
   - Correct/incorrect answer handling
   - Box reset logic dla wrong answers

3. **Database transactions**
   - Atomic review INSERT + flashcard UPDATE
   - Error handling dla constraint violations
   - Rollback procedures dla failed updates

### Faza 3: Implementacja GET endpoint (1.5 dnia)

1. **GET /api/reviews core logic**

   - Query parameters validation
   - Complex filtering logic
   - JOIN optimization z flashcards/decks
   - Pagination implementation

2. **Advanced filtering**

   - Flashcard-specific history
   - Date range filtering
   - Performance optimization
   - Response formatting

3. **Pagination i sorting**
   - Efficient LIMIT/OFFSET handling
   - Created_at DESC ordering
   - Total count calculation
   - Has_more flag logic

### Faza 4: Business rules implementation (1 dzień)

1. **Daily limits enforcement**

   - UTC day calculation
   - Standard vs catch-up limits tracking
   - Limit validation przed review submission
   - Error handling dla exceeded limits

2. **SRS business rules**

   - Only accepted cards can be reviewed
   - Due date validation
   - Duplicate review prevention
   - Box progression validation

3. **Data integrity**
   - Review immutability enforcement
   - Flashcard state consistency
   - User isolation verification
   - Database constraint validation

### Faza 5: Performance optimization (1 dzień)

1. **Database optimization**

   - Index analysis i optimization
   - Query performance tuning
   - Connection pooling verification
   - Slow query identification

2. **Caching implementation**

   - Daily limits caching
   - Flashcard metadata caching
   - Review statistics caching
   - Cache invalidation strategy

3. **Response optimization**
   - JSON payload optimization
   - Compression implementation
   - Field selection optimization
   - Memory usage optimization

### Faza 6: Testing i validation (1.5 dnia)

1. **Unit testing**

   - ReviewsService methods testing
   - SRS algorithm validation
   - Edge cases coverage
   - Mock data scenarios

2. **Integration testing**

   - API endpoints testing
   - Database transactions testing
   - Authentication flow testing
   - Error scenarios validation

3. **SRS accuracy testing**
   - Box progression validation
   - Due date calculation testing
   - Daily limits enforcement testing
   - Performance under load testing

### Faza 7: Monitoring i deployment (0.5 dnia)

1. **Monitoring setup**

   - Review submission metrics
   - SRS algorithm effectiveness tracking
   - Daily usage patterns monitoring
   - Error rate monitoring

2. **Production deployment**
   - Staging environment testing
   - Production deployment
   - Health checks implementation
   - Post-deployment validation

**Całkowity czas implementacji: 8.5 dnia**

### Dependencies i Prerequisites

- ✅ Istniejąca struktura bazy danych (reviews, flashcards tables)
- ✅ Supabase client i authentication setup
- ✅ Podstawowe typy w types.ts (ReviewsResponseDTO, etc.)
- ⏳ ReviewsService creation
- ⏳ SRS Algorithm Service implementation
- ⏳ Daily limits tracking infrastructure
- ⏳ Caching infrastructure setup
- ⏳ Monitoring i alerting configuration

### Integration z innymi endpointami

- **GET /api/study/session** - fiszki do review pochodzą z study sessions
- **GET /api/flashcards/{id}** - szczegóły fiszek podczas review
- **PATCH /api/flashcards/{id}/status** - accepted status required dla review
- **GET /api/user/export** - reviews są częścią user data export
