# Plan implementacji widoku Szczegóły talii

## 1. Przegląd

Widok szczegółów talii stanowi centrum zarządzania pojedynczą talią fiszek w aplikacji AI Flashcards. Dostępny pod ścieżką `/decks/:slug`, zapewnia kompleksową funkcjonalność do przeglądania, filtrowania i zarządzania fiszkami w konkretnej talii, analizy statystyk oraz konfiguracji ustawień talii. Widok implementuje system zakładek (Fiszki, Statystyki, Ustawienia) z zaawansowanym filtrowaniem, generowaniem AI, optimistic updates oraz pełną funkcjonalnością CRUD dla fiszek zgodnie z wymogami WCAG AA.

## 2. Routing widoku

- **Ścieżka**: `/decks/:slug`
- **Plik**: `src/pages/decks/[slug]/index.astro`
- **Parametry**: `slug` (kebab-case format, unikalny identyfikator talii)
- **Layout**: Wykorzystuje główny Layout aplikacji z AppShell
- **Autoryzacja**: Wymaga aktywnej sesji użytkownika i ownership talii
- **Przekierowania**: Nieautoryzowani → `/login`, nieistniejąca talia → `/decks`
- **Deep linking**: Obsługa URL hash dla zakładek `#fiszki`, `#statystyki`, `#ustawienia`

## 3. Struktura komponentów

```
DeckDetailPage (.astro)
├── Layout
│   ├── Head (meta, title, SEO)
│   └── AppShell
│       └── main
│           └── DeckDetailContainer (React, client:load)
│               ├── DeckHeader
│               │   ├── DeckBreadcrumb
│               │   ├── DeckTitle (editable)
│               │   └── DeckActions (generate, export, study)
│               └── DeckTabs
│                   ├── FlashcardsTab
│                   │   ├── FilterBar
│                   │   │   ├── PresetFilters (Do akceptacji, Overdue, Najnowsze)
│                   │   │   ├── CustomFilters (status, box, search)
│                   │   │   └── ResetFilters
│                   │   ├── FlashcardsTable
│                   │   │   ├── TableHeader (sortowanie)
│                   │   │   ├── FlashcardRow[] (z akcjami)
│                   │   │   └── Pagination
│                   │   └── EmptyState (gdy brak fiszek)
│                   ├── StatsTab
│                   │   ├── StatsOverview
│                   │   ├── StatsCards (total, by status, by box)
│                   │   ├── DueProgressChart
│                   │   └── ActivityChart
│                   └── SettingsTab
│                       ├── DeckSettingsForm
│                       ├── ExportSection
│                       └── DangerZone (delete)
│               ├── Modals
│               │   ├── GenerateModal
│               │   ├── EditFlashcardModal
│               │   └── ConfirmDialog
│               └── LoadingStates & ErrorBoundaries
```

## 4. Szczegóły komponentów

### DeckDetailPage (Astro)

- **Opis**: Główny kontener strony szczegółów talii z layoutem, SEO meta tagami i autoryzacją
- **Główne elementy**: Layout wrapper, AppShell, DeckDetailContainer z client:load
- **Obsługiwane interakcje**: Brak (statyczny kontener)
- **Obsługiwana walidacja**: Authorization check, slug format validation, redirect handling
- **Typy**: Brak
- **Propsy**: Brak

### DeckDetailContainer (React)

- **Opis**: Główny kontener React zarządzający stanem całego widoku, API calls, loading states i error handling
- **Główne elementy**: DeckHeader, DeckTabs, modals, error boundaries, loading overlays
- **Obsługiwane interakcje**: Tab switching, modal management, error recovery, data refresh
- **Obsługiwana walidacja**: Deck ownership validation, API response validation, error state management
- **Typy**: `DeckDetailState`, `DeckWithCounts`, `ErrorResponseDTO`
- **Propsy**: `slug` (z URL params)

### DeckHeader (React)

- **Opis**: Nagłówek widoku z breadcrumbami, tytułem talii i głównymi akcjami
- **Główne elementy**: Breadcrumb navigation (Talie > [nazwa talii]), editable deck title, description, action buttons (Study, Generate, Export)
- **Obsługiwane interakcje**: Inline editing nazwy/opisu, nawigacja breadcrumb, trigger modals, start study session
- **Obsługiwana walidacja**: Deck name validation (max 100 chars), description validation (max 500 chars)
- **Typy**: `DeckWithCounts`, `DeckHeaderProps`
- **Propsy**: `deck`, `onEdit`, `onGenerate`, `onExport`, `onStudy`, `isEditing`

### DeckTabs (React)

- **Opis**: Komponenty zakładek z nawigacją i content switching dla Fiszki/Statystyki/Ustawienia
- **Główne elementy**: Tab navigation bar, tab content containers, URL hash sync
- **Obsługiwane interakcje**: Tab clicking, keyboard navigation (Arrow keys), deep linking
- **Obsługiwana walidacja**: Active tab validation, URL hash format validation
- **Typy**: `DeckTabsProps`, `TabType`
- **Propsy**: `activeTab`, `onTabChange`, `deck`, `flashcards`

### FlashcardsTab (React)

- **Opis**: Zakładka z listą fiszek w konkretnej talii, filtrowaniem i zarządzaniem fiszkami
- **Główne elementy**: FilterBar z presetami, FlashcardsTable z sortowaniem, action buttons, empty states
- **Obsługiwane interakcje**: Filter aplikacja, sort columns, pagination, individual flashcard actions
- **Obsługiwana walidacja**: Filter values validation, pagination limits, flashcard action validation
- **Typy**: `FlashcardListItem[]`, `FlashcardFilters`, `PaginationState`
- **Propsy**: `deckSlug`, `flashcards`, `filters`, `onFilterChange`, `onAction`

### FilterBar (React)

- **Opis**: Pasek filtrów z presetami (Do akceptacji, Overdue, Najnowsze), custom filters i reset functionality
- **Główne elementy**: Preset buttons, status dropdown, box dropdown, search input, reset button
- **Obsługiwane interakcje**: Preset clicking, dropdown selection, search typing (debounced), reset filters
- **Obsługiwana walidacja**: Search query validation, filter enum validation, combination rules
- **Typy**: `FlashcardFilters`, `FilterPreset`, `FilterBarProps`
- **Propsy**: `filters`, `onFilterChange`, `onPresetApply`, `onReset`, `resultsCount`

### FlashcardsTable (React)

- **Opis**: Tabela z fiszkami talii, sortowaniem, paginacją i akcjami na wierszach
- **Główne elementy**: Table header z sort controls, FlashcardRow components, pagination controls
- **Obsługiwane interakcje**: Column sorting, pagination navigation, individual row actions
- **Obsługiwana walidacja**: Sort direction validation, page bounds validation, action permissions
- **Typy**: `FlashcardListItem[]`, `SortConfig`, `PaginationDTO`
- **Propsy**: `flashcards`, `sort`, `onSort`, `pagination`, `onPageChange`, `onRowAction`

### FlashcardRow (React)

- **Opis**: Wiersz pojedynczej fiszki z content preview i action buttons (Accept/Reject/Edit/Delete)
- **Główne elementy**: Question/answer preview, status badge, due date, auto-accept countdown, action buttons
- **Obsługiwane interakcje**: Content clicking (expand), action buttons, status changes
- **Obsługiwana walidacja**: Status change validation, action permissions check, optimistic update validation
- **Typy**: `FlashcardListItem`, `FlashcardRowProps`
- **Propsy**: `flashcard`, `onAccept`, `onReject`, `onEdit`, `onDelete`, `isUpdating`

### GenerateModal (React)

- **Opis**: Modal do generowania fiszek AI z tekstu użytkownika dla konkretnej talii
- **Główne elementy**: Textarea z input text (max 2000 chars), difficulty selector, max cards slider, submit button
- **Obsługiwane interakcje**: Text input (z licznikiem znaków), dropdown selection, slider control, form submit
- **Obsługiwana walidacja**: Text length ≤2000 chars, difficulty enum, max_cards range 1-10, budget check
- **Typy**: `GenerateFlashcardsRequest`, `GenerateModalProps`
- **Propsy**: `deckId`, `isOpen`, `onClose`, `onSubmit`, `isLoading`, `budgetInfo`

### EditFlashcardModal (React)

- **Opis**: Modal do edycji pytania i odpowiedzi istniejącej fiszki
- **Główne elementy**: Question textarea, answer textarea, save/cancel buttons, validation messages
- **Obsługiwane interakcje**: Text input w polach, form validation, save/cancel actions, keyboard shortcuts
- **Obsługiwana walidacja**: Question max 256 chars, answer max 512 chars, required fields, dirty state detection
- **Typy**: `FlashcardListItem`, `UpdateFlashcardRequest`, `EditFlashcardModalProps`
- **Propsy**: `flashcard`, `isOpen`, `onClose`, `onSave`, `isLoading`

### StatsTab (React)

- **Opis**: Zakładka ze statystykami konkretnej talii i visualizacjami danych
- **Główne elementy**: Stats cards grid (total, by status, by box), charts/graphs, progress indicators, summary metrics
- **Obsługiwane interakcje**: Hover tooltips, chart interactions, time period selection
- **Obsługiwana walidacja**: Stats data validation, chart data consistency, time range validation
- **Typy**: `DeckStats`, `StatsTabProps`
- **Propsy**: `deck`, `stats`, `flashcards`, `onRefresh`

### SettingsTab (React)

- **Opis**: Zakładka z ustawieniami konkretnej talii i management actions
- **Główne elementy**: Deck settings form (name, description), export controls, danger zone z delete option
- **Obsługiwane interakcje**: Form editing, export triggering, delete confirmation
- **Obsługiwana walidacja**: Deck name uniqueness, description length, delete confirmation text
- **Typy**: `DeckWithCounts`, `SettingsTabProps`
- **Propsy**: `deck`, `onUpdate`, `onDelete`, `onExport`, `isUpdating`

### ConfirmDialog (React)

- **Opis**: Reusable dialog do potwierdzania destructive actions (delete flashcard, delete deck)
- **Główne elementy**: Dialog overlay, title, message, confirm/cancel buttons
- **Obsługiwane interakcje**: Button clicking, keyboard shortcuts (Enter/Escape), focus trapping
- **Obsługiwana walidacja**: Action type validation, confirmation text matching
- **Typy**: `ConfirmDialogProps`
- **Propsy**: `isOpen`, `title`, `message`, `confirmText`, `onConfirm`, `onCancel`, `variant`

## 5. Typy

### Nowe typy ViewModel

```typescript
// Stan głównego widoku szczegółów talii
interface DeckDetailState {
  deck: DeckWithCounts | null;
  flashcards: FlashcardListItem[];
  loading: {
    deck: boolean;
    flashcards: boolean;
    generating: boolean;
    updating: Record<string, boolean>;
  };
  error: string | null;
  activeTab: 'flashcards' | 'stats' | 'settings';
  filters: FlashcardFilters;
  pagination: PaginationState;
}

// Filtry dla fiszek z presetami
interface FlashcardFilters {
  status?: 'pending' | 'accepted' | 'rejected' | null;
  box?: 'box1' | 'box2' | 'box3' | 'graduated' | null;
  preset?: 'pending' | 'overdue' | 'newest' | null;
  search?: string;
  sortBy?: 'created_at' | 'updated_at' | 'next_due_date' | 'question';
  sortOrder?: 'asc' | 'desc';
}

// Statystyki konkretnej talii z dodatkowymi metrykami
interface DeckStats {
  total_flashcards: number;
  by_status: {
    pending: number;
    accepted: number;
    rejected: number;
  };
  by_box: {
    box1: number;
    box2: number;
    box3: number;
    graduated: number;
  };
  due_today: number;
  overdue: number;
  next_due_date?: string;
  weekly_activity: Array<{
    date: string;
    studied: number;
    generated: number;
  }>;
  average_acceptance_rate: number;
}

// Props dla wiersza fiszki
interface FlashcardRowProps {
  flashcard: FlashcardListItem;
  onAccept: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
  onEdit: (flashcard: FlashcardListItem) => void;
  onDelete: (id: string) => Promise<void>;
  isUpdating: boolean;
}

// Props dla modal generowania w kontekście talii
interface GenerateModalProps {
  deckId: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: GenerateFlashcardsRequest) => Promise<void>;
  isLoading: boolean;
  budgetInfo: {
    currentSpend: number;
    monthlyLimit: number;
    estimatedCost: number;
  };
}

// Stan paginacji dla fiszek talii
interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasMore: boolean;
}

// Typ dla tab navigation
type TabType = 'flashcards' | 'stats' | 'settings';

// Preset filtrów dla fiszek
type FilterPreset = 'pending' | 'overdue' | 'newest';

// Props dla nagłówka talii
interface DeckHeaderProps {
  deck: DeckWithCounts;
  onEdit: (data: { name?: string; description?: string }) => Promise<void>;
  onGenerate: () => void;
  onExport: () => void;
  onStudy: () => void;
  isEditing: boolean;
}
```

### Istniejące typy API (z types.ts)

- `DeckWithCounts` - szczegóły talii z licznikami fiszek
- `FlashcardListItem` - element listy fiszek
- `FlashcardDetailResponseDTO` - pełne szczegóły fiszki
- `GenerateFlashcardsRequest/Response` - AI generation
- `UpdateFlashcardRequest` - edycja fiszki
- `PaginationDTO` - standardowa paginacja
- `ErrorResponseDTO` - standardowy format błędów

## 6. Zarządzanie stanem

### Custom Hook: useDeckDetail

```typescript
interface UseDeckDetailReturn {
  deckState: DeckDetailState;
  actions: {
    refreshDeck: () => Promise<void>;
    refreshFlashcards: () => Promise<void>;
    setActiveTab: (tab: TabType) => void;
    setFilters: (filters: Partial<FlashcardFilters>) => void;
    updateDeck: (data: { name?: string; description?: string }) => Promise<void>;
  };
  computed: {
    filteredFlashcards: FlashcardListItem[];
    deckStats: DeckStats;
    hasUnsavedChanges: boolean;
  };
}
```

### Custom Hook: useFlashcardActions

```typescript
interface UseFlashcardActionsReturn {
  generateFlashcards: (request: GenerateFlashcardsRequest) => Promise<void>;
  acceptFlashcard: (id: string) => Promise<void>;
  rejectFlashcard: (id: string) => Promise<void>;
  updateFlashcard: (id: string, data: UpdateFlashcardRequest) => Promise<void>;
  deleteFlashcard: (id: string) => Promise<void>;
  isUpdating: (id: string) => boolean;
}
```

### Custom Hook: useFlashcardFilters

```typescript
interface UseFlashcardFiltersReturn {
  filters: FlashcardFilters;
  setFilter: (key: keyof FlashcardFilters, value: any) => void;
  applyPreset: (preset: FilterPreset) => void;
  clearFilters: () => void;
  getAPIQuery: () => URLSearchParams;
  syncWithURL: () => void;
}
```

**Funkcjonalności hooków:**

- React Query dla cache'owania API responses
- Optimistic updates z automatic rollback on errors
- URL synchronization dla deep linking
- Loading states coordination między komponentami
- Error handling z user-friendly messages
- Real-time countdown dla auto-accept pending fiszek

**Stan lokalny w komponentach:**

- DeckDetailContainer: główny stan aplikacji + UI state
- FilterBar: temporary filter state przed aplikacją
- GenerateModal: form state + validation errors
- EditFlashcardModal: form state + dirty tracking
- FlashcardsTable: sort state + loading states

## 7. Integracja API

### Endpoint: GET /api/decks/{slug}

**Request Type**: `{ slug: string }`

```typescript
// Authorization header wymagany
Headers: {
  Authorization: "Bearer <access_token>"
}
```

**Response Type**: `DeckDetailResponseDTO`

```typescript
{
  data: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    created_at: string;
    updated_at: string;
    flashcard_count: number;
    pending_count: number;
  }
}
```

### Endpoint: GET /api/decks/{slug}/flashcards

**Request Type**: `FlashcardFilters + PaginationParams`

```typescript
// Query parameters
{
  status?: 'pending' | 'accepted' | 'rejected';
  box?: 'box1' | 'box2' | 'box3' | 'graduated';
  limit?: number; // 1-100, default 20
  offset?: number; // ≥0, default 0
  search?: string;
  sortBy?: 'created_at' | 'updated_at' | 'next_due_date' | 'question';
  sortOrder?: 'asc' | 'desc';
}
```

**Response Type**: `FlashcardListResponseDTO`

```typescript
{
  data: FlashcardListItem[];
  pagination: PaginationDTO;
}
```

### Endpoint: POST /api/flashcards/generate

**Request Type**: `GenerateFlashcardsRequest`

```typescript
{
  deck_id: string; // ID talii, do której generujemy
  text: string; // max 2000 chars
  difficulty?: 'easy' | 'medium' | 'hard';
  max_cards?: number; // 1-10, default 5
}
```

**Response Type**: `GenerateFlashcardsResponse`

### Inne endpointy dla fiszek

- `PATCH /api/flashcards/{id}/status` - akceptacja/odrzucenie pojedynczej fiszki
- `PUT /api/flashcards/{id}` - edycja content fiszki
- `DELETE /api/flashcards/{id}` - usunięcie fiszki
- `PUT /api/decks/{slug}` - update deck info (name, description)
- `DELETE /api/decks/{slug}` - delete całej talii

**Obsługa odpowiedzi:**

- **200 OK**: Parse data, update state, show success feedback
- **401 Unauthorized**: Redirect to login, clear auth state
- **404 Not Found**: Redirect to /decks z error message
- **429 Rate Limited**: Show cooldown timer, disable actions
- **500 Internal Server Error**: Show error state z retry option

**React Query configuration:**

- Cache keys: `['deck', slug]`, `['deck-flashcards', slug, filters]`
- Stale time: 5 minutes dla deck info, 2 minutes dla flashcards
- Background refetch on window focus
- Automatic retries: 3 attempts z exponential backoff

## 8. Interakcje użytkownika

### Scenariusze nawigacji

1. **Wejście na stronę konkretnej talii:**
   - URL `/decks/python-basics` → load deck info + default flashcards view
   - Show loading skeletons, progressive reveal content
   - Auto-focus na main content dla accessibility
   - Update document title z deck name

2. **Switching między zakładkami:**
   - Click "Statystyki" → change activeTab, update URL hash
   - Lazy load stats data przy pierwszym wejściu
   - Preserve filter state between tab switches
   - Keyboard navigation: Tab, Arrow keys, Enter

### Scenariusze filtrowania fiszek

3. **Preset filters:**
   - Click "Do akceptacji" → apply status=pending filter
   - Click "Overdue" → apply custom filter due_date < today
   - Click "Najnowsze" → apply sort by created_at desc
   - Visual feedback: active preset highlighting

4. **Custom filtering:**
   - Type w search → debounced API call (500ms delay)
   - Select status dropdown → immediate filter application
   - Column sort click → toggle asc/desc, update table
   - Reset filters → clear all, return to default view

### Scenariusze zarządzania fiszkami

5. **Single flashcard actions:**
   - Click "Accept" → optimistic update, API call, rollback on error
   - Click "Reject" → optimistic removal, API call, restore on error
   - Click "Edit" → open EditFlashcardModal z prefilled data
   - Click "Delete" → open ConfirmDialog, API call po confirmation

6. **AI Generation w kontekście talii:**
   - Click "Generuj fiszki" → open GenerateModal
   - Type text → character counter, validate ≤2000 chars
   - Submit → loading state z estimated time, progress bar
   - Success → close modal, refresh flashcards list, show toast

7. **Study session rozpoczęcie:**
   - Click "Ucz się" → navigate to `/study?deck=:slug`
   - Check due count → show "X fiszek do nauki"
   - No due cards → show "Brak fiszek do nauki" z options

### Scenariusze ustawień talii

8. **Deck management:**
   - Inline edit deck name → click to edit, Enter to save
   - Update description → textarea expansion, save on blur
   - Export deck → generate JSON, trigger browser download
   - Delete deck → two-step confirmation, redirect to /decks

9. **Error recovery:**
   - Network error → show retry button, offline indicator
   - API error → show user-friendly message, suggest actions
   - Optimistic update failure → rollback state, show error toast
   - Concurrent modification → refresh data, show conflict notice

## 9. Warunki i walidacja

### Walidacja po stronie klienta

**Authorization i permissions:**

- Deck ownership check przy load strony
- Action permissions based na flashcard status
- Rate limiting awareness dla AI generation
- Budget limit checking przed AI generation

**Input validation:**

- Search query: max 100 chars, sanitize special characters
- Generate text: required, max 2000 chars, non-empty
- Max cards: number range 1-10, integer only
- Question/Answer edit: max 256/512 chars respectively
- Deck name: max 100 chars, required
- Description: max 500 chars, optional

**Business rules validation:**

- Status changes: tylko pending → accepted/rejected
- Auto-accept countdown: tylko dla pending fiszek ≥5 dni
- Filter combinations: logical validation rules
- Deck slug uniqueness w ramach użytkownika

### API response validation

**Data integrity checks:**

- Validate deck structure matches expected schema
- Flashcard list consistency with pagination
- Stats calculations accuracy verification
- Date format validation for due dates

**Error response handling:**

- 400 Bad Request: show field-specific validation errors
- 404 Not Found: differentiate między deck/flashcard not found
- 409 Conflict: handle slug duplication gracefully
- 429 Rate Limited: show cooldown timer, disable relevant actions

**Real-time validation:**

- Auto-accept countdown accuracy
- Due date calculations
- Stats consistency across components
- Cache invalidation triggers

## 10. Obsługa błędów

### Kategorie błędów i strategie

1. **API Communication Errors:**
   - Network timeout: Show offline banner, enable retry
   - 401 Unauthorized: Clear auth tokens, redirect to login
   - 404 Deck Not Found: Redirect to /decks z "Talia nie istnieje"
   - 500 Server Error: Show "Wystąpił błąd", retry button
   - Handle: Global error boundary + component-specific fallbacks

2. **Data Loading Errors:**
   - Deck loading failure: Show error state z refresh option
   - Flashcards loading failure: Show table error state, preserve filters
   - Stats calculation errors: Show "Statystyki niedostępne"
   - Handle: Partial loading support, graceful degradation

3. **User Action Errors:**
   - Flashcard update failure: Rollback optimistic update, show toast
   - Generation failure: Keep modal open, show specific error
   - Delete failure: Restore item, show retry option
   - Handle: Optimistic UI patterns z rollback mechanisms

4. **Validation Errors:**
   - Form validation: Highlight invalid fields, show inline messages
   - File size errors: Show "Tekst za długi" dla text input
   - Budget exceeded: Show upgrade prompt, disable generate
   - Handle: Real-time validation z user-friendly messaging

5. **State Management Errors:**
   - Filter state corruption: Reset to default filters
   - Pagination state issues: Reset to page 1
   - URL sync errors: Fallback to application default state
   - Handle: State sanitization i recovery mechanisms

### Error recovery patterns

- **Automatic retry**: 3 attempts z exponential backoff dla network errors
- **Manual retry**: User-triggered retry buttons dla failed operations
- **Graceful degradation**: Show available data when partial loading fails
- **Error boundaries**: Prevent crashes, show fallback UI
- **User feedback**: Toast notifications, inline messages, status indicators

## 11. Kroki implementacji

### Etap 1: Przygotowanie infrastruktury (Kroki 1-8)

1. **Utwórz strukturę plików**
   - `src/pages/decks/[slug]/index.astro` - główna strona
   - `src/components/deck-detail/` - folder komponentów
   - `src/hooks/deck-detail/` - custom hooks

2. **Rozszerz typy**
   - Dodaj nowe interfejsy do `src/types.ts`
   - Validate compatibility z istniejącymi API types
   - Setup error handling types

3. **Przygotuj routing**
   - Configure Astro routing dla dynamic slug
   - Setup breadcrumb navigation
   - Implement authorization guards

4. **Utwórz base utilities**
   - Date formatting functions
   - Filter query builders
   - URL synchronization helpers
   - Validation utilities

5. **Setup testing infrastructure**
   - Unit test setup dla components
   - Mock API responses
   - Accessibility testing tools

6. **Create base components**
   - LoadingSpinner
   - ErrorBoundary
   - ConfirmDialog
   - Toast notifications

7. **Implement main page structure**
   - DeckDetailPage.astro z layoutem
   - Basic routing i parameter extraction
   - SEO meta tags setup

8. **Setup state management foundation**
   - React Query configuration
   - Error handling setup
   - Cache strategies

### Etap 2: Custom hooks implementation (Kroki 9-16)

9. **Implement useDeckDetail hook**
   - API integration dla deck loading
   - Loading i error states
   - React Query cache management

10. **Create useFlashcardFilters hook**
    - Filter state management
    - URL synchronization
    - Preset filters logic

11. **Build useFlashcardActions hook**
    - CRUD operations dla flashcards
    - Optimistic updates
    - Error handling z rollback

12. **Add useOptimisticUpdates helper**
    - Generic optimistic update pattern
    - Rollback mechanisms
    - Loading state coordination

13. **Implement usePagination hook**
    - Pagination state management
    - Page navigation logic
    - URL parameter sync

14. **Create useAutoAcceptCountdown hook**
    - Real-time countdown dla pending fiszek
    - Auto-refresh trigger
    - Cleanup on unmount

15. **Add useTabNavigation hook**
    - Tab state management
    - URL hash synchronization
    - Keyboard navigation support

16. **Test all hooks**
    - Unit tests dla each hook
    - Integration tests z mock APIs
    - Error scenario testing

### Etap 3: Core components (Kroki 17-24)

17. **Build DeckDetailContainer**
    - Main state orchestration
    - Tab management
    - Error boundary integration

18. **Implement DeckHeader**
    - Breadcrumb navigation
    - Inline editing dla deck title
    - Action buttons layout

19. **Create DeckTabs component**
    - Tab navigation
    - Content switching
    - Keyboard accessibility

20. **Build FilterBar**
    - Preset filter buttons
    - Custom filter controls
    - Reset functionality

21. **Implement FlashcardsTable**
    - Data table z sorting
    - Column configuration
    - Responsive layout

22. **Create FlashcardRow**
    - Row content display
    - Action buttons
    - Auto-accept countdown display

23. **Add pagination controls**
    - Page navigation
    - Page size selection
    - Results summary

24. **Test core components**
    - Component unit tests
    - Interaction testing
    - Accessibility validation

### Etap 4: Modals i formularze (Kroki 25-32)

25. **Implement GenerateModal**
    - Form layout z validation
    - Character counter
    - Budget checking

26. **Create EditFlashcardModal**
    - Form fields z validation
    - Dirty state detection
    - Save/cancel logic

27. **Build form validation system**
    - Real-time validation
    - Error message display
    - Accessibility support

28. **Add modal management**
    - Focus trapping
    - Escape key handling
    - Backdrop click closing

29. **Implement loading states**
    - Skeleton placeholders
    - Progress indicators
    - Spinner components

30. **Create toast system**
    - Success notifications
    - Error messages
    - Auto-dismiss logic

31. **Add keyboard shortcuts**
    - Modal triggers
    - Form submissions
    - Navigation shortcuts

32. **Test modals i forms**
    - Form validation tests
    - Modal interaction tests
    - Keyboard navigation tests

### Etap 5: Stats i Settings tabs (Kroki 33-38)

33. **Implement StatsTab**
    - Stats cards layout
    - Data visualization
    - Chart components

34. **Create SettingsTab**
    - Deck settings form
    - Export functionality
    - Delete confirmation

35. **Add data visualization**
    - Charts dla stats
    - Progress indicators
    - Activity graphs

36. **Implement export features**
    - JSON generation
    - File download trigger
    - Format options

37. **Create danger zone**
    - Delete confirmation flow
    - Two-step verification
    - Redirect handling

38. **Test advanced features**
    - Stats calculation tests
    - Export functionality tests
    - Delete workflow tests

### Etap 6: Finalizacja i polish (Kroki 39-40)

39. **Complete accessibility implementation**
    - ARIA labels i descriptions
    - Keyboard navigation polish
    - Screen reader testing
    - Color contrast validation

40. **Final testing i optimization**
    - End-to-end testing
    - Performance optimization
    - Browser compatibility testing
    - Production deployment validation
