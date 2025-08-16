# API Endpoint Implementation Plan: Additional Authentication Endpoints

## 1. Przegląd punktów końcowych

Ten plan obejmuje implementację 5 dodatkowych endpointów autentykacji dla aplikacji AI Flashcards, uzupełniających podstawowe funkcje login/register:

### POST /api/auth/logout

Endpoint do bezpiecznego wylogowania użytkownika poprzez invalidację aktualnej sesji. Implementuje server-side session invalidation i opcjonalnie blacklisting JWT tokens dla dodatkowego bezpieczeństwa.

### POST /api/auth/refresh

Endpoint do odnawiania access_token przy użyciu refresh_token. Kluczowy dla long-running sessions, implementuje token rotation i security best practices dla JWT refresh flow.

### GET /api/auth/me

Endpoint do pobierania profilu aktualnie zalogowanego użytkownika. Zwraca podstawowe informacje o koncie bez wrażliwych danych, używany przez frontend do weryfikacji stanu autentykacji.

### POST /api/auth/password/reset

Endpoint do inicjowania procesu resetowania hasła. Wysyła bezpieczny link resetowania na email użytkownika z tokenem o ograniczonym czasie życia.

### POST /api/auth/password/update

Endpoint do finalizacji procesu resetowania hasła. Waliduje token z emaila i umożliwia ustawienie nowego hasła z pełną integracją z Supabase Auth.

## 2. Szczegóły żądania

### POST /api/auth/logout

- **Metoda HTTP**: POST
- **Struktura URL**: `/api/auth/logout`
- **Headers**: `Authorization: Bearer <access_token>`
- **Brak request body**

### POST /api/auth/refresh

- **Metoda HTTP**: POST
- **Struktura URL**: `/api/auth/refresh`
- **Request Body**:

```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### GET /api/auth/me

- **Metoda HTTP**: GET
- **Struktura URL**: `/api/auth/me`
- **Headers**: `Authorization: Bearer <access_token>`
- **Brak request body**

### POST /api/auth/password/reset

- **Metoda HTTP**: POST
- **Struktura URL**: `/api/auth/password/reset`
- **Request Body**:

```json
{
  "email": "user@example.com"
}
```

### POST /api/auth/password/update

- **Metoda HTTP**: POST
- **Struktura URL**: `/api/auth/password/update`
- **Request Body**:

```json
{
  "token": "reset_token_from_email",
  "password": "NewSecurePassword123!"
}
```

## 3. Wykorzystywane typy

### Response DTOs

- `LogoutResponseDTO` (POST logout)
- `RefreshTokenResponseDTO` (POST refresh)
- `UserProfileResponseDTO` (GET me)
- `PasswordResetResponseDTO` (POST password/reset)
- `SuccessMessageResponseDTO` (POST password/update)
- `ErrorResponseDTO` (error responses)

### Request DTOs

- `RefreshTokenRequestDTO` (POST refresh)
- `PasswordResetRequestDTO` (POST password/reset)
- `PasswordUpdateRequestDTO` (POST password/update)

### Shared Types

- `UserProfile` (user profile data)
- `AuthTokens` (token data - partial for refresh)

### Validation Schemas (Zod)

- `refreshTokenRequestSchema`
- `passwordResetRequestSchema`
- `passwordUpdateRequestSchema`

## 4. Szczegóły odpowiedzi

### POST /api/auth/logout - Sukces (200 OK)

```json
{
  "message": "Logged out successfully"
}
```

### POST /api/auth/refresh - Sukces (200 OK)

```json
{
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 3600
  }
}
```

### GET /api/auth/me - Sukces (200 OK)

```json
{
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "email_confirmed_at": "2025-06-11T10:00:00Z",
    "created_at": "2025-06-11T10:00:00Z",
    "last_sign_in_at": "2025-06-11T09:30:00Z"
  }
}
```

### POST /api/auth/password/reset - Sukces (200 OK)

```json
{
  "message": "If an account with this email exists, you will receive password reset instructions"
}
```

### POST /api/auth/password/update - Sukces (200 OK)

```json
{
  "message": "Password updated successfully"
}
```

### Kody błędów (wszystkie endpointy)

- **400 Bad Request**: Nieprawidłowe dane wejściowe (walidacja Zod)
- **401 Unauthorized**: Brak autoryzacji, nieprawidłowy token, lub token wygasły
- **429 Too Many Requests**: Przekroczenie limitów rate limiting
- **500 Internal Server Error**: Błąd serwera (database, Supabase, email)

## 5. Przepływ danych

### POST /api/auth/logout

1. **Walidacja JWT token** - sprawdzenie Bearer token w header Authorization
2. **Sprawdzenie aktywnej sesji** - weryfikacja czy token jest aktywny w Supabase
3. **Session invalidation** - wywołanie `supabase.auth.signOut()`
4. **Optional token blacklisting** - dodanie token do blacklist cache (Redis)
5. **Audit logging** - zapis zdarzenia logout do systemu logów
6. **Zwrócenie potwierdzenia** - success message

### POST /api/auth/refresh

1. **Walidacja request body** - sprawdzenie refresh_token format przez Zod
2. **Refresh token validation** - weryfikacja przez `supabase.auth.refreshSession()`
3. **Sprawdzenie user status** - czy konto jest active i confirmed
4. **Token rotation** - generowanie nowego access_token (i opcjonalnie refresh_token)
5. **Session update** - aktualizacja last_activity timestamp
6. **Audit logging** - zapis refresh event
7. **Zwrócenie nowych tokenów** - access_token z expires_in

### GET /api/auth/me

1. **Walidacja JWT token** - sprawdzenie Bearer token w header
2. **User extraction** - pobranie user_id z JWT payload
3. **Fetch user profile** - pobranie aktualnych danych z `auth.users`
4. **Data sanitization** - usunięcie wrażliwych danych (hasło, refresh tokens)
5. **Profile formatting** - przygotowanie UserProfile DTO
6. **Zwrócenie profilu** - user data bez sensitive information

### POST /api/auth/password/reset

1. **Walidacja request body** - sprawdzenie email format przez Zod
2. **Rate limiting check** - ochrona przed spam requests
3. **Email normalization** - lowercase, trim, validation
4. **User lookup** - sprawdzenie czy email istnieje (bez ujawniania)
5. **Reset token generation** - `supabase.auth.resetPasswordForEmail()`
6. **Email sending** - wysłanie instrukcji resetowania przez Supabase
7. **Audit logging** - zapis password reset request (z hashed email)
8. **Generic response** - security-conscious message

### POST /api/auth/password/update

1. **Walidacja request body** - token i password validation przez Zod
2. **Token verification** - sprawdzenie reset token przez Supabase
3. **Password strength validation** - delegowanie do Supabase policy
4. **Password update** - `supabase.auth.updateUser()` z nowym hasłem
5. **Session invalidation** - wylogowanie ze wszystkich urządzeń
6. **Audit logging** - zapis successful password change
7. **Zwrócenie potwierdzenia** - success message

## 6. Względy bezpieczeństwa

### Autentykacja i autoryzacja

- **JWT Bearer tokens** - wymagane dla logout i me endpoints
- **Refresh token security** - secure storage, rotation, expiration
- **Session management** - proper invalidation, timeout handling
- **Token blacklisting** - optional Redis-based blacklist dla logout

### Password reset security

- **Rate limiting** - strict limits dla password reset requests
- **Token security** - time-limited, single-use reset tokens
- **Email verification** - tylko confirmed emails mogą resetować
- **Generic responses** - nie ujawnianie czy email istnieje

### Validation i input security

- **Zod schemas** - wszystkie request bodies
- **Email normalization** - consistent processing
- **Token format validation** - JWT structure verification
- **Password policy enforcement** - delegowanie do Supabase

### Audit i monitoring

- **Security event logging** - wszystkie auth events
- **Suspicious activity detection** - multiple failed attempts
- **Geographic tracking** - IP-based anomaly detection
- **Device fingerprinting** - optional dla advanced security

### Rate limiting

- **Password reset** - 5 requests per hour per IP
- **Token refresh** - 100 requests per hour per user
- **Me endpoint** - 1000 requests per hour per user
- **Logout** - 50 requests per hour per user

### Security headers

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security` dla HTTPS

## 7. Obsługa błędów

### Błędy walidacji (400 Bad Request)

- Nieprawidłowy format refresh_token
- Nieprawidłowy format email
- Słabe hasło (nie spełnia policy)
- Nieprawidłowy reset token format
- Brakujące wymagane pola

### Błędy autoryzacji (401 Unauthorized)

- Brak nagłówka Authorization (logout, me)
- Nieprawidłowy format Bearer token
- Token wygasły lub nieprawidłowy
- Refresh token invalid lub revoked
- Reset token expired lub invalid

### Błędy rate limiting (429 Too Many Requests)

- Przekroczenie limitów password reset
- Zbyt wiele prób refresh token
- Spam protection dla auth endpoints
- IP-based rate limiting

### Błędy user state (403 Forbidden)

- Unconfirmed email account
- Suspended user account
- Account locked due to security
- Email changes pending verification

### Błędy serwera (500 Internal Server Error)

- Błąd komunikacji z Supabase
- Email service unavailable
- Database connectivity issues
- Cache/Redis errors (token blacklist)
- Audit logging failures

### Format błędów

```json
{
  "error": {
    "code": "INVALID_REFRESH_TOKEN",
    "message": "The provided refresh token is invalid or has expired",
    "details": {
      "token_expired": true,
      "issued_at": "2025-06-01T10:00:00Z",
      "expires_at": "2025-06-01T10:30:00Z"
    }
  }
}
```

## 8. Rozważania dotyczące wydajności

### Token management optimization

- **JWT validation caching** - cache decoded tokens
- **Refresh token rate limiting** - prevent token abuse
- **Token blacklist optimization** - efficient Redis operations
- **Session cleanup** - automated expired session removal

### Database optimization

- **User lookup optimization** - indexed email queries
- **Audit log partitioning** - time-based partitions
- **Connection pooling** - efficient Supabase connections
- **Read replicas** - dla me endpoint read operations

### Caching strategia

- **User profile caching** - cache dla me endpoint (short TTL)
- **Rate limit caching** - Redis-based counters
- **Password reset throttling** - distributed rate limiting
- **Session state caching** - active session tracking

### Email service optimization

- **Async email sending** - nie blokować API response
- **Email template caching** - precompiled templates
- **Delivery tracking** - monitoring email success rates
- **Fallback providers** - backup email services

### Security performance

- **Efficient token validation** - minimize crypto operations
- **Blacklist optimization** - bloom filters dla scale
- **Audit log batching** - grupowanie log writes
- **Geographic IP lookup** - cached GeoIP data

### Monitoring i metryki

- **Authentication success rates** - tracking auth health
- **Token refresh patterns** - detecting anomalies
- **Password reset conversion** - email→completion rates
- **Response time monitoring** - <100ms dla większości endpoints

## 9. Etapy wdrożenia

### Faza 1: Przygotowanie infrastruktury (1 dzień)

1. **Utworzenie endpoint files** - API route files

   - `/api/auth/logout.ts`
   - `/api/auth/refresh.ts`
   - `/api/auth/me.ts`
   - `/api/auth/password/reset.ts`
   - `/api/auth/password/update.ts`

2. **Rozszerzenie AuthService** - dodanie nowych metod

   - `logout()`
   - `refreshToken()`
   - `getCurrentUser()`
   - `requestPasswordReset()`
   - `updatePassword()`

3. **Zod schemas implementacja**
   - `refreshTokenRequestSchema`
   - `passwordResetRequestSchema`
   - `passwordUpdateRequestSchema`

### Faza 2: Implementacja session management (1.5 dnia)

1. **POST /api/auth/logout**

   - JWT token validation
   - Supabase session invalidation
   - Optional token blacklisting
   - Audit logging implementation

2. **POST /api/auth/refresh**

   - Refresh token validation
   - Token rotation logic
   - Session update handling
   - Security event logging

3. **GET /api/auth/me**
   - User profile extraction
   - Data sanitization
   - Profile formatting
   - Caching implementation

### Faza 3: Password reset implementation (2 dni)

1. **POST /api/auth/password/reset**

   - Email validation i normalization
   - Rate limiting implementation
   - Supabase password reset integration
   - Email sending verification

2. **POST /api/auth/password/update**

   - Reset token validation
   - Password policy enforcement
   - Secure password update
   - All-session invalidation

3. **Email integration testing**
   - Template customization
   - Delivery verification
   - Error handling for email failures
   - Fallback mechanisms

### Faza 4: Security hardening (1 dzień)

1. **Rate limiting implementation**

   - Redis-based rate limiters
   - IP i user-based limits
   - Distributed throttling
   - Grace period handling

2. **Audit logging enhancement**

   - Structured security logs
   - PII protection in logs
   - Log retention policies
   - Real-time alerting

3. **Token security**
   - Blacklist implementation
   - Token rotation policies
   - Security event detection
   - Anomaly alerting

### Faza 5: Performance optimization (1 dzień)

1. **Caching implementation**

   - User profile caching
   - Rate limit counters
   - Session state caching
   - Cache invalidation strategies

2. **Database optimization**

   - Query optimization
   - Index verification
   - Connection pooling tuning
   - Read replica utilization

3. **Response optimization**
   - Payload minimization
   - Async operations
   - Error response consistency
   - Performance monitoring

### Faza 6: Testing i integration (1.5 dnia)

1. **Unit testing**

   - AuthService methods testing
   - Security logic validation
   - Edge cases coverage
   - Mock integrations

2. **Integration testing**

   - End-to-end auth flows
   - Password reset full cycle
   - Token refresh scenarios
   - Cross-browser compatibility

3. **Security testing**
   - Rate limiting validation
   - Token security testing
   - Input validation testing
   - Session management testing

### Faza 7: Monitoring i deployment (0.5 dnia)

1. **Monitoring setup**

   - Authentication metrics
   - Security event tracking
   - Performance monitoring
   - Error rate alerting

2. **Production deployment**
   - Staging validation
   - Feature flag deployment
   - Production verification
   - Rollback procedures

**Całkowity czas implementacji: 8.5 dnia**

### Dependencies i Prerequisites

- ✅ Istniejąca infrastruktura Supabase Auth
- ✅ Podstawowe typy w types.ts (AuthTokens, UserProfile, etc.)
- ✅ AuthService foundation
- ⏳ Redis setup dla rate limiting i token blacklist
- ⏳ Email service configuration (Supabase)
- ⏳ Audit logging infrastructure
- ⏳ Monitoring i alerting setup

### Integration z istniejącymi endpointami

- **POST /api/auth/login** - source refresh_token dla refresh endpoint
- **POST /api/auth/register** - email confirmation przed password reset
- **Wszystkie authenticated endpoints** - używają JWT validation z logout blacklist
- **Frontend auth state** - GET /api/auth/me dla session verification
