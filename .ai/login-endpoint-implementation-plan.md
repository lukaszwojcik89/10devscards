# API Endpoint Implementation Plan: POST /api/auth/login (User Authentication)

## 1. Przegląd punktu końcowego

Endpoint służy do autentykacji użytkowników w aplikacji AI Flashcards. Jest to fundamentalna funkcjonalność umożliwiająca użytkownikom bezpieczne logowanie się przy użyciu email i hasła, zwracając JWT tokeny (access_token i refresh_token) wraz z profilem użytkownika. Endpoint implementuje mechanizmy bezpieczeństwa jak rate limiting, walidację danych oraz obsługę błędów autentykacji.

## 2. Szczegóły żądania

- **Metoda HTTP**: POST
- **Struktura URL**: `/api/auth/login`
- **Content-Type**: `application/json`
- **Parametry** (w body):
  - **Wymagane**:
    - `email` (string, valid email format, max 254 characters)
    - `password` (string, min 8 characters, max 128 characters)
- **Request Body**:

  ```json
  {
    "email": "user@example.com",
    "password": "SecurePassword123!"
  }
  ```

## 3. Wykorzystywane typy

- `LoginRequestDTO` (request body)
- `LoginResponseDTO` (success response)
- `ErrorResponseDTO` (error responses)
- `UserProfile` (user data)
- `AuthTokens` (JWT tokens)
- `loginRequestSchema` (walidacja Zod)

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
      "email_confirmed_at": "2025-06-11T10:00:00Z",
      "created_at": "2025-06-10T10:00:00Z",
      "last_sign_in_at": "2025-06-11T10:00:00Z"
    }
  }
}
```

### Kody błędów

- **400 Bad Request**: Nieprawidłowe dane wejściowe (walidacja Zod)
- **401 Unauthorized**: Nieprawidłowe dane logowania (email/hasło)
- **403 Forbidden**: Konto nieaktywne lub niezweryfikowane
- **429 Too Many Requests**: Przekroczony limit prób logowania
- **500 Internal Server Error**: Błąd serwera

## 5. Przepływ danych

1. **Walidacja request body** - użycie Zod schema dla sprawdzenia formatu email i hasła
2. **Rate limiting check** - sprawdzenie limitów prób logowania dla IP/email
3. **Normalizacja email** - konwersja na lowercase, trimowanie whitespace
4. **Autentykacja Supabase** - wywołanie `supabase.auth.signInWithPassword()`
5. **Sprawdzenie statusu konta** - weryfikacja czy email został potwierdzony
6. **Aktualizacja last_sign_in_at** - zapis czasu ostatniego logowania
7. **Generacja JWT tokens** - otrzymanie access_token i refresh_token
8. **Przygotowanie response** - formatowanie odpowiedzi z tokenami i profilem
9. **Audit logging** - zapis zdarzenia logowania do systemu logów
10. **Zwrócenie odpowiedzi** - przesłanie tokenów i danych użytkownika

## 6. Względy bezpieczeństwa

### Walidacja i sanityzacja

- **Email validation**: RFC 5322 compliant regex, max 254 characters
- **Password requirements**: Min 8 characters, max 128 characters, brak dodatkowych wymagań (delegacja do Supabase)
- **Input sanitization**: Trimowanie whitespace, normalizacja email (lowercase)
- **SQL injection protection**: Użycie Supabase ORM/prepared statements

### Rate limiting

- **Per IP**: Max 10 prób logowania na 15 minut
- **Per email**: Max 5 prób logowania na 15 minut
- **Global**: Max 1000 prób logowania na minutę dla całej aplikacji
- **Exponential backoff**: Zwiększanie opóźnienia po nieudanych próbach

### Sesje i tokeny

- **Access token**: Krótki czas życia (1 godzina), zawiera user_id i podstawowe uprawnienia
- **Refresh token**: Długi czas życia (30 dni), stored securely, używany do odnawiania access tokens
- **Token rotation**: Nowy refresh token przy każdym odświeżeniu
- **Secure storage**: HttpOnly cookies dla refresh tokens (opcjonalnie)

### Auditing i monitoring

- **Successful logins**: Log z user_id, IP, timestamp, user agent
- **Failed attempts**: Log z email (hashed), IP, reason, timestamp
- **Suspicious activity**: Alert przy wykryciu anomalii (multiple IPs, brute force)
- **Account lockout**: Tymczasowe zablokowanie po 5 nieudanych próbach

## 7. Obsługa błędów

### Błędy walidacji (400 Bad Request)

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "email": "Invalid email format",
      "password": "Password must be at least 8 characters"
    }
  }
}
```

### Błędy autentykacji (401 Unauthorized)

```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password"
  }
}
```

### Konto niezweryfikowane (403 Forbidden)

```json
{
  "error": {
    "code": "EMAIL_NOT_CONFIRMED",
    "message": "Please confirm your email address before logging in"
  }
}
```

### Rate limiting (429 Too Many Requests)

```json
{
  "error": {
    "code": "TOO_MANY_REQUESTS",
    "message": "Too many login attempts. Please try again later",
    "details": {
      "retry_after": 900
    }
  }
}
```

### Błędy serwera (500 Internal Server Error)

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Authentication service temporarily unavailable"
  }
}
```

## 8. Rozważania dotyczące wydajności

### Optymalizacje bazy danych

- **Connection pooling**: Efektywne zarządzanie połączeniami z Supabase
- **Query optimization**: Minimalizacja zapytań przez batching operacji
- **Caching**: Redis cache dla rate limiting counters
- **Indexing**: Upewnienie się o indeksach na email w tabeli users

### Response times

- **Target**: < 200ms dla 95% żądań
- **Timeout**: Max 5s dla całego procesu logowania
- **Monitoring**: Śledzenie czasów odpowiedzi per endpoint
- **Alerting**: Alert przy degradacji wydajności

### Skalowalność

- **Horizontal scaling**: Load balancer dla wielu instancji aplikacji
- **Session storage**: Centralized redis dla rate limiting
- **CDN integration**: Cache statycznych zasobów auth UI
- **Database scaling**: Read replicas dla user queries

## 9. Monitoring i metryki

### Kluczowe metryki

- **Login success rate**: % udanych logowań vs. wszystkich prób
- **Average response time**: Średni czas odpowiedzi endpoint'a
- **Failed login attempts**: Liczba nieudanych prób per godzina/dzień
- **Rate limit hits**: Liczba zablokowanych żądań przez rate limiting
- **Token usage patterns**: Analiza użycia access vs refresh tokens

### Alerty i notifikacje

- **High failure rate**: > 30% nieudanych logowań w ciągu 15 minut
- **Spike in login attempts**: > 1000 prób w ciągu minuty
- **Service availability**: Downtime > 1 minuta
- **Suspicious activity**: Brute force patterns, unusual geographic distribution

### Logging strategia

- **Structured logging**: JSON format z korrelacja ID
- **Log levels**: INFO dla udanych logowań, WARN dla nieudanych, ERROR dla błędów serwera
- **PII protection**: Hashowanie email addresses, brak logowania haseł
- **Retention**: 90 dni dla audit logs, 30 dni dla debug logs

## 10. Testowanie

### Unit testy

- **Walidacja input data**: Test wszystkich scenariuszy walidacji Zod
- **Supabase integration**: Mock auth service responses
- **Error handling**: Test wszystkich typów błędów
- **Rate limiting logic**: Test mechanizmów ograniczania żądań

### Integration testy

- **End-to-end login flow**: Pełny cykl od request do response
- **Database interactions**: Test operacji na prawdziwej bazie danych
- **External services**: Test integracji z Supabase Auth
- **Security scenarios**: Test scenariuszy bezpieczeństwa

### Performance testy

- **Load testing**: 1000 równoczesnych żądań logowania
- **Stress testing**: Określenie punktu załamania systemu
- **Rate limiting validation**: Test skuteczności mechanizmów rate limiting
- **Memory leaks**: Sprawdzenie stabilności przy długotrwałych testach

### Security testy

- **Input validation**: Fuzzing, injection attacks, malformed requests
- **Authentication bypass**: Próby ominięcia mechanizmów auth
- **Rate limiting bypass**: Test obejścia ograniczeń
- **Token security**: Walidacja bezpieczeństwa JWT tokens

## 11. Etapy wdrożenia

### Faza 1: Podstawowa infrastruktura (2-3 dni)

1. **Zod schema implementation**

   - Stworzenie `loginRequestSchema` w `auth.zod.ts`
   - Walidacja email (RFC 5322) i password (długość)
   - Unit testy dla walidacji

2. **AuthService implementation**

   - Podstawowa klasa `AuthService` w `auth.service.ts`
   - Metody: `login()`, `validateCredentials()`, `formatUserProfile()`
   - Mock implementation dla testowania

3. **Endpoint skeleton**
   - Podstawowa struktura `/api/auth/login.ts`
   - Request parsing i walidacja
   - Error handling framework
   - Basic response formatting

### Faza 2: Supabase integration (2-3 dni)

1. **Authentication logic**

   - Integracja z `supabase.auth.signInWithPassword()`
   - Obsługa różnych typów błędów Supabase
   - Mapowanie błędów na odpowiednie HTTP status codes

2. **User profile handling**

   - Pobieranie i formatowanie danych użytkownika
   - Obsługa niezweryfikowanych kont
   - Aktualizacja `last_sign_in_at` timestamp

3. **Token management**
   - Ekstrakcja access_token i refresh_token
   - Walidacja czasów wygaśnięcia
   - Secure token handling

### Faza 3: Security & Rate limiting (3-4 dni)

1. **Rate limiting implementation**

   - Redis integration dla counters
   - IP-based i email-based limiting
   - Exponential backoff logic
   - Rate limit headers w response

2. **Security enhancements**

   - Input sanitization
   - CSRF protection considerations
   - Audit logging implementation
   - Suspicious activity detection

3. **Error security**
   - Consistent error responses (nie ujawniać czy email istnieje)
   - Generic error messages
   - Proper HTTP status codes
   - Security headers

### Faza 4: Testing & Monitoring (2-3 dni)

1. **Comprehensive testing**

   - Unit tests (>90% coverage)
   - Integration tests
   - Security tests
   - Performance tests

2. **Monitoring setup**

   - Metrics collection
   - Alerting rules
   - Dashboard creation
   - Log aggregation

3. **Documentation**
   - API documentation update
   - Security guidelines
   - Operational runbooks
   - Error response catalog

### Faza 5: Deployment & Optimization (1-2 dni)

1. **Staging deployment**

   - Feature flags setup
   - Environment configuration
   - Smoke tests
   - Performance validation

2. **Production deployment**

   - Gradual rollout (1% -> 10% -> 100%)
   - Real-time monitoring
   - Rollback procedures
   - Post-deployment validation

3. **Post-launch optimization**
   - Performance tuning based na metrics
   - Rate limiting adjustments
   - Security policy refinements
   - User feedback incorporation

## 12. Dependencies i Prerequisites

### Environment setup

- **Supabase configuration**: Upewnienie się o poprawnej konfiguracji auth w Supabase
- **Redis setup**: Dla rate limiting (development może używać in-memory)
- **Environment variables**: SUPABASE_URL, SUPABASE_ANON_KEY, REDIS_URL
- **Database access**: Uprawnienia do tabeli users i auth

### Code dependencies

- **Existing types**: `LoginRequestDTO`, `LoginResponseDTO`, `UserProfile`
- **Supabase client**: Istniejący `supabaseClient` from `@/db/supabase.client`
- **Error types**: `ErrorResponseDTO` i związane typy
- **Utility functions**: Email validation, password hashing helpers

### External services

- **Supabase Auth**: Główny provider autentykacji
- **Redis**: Cache dla rate limiting (opcjonalnie, może być in-memory na starcie)
- **Monitoring service**: Dla metryk i alertów (np. DataDog, New Relic)
- **Logging service**: Dla audit logs (np. Winston, Pino)

## 13. Risk mitigation

### Security risks

- **Brute force attacks**: Rate limiting + account lockout
- **Credential stuffing**: Monitoring anomalii + CAPTCHA po wielu próbach
- **Session hijacking**: Secure token handling + token rotation
- **Data leaks**: Proper error messages + audit logging

### Performance risks

- **High load**: Horizontal scaling + caching
- **Database bottlenecks**: Connection pooling + read replicas
- **External service downtime**: Circuit breakers + fallback mechanisms
- **Memory leaks**: Proper cleanup + monitoring

### Operational risks

- **Configuration errors**: Infrastructure as code + validation
- **Deployment issues**: Feature flags + gradual rollout
- **Monitoring gaps**: Comprehensive metrics + alerting
- **Support escalation**: Clear runbooks + on-call procedures

## 14. Success criteria

### Functional requirements

- ✅ User może się zalogować przy użyciu poprawnych danych
- ✅ System zwraca proper error messages dla niepoprawnych danych
- ✅ Rate limiting skutecznie blokuje brute force attacks
- ✅ JWT tokens działają poprawnie z innymi endpoints
- ✅ Unverified accounts nie mogą się logować

### Performance requirements

- ✅ 95% żądań < 200ms response time
- ✅ 99.9% uptime dla endpoint'a
- ✅ Obsługa 1000 równoczesnych logowań
- ✅ Rate limiting nie wpływa negatywnie na legitimate users

### Security requirements

- ✅ Brak successful brute force attacks w testach
- ✅ Proper audit trail dla wszystkich login events
- ✅ Tokens są secure i nie leakują sensitive data
- ✅ OWASP Top 10 compliance dla auth endpoint

### Monitoring requirements

- ✅ Real-time metrics dla login success/failure rates
- ✅ Alerting działa poprawnie dla anomalii
- ✅ Comprehensive logging bez PII leaks
- ✅ Dashboard pokazuje health endpoint'a w czasie rzeczywistym
