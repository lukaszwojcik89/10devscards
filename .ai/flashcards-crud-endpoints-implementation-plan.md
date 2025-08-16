# API Endpoint Implementation Plan: Flashcards CRUD Endpoints

## 1. Przegląd punktów końcowych

Ten plan obejmuje implementację 6 endpointów CRUD dla zarządzania fiszkami w aplikacji AI Flashcards:

### GET /api/decks/{slug}/flashcards

Endpoint do pobierania wszystkich fiszek należących do określonej talii z opcjonalnym filtrowaniem według statusu i pola Leitner. Obsługuje paginację i zwraca szczegółowe informacje o każdej fiszce.

### GET /api/flashcards/{id}

Endpoint do pobierania szczegółowych informacji o pojedynczej fiszce, w tym wszystkich metadanych AI i informacji o postępie w systemie Leitner.

### POST /api/flashcards

Endpoint do ręcznego tworzenia nowych fiszek w określonej talii. Fiszki tworzone manualnie otrzymują status "accepted" i trafiają do box1 systemu Leitner.

### PUT /api/flashcards/{id}

Endpoint do aktualizacji treści pytania i odpowiedzi istniejącej fiszki. Zachowuje wszystkie metadane i informacje o postępie.

### PATCH /api/flashcards/{id}/status

Endpoint do zatwierdzania lub odrzucania fiszek ze statusem "pending" (wygenerowanych przez AI). Implementuje logikę auto-akceptacji po 5 dniach.

### DELETE /api/flashcards/{id}

Endpoint do permanentnego usuwania fiszki z systemu wraz z całą historią powtórek.

## 2. Szczegóły żądania

### GET /api/decks/{slug}/flashcards

- **Metoda HTTP**: GET
- **Struktura URL**: `/api/decks/{slug}/flashcards`
- **Parametry**:
  - **Wymagane** (w URL):
    - `slug` (string, slug talii należącej do użytkownika)
  - **Opcjonalne** (query params):
    - `status` ("pending" | "accepted" | "rejected", filtrowanie według statusu)
    - `box` ("box1" | "box2" | "box3" | "graduated", filtrowanie według poziomu Leitner)
    - `limit` (number, 1-100, domyślnie 20)
    - `offset` (number, >=0, domyślnie 0)

### GET /api/flashcards/{id}

- **Metoda HTTP**: GET
- **Struktura URL**: `/api/flashcards/{id}`
- **Parametry**:
  - **Wymagane** (w URL):
    - `id` (string, UUID fiszki należącej do użytkownika)

### POST /api/flashcards

- **Metoda HTTP**: POST
- **Struktura URL**: `/api/flashcards`
- **Request Body**:

```json
{
  "deck_id": "uuid",
  "question": "What is the difference between let and var?",
  "answer": "let has block scope while var has function scope"
}
```

### PUT /api/flashcards/{id}

- **Metoda HTTP**: PUT
- **Struktura URL**: `/api/flashcards/{id}`
- **Request Body**:

```json
{
  "question": "Updated question?",
  "answer": "Updated answer"
}
```

### PATCH /api/flashcards/{id}/status

- **Metoda HTTP**: PATCH
- **Struktura URL**: `/api/flashcards/{id}/status`
- **Request Body**:

```json
{
  "status": "accepted"
}
```

### DELETE /api/flashcards/{id}

- **Metoda HTTP**: DELETE
- **Struktura URL**: `/api/flashcards/{id}`
- **Brak body**

## 3. Wykorzystywane typy

### Response DTOs

- `FlashcardListResponseDTO` (GET deck flashcards)
- `FlashcardDetailResponseDTO` (GET single flashcard)
- `FlashcardResponseData` (shared flashcard data)
- `PaginationDTO` (pagination metadata)
- `ErrorResponseDTO` (error responses)
- `SuccessMessageResponseDTO` (delete confirmation)

### Request DTOs

- `CreateFlashcardRequestDTO` (POST flashcards)
- `UpdateFlashcardRequestDTO` (PUT flashcards)
- `UpdateFlashcardStatusRequestDTO` (PATCH status)

### Command Models

- `CreateFlashcardCommand` (business logic layer)
- `UpdateFlashcardCommand` (business logic layer)
- `UpdateFlashcardStatusCommand` (business logic layer)
- `DeleteFlashcardCommand` (business logic layer)

### Validation Schemas (Zod)

- `createFlashcardRequestSchema`
- `updateFlashcardRequestSchema`
- `updateFlashcardStatusRequestSchema`

## 4. Szczegóły odpowiedzi

### GET /api/decks/{slug}/flashcards - Sukces (200 OK)

```json
{
  "data": [
    {
      "id": "uuid",
      "deck_id": "uuid",
      "question": "What is a closure in JavaScript?",
      "answer": "A closure is a function that has access to variables from its outer scope",
      "status": "accepted",
      "box": "box2",
      "next_due_date": "2025-06-14T10:00:00Z",
      "created_at": "2025-06-11T10:00:00Z",
      "updated_at": "2025-06-11T10:00:00Z",
      "model": "gpt-4o-mini",
      "tokens_used": 95,
      "price_usd": 0.000285,
      "updated_by": "uuid"
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 20,
    "offset": 0,
    "has_more": true
  }
}
```

### GET /api/flashcards/{id} - Sukces (200 OK)

```json
{
  "data": {
    "id": "uuid",
    "deck_id": "uuid",
    "question": "What is a closure in JavaScript?",
    "answer": "A closure is a function that has access to variables from its outer scope",
    "status": "accepted",
    "box": "box2",
    "next_due_date": "2025-06-14T10:00:00Z",
    "created_at": "2025-06-11T10:00:00Z",
    "updated_at": "2025-06-11T10:00:00Z",
    "model": "gpt-4o-mini",
    "tokens_used": 95,
    "price_usd": 0.000285,
    "updated_by": "uuid"
  }
}
```

### POST /api/flashcards - Sukces (201 Created)

Zwraca strukturę identyczną jak GET /api/flashcards/{id}

### PUT /api/flashcards/{id} - Sukces (200 OK)

Zwraca strukturę identyczną jak GET /api/flashcards/{id}

### PATCH /api/flashcards/{id}/status - Sukces (200 OK)

Zwraca strukturę identyczną jak GET /api/flashcards/{id}

### DELETE /api/flashcards/{id} - Sukces (200 OK)

```json
{
  "message": "Flashcard deleted successfully"
}
```

### Kody błędów (wszystkie endpointy)

- **400 Bad Request**: Nieprawidłowe dane wejściowe (walidacja Zod)
- **401 Unauthorized**: Brak autoryzacji lub nieprawidłowy token
- **404 Not Found**: Fiszka, talia lub zasób nie istnieje/nie należy do użytkownika
- **500 Internal Server Error**: Błąd serwera (database, system)

## 5. Przepływ danych

### GET /api/decks/{slug}/flashcards

1. **Walidacja JWT token** - sprawdzenie autentykacji użytkownika
2. **Sprawdzenie deck ownership** - weryfikacja, czy talia należy do użytkownika
3. **Parsowanie query parameters** - walidacja i domyślne wartości dla filtrów
4. **Query z filtrami** - pobranie fiszek z bazy z odpowiednimi WHERE clauses
5. **Obliczenie pagination** - COUNT query dla total + has_more flag
6. **Formatowanie odpowiedzi** - przygotowanie FlashcardListResponseDTO

### GET /api/flashcards/{id}

1. **Walidacja JWT token** - sprawdzenie autentykacji użytkownika
2. **Sprawdzenie flashcard ownership** - weryfikacja przez deck ownership (RLS)
3. **Pobranie fiszki** - SELECT z pełnymi danymi
4. **Formatowanie odpowiedzi** - przygotowanie FlashcardDetailResponseDTO

### POST /api/flashcards

1. **Walidacja JWT token** - sprawdzenie autentykacji użytkownika
2. **Walidacja request body** - użycie Zod schema
3. **Sprawdzenie deck ownership** - weryfikacja, czy talia należy do użytkownika
4. **Walidacja business rules** - sprawdzenie limitów fiszek w talii
5. **Utworzenie fiszki** - INSERT do tabeli flashcards ze statusem "accepted", box1
6. **Ustawienie next_due_date** - natychmiastowe dostępność do nauki
7. **Zwrócenie odpowiedzi** - przesłanie utworzonej fiszki

### PUT /api/flashcards/{id}

1. **Walidacja JWT token** - sprawdzenie autentykacji użytkownika
2. **Walidacja request body** - użycie Zod schema
3. **Sprawdzenie flashcard ownership** - weryfikacja przez deck ownership
4. **Aktualizacja fiszki** - UPDATE z zachowaniem metadanych AI i box/due_date
5. **Ustawienie updated_at i updated_by** - tracking zmian
6. **Zwrócenie odpowiedzi** - przesłanie zaktualizowanej fiszki

### PATCH /api/flashcards/{id}/status

1. **Walidacja JWT token** - sprawdzenie autentykacji użytkownika
2. **Walidacja request body** - sprawdzenie dozwolonych statusów
3. **Sprawdzenie flashcard ownership** - weryfikacja przez deck ownership
4. **Walidacja business rules** - status można zmieniać tylko z "pending"
5. **Aktualizacja statusu** - UPDATE status + due_date handling
6. **Implementacja auto-acceptance logic** - sprawdzenie 5-dniowego limitu
7. **Zwrócenie odpowiedzi** - przesłanie zaktualizowanej fiszki

### DELETE /api/flashcards/{id}

1. **Walidacja JWT token** - sprawdzenie autentykacji użytkownika
2. **Sprawdzenie flashcard ownership** - weryfikacja przez deck ownership
3. **Usunięcie historii** - CASCADE DELETE reviews przez foreign key
4. **Usunięcie fiszki** - DELETE z tabeli flashcards
5. **Zwrócenie potwierdzenia** - success message

## 6. Względy bezpieczeństwa

### Autentykacja i autoryzacja

- **JWT Bearer token** - wymagany we wszystkich endpointach
- **Row Level Security** - automatyczne filtrowanie przez owner_id
- **Deck ownership check** - dodatkowa weryfikacja dla POST flashcards
- **Flashcard ownership** - weryfikacja przez relację deck → owner

### Walidacja danych

- **Zod schemas** - wszystkie request bodies i query params
- **SQL injection protection** - używanie parametryzowanych queries
- **XSS protection** - automatyczne escapowanie w PostgreSQL
- **Input length limits** - question (256 chars), answer (512 chars)

### Rate limiting i limity biznesowe

- **General API limits** - 1000 requests/hour per user
- **Flashcard limits** - max 1000 fiszek per deck (business rule)
- **Status change validation** - tylko pending → accepted/rejected

### Security headers

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`

## 7. Obsługa błędów

### Błędy walidacji (400 Bad Request)

- Nieprawidłowy UUID w parametrach URL
- Przekroczenie limitów długości question/answer
- Nieprawidłowe wartości enum dla status/box
- Nieprawidłowe query parameters (limit >100, offset <0)
- Brakujące wymagane pola w request body

### Błędy autoryzacji (401 Unauthorized)

- Brak nagłówka Authorization
- Nieprawidłowy format tokenu Bearer
- Token wygasły lub nieprawidłowy
- Błąd weryfikacji użytkownika w Supabase

### Błędy zasobów (404 Not Found)

- Fiszka o podanym ID nie istnieje
- Talia o podanym slug nie istnieje
- Fiszka nie należy do użytkownika (przez deck ownership)
- Talia nie należy do użytkownika

### Błędy logiki biznesowej (400 Bad Request)

- Próba zmiany statusu fiszki która nie jest "pending"
- Przekroczenie limitu fiszek w talii (1000)
- Próba utworzenia fiszki w usuniętej talii (is_deleted = true)

### Błędy serwera (500 Internal Server Error)

- Błąd połączenia z bazą danych
- Błąd constraint w PostgreSQL
- Nieoczekiwane błędy aplikacji
- Timeout operacji bazodanowych

### Format błędów

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Question text exceeds maximum length of 256 characters",
    "details": {
      "field": "question",
      "received_length": 312,
      "max_length": 256
    }
  }
}
```

## 8. Rozważania dotyczące wydajności

### Optymalizacje bazy danych

- **Indeksy na deck_id** - szybkie queries dla fiszek w talii
- **Composite index** - (deck_id, status) dla filtrowania
- **Due date index** - optymalizacja dla study sessions
- **Connection pooling** - zarządzanie połączeniami do PostgreSQL

### Optymalizacje queries

- **Pagination limits** - max 100 results per request
- **SELECT specific fields** - unikanie SELECT \*
- **Efficient counting** - COUNT(\*) OVER() dla pagination
- **Index hints** - WHERE clauses matching database indexes

### Caching strategia

- **Query result caching** - cache dla często pobieranych talii
- **ETag headers** - cache validation dla GET requests
- **Cache invalidation** - clearing cache po UPDATE/DELETE operations

### Response optimization

- **JSON compression** - gzip dla large responses
- **Field selection** - opcjonalne ograniczenie returned fields
- **Batch operations** - grupowanie múltiple operations

### Monitoring i limity

- **Response time tracking** - <200ms dla GET, <500ms dla mutations
- **Query performance monitoring** - slow query detection
- **Memory usage tracking** - monitoring memory leaks
- **Database connection monitoring** - connection pool health

## 9. Etapy wdrożenia

### Faza 1: Przygotowanie infrastruktury (1 dzień)

1. **Tworzenie plików endpoint** - utworzenie API route files

   - `/api/decks/[slug]/flashcards.ts`
   - `/api/flashcards/[id].ts`
   - `/api/flashcards/index.ts`
   - `/api/flashcards/[id]/status.ts`

2. **Rozszerzenie FlashcardsService** - dodanie metod CRUD

   - `getFlashcardsByDeck()`
   - `getFlashcardById()`
   - `createFlashcard()`
   - `updateFlashcard()`
   - `updateFlashcardStatus()`
   - `deleteFlashcard()`

3. **Zod schemas implementacja** - validation schemas
   - `createFlashcardRequestSchema`
   - `updateFlashcardRequestSchema`
   - `updateFlashcardStatusRequestSchema`
   - Query parameters validation schemas

### Faza 2: Implementacja GET endpoints (1 dzień)

1. **GET /api/decks/{slug}/flashcards**

   - Deck ownership verification
   - Query parameters parsing i validation
   - Database query z filtering i pagination
   - Response formatting

2. **GET /api/flashcards/{id}**

   - Flashcard ownership verification przez RLS
   - Single flashcard fetch
   - Error handling dla not found

3. **Testing GET endpoints**
   - Unit tests dla service methods
   - Integration tests dla API endpoints
   - Error scenario testing

### Faza 3: Implementacja POST/PUT endpoints (2 dni)

1. **POST /api/flashcards**

   - Request validation z Zod
   - Deck ownership check
   - Business rules validation (limits)
   - Flashcard creation z proper defaults
   - Response formatting

2. **PUT /api/flashcards/{id}**

   - Request validation
   - Ownership verification
   - Update logic z metadata preservation
   - Updated timestamp tracking

3. **Testing POST/PUT endpoints**
   - Validation testing
   - Business logic testing
   - Error scenarios
   - Security testing

### Faza 4: Implementacja PATCH/DELETE endpoints (1 dzień)

1. **PATCH /api/flashcards/{id}/status**

   - Status validation (only pending can change)
   - Auto-acceptance logic implementation
   - Due date recalculation
   - Business rules enforcement

2. **DELETE /api/flashcards/{id}**

   - Ownership verification
   - Cascade delete handling
   - Confirmation response

3. **Testing PATCH/DELETE endpoints**
   - Status change validation
   - Auto-acceptance testing
   - Cascade delete verification

### Faza 5: Security i Performance optimization (1 dzień)

1. **Security audit**

   - Input validation completeness
   - Authorization checks verification
   - SQL injection testing
   - Error message security review

2. **Performance optimization**

   - Query optimization i indexing
   - Response time measurements
   - Memory usage optimization
   - Cache implementation

3. **Rate limiting implementation**
   - Per-user limits enforcement
   - Business rules implementation
   - Monitoring i alerting

### Faza 6: Integration testing i deployment (1 dzień)

1. **End-to-end testing**

   - Full workflow testing
   - Cross-endpoint integration
   - Frontend integration testing
   - Error flow testing

2. **Load testing**

   - Concurrent requests handling
   - Database performance under load
   - Memory leak detection
   - Response time under stress

3. **Production deployment**
   - Staging environment testing
   - Production deployment z monitoring
   - Health checks implementation
   - Rollback procedures setup

### Faza 7: Monitoring i documentation (0.5 dnia)

1. **Monitoring setup**

   - Metrics collection (response times, error rates)
   - Alerting configuration
   - Dashboard creation
   - Log aggregation

2. **Documentation finalization**
   - API documentation update
   - Error response catalog
   - Security guidelines
   - Operational runbooks

**Całkowity czas implementacji: 7.5 dnia**

### Dependencies i Prerequisites

- ✅ Istniejąca struktura bazy danych (tabela flashcards)
- ✅ Supabase client i authentication setup
- ✅ Podstawowe typy w types.ts
- ✅ FlashcardsService foundation
- ⏳ Rozszerzenie Zod schemas dla nowych endpoints
- ⏳ Testing infrastructure setup
- ⏳ Monitoring i alerting configuration
