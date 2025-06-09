# API Endpoint Implementation Plan: POST /api/flashcards/generate (AI Flashcard Generation)

## 1. Przegląd punktu końcowego

Tworzy nowe fiszki w wybranej talii na podstawie wejściowego tekstu użytkownika, wykorzystując AI (np. GPT-4o-mini). Endpoint obsługuje limity budżetowe, walidację wejścia i zwraca wygenerowane fiszki wraz z metadanymi generacji.

## 2. Szczegóły żądania

- Metoda HTTP: POST
- Struktura URL: /api/flashcards/generate
- Parametry:
  - Wymagane (w body):
    - `deck_id` (string, UUID istniejącej talii)
    - `input_text` (string, max 2000 znaków)
    - `max_flashcards` (number, 1-10)
- Request Body:
  - Typ: `GenerateFlashcardsRequest`
  - Przykład:

    ```json
    {
      "deck_id": "uuid",
      "input_text": "JavaScript closures are functions...",
      "max_flashcards": 5
    }
    ```

## 3. Wykorzystywane typy

- `GenerateFlashcardsRequest` (request body)
- `GenerateFlashcardsResponse` (response)
- `ErrorResponse` (błędy)
- (wewnętrznie: typy bazodanowe z `Tables<"flashcards">`)

## 4. Szczegóły odpowiedzi

- Status: 201 Created (sukces)
- Body: `GenerateFlashcardsResponse`
  - Przykład:

    ```json
    {
      "generated_flashcards": [
        {
          "id": "uuid",
          "question": "What is a closure in JavaScript?",
          "answer": "A function that has access to variables in its outer scope",
          "status": "pending",
          "model": "gpt-4o-mini",
          "tokens_used": 85,
          "price_usd": 0.000025
        }
      ],
      "generation_summary": {
        "total_generated": 3,
        "total_tokens": 255,
        "total_cost_usd": 0.000075,
        "model_used": "gpt-4o-mini"
      }
    }
    ```

- Kody błędów:
  - 400 Bad Request – nieprawidłowe dane wejściowe
  - 402 Payment Required – przekroczony budżet
  - 429 Too Many Requests – limit generacji przekroczony
  - 404 Not Found – deck nie istnieje lub nie należy do użytkownika
  - 401 Unauthorized – brak autoryzacji
  - 500 Internal Server Error – błąd serwera

## 5. Przepływ danych

1. Użytkownik wysyła żądanie POST z danymi wejściowymi.
2. Endpoint waliduje dane wejściowe (Zod): deck_id, input_text, max_flashcards.
3. Sprawdzenie autoryzacji użytkownika (token JWT, Supabase Auth).
4. Sprawdzenie istnienia i własności decka (deck_id należy do użytkownika).
5. Sprawdzenie limitów budżetowych (odczyt z tabeli budget_events).
6. Wywołanie usługi AI (np. Openrouter) do wygenerowania fiszek.
7. Zapisanie wygenerowanych fiszek do bazy (status: pending, model, tokens_used, price_usd).
8. Zapisanie kosztu generacji do budget_events.
9. Zwrócenie wygenerowanych fiszek i podsumowania generacji w formacie `GenerateFlashcardsResponse`.
10. W przypadku błędu – zwrócenie `ErrorResponse` z odpowiednim kodem.

## 6. Względy bezpieczeństwa

- Wymagane uwierzytelnienie (token JWT, Supabase Auth).
- Sprawdzenie owner_id decka – generacja tylko dla własnych talii.
- Walidacja pól wejściowych (długość, format, limity).
- Ochrona przed nadużyciami (limity budżetowe, rate limiting).
- RLS na poziomie bazy (dodatkowa warstwa ochrony).
- Ograniczenie długości pól (ochrona przed DoS).

## 7. Obsługa błędów

- 400: Zwracany, gdy dane wejściowe nie spełniają wymagań walidacji (Zod).
- 402: Zwracany, gdy przekroczony budżet użytkownika na generację AI.
- 429: Zwracany, gdy przekroczony limit generacji (rate limit).
- 404: Zwracany, gdy deck nie istnieje lub nie należy do użytkownika.
- 401: Zwracany, gdy użytkownik nie jest zalogowany lub token jest nieprawidłowy.
- 500: Zwracany, gdy wystąpi nieoczekiwany błąd serwera (logowanie do Sentry).

## 8. Rozważania dotyczące wydajności

- Odczyt decka i budżetu powinien być zoptymalizowany (indeksy na deck_id, owner_id, budget_events).
- Ograniczenie długości input_text i liczby generowanych fiszek chroni przed nadużyciami.
- Operacje INSERT i SELECT zoptymalizowane przez indeksy.
- Wywołanie AI powinno być asynchroniczne lub z timeoutem.
- Odpowiedź nie zawiera ciężkich danych (np. plików).

## 9. Etapy wdrożenia

1. Utwórz Zod schema dla `GenerateFlashcardsRequest` zgodnie z wymaganiami walidacji.
2. Zaimplementuj endpoint POST /api/flashcards/generate w odpowiednim pliku Astro API.
3. Wyodrębnij logikę generacji fiszek do serwisu (np. `src/lib/services/flashcards.service.ts`).
4. W serwisie:
   - Pobierz owner_id z kontekstu użytkownika.
   - Sprawdź istnienie i własność decka.
   - Sprawdź limity budżetowe i rate limiting.
   - Wywołaj usługę AI do generacji fiszek.
   - Zapisz fiszki do bazy z odpowiednimi metadanymi.
   - Zapisz koszt generacji do budget_events.
   - Przygotuj odpowiedź w formacie `GenerateFlashcardsResponse`.
5. Zaimplementuj obsługę błędów i odpowiednich kodów statusu.
6. Dodaj testy jednostkowe i integracyjne dla walidacji i logiki serwisowej.
7. Przetestuj endpoint ręcznie (np. przez Postman/Insomnia).
8. Zaimplementuj logowanie błędów do Sentry (jeśli dotyczy).
9. Zadbaj o zgodność z ESLint i formatowaniem kodu.
10. Zaktualizuj dokumentację API.
