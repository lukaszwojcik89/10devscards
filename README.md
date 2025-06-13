# AI Flashcards

**AI Flashcards** to aplikacja webowa do tworzenia i nauki fiszek generowanych przez sztuczną inteligencję. Projekt bazuje na Astro i React, a dane przechowywane są w Supabase.

## Funkcje

- Generowanie fiszek na podstawie podanego tekstu z wykorzystaniem modeli AI
- Zarządzanie taliami i fiszkami użytkownika
- Rejestracja, logowanie i reset hasła
- Nauka i śledzenie postępów

## Instalacja

1. Zainstaluj zależności:
   ```bash
   npm install
   ```
2. Skopiuj plik `.env.example` do `.env` i uzupełnij wymagane wartości (adres projektu Supabase, klucz API oraz dane do OpenRouter).
3. Uruchom środowisko deweloperskie:
   ```bash
   npm run dev
   ```

Aplikacja będzie dostępna pod adresem `http://localhost:4321` domyślnie.

## Testowanie

Aby uruchomić zestaw testów jednostkowych użyj komendy:

```bash
npm test
```

## Licencja

Projekt jest dostępny na licencji MIT.
