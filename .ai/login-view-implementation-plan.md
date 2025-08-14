# Plan implementacji widoku Logowania

## 1. Przegląd

Widok logowania umożliwia uwierzytelnienie istniejących użytkowników w aplikacji AI Flashcards. Implementuje bezpieczną autentykację z wykorzystaniem Supabase Auth, obsługuje walidację danych, rate limiting oraz różne scenariusze błędów. Widok jest zbudowany z wykorzystaniem Astro 5 dla struktury strony oraz React 19 dla interaktywnych komponentów formularza.

## 2. Routing widoku

- **Ścieżka**: `/login`
- **Plik**: `src/pages/login.astro`
- **Layout**: Wykorzystuje główny Layout aplikacji
- **Przekierowania**: Po udanym logowaniu przekierowanie do `/dashboard` lub strony docelowej zapisanej w `returnUrl`

## 3. Struktura komponentów

```
LoginPage (.astro)
├── Layout
│   ├── Head (meta, title, SEO)
│   └── main
│       ├── LoginForm (React, client:load)
│       │   ├── EmailInput
│       │   │   ├── Label
│       │   │   ├── Input[type="email"]
│       │   │   └── ErrorMessage
│       │   ├── PasswordInput
│       │   │   ├── Label
│       │   │   ├── Input[type="password"]
│       │   │   ├── ToggleVisibilityButton
│       │   │   └── ErrorMessage
│       │   ├── AlertInline (błędy globalne)
│       │   └── SubmitButton
│       └── NavigationLinks
│           ├── RegisterLink
│           └── ResetPasswordLink
```

## 4. Szczegóły komponentów

### LoginPage (Astro)

- **Opis**: Główny kontener strony logowania z SEO meta tagami i layoutem
- **Główne elementy**: Layout wrapper, title, meta description, LoginForm z client:load
- **Obsługiwane interakcje**: Brak (statyczny kontener)
- **Obsługiwana walidacja**: Brak
- **Typy**: Brak
- **Propsy**: Brak

### LoginForm (React)

- **Opis**: Główny komponent formularza zarządzający stanem, walidacją i submission
- **Główne elementy**: form element, EmailInput, PasswordInput, SubmitButton, AlertInline, NavigationLinks
- **Obsługiwane interakcje**: form submission, field validation, error handling, API communication
- **Obsługiwana walidacja**: Email format, password required, overall form validation
- **Typy**: LoginFormState, LoginFormData, LoginFormErrors
- **Propsy**: returnUrl?: string

### EmailInput (React)

- **Opis**: Pole wprowadzania adresu email z walidacją formatu
- **Główne elementy**: Label, Input[type="email"], ErrorMessage
- **Obsługiwane interakcje**: onChange, onBlur, focus management
- **Obsługiwana walidacja**: Email format (RFC 5322), required field, max 254 characters
- **Typy**: EmailInputProps
- **Propsy**: value, onChange, onBlur, error, disabled, required

### PasswordInput (React)

- **Opis**: Pole hasła z możliwością przełączania widoczności
- **Główne elementy**: Label, Input[type="password"], ToggleVisibilityButton, ErrorMessage
- **Obsługiwane interakcje**: onChange, onBlur, toggle visibility, focus management
- **Obsługiwana walidacja**: Required field, minimum 8 characters
- **Typy**: PasswordInputProps
- **Propsy**: value, onChange, onBlur, showPassword, onToggleVisibility, error, disabled

### SubmitButton (React)

- **Opis**: Przycisk wysyłania formularza ze stanami loading i disabled
- **Główne elementy**: Button element, loading spinner, text content
- **Obsługiwane interakcje**: onClick (form submission), loading state management
- **Obsługiwana walidacja**: Disabled when form invalid lub during submission
- **Typy**: SubmitButtonProps
- **Propsy**: isLoading, isDisabled, onClick

### AlertInline (React)

- **Opis**: Komponent wyświetlający błędy globalne i komunikaty API
- **Główne elementy**: Alert container, error icon, message text, close button
- **Obsługiwane interakcje**: Close button, auto-dismiss
- **Obsługiwana walidacja**: Brak
- **Typy**: AlertInlineProps
- **Propsy**: message, type, onClose, autoClose

### NavigationLinks (React)

- **Opis**: Linki nawigacyjne do rejestracji i resetowania hasła
- **Główne elementy**: Link containers, anchor elements
- **Obsługiwane interakcje**: Click navigation
- **Obsługiwana walidacja**: Brak
- **Typy**: Brak
- **Propsy**: Brak

## 5. Typy

### Nowe typy ViewModel

```typescript
// Stan danych formularza
interface LoginFormData {
  email: string;
  password: string;
  showPassword: boolean;
}

// Błędy walidacji formularza
interface LoginFormErrors {
  email?: string;
  password?: string;
  general?: string;
}

// Kompleksowy stan formularza
interface LoginFormState {
  data: LoginFormData;
  errors: LoginFormErrors;
  isSubmitting: boolean;
  isValid: boolean;
}

// Bazowe propsy dla pól formularza
interface FormFieldProps {
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  required?: boolean;
  disabled?: boolean;
}

// Propsy dla pola email
interface EmailInputProps extends FormFieldProps {
  type: 'email';
  placeholder?: string;
  autoComplete?: string;
}

// Propsy dla pola hasła
interface PasswordInputProps extends FormFieldProps {
  type: 'password';
  showPassword: boolean;
  onToggleVisibility: () => void;
  placeholder?: string;
}

// Propsy dla przycisku submit
interface SubmitButtonProps {
  isLoading: boolean;
  isDisabled: boolean;
  onClick: (e: FormEvent) => void;
  children: ReactNode;
}

// Propsy dla komponentu alertów
interface AlertInlineProps {
  message: string;
  type: 'error' | 'warning' | 'info';
  onClose?: () => void;
  autoClose?: boolean;
}
```

### Istniejące typy API (z types.ts)

- `LoginRequestDTO` - dane wejściowe API
- `LoginResponseDTO` - odpowiedź API z tokenami
- `ErrorResponseDTO` - standardowy format błędów
- `UserProfile` - profil użytkownika
- `AuthTokens` - struktura JWT tokenów

## 6. Zarządzanie stanem

### Custom Hook: useLoginForm

```typescript
interface UseLoginFormReturn {
  formState: LoginFormState;
  handleEmailChange: (email: string) => void;
  handlePasswordChange: (password: string) => void;
  handleTogglePassword: () => void;
  handleSubmit: (e: FormEvent) => Promise<void>;
  validateField: (field: keyof LoginFormData) => void;
  clearErrors: () => void;
}
```

**Funkcjonalności hook:**

- Zarządzanie stanem formularza (data, errors, loading)
- Real-time walidacja pól (on blur)
- Obsługa submission z API call
- Error handling i recovery
- Focus management
- Form reset po błędach

**Stan lokalny w komponencie:**

- `formState` - główny stan formularza
- `apiError` - błędy z API responses
- `isSubmitting` - stan ładowania

## 7. Integracja API

### Endpoint: POST /api/auth/login

**Request Type**: `LoginRequestDTO`

```typescript
{
  email: string;    // valid email format, max 254 chars
  password: string; // min 8 chars, max 128 chars
}
```

**Response Type**: `LoginResponseDTO`

```typescript
{
  data: {
    user: UserProfile;
    tokens: AuthTokens;
  }
}
```

**Obsługa odpowiedzi:**

- **200 OK**: Zapisz tokeny, przekieruj do dashboard
- **400 Bad Request**: Pokaż błędy walidacji
- **401 Unauthorized**: Pokaż błąd autoryzacji lub weryfikacji
- **429 Too Many Requests**: Pokaż komunikat o rate limiting
- **500 Internal Server Error**: Pokaż błąd ogólny

**Strategia przechowywania tokenów:**

- Access token: sessionStorage (krótkotrwały)
- Refresh token: httpOnly cookie (preferowane) lub localStorage z szyfrowaniem

## 8. Interakcje użytkownika

### Scenariusze interakcji

1. **Wpisywanie email:**
   - User wpisuje w pole email → real-time format validation
   - onBlur → walidacja i pokazanie błędu jeśli nieprawidłowy
   - onFocus → czyszczenie błędu jeśli format poprawny

2. **Wpisywanie hasła:**
   - User wpisuje hasło → pole masked domyślnie
   - onBlur → walidacja minimum length
   - Toggle visibility → switch między text/password type

3. **Submission formularza:**
   - Click Submit lub Enter → walidacja wszystkich pól
   - Invalid form → pokaż błędy, focus na pierwszy błędny
   - Valid form → disable form, show loading, API call

4. **Sukces logowania:**
   - Zapisz tokeny do storage
   - Przekieruj do dashboard lub returnUrl
   - Update global auth state

5. **Błąd logowania:**
   - Pokaż odpowiedni komunikat błędu
   - Re-enable form
   - Zachowaj email, wyczyść hasło
   - Focus na problematyczne pole

6. **Nawigacja:**
   - "Nie masz konta?" → /register
   - "Zapomniałeś hasła?" → /reset-password

## 9. Warunki i walidacja

### Walidacja po stronie klienta

**EmailInput:**

- Format email (RFC 5322 regex)
- Required field validation
- Max 254 characters
- Real-time validation on blur

**PasswordInput:**

- Required field validation
- Minimum 8 characters
- Maximum 128 characters
- Real-time validation on blur

**Form level:**

- Wszystkie pola wymagane
- Submit disabled jeśli validation errors
- Clear errors on successful validation

### Walidacja API i error handling

**400 Bad Request:**

- Mapuj błędy na odpowiednie pola
- Pokaż specific field errors

**401 Unauthorized:**

- "Nieprawidłowy email lub hasło" (wrong credentials)
- "Potwierdź swój email przed logowaniem" (unverified email)

**429 Too Many Requests:**

- "Zbyt wiele prób logowania. Spróbuj ponownie za 15 minut"
- Disable form na określony czas

## 10. Obsługa błędów

### Typy błędów i strategie

1. **Błędy walidacji klienta:**
   - Pokaż immediately on blur
   - Clear when field becomes valid
   - Prevent submission until resolved

2. **Błędy API:**
   - 400: Field-specific errors w ErrorMessage components
   - 401: Global error w AlertInline
   - 429: Global error z countdown timer
   - 500: Generic "Spróbuj ponownie" message

3. **Błędy sieci:**
   - Network unavailable: "Sprawdź połączenie z internetem"
   - Timeout: "Żądanie przekroczyło limit czasu"
   - Fallback dla wszystkich network errors

4. **Błędy storage:**
   - localStorage unavailable → sessionStorage fallback
   - Quota exceeded → clear old tokens

5. **Accessibility errors:**
   - Screen reader announcements dla errors
   - Focus management na error fields
   - ARIA live regions dla dynamic messages

### Error recovery

- Auto-retry mechanizm dla network errors
- Clear error states on user input
- Graceful degradation dla storage issues

## 11. Kroki implementacji

1. **Przygotowanie struktury plików**
   - Utwórz `src/pages/login.astro`
   - Utwórz folder `src/components/auth/` dla komponentów React
   - Utwórz `src/hooks/useLoginForm.ts`
   - Utwórz `src/utils/validation.ts`

2. **Implementacja typów**
   - Dodaj nowe ViewModel types do `src/types.ts`
   - Export wszystkich potrzebnych interfejsów
   - Ensure compatibility z istniejącymi API types

3. **Utility functions**
   - `validateEmail()` - email format validation
   - `validatePassword()` - password strength validation
   - `formatApiError()` - API error message formatting
   - `tokenStorage` - secure token management

4. **Base components**
   - `EmailInput` - z walidacją i accessibility
   - `PasswordInput` - z toggle visibility
   - `SubmitButton` - z loading states
   - `AlertInline` - dla error messages

5. **Custom hook implementation**
   - `useLoginForm` z complete form logic
   - State management
   - Validation logic
   - API integration
   - Error handling

6. **Main LoginForm component**
   - Integrate wszystkie sub-components
   - Use useLoginForm hook
   - Handle form submission
   - Manage loading states

7. **Astro page implementation**
   - `login.astro` z SEO meta tags
   - Proper Layout integration
   - Client-side hydration dla LoginForm
   - Navigation i routing

8. **API integration**
   - HTTP client dla login endpoint
   - Response handling
   - Token storage implementation
   - Redirect logic

9. **Error handling refinement**
   - Global error boundaries
   - Specific error messages
   - Accessibility improvements
   - User feedback enhancement

10. **Testing i accessibility**
    - Unit tests dla validation functions
    - Integration tests dla form submission
    - Accessibility audit z screen reader
    - Cross-browser testing

11. **Performance optimization**
    - Code splitting dla React components
    - Lazy loading dla non-critical parts
    - Bundle size optimization
    - Loading state improvements

12. **Documentation i review**
    - Code comments dla complex logic
    - README updates
    - Security review
    - Final testing i deployment
