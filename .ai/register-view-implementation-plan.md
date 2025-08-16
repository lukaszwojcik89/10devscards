# Plan implementacji widoku Rejestracji

## 1. Przegląd

Widok rejestracji umożliwia utworzenie nowego konta użytkownika w aplikacji AI Flashcards. Implementuje bezpieczną rejestrację z wykorzystaniem Supabase Auth przez magic link, obsługuje walidację danych oraz wymagania prawne dotyczące wieku użytkownika. Widok jest zbudowany z wykorzystaniem Astro 5 dla struktury strony oraz React 19 dla interaktywnych komponentów formularza. Po udanej rejestracji użytkownik musi zweryfikować swój adres e-mail przed pierwszym logowaniem.

## 2. Routing widoku

- **Ścieżka**: `/register`
- **Plik**: `src/pages/register.astro`
- **Layout**: Wykorzystuje główny Layout aplikacji
- **Przekierowania**: Po udanej rejestracji przekierowanie do `/verify-email` lub wyświetlenie instrukcji weryfikacji

## 3. Struktura komponentów

```
RegisterPage (.astro)
├── Layout
│   ├── Head (meta, title, SEO)
│   └── main
│       ├── RegisterForm (React, client:load)
│       │   ├── EmailInput
│       │   │   ├── Label
│       │   │   ├── Input[type="email"]
│       │   │   └── ErrorMessage
│       │   ├── AgeConfirmationCheckbox
│       │   │   ├── Checkbox
│       │   │   ├── Label (z tekstem prawnym)
│       │   │   └── ErrorMessage
│       │   ├── AlertInfo (komunikat o weryfikacji)
│       │   └── SubmitButton
│       └── NavigationLinks
│           └── LoginLink
```

## 4. Szczegóły komponentów

### RegisterPage (Astro)

- **Opis**: Główny kontener strony rejestracji z SEO meta tagami i layoutem
- **Główne elementy**: Layout wrapper, title, meta description, RegisterForm z client:load
- **Obsługiwane interakcje**: Brak (statyczny kontener)
- **Obsługiwana walidacja**: Brak
- **Typy**: Brak
- **Propsy**: Brak

### RegisterForm (React)

- **Opis**: Główny komponent formularza zarządzający stanem, walidacją i submission rejestracji przez magic link
- **Główne elementy**: form element, EmailInput, AgeConfirmationCheckbox, AlertInfo, SubmitButton, NavigationLinks
- **Obsługiwane interakcje**: form submission, field validation, error handling, API communication, success state management
- **Obsługiwana walidacja**: Email format, age confirmation required, overall form validation
- **Typy**: RegisterFormState, RegisterFormData, RegisterFormErrors
- **Propsy**: Brak

### EmailInput (React)

- **Opis**: Pole wprowadzania adresu email z walidacją formatu (reuse z login widoku)
- **Główne elementy**: Label, Input[type="email"], ErrorMessage
- **Obsługiwane interakcje**: onChange, onBlur, focus management
- **Obsługiwana walidacja**: Email format (RFC 5322), required field, max 254 characters
- **Typy**: EmailInputProps
- **Propsy**: value, onChange, onBlur, error, disabled, required

### AgeConfirmationCheckbox (React)

- **Opis**: Checkbox z wymaganym potwierdzeniem wieku ≥ 16 lat zgodnie z wymaganiami prawnymi
- **Główne elementy**: Checkbox input, Label z tekstem prawnym, ErrorMessage
- **Obsługiwane interakcje**: onChange (toggle checked state), focus management
- **Obsługiwana walidacja**: Required field (must be true), boolean validation
- **Typy**: AgeConfirmationProps
- **Propsy**: checked, onChange, error, disabled, required (always true)

### SubmitButton (React)

- **Opis**: Przycisk wysyłania formularza ze stanami loading i disabled
- **Główne elementy**: Button element, loading spinner, text content ("Zarejestruj się")
- **Obsługiwane interakcje**: onClick (form submission), loading state management
- **Obsługiwana walidacja**: Disabled when form invalid lub during submission
- **Typy**: SubmitButtonProps
- **Propsy**: isLoading, isDisabled, onClick

### AlertInfo (React)

- **Opis**: Komponent wyświetlający komunikaty informacyjne o procesie weryfikacji e-mail
- **Główne elementy**: Alert container, info icon, message text, optional close button
- **Obsługiwane interakcje**: Close button (optional), auto-dismiss
- **Obsługiwana walidacja**: Brak
- **Typy**: AlertInfoProps
- **Propsy**: title, message, type, onClose, autoClose

### NavigationLinks (React)

- **Opis**: Link nawigacyjny do strony logowania
- **Główne elementy**: Link container, anchor element ("Masz już konto? Zaloguj się")
- **Obsługiwane interakcje**: Click navigation
- **Obsługiwana walidacja**: Brak
- **Typy**: Brak
- **Propsy**: Brak

## 5. Typy

### Nowe typy ViewModel

```typescript
// Stan danych formularza rejestracji
interface RegisterFormData {
  email: string;
  age_confirmation: boolean;
}

// Błędy walidacji formularza rejestracji
interface RegisterFormErrors {
  email?: string;
  age_confirmation?: string;
  general?: string;
}

// Kompleksowy stan formularza rejestracji
interface RegisterFormState {
  data: RegisterFormData;
  errors: RegisterFormErrors;
  isSubmitting: boolean;
  isValid: boolean;
  isSuccess: boolean; // pokazuje success state po rejestracji
}

// Propsy dla checkbox potwierdzenia wieku
interface AgeConfirmationProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
  disabled?: boolean;
  required: true; // zawsze wymagane
}

// Propsy dla komponentu alertów informacyjnych
interface AlertInfoProps {
  title?: string;
  message: string;
  type: "info" | "success" | "warning";
  onClose?: () => void;
  autoClose?: boolean;
}

// Propsy dla pola email (reuse z login)
interface EmailInputProps extends FormFieldProps {
  type: "email";
  placeholder?: string;
  autoComplete?: string;
}

// Propsy dla przycisku submit
interface SubmitButtonProps {
  isLoading: boolean;
  isDisabled: boolean;
  onClick: (e: FormEvent) => void;
  children: ReactNode;
}
```

### Istniejące typy API (z types.ts)

- `RegisterRequestDTO` - dane wejściowe API { email, age_confirmation }
- `RegisterResponseDTO` - odpowiedź API z profilem użytkownika
- `ErrorResponseDTO` - standardowy format błędów
- `UserProfile` - profil użytkownika

## 6. Zarządzanie stanem

### Custom Hook: useRegisterForm

```typescript
interface UseRegisterFormReturn {
  formState: RegisterFormState;
  handleEmailChange: (email: string) => void;
  handleAgeConfirmationChange: (checked: boolean) => void;
  handleSubmit: (e: FormEvent) => Promise<void>;
  validateField: (field: keyof RegisterFormData) => void;
  clearErrors: () => void;
  resetForm: () => void;
}
```

**Funkcjonalności hook:**

- Zarządzanie stanem formularza (data, errors, loading, success)
- Real-time walidacja pól (email on blur, age confirmation on change)
- Obsługa submission z API call
- Success state management (różny od login)
- Error handling i recovery
- Form reset functionality
- Focus management

**Stan lokalny w komponencie:**

- `formState` - główny stan formularza
- `apiError` - błędy z API responses
- `showSuccessMessage` - stan sukcesu po rejestracji

## 7. Integracja API

### Endpoint: POST /api/auth/register

**Request Type**: `RegisterRequestDTO`

```typescript
{
  email: string; // valid email format, max 254 chars
  age_confirmation: boolean; // must be true (legal requirement)
}
```

**Response Type**: `RegisterResponseDTO`

```typescript
{
  data: {
    user: UserProfile;
    message: string; // komunikat o weryfikacji
  }
}
```

**Obsługa odpowiedzi:**

- **201 Created**: Pokaż success message z instrukcjami weryfikacji
- **400 Bad Request**: Pokaż błędy walidacji
- **409 Conflict**: Pokaż komunikat "Email już istnieje"
- **500 Internal Server Error**: Pokaż błąd ogólny

**Różnice od login flow:**

- Brak przechowywania tokenów (tokens dopiero po weryfikacji)
- Success state wymaga różnej obsługi
- Magic link registration zamiast password-based

## 8. Interakcje użytkownika

### Scenariusze interakcji

1. **Wpisywanie email:**

   - User wpisuje w pole email → real-time format validation
   - onBlur → walidacja i pokazanie błędu jeśli nieprawidłowy
   - onFocus → czyszczenie błędu jeśli format poprawny

2. **Zaznaczanie age confirmation:**

   - User klika checkbox → toggle checked state
   - onChange → walidacja required (must be true)
   - Error message jeśli nie zaznaczone przy próbie submit

3. **Submission formularza:**

   - Click Submit lub Enter → walidacja wszystkich pól
   - Invalid form → pokaż błędy, focus na pierwszy błędny
   - Valid form → disable form, show loading, API call

4. **Sukces rejestracji:**

   - Pokaż AlertInfo z instrukcjami weryfikacji
   - Update UI do success state
   - Provide clear next steps (sprawdź email)
   - Optional redirect do /verify-email po timeout

5. **Błąd rejestracji:**

   - Pokaż odpowiedni komunikat błędu
   - Re-enable form submission
   - Zachowaj form data dla user convenience
   - Focus na problematyczne pole

6. **Nawigacja:**
   - "Masz już konto?" → /login
   - Po sukcesie → link do /login lub auto-redirect do /verify-email

## 9. Warunki i walidacja

### Walidacja po stronie klienta

**EmailInput:**

- Format email (RFC 5322 regex)
- Required field validation
- Max 254 characters
- Real-time validation on blur

**AgeConfirmationCheckbox:**

- Required field validation (must be true)
- Legal requirement compliance
- Clear error message if unchecked

**Form level:**

- Wszystkie pola wymagane
- Age confirmation must be true
- Submit disabled jeśli validation errors
- Clear errors on successful validation

### Walidacja API i error handling

**400 Bad Request:**

- Mapuj błędy na odpowiednie pola
- Specific field errors dla email format lub age confirmation

**409 Conflict:**

- "Konto z tym adresem już istnieje. Zaloguj się lub użyj innego email"
- Link do strony logowania

**500 Internal Server Error:**

- "Wystąpił błąd serwera. Spróbuj ponownie"
- Retry functionality

## 10. Obsługa błędów

### Typy błędów i strategie

1. **Błędy walidacji klienta:**

   - Invalid email: "Nieprawidłowy format email"
   - Empty email: "Email jest wymagany"
   - Age confirmation unchecked: "Potwierdzenie wieku jest wymagane"
   - Handle: Real-time validation w components

2. **Błędy API:**

   - 400: Field-specific errors w ErrorMessage components
   - 409: Global error w AlertInfo "Email już istnieje"
   - 500: Generic error message z retry option

3. **Błędy sieci:**

   - Network unavailable: "Sprawdź połączenie z internetem"
   - Timeout: "Żądanie przekroczyło limit czasu"
   - Auto-retry mechanizm dla network errors

4. **Email delivery issues:**

   - Success state includes instructions about checking spam
   - Provide resend verification option
   - Clear timeline expectations

5. **Legal compliance errors:**
   - Age under 16: Clear message about age requirement
   - Cannot bypass age confirmation validation

### Error recovery

- Clear error states on user input
- Retry functionality dla network issues
- Form data preservation podczas błędów
- Graceful degradation dla email delivery issues

## 11. Kroki implementacji

1. **Przygotowanie struktury plików**

   - Utwórz `src/pages/register.astro`
   - Reuse folder `src/components/auth/` z komponentów login
   - Utwórz `src/hooks/useRegisterForm.ts`
   - Extend `src/utils/validation.ts` o age confirmation

2. **Implementacja typów**

   - Dodaj nowe Register ViewModel types do `src/types.ts`
   - Ensure compatibility z istniejącymi API types
   - Legal compliance types dla age confirmation

3. **Utility functions**

   - `validateAgeConfirmation()` - boolean validation
   - Reuse `validateEmail()` z login implementation
   - `formatApiError()` - extend dla register-specific errors

4. **Nowe komponenty**

   - `AgeConfirmationCheckbox` - z legal text i proper accessibility
   - `AlertInfo` - dla success messages i instructions
   - Reuse `EmailInput` i `SubmitButton` z login

5. **Custom hook implementation**

   - `useRegisterForm` z register-specific logic
   - Success state management (różny od login)
   - Age confirmation validation
   - API integration bez token storage

6. **Main RegisterForm component**

   - Integrate wszystkie sub-components
   - Use useRegisterForm hook
   - Success state UI z instrukcjami weryfikacji
   - Proper legal compliance handling

7. **Astro page implementation**

   - `register.astro` z SEO meta tags
   - Layout integration
   - Client-side hydration dla RegisterForm
   - Navigation i routing

8. **API integration**

   - HTTP client dla register endpoint
   - Response handling bez token storage
   - Success flow z email verification instructions
   - Error mapping dla register-specific cases

9. **Success state refinement**

   - Clear instructions o email verification
   - Next steps guidance
   - Resend functionality planning
   - Legal compliance confirmation

10. **Legal compliance verification**

    - Age confirmation text review
    - Accessibility audit dla legal text
    - GDPR/RODO compliance check
    - Audit trail implementation

11. **Testing i accessibility**

    - Unit tests dla register validation functions
    - Integration tests dla register flow
    - Legal compliance testing
    - Accessibility audit z screen reader

12. **Documentation i review**
    - Legal requirements documentation
    - Registration flow documentation
    - Security review
    - Final testing i deployment
