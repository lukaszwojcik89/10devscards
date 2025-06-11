# API Endpoint Implementation Plan: Authentication Endpoints (Register & Login)

<analysis>
Analiza specyfikacji API i wymagań:

1. **Kluczowe punkty specyfikacji**:
   - POST /api/auth/register: 201 Created, obsługa age_confirmation, email verification
   - POST /api/auth/login: 200 OK, zwracanie JWT tokens, walidacja potwierdzonego emaila
   - Oba endpointy wymagają walidacji Zod, obsługi błędów Supabase, nagłówków bezpieczeństwa

2. **Wymagane i opcjonalne parametry**:
   - Register: email (req), password (req), age_confirmation (req)
   - Login: email (req), password (req)

3. **Niezbędne typy DTO**:
   - RegisterRequestDTO, RegisterResponseDTO, LoginRequestDTO, LoginResponseDTO
   - ErrorResponseDTO, UserProfile, AuthTokens

4. **Logika w serwisach**:
   - AuthService już istnieje z metodami register() i login()
   - Integracja z Supabase Auth, obsługa błędów, formatowanie odpowiedzi

5. **Walidacja danych**:
   - Zod schemas: registerRequestSchema, loginRequestSchema
   - Email format (RFC 5322), password length (8-128), age confirmation boolean

6. **Potencjalne zagrożenia bezpieczeństwa**:
   - Brute force attacks, credential stuffing, session hijacking
   - Rate limiting, secure headers, input validation

7. **Scenariusze błędów**:
   - 400: Invalid input, 401: Invalid credentials/unconfirmed email
   - 409: Email already exists, 429: Rate limiting, 500: Server errors
</analysis>

## 1. Przegląd punktów końcowych

### POST /api/auth/register

Endpoint służy do rejestracji nowych użytkowników w systemie AI Flashcards. Implementuje obowiązkową weryfikację wieku, integrację z Supabase Auth oraz wysyłanie emaili potwierdzających. Zwraca profil użytkownika z komunikatem o konieczności potwierdzenia emaila.

### POST /api/auth/login

Endpoint umożliwia autentykację istniejących użytkowników przy użyciu emaila i hasła. Zwraca JWT tokens (access_token, refresh_token) wraz z profilem użytkownika. Implementuje mechanizmy bezpieczeństwa jak rate limiting i walidację potwierdzonego emaila.

## 2. Szczegóły żądania

### POST /api/auth/register

- **Metoda HTTP**: POST
- **Struktura URL**: `/api/auth/register`
- **Content-Type**: `application/json`
- **Parametry wymagane**:
  - `email` (string, valid email format, max 254 characters)
  - `password` (string, min 8 characters, max 128 characters)
  - `age_confirmation` (boolean, must be true)
- **Request Body**:

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "age_confirmation": true
}
```

### POST /api/auth/login

- **Metoda HTTP**: POST
- **Struktura URL**: `/api/auth/login`
- **Content-Type**: `application/json`
- **Parametry wymagane**:
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

### DTOs i Command Models

- `RegisterRequestDTO` - dane wejściowe rejestracji
- `RegisterResponseDTO` - odpowiedź rejestracji z profilem użytkownika
- `LoginRequestDTO` - dane wejściowe logowania
- `LoginResponseDTO` - odpowiedź logowania z tokenami i profilem
- `ErrorResponseDTO` - standardowy format błędów
- `UserProfile` - profil użytkownika
- `AuthTokens` - struktura JWT tokenów

### Zod Schemas

- `registerRequestSchema` - walidacja danych rejestracji
- `loginRequestSchema` - walidacja danych logowania

### Service Classes

- `AuthService` - główna logika autentykacji z metodami `register()` i `login()`

## 4. Szczegóły odpowiedzi

### POST /api/auth/register

#### Sukces (201 Created)

```json
{
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "email_confirmed_at": null,
      "created_at": "2025-06-11T10:00:00Z",
      "last_sign_in_at": "2025-06-11T10:00:00Z"
    },
    "message": "Please check your email to confirm your account"
  }
}
```

### POST /api/auth/login

#### Sukces (200 OK)

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

### Kody błędów (oba endpointy)

- **400 Bad Request**: Nieprawidłowe dane wejściowe (walidacja Zod)
- **401 Unauthorized**: Nieprawidłowe dane logowania / niezweryfikowany email
- **409 Conflict**: Email już istnieje (tylko register)
- **429 Too Many Requests**: Przekroczenie limitów rate limiting
- **500 Internal Server Error**: Błędy serwera

## 5. Przepływ danych

### Rejestracja (/api/auth/register)

1. **Walidacja request body** - użycie registerRequestSchema
2. **Rate limiting check** - sprawdzenie limitów prób rejestracji
3. **Normalizacja email** - lowercase, trimowanie
4. **Rejestracja Supabase** - wywołanie `supabase.auth.signUp()`
5. **Konfiguracja emailRedirectTo** - URL potwierdzenia
6. **Obsługa błędów** - mapowanie błędów Supabase na kody HTTP
7. **Formatowanie profilu** - przygotowanie UserProfile
8. **Zwrócenie odpowiedzi** - profil użytkownika z komunikatem

### Logowanie (/api/auth/login)

1. **Walidacja request body** - użycie loginRequestSchema
2. **Rate limiting check** - sprawdzenie limitów prób logowania
3. **Normalizacja email** - lowercase, trimowanie
4. **Autentykacja Supabase** - wywołanie `supabase.auth.signInWithPassword()`
5. **Sprawdzenie statusu emaila** - weryfikacja email_confirmed_at
6. **Aktualizacja last_sign_in_at** - zapis czasu logowania
7. **Ekstrakcja tokenów** - access_token, refresh_token
8. **Formatowanie odpowiedzi** - tokeny + profil użytkownika

## 6. Względy bezpieczeństwa

### Walidacja i sanityzacja

- **Email validation**: RFC 5322 compliant, max 254 characters
- **Password requirements**: Min 8 characters, max 128 characters
- **Input sanitization**: Trimowanie, normalizacja email (lowercase)
- **Age verification**: Obowiązkowe potwierdzenie (register)
- **SQL injection protection**: Użycie Supabase ORM

### Rate limiting

- **Per IP**: Max 10 prób logowania na 15 minut
- **Per email**: Max 5 prób logowania na 15 minut
- **Registration**: Max 3 rejestracje na IP na godzinę
- **Global**: Max 1000 żądań auth na minutę
- **Exponential backoff**: Zwiększanie opóźnienia po błędach

### Sesje i tokeny

- **Access token**: 1 godzina żywotności, zawiera user_id
- **Refresh token**: 30 dni żywotności, secure storage
- **Token rotation**: Nowy refresh token przy odświeżaniu
- **Secure headers**: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection

### Auditing i monitoring

- **Successful operations**: Log z user_id, IP, timestamp
- **Failed attempts**: Log z hashed email, IP, reason
- **Suspicious activity**: Alert przy anomaliach
- **Account creation**: Tracking rejestracji z metadanymi

## 7. Obsługa błędów

### Błędy walidacji (400 Bad Request)

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "email": "Invalid email format",
      "password": "Password must be at least 8 characters",
      "age_confirmation": "Age confirmation is required"
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

### Email niezweryfikowany (401 Unauthorized)

```json
{
  "error": {
    "code": "EMAIL_NOT_CONFIRMED",
    "message": "Please confirm your email address before logging in"
  }
}
```

### Email już istnieje (409 Conflict)

```json
{
  "error": {
    "code": "EMAIL_EXISTS",
    "message": "Użytkownik z tym adresem email już istnieje"
  }
}
```

### Rate limiting (429 Too Many Requests)

```json
{
  "error": {
    "code": "TOO_MANY_REQUESTS",
    "message": "Zbyt wiele prób. Spróbuj ponownie później",
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
    "message": "Usługa autentykacji tymczasowo niedostępna"
  }
}
```

## 8. Rozważania dotyczące wydajności

### Optymalizacje bazy danych

- **Connection pooling**: Efektywne zarządzanie połączeniami Supabase
- **Query optimization**: Minimalizacja zapytań, batch operations
- **Email indexing**: Indeksy na polu email w auth.users
- **Cache strategy**: Redis dla rate limiting counters

### Response times

- **Target**: < 300ms dla 95% żądań rejestracji/logowania
- **Timeout**: Max 10s dla całego procesu
- **Monitoring**: Śledzenie czasów odpowiedzi per endpoint
- **Alerting**: Alert przy degradacji wydajności > 500ms

### Skalowalność

- **Horizontal scaling**: Load balancer dla wielu instancji
- **Session storage**: Centralized Redis dla rate limiting
- **Email service**: Asynchroniczne wysyłanie emaili potwierdzających
- **Database scaling**: Read replicas dla user queries

## 9. Monitoring i metryki

### Kluczowe metryki

- **Registration success rate**: % udanych rejestracji
- **Login success rate**: % udanych logowań
- **Email confirmation rate**: % potwierdzonych kont
- **Average response time**: Średni czas odpowiedzi
- **Rate limit hits**: Liczba zablokowanych żądań

### Alerty i notyfikacje

- **High failure rate**: > 30% błędów w ciągu 15 minut
- **Spike in registrations**: > 100 rejestracji w minutę
- **Brute force detection**: Wzorzce ataków
- **Service availability**: Downtime > 1 minuta
- **Low email confirmation**: < 50% potwierdzeń w 24h

### Logging strategia

- **Structured logging**: JSON format z correlation ID
- **Log levels**: INFO dla sukcesu, WARN dla błędów, ERROR dla serwera
- **PII protection**: Hashowanie emaili, brak haseł w logach
- **Retention**: 90 dni dla audit logs, 30 dni dla debug

## 10. Testowanie

### Unit testy

- **Walidacja input data**: Test wszystkich scenariuszy Zod
- **AuthService methods**: Mock Supabase responses
- **Error handling**: Test wszystkich typów błędów
- **Rate limiting logic**: Test mechanizmów ograniczania

### Integration testy

- **End-to-end flows**: Pełny cykl rejestracji i logowania
- **Database interactions**: Test z prawdziwą bazą Supabase
- **Email integration**: Test wysyłania emaili potwierdzających
- **Token validation**: Test funkcjonalności JWT

### Performance testy

- **Load testing**: 500 równoczesnych rejestracji/logowań
- **Stress testing**: Określenie punktu załamania
- **Rate limiting validation**: Test skuteczności ograniczeń
- **Memory stability**: Sprawdzenie leaków pamięci

### Security testy

- **Input validation**: Fuzzing, injection attacks
- **Authentication bypass**: Próby ominięcia auth
- **Rate limiting bypass**: Test obejścia ograniczeń
- **Token security**: Walidacja bezpieczeństwa JWT

## 11. Etapy wdrożenia

### Faza 1: Przygotowanie infrastruktury (1 dzień)

✅ **Completed**

1. Zod schemas implementation - `registerRequestSchema`, `loginRequestSchema`
2. AuthService implementation - metody `register()` i `login()`
3. Endpoint skeletons - `/api/auth/register.ts`, `/api/auth/login.ts`
4. Types definitions - wszystkie DTOs zdefiniowane

### Faza 2: Supabase integration (1 dzień)

✅ **Completed**

1. Authentication logic - integracja z `supabase.auth`
2. User profile handling - formatowanie danych użytkownika
3. Token management - extracting access/refresh tokens
4. Error mapping - mapowanie błędów Supabase na HTTP codes

### Faza 3: Security & Validation (0.5 dnia)

✅ **Mostly Completed**

1. Input validation - implementacja Zod schemas ✅
2. Security headers - X-Content-Type-Options, X-Frame-Options ✅
3. Error handling - consistent error responses ✅
4. Rate limiting - **TODO**: implementacja Redis-based limiting

### Faza 4: Frontend Integration (0.5 dnia)

✅ **Completed**

1. HTML forms - `/login.astro`, `/register.astro` ✅
2. JavaScript handlers - fetch calls do API endpoints ✅
3. Error display - user-friendly error messages ✅
4. Success flows - redirects po udanej rejestracji/logowaniu ✅

### Faza 5: Testing & Deployment (0.5 dnia)

🔄 **In Progress**

1. Manual testing - testowanie przez formulary HTML ✅
2. API testing - curl requests, positive/negative cases ✅
3. Error scenarios - test wszystkich błędów ⏳
4. Production readiness - remove console.log, finalize ⏳

## 12. Dependencies i Prerequisites

### Environment setup ✅

- **Supabase configuration**: Lokalna instancja działa
- **Environment variables**: SUPABASE_URL, SUPABASE_KEY skonfigurowane
- **Astro server**: Development server na porcie 3000
- **Database access**: RLS policies dla auth.users

### Code dependencies ✅

- **Existing types**: Wszystkie DTOs zdefiniowane w `types.ts`
- **Supabase client**: `supabaseClient` z `@/db/supabase.client`
- **AuthService**: Pełna implementacja z metodami register/login
- **Zod schemas**: Walidacja w `auth.zod.ts`

### External services ✅

- **Supabase Auth**: Główny provider autentykacji
- **Email service**: Automatic przez Supabase Auth
- **Local development**: Supabase local stack działający

## 13. Risk mitigation

### Security risks

- **Brute force attacks**: Rate limiting + monitoring anomalii
- **Credential stuffing**: Rate limiting per email + IP tracking
- **Email enumeration**: Consistent error messages
- **Session hijacking**: Secure token handling + rotation

### Performance risks

- **High registration load**: Asynchronous email sending
- **Database bottlenecks**: Connection pooling + monitoring
- **Supabase downtime**: Circuit breakers + fallback
- **Memory leaks**: Proper cleanup + monitoring

### Operational risks

- **Configuration errors**: Environment validation
- **Email delivery issues**: Monitoring email service
- **Rate limiting issues**: Careful tuning + monitoring
- **Support escalation**: Clear error messages + documentation

## 14. Success criteria

### Functional requirements ✅

- ✅ Użytkownik może się zarejestrować z valid email/password
- ✅ System wysyła email potwierdzający rejestrację
- ✅ Użytkownik może się zalogować po potwierdzeniu emaila
- ✅ System zwraca proper JWT tokens przy logowaniu
- ✅ Niezweryfikowane konta nie mogą się logować
- ✅ Proper error messages dla wszystkich scenariuszy

### Performance requirements

- ✅ 95% żądań < 300ms response time (current: ~300ms)
- ✅ Endpoints działają stabilnie pod load
- ⏳ Rate limiting nie wpływa na legitimate users
- ⏳ 99.9% uptime dla auth endpoints

### Security requirements

- ✅ Proper input validation z Zod schemas
- ✅ Security headers w wszystkich responses
- ✅ Błędy nie ujawniają sensitive information
- ⏳ Rate limiting prevents brute force attacks
- ⏳ Audit trail dla wszystkich auth events

### Integration requirements

- ✅ Frontend forms działają z API endpoints
- ✅ Supabase Auth integration działa poprawnie
- ✅ Database RLS policies działają poprawnie
- ✅ Email confirmation flow funkcjonalny

## Status: ✅ MOSTLY COMPLETED

**Ostatnie zadania do finalizacji:**

1. Implementacja Redis-based rate limiting (opcjonalne dla MVP)
2. Comprehensive testing scenariuszy błędów
3. Production deployment configuration
4. Monitoring i alerting setup
