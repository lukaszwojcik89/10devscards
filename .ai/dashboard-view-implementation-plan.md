# Plan implementacji widoku Dashboard

## 1. Przegląd

Widok Dashboard stanowi główną stronę aplikacji AI Flashcards, dostępną pod ścieżką `/` po zalogowaniu użytkownika. Zapewnia szybki wgląd w aktywności nauki użytkownika poprzez wyświetlanie kluczowych wskaźników KPI, ostatnio używanych talii oraz szybkich akcji. Widok agreguje dane z 6 różnych sekcji API w jednym wywołaniu i implementuje zaawansowane mechanizmy loading states, error handling oraz accessibility features zgodnie z WCAG AA.

## 2. Routing widoku

- **Ścieżka**: `/`
- **Plik**: `src/pages/index.astro`
- **Layout**: Wykorzystuje główny Layout aplikacji z AppShell
- **Autoryzacja**: Wymaga aktywnej sesji użytkownika
- **Przekierowania**: Nieautoryzowani użytkownicy → `/login`

## 3. Struktura komponentów

```
DashboardPage (.astro)
├── Layout
│   ├── Head (meta, title, SEO)
│   └── AppShell
│       └── main
│           ├── DashboardContainer (React, client:load)
│           │   ├── ToastWelcome (conditional, first login)
│           │   ├── BannerLimits (conditional, AI usage > 80%)
│           │   ├── KpiSection
│           │   │   ├── KpiTile (Do nauki dziś)
│           │   │   ├── KpiTile (Zaległe)
│           │   │   └── KpiTile (Streak)
│           │   ├── RecentDecksSection
│           │   │   ├── SectionHeader
│           │   │   ├── DeckList
│           │   │   │   └── DeckCard[] (ostatnie 5)
│           │   │   └── ViewAllButton
│           │   ├── QuickActionsSection
│           │   │   ├── SectionHeader
│           │   │   ├── ActionButton (Nowa sesja)
│           │   │   ├── ActionButton (Generuj AI)
│           │   │   └── ActionButton (Nowa talia)
│           │   └── SkeletonDashboard (loading state)
│           └── Footer
```

## 4. Szczegóły komponentów

### DashboardPage (Astro)

- **Opis**: Główny kontener strony dashboard z layoutem, SEO meta tagami i zarządzaniem autoryzacją
- **Główne elementy**: Layout wrapper, AppShell, DashboardContainer z client:load
- **Obsługiwane interakcje**: Brak (statyczny kontener)
- **Obsługiwana walidacja**: Authorization check (redirect to login if unauthorized)
- **Typy**: Brak
- **Propsy**: Brak

### DashboardContainer (React)

- **Opis**: Główny kontener React zarządzający stanem dashboard, API calls, loading states i error handling
- **Główne elementy**: Wszystkie sekcje dashboard, conditional components, error boundaries
- **Obsługiwane interakcje**: API data fetching, refresh actions, error recovery, navigation routing
- **Obsługiwana walidacja**: API response validation, data integrity checks, error state management
- **Typy**: DashboardState, DashboardData, ErrorResponseDTO
- **Propsy**: Brak (główny kontener)

### KpiSection (React)

- **Opis**: Sekcja wyświetlająca 3 główne kafle KPI w responsywnym grid layout
- **Główne elementy**: Grid container, 3 KpiTile components, responsive breakpoints
- **Obsługiwane interakcje**: Navigation clicks z KPI tiles, hover states z tooltips
- **Obsługiwana walidacja**: Number validation dla KPI values, fallback dla missing data
- **Typy**: UserStats, StudyProgress
- **Propsy**: userStats, studyProgress, onKpiClick

### KpiTile (React)

- **Opis**: Pojedynczy kafel KPI z wartością, tytułem, ikoną i opcjonalnym CTA
- **Główne elementy**: Card container, value display, title, subtitle, icon, hover effects
- **Obsługiwane interakcje**: onClick navigation, hover tooltips, keyboard navigation
- **Obsługiwana walidacja**: Value formatting, variant validation, accessibility attributes
- **Typy**: KpiTileProps
- **Propsy**: title, value, subtitle, variant, onClick, isClickable, icon

### RecentDecksSection (React)

- **Opis**: Sekcja pokazująca ostatnio używane talie z opcją przejścia do pełnej listy
- **Główne elementy**: Section header, horizontal deck list, "Zobacz wszystkie" button
- **Obsługiwane interakcje**: Deck card clicks, navigation do deck details, view all action
- **Obsługiwana walidacja**: Deck data validation, empty state handling
- **Typy**: RecentDeck[], EmptyStateProps
- **Propsy**: recentDecks, onDeckClick, onViewAll

### QuickActionsSection (React)

- **Opis**: Sekcja z przyciskami do najważniejszych akcji aplikacji
- **Główne elementy**: Section header, action buttons grid, disabled states handling
- **Obsługiwane interakcje**: Action button clicks, conditional navigation, disabled state feedback
- **Obsługiwana walidacja**: Action availability validation, conditional enabling/disabling
- **Typy**: QuickActions, QuickActionButtonProps
- **Propsy**: quickActions, onActionClick

### BannerLimits (React)

- **Opis**: Conditional banner informujący o limitach AI usage i dziennych limitach nauki
- **Główne elementy**: Banner container, warning/info icon, message text, dismiss button, learn more link
- **Obsługiwane interakcje**: Dismiss action, learn more navigation, auto-hide logic
- **Obsługiwana walidacja**: AI usage threshold validation, display conditions
- **Typy**: BannerLimitsProps, AIUsage
- **Propsy**: aiUsage, onDismiss, onLearnMore, type

### ToastWelcome (React)

- **Opis**: Jednorazowy toast powitalny wyświetlany po pierwszym logowaniu w sesji
- **Główne elementy**: Toast container, welcome message, dismiss button, auto-dismiss timer
- **Obsługiwane interakcje**: Manual dismiss, auto-dismiss, session storage management
- **Obsługiwana walidacja**: Session tracking, show-once-per-session logic
- **Typy**: ToastWelcomeProps
- **Propsy**: userName, onDismiss, autoClose, duration

### SkeletonDashboard (React)

- **Opis**: Loading state component wyświetlający skeleton placeholder dla całego dashboard
- **Główne elementy**: Skeleton blocks dla KPI tiles, recent decks, quick actions
- **Obsługiwane interakcje**: Brak (pure visual component)
- **Obsługiwana walidacja**: Brak
- **Typy**: Brak
- **Propsy**: Brak

## 5. Typy

### Nowe typy ViewModel

```typescript
// Stan całego dashboard
interface DashboardState {
  data: DashboardData | null;
  isLoading: boolean;
  error: string | null;
  lastRefresh: Date | null;
  showWelcomeToast: boolean;
}

// Props dla kafla KPI
interface KpiTileProps {
  title: string;
  value: number | string;
  subtitle?: string;
  variant: "primary" | "warning" | "success" | "neutral";
  onClick?: () => void;
  isClickable?: boolean;
  icon?: React.ComponentType;
  tooltip?: string;
}

// Props dla karty talii
interface DeckCardProps {
  deck: RecentDeck;
  onClick: (slug: string) => void;
  showStats?: boolean;
  showLastActivity?: boolean;
}

// Props dla przycisku szybkiej akcji
interface QuickActionButtonProps {
  title: string;
  description?: string;
  icon: React.ComponentType;
  onClick: () => void;
  isDisabled?: boolean;
  variant: "primary" | "secondary";
  disabledReason?: string;
}

// Props dla bannera limitów
interface BannerLimitsProps {
  aiUsage: AIUsage;
  onDismiss: () => void;
  onLearnMore?: () => void;
  type: "warning" | "info";
}

// Props dla toasta powitalnego
interface ToastWelcomeProps {
  userName?: string;
  onDismiss: () => void;
  autoClose?: boolean;
  duration?: number;
}

// Props dla sekcji recent decks
interface RecentDecksSectionProps {
  recentDecks: RecentDeck[];
  onDeckClick: (slug: string) => void;
  onViewAll: () => void;
  isLoading?: boolean;
}

// Props dla sekcji quick actions
interface QuickActionsSectionProps {
  quickActions: QuickActions;
  onActionClick: (action: string) => void;
}
```

### Istniejące typy API (z types.ts)

- `DashboardResponseDTO` - odpowiedź API z danymi dashboard
- `DashboardData` - główna struktura danych dashboard
- `UserStats` - statystyki użytkownika (talie, fiszki)
- `StudyProgress` - postęp nauki (dzisiaj, streak, catchup)
- `UpcomingSessions` - nadchodzące sesje nauki
- `RecentDeck` - informacje o ostatnio używanej talii
- `AIUsage` - informacje o wykorzystaniu AI
- `QuickActions` - dostępne szybkie akcje
- `ErrorResponseDTO` - standardowy format błędów

## 6. Zarządzanie stanem

### Custom Hook: useDashboard

```typescript
interface UseDashboardReturn {
  dashboardData: DashboardData | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  lastRefresh: Date | null;
  isRefreshing: boolean;
}
```

### Custom Hook: useWelcomeToast

```typescript
interface UseWelcomeToastReturn {
  showWelcomeToast: boolean;
  dismissWelcomeToast: () => void;
  triggerWelcomeToast: () => void;
}
```

### Custom Hook: useQuickActions

```typescript
interface UseQuickActionsReturn {
  navigateToStudy: () => void;
  navigateToGenerate: () => void;
  navigateToCreateDeck: () => void;
  navigateToDecks: () => void;
  handleActionClick: (action: string) => void;
}
```

**Funkcjonalności hooków:**

- API data fetching z React Query dla caching
- Loading states management z skeleton coordination
- Error handling z automatic retry mechanisms
- Welcome toast management z session persistence
- Navigation helpers z proper routing
- Background refresh z window focus detection
- Cache invalidation strategies

**Stan lokalny w komponencie:**

- `dashboardState` - główny stan dashboard
- `refreshTrigger` - manual refresh state
- `sessionFlags` - toast i banner preferences

## 7. Integracja API

### Endpoint: GET /api/dashboard

**Request Type**: Brak parametrów

```typescript
// Tylko Authorization header wymagany
Headers: {
  Authorization: "Bearer <access_token>";
}
```

**Response Type**: `DashboardResponseDTO`

```typescript
{
  data: {
    userStats: UserStats;
    studyProgress: StudyProgress;
    upcomingSessions: UpcomingSessions;
    recentDecks: RecentDeck[];
    aiUsage: AIUsage;
    quickActions: QuickActions;
  }
}
```

**Obsługa odpowiedzi:**

- **200 OK**: Parse data, update state, show welcome toast if needed
- **401 Unauthorized**: Redirect to login, clear tokens
- **500 Internal Server Error**: Show error state z retry option
- **Network errors**: Show offline mode z cached data fallback

**React Query integration:**

- Cache key: `['dashboard', userId]`
- Stale time: 5 minutes
- Background refetch on window focus
- Retry policy: 3 attempts z exponential backoff

## 8. Interakcje użytkownika

### Scenariusze interakcji

1. **Initial dashboard load:**

   - Show skeleton states dla wszystkich sekcji
   - API call success → progressive reveal wszystkich sekcji
   - Welcome toast trigger jeśli first login session
   - Auto-focus na main content dla accessibility

2. **KPI tile interactions:**

   - Click "Do nauki dziś" → navigate to study session
   - Click "Zaległe" → navigate to study z catchup=true
   - Click "Streak" → show streak info lub navigate to study
   - Hover → show detailed tooltips z breakdown

3. **Recent decks interactions:**

   - Click deck card → navigate to `/decks/:slug`
   - Click "Zobacz wszystkie" → navigate to `/decks`
   - Empty state → show "Utwórz pierwszą talię" CTA
   - Hover deck → show quick stats overlay

4. **Quick actions interactions:**

   - Click "Nowa sesja" → navigate to study session selection
   - Click "Generuj AI" → open generate modal
   - Click "Nowa talia" → navigate to deck creation
   - Disabled actions → show tooltip z explanation

5. **Banner interactions:**

   - AI usage warning → show dismiss option, link to settings
   - Daily limit info → show progress, link to help
   - Dismiss → save preference, hide banner
   - Learn more → navigate to relevant help section

6. **Toast interactions:**

   - Welcome toast → auto-dismiss po 5s, manual close option
   - Error notifications → manual dismiss, retry actions
   - Success messages → auto-dismiss po 3s

7. **Refresh interactions:**
   - Manual refresh button → reload all data
   - Pull-to-refresh → mobile gesture support (future)
   - Auto-refresh → background updates on focus
   - Error recovery → retry failed sections

## 9. Warunki i walidacja

### Walidacja po stronie klienta

**Authorization validation:**

- Bearer token presence check przed API call
- Token format validation
- Automatic token refresh jeśli expired
- Redirect to login jeśli no valid token

**Data validation:**

- UserStats numbers → validate non-negative integers
- StudyProgress dates → validate date formats i logic
- RecentDecks array → validate deck structure
- AIUsage percentages → validate 0-100 range

**UI state validation:**

- Loading states → minimum 200ms, maximum 10s timeout
- Error states → user-friendly messages, retry availability
- Empty states → contextual CTAs, proper guidance

### API response validation

**Response structure:**

- Validate DashboardResponseDTO schema
- Handle missing optional fields gracefully
- Provide defaults dla undefined values
- Type safety przez TypeScript + runtime checks

**Error handling:**

- 401: Clear auth state, redirect to login
- 500: Show generic error z retry option
- Timeout: Show network error z offline mode
- Partial failures: Show available data + error indicators

## 10. Obsługa błędów

### Typy błędów i strategie

1. **API Errors:**

   - 401 Unauthorized: "Sesja wygasła" → automatic redirect to login
   - 500 Server Error: "Wystąpił błąd" → retry button z exponential backoff
   - Network timeout: "Sprawdź połączenie" → offline mode z cached data
   - Handle: Global error boundary + section-specific fallbacks

2. **Data Loading Errors:**

   - Partial API failure: Show loaded sections, error indicators dla failed
   - Data corruption: Show "Dane niedostępne" z refresh option
   - Schema validation failure: Fallback to default values z warning
   - Handle: Granular error handling per dashboard section

3. **User Interaction Errors:**

   - Navigation failures: Toast notification z retry option
   - Quick action errors: Disable button, show error tooltip
   - Toast system failures: Fallback to browser notifications
   - Handle: User feedback + graceful degradation

4. **Performance Issues:**

   - Slow loading: Extended skeleton display z progress indication
   - Memory issues: Virtualization dla large datasets
   - UI freezing: React.memo optimization + useMemo dla calculations
   - Handle: Performance monitoring i progressive enhancement

5. **Empty State Scenarios:**
   - New user: Onboarding CTAs ("Utwórz pierwszą talię")
   - No activity: Motivational content ("Rozpocznij naukę")
   - No recent decks: "Dodaj talie" prompts
   - Handle: Contextual empty states z clear next steps

### Error recovery mechanisms

- Automatic retry z exponential backoff
- Cached data fallbacks dla offline scenarios
- Section-by-section error isolation
- User-initiated refresh options
- Graceful degradation to core functionality

## 11. Kroki implementacji

1. **Przygotowanie struktury plików**

   - Utwórz/zaktualizuj `src/pages/index.astro`
   - Utwórz folder `src/components/dashboard/`
   - Setup `src/hooks/useDashboard.ts`
   - Extend `src/utils/dashboard.ts` utility functions

2. **Implementacja typów**

   - Extend `src/types.ts` z dashboard ViewModel types
   - Ensure compatibility z istniejącymi API types
   - Add error handling types

3. **Base components implementation**

   - `KpiTile` - reusable KPI display component
   - `DeckCard` - recent deck card component
   - `QuickActionButton` - action button component
   - `SkeletonDashboard` - loading states

4. **Section components**

   - `KpiSection` - KPI tiles layout
   - `RecentDecksSection` - recent decks list
   - `QuickActionsSection` - quick actions grid
   - `BannerLimits` - conditional banners

5. **State management hooks**

   - `useDashboard` - API integration z React Query
   - `useWelcomeToast` - session-based toast management
   - `useQuickActions` - navigation helpers
   - Error handling hooks

6. **Main DashboardContainer**

   - Integrate wszystkie sekcje
   - Coordinate loading states
   - Handle error boundaries
   - Manage conditional components

7. **Astro page implementation**

   - `index.astro` z proper SEO
   - Layout integration z AppShell
   - Authorization checks
   - Client-side hydration

8. **API integration refinement**

   - React Query setup z proper cache keys
   - Background refresh strategies
   - Error handling i retry logic
   - Performance optimization

9. **Accessibility implementation**

   - ARIA landmarks dla wszystkich sekcji
   - Keyboard navigation support
   - Screen reader announcements
   - Focus management

10. **Toast i notification system**

    - Welcome toast z session tracking
    - Error notifications
    - Success feedback
    - Auto-dismiss logic

11. **Responsive design**

    - Desktop-first CSS Grid layouts
    - Mobile breakpoints
    - Touch-friendly interactions
    - Progressive disclosure

12. **Testing i performance**
    - Unit tests dla all components
    - Integration tests dla API calls
    - Performance testing z React DevTools
    - Accessibility audit z screen readers
    - Final optimization i deployment
