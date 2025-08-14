# Plan implementacji widoku Ekrany błędów

## 1. Przegląd

Ekrany błędów stanowią system spójnego obsługiwania błędów nawigacji i serwera w aplikacji AI Flashcards. Obejmują trzy główne typy błędów: 403 (Forbidden), 404 (Not Found) i 500 (Internal Server Error). Głównym celem jest zapewnienie przyjaznego doświadczenia użytkownika podczas wystąpienia błędów, bez ujawniania szczegółów systemowych, z zachowaniem pełnej zgodności z wymaganiami dostępności WCAG AA.

## 2. Routing widoku

Widoki dostępne na następujących ścieżkach:
- `/error/403` - błąd braku uprawnień dostępu
- `/error/404` - błąd nieznalezionej strony/zasobu  
- `/error/500` - błąd wewnętrzny serwera

Dodatkowo system wspiera automatyczne przekierowania:
- Middleware przekierowuje na odpowiednie error pages
- React Error Boundary przekierowuje na `/error/500` dla nieobsłużonych wyjątków
- Invalid error types w URL defaultują do `/error/404`

## 3. Struktura komponentów

```
ErrorPageLayout
├── Breadcrumbs (opcjonalne dla kontekstu)
├── ErrorState
│   ├── ErrorIcon (403: Lock, 404: Search, 500: Warning)
│   ├── ErrorContent
│   │   ├── ErrorTitle
│   │   ├── ErrorDescription  
│   │   └── ErrorHelpText
│   └── ErrorActions
│       ├── Button(Retry) [tylko dla 500]
│       ├── Button(Powrót)
│       ├── Button(Dashboard)
│       └── Button(Pomoc) [opcjonalnie]
└── Footer (minimalistyczny)
```

## 4. Szczegóły komponentów

### ErrorPageLayout

- **Opis**: Główny layout wrapper zapewniający spójną strukturę dla wszystkich typów błędów. Odpowiada za SEO meta tags, proper HTTP status codes i responsive design.
- **Główne elementy**: `<main>` z role="main", optional breadcrumbs, centralized content area, minimal footer z links do help/contact
- **Obsługiwane interakcje**: Keyboard navigation, focus management po załadowaniu strony
- **Obsługiwana walidacja**: Sprawdzenie poprawności error type (403/404/500), sanitization URL parameters
- **Typy**: `ErrorPageProps`, `ErrorType`, `ErrorLayoutConfig`
- **Propsy**: `errorType: ErrorType`, `title?: string`, `showBreadcrumbs?: boolean`, `children: React.ReactNode`

### ErrorState

- **Opis**: Centralny komponent wyświetlający szczegóły błędu z ikoną, tytułem, opisem i dostępnymi akcjami. Obsługuje różne warianty dla każdego typu błędu.
- **Główne elementy**: Container div z centered layout, ErrorIcon, text content hierarchy (h1 title, description paragraph), ErrorActions group
- **Obsługiwane interakcje**: Automatic focus na pierwszy action button, keyboard navigation między elementami
- **Obsługiwana walidacja**: Validacja error type dla odpowiedniego content i actions, sprawdzenie dostępności previous page dla "Powrót" button
- **Typy**: `ErrorStateProps`, `ErrorConfig`, `ErrorActionConfig`
- **Propsy**: `errorType: ErrorType`, `customTitle?: string`, `customDescription?: string`, `showRetry?: boolean`, `previousUrl?: string`

### ErrorIcon

- **Opis**: Komponent wyświetlający odpowiednią ikonę dla typu błędu z proper accessibility attributes. Używa Lucide React icons z consistent sizing.
- **Główne elementy**: SVG icon wrapper z aria-hidden="true", surrounding container dla styling consistency
- **Obsługiwane interakcje**: Brak direct interactions (decorative element)
- **Obsługiwana walidacja**: Sprawdzenie czy error type ma assigned icon, fallback do default icon
- **Typy**: `ErrorIconProps`, `IconComponent`
- **Propsy**: `errorType: ErrorType`, `size?: 'sm' | 'md' | 'lg'`, `className?: string`

### ErrorActions

- **Opis**: Grupa przycisków akcji umożliwiających użytkownikowi recovery z error state. Hierarchia primary/secondary buttons z loading states.
- **Główne elementy**: Button group container, primary action button (Retry/Dashboard), secondary buttons (Powrót, Pomoc)
- **Obsługiwane interakcje**: Click handlers dla navigation, retry logic z debouncing, keyboard shortcuts (Enter, Escape)
- **Obsługiwana walidacja**: Sprawdzenie availability poprzedniej strony, validacja retry attempts limit, network connectivity check
- **Typy**: `ErrorActionsProps`, `ActionHandler`, `RetryConfig`
- **Propsy**: `errorType: ErrorType`, `onRetry?: () => Promise<void>`, `onBack?: () => void`, `onDashboard: () => void`, `isRetrying?: boolean`

## 5. Typy

```typescript
// Podstawowe typy dla error handling
export type ErrorType = '403' | '404' | '500';

export interface ErrorPageProps {
  errorType: ErrorType;
  title?: string;
  description?: string;
  showRetry?: boolean;
  previousUrl?: string;
}

// Konfiguracja dla każdego typu błędu
export interface ErrorConfig {
  title: string;
  description: string;
  helpText?: string;
  iconName: keyof typeof icons;
  showRetry: boolean;
  statusCode: number;
  actions: ErrorActionType[];
}

export type ErrorActionType = 'retry' | 'back' | 'dashboard' | 'help' | 'login';

export interface ErrorActionConfig {
  type: ErrorActionType;
  label: string;
  variant: 'primary' | 'secondary' | 'outline';
  handler: ActionHandler;
}

// Props dla komponentów
export interface ErrorStateProps {
  errorType: ErrorType;
  customTitle?: string;
  customDescription?: string;
  className?: string;
}

export interface ErrorActionsProps {
  errorType: ErrorType;
  onRetry?: () => Promise<void>;
  onBack?: () => void;
  onDashboard: () => void;
  onHelp?: () => void;
  isRetrying?: boolean;
  previousUrl?: string;
}

export interface ErrorIconProps {
  errorType: ErrorType;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Navigation i action handlers
export type ActionHandler = () => void | Promise<void>;

export interface RetryConfig {
  maxAttempts: number;
  debounceMs: number;
  backoffMultiplier: number;
}

// Analytics i tracking (opcjonalne)
export interface ErrorAnalytics {
  errorType: ErrorType;
  userAgent: string;
  referrer: string;
  timestamp: Date;
  userId?: string;
}
```

## 6. Zarządzanie stanem

Stan zarządzany lokalnie w komponentach bez potrzeby global state management:

### useState w ErrorActions:
```typescript
const [isRetrying, setIsRetrying] = useState(false);
const [retryAttempts, setRetryAttempts] = useState(0);
const [lastRetryTime, setLastRetryTime] = useState<Date | null>(null);
```

### Custom hook useErrorPageNavigation:
```typescript
const useErrorPageNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const goBack = useCallback(() => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigate('/');
    }
  }, [navigate]);
  
  const goToDashboard = useCallback(() => {
    navigate('/');
  }, [navigate]);
  
  const goToHelp = useCallback(() => {
    navigate('/help');
  }, [navigate]);
  
  return { goBack, goToDashboard, goToHelp };
};
```

### Custom hook useRetryAction:
```typescript
const useRetryAction = (config: RetryConfig) => {
  const [isRetrying, setIsRetrying] = useState(false);
  const [attempts, setAttempts] = useState(0);
  
  const retry = useCallback(async () => {
    if (attempts >= config.maxAttempts) return;
    
    setIsRetrying(true);
    setAttempts(prev => prev + 1);
    
    try {
      await new Promise(resolve => setTimeout(resolve, config.debounceMs * attempts));
      window.location.reload();
    } catch (error) {
      console.error('Retry failed:', error);
    } finally {
      setIsRetrying(false);
    }
  }, [attempts, config]);
  
  return { retry, isRetrying, attempts, canRetry: attempts < config.maxAttempts };
};
```

## 7. Integracja API

Error pages są głównie statyczne, ale mogą integrować się z następującymi systemami:

### Analytics tracking (opcjonalne):
```typescript
const trackErrorPageView = async (errorData: ErrorAnalytics) => {
  try {
    await fetch('/api/analytics/error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorData)
    });
  } catch (error) {
    // Silent fail - nie przerywamy UX dla analytics
    console.warn('Error tracking failed:', error);
  }
};
```

### Health check dla retry (500 errors):
```typescript
const checkServerHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch('/api/health', { 
      method: 'HEAD',
      cache: 'no-cache' 
    });
    return response.ok;
  } catch {
    return false;
  }
};
```

### Brak dedykowanych error API endpoints - strony są statyczne z client-side enhancement.

## 8. Interakcje użytkownika

### Scenariusze interakcji dla każdego typu błędu:

**403 Forbidden:**
1. Użytkownik próbuje dostępu do zasobu bez uprawnień
2. System przekierowuje na `/error/403`
3. Wyświetla się komunikat z opcjami: "Zaloguj się ponownie", "Powrót", "Dashboard"
4. Klik "Zaloguj się ponownie" → `/login` z return URL
5. Klik "Powrót" → history.back() lub Dashboard jeśli brak historii

**404 Not Found:**
1. Użytkownik wchodzi na nieistniejący URL lub kliknął broken link
2. System przekierowuje na `/error/404`  
3. Wyświetla się komunikat z opcjami: "Powrót", "Dashboard", "Pomoc"
4. Klik "Pomoc" → `/help` z sekcją FAQ o nawigacji

**500 Internal Server Error:**
1. Wystąpił błąd serwera podczas żądania
2. System przekierowuje na `/error/500`
3. Wyświetla się komunikat z opcjami: "Spróbuj ponownie", "Powrót", "Dashboard"
4. Klik "Spróbuj ponownie" → retry z health check i debouncing
5. Po successful retry → powrót do oryginalnej strony

### Keyboard Navigation:
- `Tab` - nawigacja między przyciskami akcji
- `Enter` - aktywacja focused button
- `Escape` - powrót do Dashboard (safe fallback)
- Focus trap nie jest potrzebny (nie ma modali)

## 9. Warunki i walidacja

### Walidacja URL i parametrów:
- **Error type validation**: Sprawdzenie czy `/error/{type}` zawiera valid type (403/404/500)
- **Fallback handling**: Invalid error types przekierowują na `/error/404`
- **Previous URL sanitization**: Sprawdzenie czy previous URL jest safe dla navigation

### Walidacja dostępu:
- **Public access**: Error pages są dostępne bez authentication
- **Context preservation**: Zachowanie error context dla lepszego UX
- **Security validation**: Nie ujawnianie sensitive information w error details

### Walidacja retry logic:
- **Max attempts limit**: Maksymalnie 3 próby retry dla 500 errors
- **Debouncing**: Minimum 2 sekundy między retry attempts
- **Network connectivity**: Sprawdzenie online status przed retry
- **Server health**: Optional health check przed reload

### Form validation (nie dotyczy - brak forms w error pages):
- Error pages nie zawierają form inputs
- Validation występuje tylko dla navigation parameters

## 10. Obsługa błędów

### Scenariusze błędów i recovery:

**Navigation Errors:**
```typescript
const handleNavigationError = (error: Error, fallbackUrl: string) => {
  console.warn('Navigation failed:', error);
  // Graceful fallback do Dashboard
  window.location.href = '/';
};
```

**Retry Failures:**
```typescript
const handleRetryFailure = (attempt: number, maxAttempts: number) => {
  if (attempt >= maxAttempts) {
    // Show message o contacting support
    showErrorMessage('Nie udało się rozwiązać problemu. Skontaktuj się z wsparciem.');
    return;
  }
  // Continue z exponential backoff
};
```

**Invalid Error Types:**
```typescript
const validateErrorType = (type: string): ErrorType => {
  if (['403', '404', '500'].includes(type)) {
    return type as ErrorType;
  }
  // Fallback do 404 dla unknown error types
  return '404';
};
```

**Network Issues:**
```typescript
const handleOffline = () => {
  // Disable retry buttons gdy offline
  // Show offline indicator
  // Listen dla online event do re-enable
};
```

**Error Loops Prevention:**
```typescript
const preventErrorLoop = () => {
  const errorPageCount = sessionStorage.getItem('errorPageCount') || '0';
  if (parseInt(errorPageCount) > 3) {
    // Force redirect do safe page
    window.location.href = '/';
    return;
  }
  sessionStorage.setItem('errorPageCount', (parseInt(errorPageCount) + 1).toString());
};
```

## 11. Kroki implementacji

### Etap 1: Podstawowa struktura (Kroki 1-10)

1. **Konfiguracja typów TypeScript**
   - Utworzenie `src/types/error.ts` z wszystkimi interfaces
   - Definicja ErrorType, ErrorConfig, ErrorPageProps

2. **Utworzenie Astro pages**
   - `src/pages/error/403.astro` z proper HTTP status code
   - `src/pages/error/404.astro` z 404 status
   - `src/pages/error/500.astro` z 500 status

3. **ErrorPageLayout component**
   - Utworzenie `src/components/ErrorPageLayout.astro`
   - Basic HTML structure z proper semantics
   - SEO meta tags i title handling

4. **Error configuration object**
   - `src/config/errors.ts` z configuration dla każdego error type
   - Titles, descriptions, icons, actions per error type

5. **Podstawowy routing**
   - Konfiguracja Astro routing dla `/error/*` paths
   - Middleware setup dla error handling

6. **Base styling z Tailwind**
   - Responsive grid layout dla error content
   - Typography hierarchy z proper contrast ratios
   - Color scheme alignment z app design system

7. **ErrorIcon component**
   - `src/components/ErrorIcon.tsx` z React
   - Import Lucide icons (Lock, Search, AlertTriangle)
   - Size variants i accessibility attributes

8. **Basic ErrorState component**
   - `src/components/ErrorState.tsx` structure
   - Title, description, icon rendering
   - Responsive layout z centered content

9. **ErrorActions component scaffold**
   - `src/components/ErrorActions.tsx` basic structure
   - Button group layout z shadcn/ui Button
   - Action handlers placeholders

10. **Basic accessibility setup**
    - Proper heading hierarchy (h1 dla error title)
    - ARIA landmarks (main, navigation)
    - Focus management basics

### Etap 2: Navigation i funkcjonalność (Kroki 11-20)

11. **useErrorPageNavigation hook**
    - Custom hook dla navigation logic
    - Safe back navigation z fallback
    - Dashboard i help navigation

12. **Navigation handlers implementation**
    - goBack() z history API z safe fallback
    - goToDashboard() z proper routing
    - goToHelp() z optional error context

13. **Button action wiring**
    - Connect navigation handlers do ErrorActions
    - Event handling z proper error boundaries
    - Loading states dla async navigation

14. **Previous URL handling**
    - Capture referring page dla "Powrót" functionality
    - URL sanitization dla security
    - Fallback strategy gdy brak valid previous page

15. **Error type validation**
    - URL parameter validation w Astro pages
    - Redirect logic dla invalid error types
    - Default fallback do 404

16. **Breadcrumb navigation (opcjonalne)**
    - `src/components/ErrorBreadcrumbs.tsx`
    - Context-aware breadcrumb generation
    - Accessible breadcrumb markup

17. **Keyboard navigation support**
    - Tab order optimization
    - Enter key handling dla buttons
    - Escape key dla quick exit do Dashboard

18. **Focus management**
    - Auto-focus na pierwszy action button po load
    - Focus restoration po navigation attempts
    - Skip links dla accessibility

19. **Error loop prevention**
    - Session storage tracking error page visits
    - Circuit breaker pattern dla repeated errors
    - Safe navigation fallbacks

20. **URL state management**
    - Query parameter handling dla error context
    - State preservation across navigation
    - Clean URL patterns

### Etap 3: Retry logic i advanced features (Kroki 21-30)

21. **useRetryAction hook**
    - Custom hook dla retry functionality z debouncing
    - Exponential backoff strategy
    - Max attempts limitation

22. **Server health check**
    - `/api/health` endpoint integration
    - Network connectivity detection
    - Pre-retry validation

23. **Retry UI implementation**
    - Loading spinner podczas retry attempts
    - Progress indication z attempt counting
    - Disabled state po max attempts

24. **Error-specific retry logic**
    - Retry only dla 500 errors (nie dla 403/404)
    - Different retry strategies per error type
    - Conditional retry button rendering

25. **Network status handling**
    - Online/offline detection
    - Automatic retry po network restoration
    - Offline mode indication

26. **Advanced error messaging**
    - Dynamic messaging based na error context
    - Time-sensitive messaging (np. "spróbuj za chwilę")
    - User-friendly technical explanations

27. **Error analytics integration (opcjonalne)**
    - Error page view tracking
    - User behavior analytics na error pages
    - A/B testing setup dla messaging

28. **Performance optimization**
    - Lazy loading dla non-critical components
    - Image optimization dla error illustrations
    - Minimal JavaScript bundle dla error pages

29. **Caching strategy**
    - Static asset caching dla error pages
    - Service worker integration dla offline support
    - CDN optimization

30. **Mobile responsiveness enhancement**
    - Touch-friendly button sizing
    - Mobile-specific layout adjustments
    - Swipe gestures dla navigation (opcjonalne)

### Etap 4: Testing, accessibility i finalizacja (Kroki 31-40)

31. **Unit tests setup**
    - Vitest configuration dla error components
    - Test utilities dla error page rendering
    - Mock setup dla navigation hooks

32. **Component unit tests**
    - ErrorState component tests z różnymi props
    - ErrorActions interaction tests
    - ErrorIcon rendering tests

33. **Integration tests**
    - Full error page rendering tests
    - Navigation flow tests
    - Retry functionality tests

34. **Accessibility testing**
    - Automated a11y tests z jest-axe
    - Screen reader testing z NVDA/JAWS
    - Keyboard-only navigation testing

35. **Cross-browser testing**
    - Modern browsers compatibility
    - Graceful degradation dla older browsers
    - Mobile browser testing

36. **Performance testing**
    - Page load speed measurement
    - Bundle size optimization
    - Core Web Vitals monitoring

37. **Error handling edge cases**
    - Invalid URL parameters handling
    - Network timeout scenarios
    - Memory leak prevention

38. **SEO optimization**
    - Proper HTTP status codes verification
    - Meta tags optimization
    - Structured data markup

39. **Final accessibility audit**
    - WCAG AA compliance verification
    - Color contrast ratio testing
    - Focus indicator visibility

40. **Documentation i deployment**
    - Component documentation z Storybook (opcjonalne)
    - Implementation guide dla team
    - Production deployment i monitoring setup

### Post-implementacja monitoring:
- Error page analytics review
- User feedback collection
- Performance metrics monitoring
- Accessibility compliance ongoing validation

## Zależności implementacyjne

### Zewnętrzne zależności:
- **Layout.astro** - podstawowy layout application
- **shadcn/ui Button** - consistent button styling
- **Lucide React** - icons dla różnych error types
- **Astro middleware** - error catching i routing

### Techniczne wymagania:
- **Astro 5** - server-side generation z client islands
- **React 19** - component interactivity
- **TypeScript 5** - type safety
- **Tailwind CSS 4** - responsive styling

### API dependencies:
- **Brak mandatory API endpoints** - error pages są statyczne
- **Optional /api/health** - dla server health checks
- **Optional /api/analytics** - dla error tracking

### Kolejność implementacji:
1. **Etap 1 (struktura)** → **Etap 2 (nawigacja)** → **Etap 3 (retry)**
2. **Etap 4 (testing)** można przeprowadzić równolegle z Etapem 3
3. **Monitoring i analytics** mogą być dodane iteracyjnie po MVP

Ten plan zapewnia comprehensive error handling system z focus na UX, accessibility i security zgodnie z wymaganiami PRD i UI plan.
