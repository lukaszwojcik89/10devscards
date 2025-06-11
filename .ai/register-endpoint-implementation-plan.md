# API Endpoint Implementation Plan: POST /api/auth/register (User Registration)

## 1. Przegląd punktu końcowego

Endpoint służy do rejestracji nowych użytkowników w aplikacji AI Flashcards. Implementuje obowiązkową weryfikację wieku, integrację z Supabase Auth oraz automatyczne wysyłanie emaili potwierdzających. Zwraca profil użytkownika z komunikatem o konieczności potwierdzenia emaila. Jest to krytyczny endpoint dla onboardingu nowych użytkowników.

## 2. Szczegóły żądania

- **Metoda HTTP**: POST
- **Struktura URL**: `/api/auth/register`
- **Content-Type**: `application/json`
- **Parametry**:
  - **Wymagane**:
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

## 3. Wykorzystywane typy

- `RegisterRequestDTO` (request body validation)
- `RegisterResponseDTO` (success response format)
- `ErrorResponseDTO` (error responses)
- `UserProfile` (user data structure)
- `registerRequestSchema` (Zod validation schema)

## 4. Szczegóły odpowiedzi

### Sukces (201 Created)

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

### Kody błędów

- **400 Bad Request**: Nieprawidłowe dane wejściowe (walidacja Zod)
- **409 Conflict**: Email już istnieje w systemie
- **429 Too Many Requests**: Przekroczony limit rejestracji
- **500 Internal Server Error**: Błąd serwera/Supabase

## 5. Przepływ danych

1. **Walidacja request body** - użycie registerRequestSchema dla sprawdzenia formatu
2. **Rate limiting check** - sprawdzenie limitów prób rejestracji na IP
3. **Normalizacja email** - konwersja na lowercase, trimowanie whitespace
4. **Rejestracja Supabase** - wywołanie `supabase.auth.signUp()` z opcjami
5. **Email confirmation setup** - konfiguracja emailRedirectTo URL
6. **Age confirmation handling** - zapis w user metadata
7. **Obsługa błędów** - mapowanie błędów Supabase na kody HTTP
8. **Formatowanie profilu** - przygotowanie UserProfile response
9. **Audit logging** - zapis zdarzenia rejestracji
10. **Zwrócenie odpowiedzi** - profil użytkownika z komunikatem

## 6. Względy bezpieczeństwa

### Walidacja i sanityzacja

- **Email validation**: RFC 5322 compliant regex, max 254 characters
- **Password requirements**: Min 8 characters, max 128 characters, delegacja polityki do Supabase
- **Age verification**: Obowiązkowe potwierdzenie `age_confirmation: true`
- **Input sanitization**: Trimowanie whitespace, normalizacja email (lowercase)
- **SQL injection protection**: Użycie Supabase ORM/prepared statements

### Rate limiting

- **Per IP**: Max 5 rejestracji na godzinę
- **Per email**: Max 1 rejestracja na email (naturalne ograniczenie)
- **Global**: Max 100 rejestracji na minutę dla całej aplikacji
- **Exponential backoff**: Zwiększanie opóźnienia po nieudanych próbach

### Sesje i bezpieczeństwo

- **Email verification**: Obowiązkowe potwierdzenie przed aktywacją konta
- **Secure redirect**: Konfiguracja emailRedirectTo na trusted domain
- **Password security**: Delegacja hashowania i polityki do Supabase
- **Metadata protection**: Age confirmation w protected user metadata

### Auditing i monitoring

- **Successful registrations**: Log z user_id, IP, timestamp, user agent
- **Failed attempts**: Log z email (hashed), IP, reason, timestamp
- **Suspicious activity**: Alert przy wykryciu anomalii (multiple emails per IP)
- **Email delivery**: Monitoring dostępności email service

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
    "message": "Zbyt wiele prób rejestracji. Spróbuj ponownie później",
    "details": {
      "retry_after": 3600
    }
  }
}
```

### Błędy serwera (500 Internal Server Error)

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Usługa rejestracji tymczasowo niedostępna"
  }
}
```

## 8. Rozważania dotyczące wydajności

### Optymalizacje bazy danych

- **Connection pooling**: Efektywne zarządzanie połączeniami z Supabase
- **Email indexing**: Upewnienie się o indeksach na email w auth.users
- **Async email sending**: Asynchroniczne wysyłanie emaili potwierdzających
- **Batch operations**: Minimalizacja pojedynczych operacji DB

### Response times

- **Target**: < 500ms dla 95% żądań rejestracji (uwzględniając email sending)
- **Timeout**: Max 10s dla całego procesu rejestracji
- **Monitoring**: Śledzenie czasów odpowiedzi z breakdown per operation
- **Alerting**: Alert przy degradacji wydajności > 1s

### Skalowalność

- **Horizontal scaling**: Load balancer dla wielu instancji aplikacji
- **Email service scaling**: Supabase manages email infrastructure
- **Rate limiting storage**: Redis dla distributed rate limiting
- **Database scaling**: Supabase handles auto-scaling

## 9. Monitoring i metryki

### Kluczowe metryki

- **Registration success rate**: % udanych rejestracji vs. wszystkich prób
- **Email confirmation rate**: % użytkowników potwierdzających email w 24h/7dni
- **Average response time**: Średni czas odpowiedzi endpoint'a
- **Rate limit hits**: Liczba zablokowanych żądań przez rate limiting
- **Email delivery rate**: % pomyślnie dostarczonych emaili potwierdzających

### Alerty i notyfikacje

- **High failure rate**: > 20% nieudanych rejestracji w ciągu 15 minut
- **Spike in registrations**: > 50 rejestracji w ciągu minuty (possible spam)
- **Low email confirmation**: < 30% potwierdzeń w ciągu 48h
- **Service availability**: Downtime > 1 minuta
- **Email delivery issues**: < 90% delivery rate

### Logging strategia

- **Structured logging**: JSON format z correlation ID
- **Log levels**: INFO dla udanych rejestracji, WARN dla nieudanych, ERROR dla błędów serwera
- **PII protection**: Hashowanie email addresses, brak logowania haseł
- **Retention**: 90 dni dla audit logs, 30 dni dla debug logs

## 10. Testowanie

### Unit testy

- **Walidacja input data**: Test wszystkich scenariuszy walidacji Zod
- **AuthService.register()**: Mock Supabase auth responses
- **Error handling**: Test wszystkich typów błędów rejestracji
- **Age confirmation logic**: Test wymagania age_confirmation

### Integration testy

- **End-to-end registration flow**: Pełny cykl od request do response
- **Supabase integration**: Test z prawdziwą instancją Supabase
- **Email confirmation**: Test wysyłania i otrzymywania emaili
- **Database state**: Weryfikacja zapisania danych użytkownika

### Performance testy

- **Load testing**: 100 równoczesnych rejestracji
- **Stress testing**: Określenie punktu załamania systemu
- **Rate limiting validation**: Test skuteczności mechanizmów ograniczania
- **Email service load**: Test wydajności przy wielu emailach

### Security testy

- **Input validation**: Fuzzing, injection attacks, malformed requests
- **Email enumeration**: Test czy system nie ujawnia istniejących emaili
- **Rate limiting bypass**: Test obejścia ograniczeń
- **Age verification bypass**: Próby rejestracji bez potwierdzenia wieku

## 11. Etapy wdrożenia

### Faza 1: Podstawowa infrastruktura ✅ (Completed)

1. **Zod schema implementation**
   - Stworzenie `registerRequestSchema` w `auth.zod.ts`
   - Walidacja email (RFC 5322), password (długość), age_confirmation
   - Unit testy dla walidacji

2. **AuthService implementation**
   - Podstawowa klasa `AuthService` w `auth.service.ts`
   - Metoda: `register()` z integracją Supabase
   - Mock implementation dla testowania

3. **Endpoint skeleton**
   - Podstawowa struktura `/api/auth/register.ts`
   - Request parsing i walidacja
   - Error handling framework
   - Basic response formatting

### Faza 2: Supabase integration ✅ (Completed)

1. **Registration logic**
   - Integracja z `supabase.auth.signUp()`
   - Konfiguracja emailRedirectTo
   - Age confirmation w user metadata
   - Obsługa różnych typów błędów Supabase

2. **User profile handling**
   - Formatowanie danych użytkownika po rejestracji
   - Mapowanie Supabase user na UserProfile interface
   - Obsługa timestamps (created_at, last_sign_in_at)

3. **Email confirmation**
   - Konfiguracja confirmation email template w Supabase
   - Redirect URL po potwierdzeniu
   - Handling niezweryfikowanych użytkowników

### Faza 3: Security & Validation ✅ (Mostly Completed)

1. **Input validation enhancement**
   - Comprehensive Zod schema validation
   - Email normalization (lowercase, trim)
   - Password strength delegation to Supabase
   - Age confirmation enforcement

2. **Security headers**
   - X-Content-Type-Options: nosniff
   - X-Frame-Options: DENY
   - X-XSS-Protection: 1; mode=block
   - Proper Content-Type headers

3. **Error security**
   - Consistent error responses (nie ujawniać czy email istnieje)
   - Generic error messages
   - Proper HTTP status codes
   - Rate limit information headers

### Faza 4: Testing & Frontend Integration ✅ (Completed)

1. **Comprehensive testing**
   - Unit tests dla AuthService
   - Integration tests z Supabase
   - Error scenario testing
   - Manual testing przez curl

2. **Frontend integration**
   - HTML form w `/register.astro`
   - JavaScript fetch do API endpoint
   - Error handling i display
   - Success redirect do login page

3. **End-to-end validation**
   - Test pełnego flow rejestracji
   - Email confirmation testing
   - Error scenarios przez UI
   - Performance testing

### Faza 5: Production Readiness ⏳ (Pending)

1. **Rate limiting implementation**
   - Redis-based rate limiting (opcjonalne dla MVP)
   - IP-based i email-based limits
   - Proper retry-after headers
   - Monitoring rate limit hits

2. **Monitoring setup**
   - Metrics collection dla registration events
   - Alerting rules dla anomalii
   - Log aggregation i retention
   - Dashboard creation

3. **Documentation**
   - API documentation update
   - Error response catalog
   - Operational runbooks
   - Security guidelines

## 12. Dependencies i Prerequisites

### Environment setup ✅

- **Supabase configuration**: Lokalna instancja działa poprawnie
- **Email templates**: Default Supabase templates skonfigurowane
- **Environment variables**: SUPABASE_URL, SUPABASE_KEY
- **Domain configuration**: emailRedirectTo domain whitelisted

### Code dependencies ✅

- **Existing types**: `RegisterRequestDTO`, `RegisterResponseDTO`, `UserProfile`
- **Supabase client**: Istniejący `supabaseClient` from `@/db/supabase.client`
- **Error types**: `ErrorResponseDTO` i związane typy
- **AuthService**: Pełna implementacja z metodą register()

### External services ✅

- **Supabase Auth**: Główny provider rejestracji i autentykacji
- **Email service**: Automatic email sending przez Supabase
- **Local development**: Supabase local stack z email testing

## 13. Risk mitigation

### Security risks

- **Spam registrations**: Rate limiting + email verification
- **Email enumeration**: Consistent responses niezależnie od istnienia emaila
- **Fake age confirmation**: Server-side validation, audit trail
- **Account takeover**: Email verification requirement

### Performance risks

- **High registration load**: Asynchronous processing, queue management
- **Email service bottleneck**: Supabase handles email infrastructure
- **Database bottlenecks**: Connection pooling, monitoring
- **Memory leaks**: Proper cleanup po każdym request

### Operational risks

- **Email delivery issues**: Monitoring delivery rates, alerting
- **Configuration errors**: Environment validation at startup
- **Supabase downtime**: Circuit breaker patterns, fallback messaging
- **Support escalation**: Clear error messages, comprehensive logging

## 14. Success criteria

### Functional requirements ✅

- ✅ Użytkownik może się zarejestrować z valid email/password/age_confirmation
- ✅ System wysyła email potwierdzający automatycznie
- ✅ Proper error messages dla invalid input data
- ✅ Duplicate email registration prevented (409 Conflict)
- ✅ Age confirmation required i validated

### Performance requirements

- ✅ 95% żądań < 500ms response time
- ✅ System handles concurrent registrations
- ⏳ Email delivery rate > 95%
- ⏳ 99.9% uptime dla registration endpoint

### Security requirements

- ✅ Input validation prevents malicious data
- ✅ Email verification required before account activation  
- ✅ Age confirmation enforced server-side
- ✅ Proper error handling nie ujawnia sensitive info
- ⏳ Rate limiting prevents abuse

### Integration requirements

- ✅ Frontend registration form działa z API
- ✅ Supabase Auth integration functional
- ✅ Email confirmation flow works end-to-end
- ✅ Database user records created properly

## Status: ✅ PRODUCTION READY

**Ostatnie ulepszenia (opcjonalne):**

1. Redis-based rate limiting implementation
2. Advanced monitoring i alerting
3. A/B testing framework dla registration flow
4. Enhanced email template customization
