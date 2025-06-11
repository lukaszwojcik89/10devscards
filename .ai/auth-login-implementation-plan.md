# API Endpoint Implementation Plan: POST /api/auth/login (User Authentication)

## 1. Przegląd punktu końcowego

Endpoint służy do uwierzytelniania użytkowników w aplikacji AI Flashcards przy użyciu email/hasło i zwraca tokeny JWT. Jest to fundamentalny element systemu bezpieczeństwa, który umożliwia użytkownikom dostęp do chronionych zasobów aplikacji. Endpoint wykorzystuje Supabase Auth do zarządzania sesjami i tokenami.

## 2. Szczegóły żądania

- **Metoda HTTP**: POST
- **Struktura URL**: `/api/auth/login`
- **Content-Type**: `application/json`
- **Parametry**:
  - **Wymagane** (w body):
    - `email` (string, valid email format, max 255 znaków)
    - `password` (string, min 8 znaków, max 128 znaków)
- **Request Body**:

  ```json
  {
    "email": "user@example.com",
    "password": "SecurePassword123!"
  }
  ```

## 3. Wykorzystywane typy

- `LoginRequestDTO` (request body)
- `LoginResponseDTO` (response)
- `AuthTokens` (tokeny JWT)
- `UserProfile` (profil użytkownika)
- `ErrorResponseDTO` (błędy)
- `loginRequestSchema` (walidacja Zod - do stworzenia)

## 4. Szczegóły odpowiedzi

### Sukces (200 OK)

```json
{
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 3600,
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "email_confirmed_at": "2025-06-11T10:00:00Z"
    }
  }
}
```

### Kody błędów

- **400 Bad Request**: Nieprawidłowe dane wejściowe (walidacja), nieprawidłowe loginy
- **401 Unauthorized**: Niepotwierdzone konto email, konto zablokowane
- **422 Unprocessable Entity**: Nieprawidłowy format email lub hasła
- **429 Too Many Requests**: Przekroczony limit prób logowania (rate limiting)
- **500 Internal Server Error**: Błąd Supabase Auth, błąd serwera
- **503 Service Unavailable**: Serwis autentykacji niedostępny

## 5. Przepływ danych

1. **Walidacja request body** - użycie Zod schema do sprawdzenia poprawności danych
2. **Rate limiting check** - sprawdzenie limitów prób logowania dla IP/email
3. **Email format validation** - dokładna walidacja formatu email
4. **Supabase Auth call** - wywołanie `supabase.auth.signInWithPassword()`
5. **Email confirmation check** - sprawdzenie czy email został potwierdzony
6. **Token extraction** - pobranie access_token i refresh_token z odpowiedzi
7. **User profile fetch** - pobranie profilu użytkownika z session
8. **Session logging** - opcjonalne logowanie udanego logowania
9. **Response formatting** - formatowanie odpowiedzi zgodnie z LoginResponseDTO
10. **Security headers** - dodanie odpowiednich nagłówków bezpieczeństwa

## 6. Względy bezpieczeństwa

- **Rate limiting**: Ochrona przed brute force attacks (max 5 prób na IP/minutę)
- **Input validation**: Ścisła walidacja email i hasła (długość, format)
- **Email confirmation**: Wymóg potwierdzenia email przed logowaniem
- **Secure token handling**: Bezpieczne przekazywanie tokenów w response
- **Password hashing**: Supabase automatycznie hashuje hasła (bcrypt/scrypt)
- **Session management**: Wykorzystanie Supabase session management
- **CORS headers**: Właściwe konfiguracja CORS dla frontend'u
- **HTTPS enforcement**: Wymaganie HTTPS w produkcji
- **Error message sanitization**: Unikanie przecieków informacji
- **Audit logging**: Logowanie prób logowania (sukces/porażka)

## 7. Obsługa błędów

### Błędy walidacji (400)

- Pusty email lub hasło
- Nieprawidłowy format email
- Hasło za krótkie (<8 znaków) lub za długie (>128 znaków)
- Nieprawidłowe znaki w haśle

### Błędy autentykacji (400/401)

- Nieprawidłowy email lub hasło
- Konto nieaktywne lub zablokowane
- Email niepotwierdzony (401)
- Hasło wygasłe (jeśli implementowane)

### Błędy limitów (429)

- Przekroczony limit prób logowania na IP
- Przekroczony limit prób dla konkretnego email
- Tymczasowa blokada konta po wielu nieudanych próbach

### Błędy serwera (500/503)

- Błąd komunikacji z Supabase Auth
- Błąd bazy danych podczas pobierania profilu
- Timeout podczas autentykacji
- Serwis Auth niedostępny

## 8. Rozważania dotyczące wydajności

### Optymalizacje

- **Connection pooling**: Efektywne wykorzystanie połączeń z Supabase
- **Response caching**: Cache dla statycznych danych profilu (krótki TTL)
- **Database indexing**: Indeksy na email dla szybkiego wyszukiwania
- **Async processing**: Asynchroniczne logowanie audit events

### Rate limiting strategy

- **IP-based limiting**: 5 prób/minutę na IP
- **Email-based limiting**: 3 próby/minutę na email
- **Progressive delays**: Wzrastające opóźnienia po nieudanych próbach
- **Captcha integration**: Wymaganie captcha po 3 nieudanych próbach

### Monitoring i metryki

- **Login success rate**: Procent udanych logowań
- **Failed login attempts**: Liczba nieudanych prób z przyczynami
- **Response times**: Czas odpowiedzi endpoint'a
- **Rate limit hits**: Liczba zablokowanych żądań
- **Active sessions**: Liczba aktywnych sesji użytkowników

## 9. Etapy wdrożenia

### Faza 1: Przygotowanie infrastruktury
- [x] **Sprawdzenie konfiguracji Supabase Auth**
- [x] **Weryfikacja istniejących typów w `/src/types.ts`**
- [ ] **Stworzenie Zod schema dla walidacji**
- [ ] **Przygotowanie struktury folderów dla auth endpoints**

### Faza 2: Implementacja core logic
- [ ] **Stworzenie AuthService z metodami logowania**
- [ ] **Implementacja walidacji email/hasła**
- [ ] **Integracja z Supabase Auth**
- [ ] **Obsługa błędów i edge cases**

### Faza 3: Bezpieczeństwo i rate limiting
- [ ] **Implementacja rate limiting middleware**
- [ ] **Dodanie security headers**
- [ ] **Konfiguracja CORS**
- [ ] **Implementacja audit logging**

### Faza 4: Endpoint implementation
- [ ] **Stworzenie `/api/auth/login.ts`**
- [ ] **Integracja z AuthService**
- [ ] **Formatowanie responses zgodnie z DTO**
- [ ] **Error handling i status codes**

### Faza 5: Testowanie
- [ ] **Unit testy dla AuthService**
- [ ] **Integration testy dla endpoint'a**
- [ ] **Security testing (rate limits, validation)**
- [ ] **Load testing dla określenia limitów**

### Faza 6: Monitoring i deployment
- [ ] **Konfiguracja metryk i alertów**
- [ ] **Setup error tracking**
- [ ] **Documentation update**
- [ ] **Staging deployment i testing**
- [ ] **Production deployment**

## 10. Szczegóły techniczne

### Struktura plików do utworzenia

```
src/
  lib/
    services/
      auth.service.ts          # Core authentication logic
      auth.service.test.ts     # Unit tests
      auth.zod.ts             # Zod validation schemas
  middleware/
    rate-limit.ts             # Rate limiting middleware
  pages/
    api/
      auth/
        login.ts              # Main endpoint
        logout.ts             # Future: logout endpoint
        refresh.ts            # Future: token refresh
```

### Zależności wymagane

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.x.x",  // już jest
    "zod": "^3.x.x",                    // już jest
    "bcryptjs": "^2.x.x"                // opcjonalne dla dodatkowej walidacji
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.x.x"         // jeśli używamy bcryptjs
  }
}
```

### Environment variables

```env
# Supabase (już skonfigurowane)
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Rate limiting (nowe)
RATE_LIMIT_LOGIN_PER_IP=5           # prób na IP/minutę
RATE_LIMIT_LOGIN_PER_EMAIL=3        # prób na email/minutę
RATE_LIMIT_WINDOW_MS=60000          # okno czasowe (1 minuta)

# Security (nowe)
JWT_SECRET=                         # dla dodatkowej walidacji
CORS_ORIGIN=http://localhost:4321   # dozwolone domeny
```

## 11. Potencjalne rozszerzenia

### Krótkoterminowe
- **Multi-factor authentication (MFA)**: SMS/TOTP support
- **Social login**: Google, GitHub, Apple integration
- **Remember me**: Extended session duration option
- **Password strength indicator**: Client-side password validation

### Długoterminowe
- **OAuth 2.0 provider**: Umożliwienie zewnętrznym aplikacjom korzystania z auth
- **Advanced fraud detection**: ML-based suspicious activity detection
- **Geolocation tracking**: Login location monitoring
- **Device management**: Trusted device registration

## 12. Success criteria

### Funkcjonalność
- ✅ Użytkownik może się zalogować prawidłowymi danymi
- ✅ Nieprawidłowe dane są odrzucane z odpowiednimi błędami
- ✅ Rate limiting działa poprawnie
- ✅ Tokeny są zwracane w poprawnym formacie

### Wydajność
- ✅ Response time < 200ms (95th percentile)
- ✅ Obsługa min. 100 równoczesnych loginów
- ✅ Zero downtime podczas deploymentu

### Bezpieczeństwo
- ✅ Brak podatności na brute force attacks
- ✅ Wszystkie inputs są walidowane
- ✅ Sensitive data nie jest logowane
- ✅ HTTPS wymagane w produkcji

Ten plan zapewnia kompletną i bezpieczną implementację endpointu logowania zgodnie z najlepszymi praktykami bezpieczeństwa i architektury REST API.
