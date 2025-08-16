# API Endpoint Implementation Plan: POST /api/flashcards/generate (AI Flashcard Generation)

## 1. Przegląd punktu końcowego

Endpoint służy do generowania fiszek z tekstu przy użyciu AI (GPT-4o-mini przez Openrouter.ai). Jest to kluczowa funkcjonalność aplikacji AI Flashcards, która umożliwia użytkownikom automatyczne tworzenie materiałów do nauki na podstawie dostarczonych treści edukacyjnych. Endpoint wymaga autentykacji, sprawdza limity budżetowe i zwraca wygenerowane fiszki wraz z metadanymi kosztów.

## 2. Szczegóły żądania

- **Metoda HTTP**: POST
- **Struktura URL**: `/api/flashcards/generate`
- **Parametry**:
  - **Wymagane** (w body):
    - `deck_id` (string, UUID istniejącej talii należącej do użytkownika)
    - `input_text` (string, max 2000 znaków, tekst do przetworzenia przez AI)
  - **Opcjonalne** (w body):
    - `max_cards` (number, 1-10, domyślnie 5)
    - `difficulty` ("beginner" | "intermediate" | "advanced", domyślnie "intermediate")
- **Request Body**:

  ```json
  {
    "deck_id": "uuid",
    "input_text": "JavaScript closures are functions that retain access to their lexical scope...",
    "max_cards": 5,
    "difficulty": "intermediate"
  }
  ```

## 3. Wykorzystywane typy

- `GenerateFlashcardsRequestDTO` (request body)
- `GenerateFlashcardsResponseDTO` (response)
- `GenerateFlashcardsCommand` (command model z user_id)
- `ErrorResponseDTO` (błędy)
- `FlashcardListItem` (wygenerowane fiszki)
- `generateFlashcardsRequestSchema` (walidacja Zod)

## 4. Szczegóły odpowiedzi

### Sukces (201 Created)

```json
{
  "generated_flashcards": [
    {
      "id": "uuid",
      "question": "What is a closure in JavaScript?",
      "answer": "A closure is a function that has access to variables from its outer scope",
      "status": "pending",
      "box": "box1",
      "next_due_date": "2025-06-11T10:00:00Z",
      "created_at": "2025-06-11T10:00:00Z",
      "model": "gpt-4o-mini",
      "tokens_used": 95,
      "price_usd": 0.000285
    }
  ],
  "generation_summary": {
    "total_generated": 5,
    "total_tokens": 450,
    "total_cost_usd": 0.00135,
    "model_used": "gpt-4o-mini"
  }
}
```

### Kody błędów

- **400 Bad Request**: Nieprawidłowe dane wejściowe (walidacja Zod)
- **401 Unauthorized**: Brak autoryzacji lub nieprawidłowy token
- **402 Payment Required**: Przekroczony budżet użytkownika na generację AI
- **404 Not Found**: Deck nie istnieje lub nie należy do użytkownika
- **429 Too Many Requests**: Przekroczony limit generacji (rate limiting)
- **500 Internal Server Error**: Błąd serwera (AI service, database)
- **503 Service Unavailable**: Globalny limit budżetu przekroczony

## 5. Przepływ danych

1. **Walidacja JWT token** - sprawdzenie autentykacji użytkownika (Bearer token)
2. **Walidacja request body** - użycie Zod schema do sprawdzenia poprawności danych
3. **Sprawdzenie deck ownership** - weryfikacja, czy deck należy do użytkownika
4. **Sprawdzenie limitów budżetowych** - odczyt z tabeli `budget_events` i sprawdzenie miesięcznego limitu
5. **Rate limiting check** - sprawdzenie limitów czasowych dla użytkownika
6. **Wywołanie AI service** - komunikacja z Openrouter.ai (GPT-4o-mini)
7. **Przetworzenie odpowiedzi AI** - parsowanie wygenerowanych fiszek
8. **Zapis do bazy danych** - wstawienie fiszek do tabeli `flashcards` ze statusem "pending"
9. **Zapis budget event** - rejestracja kosztu w tabeli `budget_events`
10. **Zwrócenie odpowiedzi** - przesłanie wygenerowanych fiszek z metadanymi

## 6. Względy bezpieczeństwa

- **Autentykacja**: Wymagany token JWT w nagłówku Authorization (Bearer)
- **Autoryzacja**: Sprawdzenie owner_id deck'a - generacja tylko dla własnych talii
- **Walidacja danych**: Zod schema dla wszystkich pól wejściowych
- **Rate limiting**: Ochrona przed nadużyciami (limity generacji na użytkownika/dzień)
- **Budget protection**: Sprawdzenie limitów finansowych przed wywołaniem AI
- **Input sanitization**: Ograniczenie długości input_text (max 2000 znaków)
- **RLS (Row Level Security)**: Dodatkowa warstwa ochrony na poziomie bazy danych
- **Error handling**: Unikanie przecieków informacji w komunikatach błędów

## 7. Obsługa błędów

### Błędy walidacji (400)

- Nieprawidłowy UUID deck_id
- input_text za długi (>2000 znaków) lub pusty
- max_cards poza zakresem 1-10
- difficulty nie w dozwolonych wartościach

### Błędy autoryzacji (401)

- Brak nagłówka Authorization
- Nieprawidłowy format tokenu Bearer
- Token wygasły lub nieprawidłowy
- Błąd weryfikacji użytkownika w Supabase

### Błędy budżetu (402)

- Miesięczny limit użytkownika przekroczony ($10)
- Przewidywany koszt generacji przekroczy limit
- Brak wystarczających środków na koncie

### Błędy zasobów (404)

- Deck o podanym deck_id nie istnieje
- Deck nie należy do zalogowanego użytkownika
- Deck jest soft-deleted (is_deleted = true)

### Błędy serwera (500/503)

- Błąd komunikacji z Openrouter.ai
- Błąd zapisu do bazy danych
- Timeout wywołania AI service
- Globalny limit budżetu aplikacji przekroczony

## 8. Rozważania dotyczące wydajności

### Optymalizacje bazy danych

- Indeksy na deck_id, owner_id dla szybkiego sprawdzenia własności
- Indeks na budget_events dla szybkiego obliczania sum miesięcznych
- Batch insert dla wielu fiszek jednocześnie
- Connection pooling dla równoległych żądań

### Optimalizacje AI service

- Timeout dla wywołań AI (max 30s)
- Retry mechanism z exponential backoff
- Caching promptów dla popularne difficulty levels
- Async processing dla większych generacji

### Monitoring i metryki

- Czas odpowiedzi endpoint'a
- Liczba tokenów zużytych przez AI
- Rate successful/failed generations
- Koszty generacji w czasie rzeczywistym
- Usage patterns per user

### Limity i throttling

- Max 10 generacji na użytkownika dziennie
- Max 5 równoczesnych żądań na użytkownika
- Global rate limit: 100 generacji/minutę dla całej aplikacji
- Circuit breaker dla AI service

## 9. Etapy wdrożenia

1. **Przygotowanie infrastruktury**

   - Sprawdzenie istniejącego endpoint'a `/api/flashcards/generate.ts`
   - Weryfikacja konfiguracji Openrouter.ai w zmiennych środowiskowych
   - Sprawdzenie dostępności FlashcardsService

2. **Implementacja walidacji**

   - Aktualizacja Zod schema jeśli potrzebna
   - Dodanie walidacji difficulty enum
   - Implementacja early returns dla błędów walidacji

3. **Wdrożenie logiki biznesowej**

   - Rozszerzenie FlashcardsService o budget checking
   - Implementacja rate limiting mechanizmu
   - Dodanie error handling dla wszystkich scenariuszy

4. **Integracja z AI service**

   - Konfiguracja Openrouter.ai client
   - Implementacja retry logic i timeout handling
   - Optymalizacja promptów dla różnych difficulty levels

5. **Testowanie**

   - Unit testy dla FlashcardsService
   - Integration testy dla endpoint'a
   - Load testing dla określenia limitów wydajności
   - Security testing (auth, validation, rate limits)

6. **Monitoring i logging**

   - Dodanie metryk do systemu monitoringu
   - Konfiguracja alertów dla błędów i limitów budżetu
   - Setup error tracking (Sentry integration)

7. **Dokumentacja i deployment**
   - Aktualizacja dokumentacji API
   - Przygotowanie migration scriptów jeśli potrzebne
   - Deployment na staging environment
   - Production deployment z feature flagami
