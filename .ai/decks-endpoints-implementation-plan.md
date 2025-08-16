# API Endpoint Implementation Plan: Decks Resource Endpoints

## 1. Przegląd punktu końcowego

Zestaw 5 endpointów REST API do zarządzania taliami fiszek w aplikacji AI Flashcards. Endpointy umożliwiają pełną funkcjonalność CRUD (Create, Read, Update, Delete) dla talii użytkowników z zachowaniem bezpieczeństwa RLS, paginacji i soft delete. System respektuje ownership użytkowników przez Supabase RLS policies i implementuje walidację danych przez Zod schemas.

## 2. Szczegóły żądania

### GET /api/decks

- **Metoda HTTP**: GET
- **Struktura URL**: `/api/decks`
- **Parametry**:
  - Wymagane: Authorization header z JWT token
  - Opcjonalne: `limit` (1-100, default 20), `offset` (≥0, default 0), `include_deleted` (boolean, default false)
- **Request Body**: Brak

### GET /api/decks/{slug}

- **Metoda HTTP**: GET
- **Struktura URL**: `/api/decks/{slug}`
- **Parametry**:
  - Wymagane: `slug` (kebab-case format), Authorization header
  - Opcjonalne: Brak
- **Request Body**: Brak

### POST /api/decks

- **Metoda HTTP**: POST
- **Struktura URL**: `/api/decks`
- **Parametry**:
  - Wymagane: Authorization header, Content-Type: application/json
  - Opcjonalne: Brak
- **Request Body**:

```json
{
  "slug": "javascript-advanced",
  "name": "Advanced JavaScript",
  "description": "ES6+ features and patterns"
}
```

### PUT /api/decks/{slug}

- **Metoda HTTP**: PUT
- **Struktura URL**: `/api/decks/{slug}`
- **Parametry**:
  - Wymagane: `slug` w URL, Authorization header
  - Opcjonalne: `name`, `description` w body
- **Request Body**:

```json
{
  "name": "Updated Deck Name",
  "description": "Updated description"
}
```

### DELETE /api/decks/{slug}

- **Metoda HTTP**: DELETE
- **Struktura URL**: `/api/decks/{slug}`
- **Parametry**:
  - Wymagane: `slug` w URL, Authorization header
  - Opcjonalne: Brak
- **Request Body**: Brak

## 3. Wykorzystywane typy

- **DTOs**: `DeckWithCounts`, `DeckListResponseDTO`, `DeckDetailResponseDTO`, `CreateDeckRequestDTO`, `UpdateDeckRequestDTO`, `DeleteDeckResponseDTO`, `PaginationDTO`, `ErrorResponseDTO`
- **Command Models**: `CreateDeckCommand`, `UpdateDeckCommand`, `DeleteDeckCommand`
- **Zod Schemas**: `deckListQuerySchema`, `createDeckSchema`, `updateDeckSchema`, `deckSlugSchema`
- **Service Classes**: `DecksService` z metodami getUserDecks(), getDeckBySlug(), createDeck(), updateDeck(), deleteDeck()

## 4. Szczegóły odpowiedzi

### GET /api/decks - 200 OK

```json
{
  "data": [
    {
      "id": "uuid",
      "slug": "python-basics",
      "name": "Python Basics",
      "description": "Fundamental Python concepts",
      "created_at": "2025-06-11T10:00:00Z",
      "updated_at": "2025-06-11T10:00:00Z",
      "flashcard_count": 25,
      "pending_count": 3
    }
  ],
  "pagination": {
    "total": 5,
    "limit": 20,
    "offset": 0,
    "has_more": false
  }
}
```

### POST /api/decks - 201 Created

```json
{
  "data": {
    "id": "uuid",
    "slug": "javascript-advanced",
    "name": "Advanced JavaScript",
    "description": "ES6+ features and patterns",
    "created_at": "2025-06-11T10:00:00Z",
    "updated_at": "2025-06-11T10:00:00Z",
    "flashcard_count": 0,
    "pending_count": 0
  }
}
```

### Błędy (400, 401, 404, 409, 500)

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "slug": "Slug must be in kebab-case format"
    }
  }
}
```

## 5. Przepływ danych

1. **Autentykacja** - weryfikacja JWT token przez Supabase middleware
2. **Walidacja** - request params/body przez odpowiednie Zod schemas
3. **RLS enforcement** - automatyczna filtracja przez Supabase WHERE user_id = auth.uid()
4. **Business logic** - wykonanie operacji przez DecksService methods
5. **Data enrichment** - dodanie liczników fiszek (flashcard_count, pending_count) przez subqueries
6. **Response formatting** - strukturyzacja odpowiedzi zgodnie z DTOs
7. **Error handling** - konsystentne formatowanie błędów przez ErrorResponseDTO

## 6. Względy bezpieczeństwa

- **Autentykacja**: JWT tokens przez Supabase Auth, wymagane dla wszystkich endpoints
- **Autoryzacja**: Row Level Security (RLS) policies na tabeli decks, automatyczna filtracja user_id = auth.uid()
- **Walidacja**: Zod schemas dla wszystkich inputs, sanityzacja strings, validation slug format
- **Rate limiting**: 100 operacji/godzinę per user, 10 równoczesnych requests per user
- **Input sanitization**: trim whitespace, escape HTML, validation length limits
- **Audit logging**: structured logs z user_id, operation, timestamp dla compliance

## 7. Obsługa błędów

- **400 Bad Request**: Invalid query params, malformed slug, validation failures
- **401 Unauthorized**: Missing/invalid JWT token, expired session
- **404 Not Found**: Deck slug nie istnieje lub nie należy do użytkownika (RLS filtering)
- **409 Conflict**: Slug already exists dla tego użytkownika (tylko POST)
- **500 Internal Server Error**: Database connection issues, Supabase service errors

Wszystkie błędy zwracane w formacie ErrorResponseDTO z kodem, wiadomością i opcjonalnymi szczegółami.

## 8. Rozważania dotyczące wydajności

- **Database optimization**: Indeksy na user_id, slug, created_at dla szybkich queries
- **Connection pooling**: Efektywne zarządzanie połączeń Supabase
- **Query optimization**: Subqueries dla liczników fiszek, LIMIT/OFFSET dla paginacji
- **Response times**: Target <200ms dla 95% requests, timeout 5s
- **Caching strategy**: Redis cache dla często używanych talii
- **Pagination**: Max 100 items per request, has_more flag dla navigation

## 9. Kroki implementacji

1. **Stworzenie Zod schemas** - deckListQuerySchema, createDeckSchema, updateDeckSchema w pliku decks.zod.ts
2. **Implementacja DecksService** - klasa z metodami CRUD w lib/services/decks.service.ts
3. **Endpoint GET /api/decks** - lista z paginacją i licznikami w pages/api/decks/index.ts
4. **Endpoint GET /api/decks/[slug]** - pojedyncza talia w pages/api/decks/[slug].ts
5. **Endpoint POST /api/decks** - tworzenie nowych talii w pages/api/decks/index.ts
6. **Endpoint PUT /api/decks/[slug]** - aktualizacja w pages/api/decks/[slug].ts
7. **Endpoint DELETE /api/decks/[slug]** - soft delete w pages/api/decks/[slug].ts
8. **Testing** - unit tests dla service methods, integration tests dla endpoints
9. **Frontend integration** - strony zarządzania taliami z JavaScript calls do API
