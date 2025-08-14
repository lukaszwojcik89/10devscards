# Plan implementacji widoku Lista talii

## 1. Przegląd

Widok Lista talii stanowi główny hub do przeglądania wszystkich talii użytkownika w aplikacji AI Flashcards. Dostępny pod ścieżką `/decks`, zapewnia przejrzysty przegląd wszystkich talii z kluczowymi metrykami, zaawansowaną funkcjonalność wyszukiwania i filtrowania, oraz szybkie akcje tworzenia nowych talii. Implementuje infinite scroll z fallback "Load more", responsywny design oraz pełną zgodność z wymogami WCAG AA.

## 2. Routing widoku

- **Ścieżka**: `/decks`
- **Plik**: `src/pages/decks.astro`
- **Parametry**: Brak (query params dla filtrów i paginacji)
- **Layout**: Wykorzystuje główny Layout aplikacji z AppShell
- **Autoryzacja**: Wymaga aktywnej sesji użytkownika
- **Przekierowania**: Nieautoryzowani → `/login`
- **Deep linking**: Obsługa query params dla search i sort state

## 3. Struktura komponentów

```
DecksPage (.astro)
├── Layout
│   ├── Head (meta, title, SEO)
│   └── AppShell
│       └── main
│           └── DecksContainer (React, client:load)
│               ├── DecksHeader
│               │   ├── PageTitle
│               │   ├── SearchBar
│               │   └── CreateDeckButton
│               ├── DecksFilterBar
│               │   ├── SortSelector
│               │   ├── StatusFilter
│               │   └── ClearFilters
│               ├── DecksContent
│               │   ├── DecksTable (desktop)
│               │   │   ├── TableHeader (sortowanie)
│               │   │   ├── DeckRow[]
│               │   │   └── LoadMoreButton
│               │   ├── DeckCards (mobile)
│               │   │   ├── DeckCard[]
│               │   │   └── LoadMoreButton
│               │   └── EmptyState
│               └── Modals
│                   ├── CreateDeckModal
│                   └── DeleteConfirmDialog
```

## 4. Szczegóły komponentów

### DecksPage (Astro)

- **Opis**: Główny kontener strony listy talii z layoutem, SEO meta tagami i autoryzacją
- **Główne elementy**: Layout wrapper, AppShell, DecksContainer z client:load
- **Obsługiwane interakcje**: Brak (statyczny kontener)
- **Obsługiwana walidacja**: Authorization check, redirect handling
- **Typy**: Brak
- **Propsy**: Brak

### DecksContainer (React)

- **Opis**: Główny kontener React zarządzający stanem całego widoku, API calls, filtering i pagination
- **Główne elementy**: DecksHeader, DecksFilterBar, DecksContent, modals, loading states
- **Obsługiwane interakcje**: Search handling, filter application, pagination, deck creation/deletion
- **Obsługiwana walidacja**: Search query validation, filter state management, pagination bounds
- **Typy**: `DecksPageState`, `DeckListItem[]`, `DecksFilters`
- **Propsy**: Brak (pobiera query params z URL)

### DecksHeader (React)

- **Opis**: Nagłówek strony z tytułem, wyszukiwarką i głównym CTA
- **Główne elementy**: Page title, search input z debouncing, "Utwórz talię" button
- **Obsługiwane interakcje**: Search typing (debounced), create deck modal trigger, search clearing
- **Obsługiwana walidacja**: Search query max 100 chars, sanitization
- **Typy**: `DecksHeaderProps`
- **Propsy**: `searchQuery`, `onSearchChange`, `onCreateDeck`, `isSearching`

### DecksFilterBar (React)

- **Opis**: Pasek filtrów z opcjami sortowania i filtrowania statusu
- **Główne elementy**: Sort dropdown, status filter, active filters display, clear button
- **Obsługiwane interakcje**: Sort selection, status filtering, clear all filters
- **Obsługiwana walidacja**: Sort option validation, filter combination rules
- **Typy**: `DecksFilters`, `SortOption`, `FilterBarProps`
- **Propsy**: `filters`, `onFilterChange`, `onClearFilters`, `resultsCount`

### DecksTable (React)

- **Opis**: Tabela z taliami dla desktop view z sortowaniem i infinite scroll
- **Główne elementy**: Table header z sort controls, DeckRow components, load more button
- **Obsługiwane interakcje**: Column sorting, row clicking (navigation), load more
- **Obsługiwana walidacja**: Sort direction validation, pagination bounds
- **Typy**: `DeckListItem[]`, `SortConfig`, `DecksTableProps`
- **Propsy**: `decks`, `sort`, `onSort`, `onRowClick`, `onLoadMore`, `hasMore`, `isLoading`

### DeckRow (React)

- **Opis**: Wiersz pojedynczej talii z kluczowymi metrykami i akcjami
- **Główne elementy**: Deck name (link), flashcard counts, due/overdue indicators, last modified, actions menu
- **Obsługiwane interakcje**: Row clicking (navigation), actions menu (edit/delete), quick study button
- **Obsługiwana walidacja**: Action permissions, deck ownership check
- **Typy**: `DeckListItem`, `DeckRowProps`
- **Propsy**: `deck`, `onEdit`, `onDelete`, `onStudy`, `isUpdating`

### DeckCards (React)

- **Opis**: Card layout dla mobile view z responsive design
- **Główne elementy**: DeckCard components w grid layout, load more button
- **Obsługiwane interakcje**: Card clicking, swipe gestures, load more
- **Obsługiwana walidacja**: Touch gesture validation, grid layout constraints
- **Typy**: `DeckListItem[]`, `DeckCardsProps`
- **Propsy**: `decks`, `onCardClick`, `onLoadMore`, `hasMore`, `isLoading`

### DeckCard (React)

- **Opis**: Card component dla pojedynczej talii w mobile view
- **Główne elementy**: Deck title, stats summary, due indicator, action button
- **Obsługiwane interakcje**: Card tap, action button tap, long press menu
- **Obsługiwana walidacja**: Touch interaction validation, card state management
- **Typy**: `DeckListItem`, `DeckCardProps`
- **Propsy**: `deck`, `onClick`, `onAction`, `isSelected`

### CreateDeckModal (React)

- **Opis**: Modal do tworzenia nowej talii z formularzem
- **Główne elementy**: Name input, description textarea, create button, cancel button
- **Obsługiwane interakcje**: Form input, validation, submit, cancel, keyboard shortcuts
- **Obsługiwana walidacja**: Name required max 100 chars, description max 500 chars, slug uniqueness
- **Typy**: `CreateDeckRequest`, `CreateDeckModalProps`
- **Propsy**: `isOpen`, `onClose`, `onSubmit`, `isLoading`

### DeleteConfirmDialog (React)

- **Opis**: Dialog potwierdzający usunięcie talii
- **Główne elementy**: Warning message, deck name confirmation, delete/cancel buttons
- **Obsługiwane interakcje**: Confirmation input, delete action, cancel, keyboard shortcuts
- **Obsługiwana walidacja**: Confirmation text matching, deck name validation
- **Typy**: `DeckListItem`, `DeleteConfirmProps`
- **Propsy**: `deck`, `isOpen`, `onConfirm`, `onCancel`, `isDeleting`

### EmptyState (React)

- **Opis**: Stan pustej listy z CTA do tworzenia pierwszej talii
- **Główne elementy**: Illustration, heading, description, create deck button
- **Obsługiwane interakcje**: Create deck button click
- **Obsługiwana walidacja**: Brak
- **Typy**: `EmptyStateProps`
- **Propsy**: `onCreateDeck`, `isFiltered`

## 5. Typy

### Nowe typy ViewModel

```typescript
// Stan głównego widoku listy talii
interface DecksPageState {
  decks: DeckListItem[];
  loading: {
    initial: boolean;
    loadMore: boolean;
    search: boolean;
    creating: boolean;
    deleting: Record<string, boolean>;
  };
  error: string | null;
  filters: DecksFilters;
  pagination: {
    hasMore: boolean;
    nextCursor: string | null;
    totalCount: number;
  };
  ui: {
    viewMode: 'table' | 'cards';
    selectedDeck: string | null;
    showCreateModal: boolean;
    showDeleteDialog: string | null;
  };
}

// Filtry dla listy talii
interface DecksFilters {
  search: string;
  sortBy: 'name' | 'created_at' | 'updated_at' | 'flashcard_count' | 'due_count';
  sortOrder: 'asc' | 'desc';
  status?: 'active' | 'empty' | null;
  hasOverdue?: boolean;
}

// Konfiguracja sortowania
interface SortConfig {
  field: keyof DecksFilters['sortBy'];
  direction: 'asc' | 'desc';
}

// Opcje sortowania dla UI
interface SortOption {
  value: DecksFilters['sortBy'];
  label: string;
  icon?: string;
}

// Props dla głównych komponentów
interface DecksHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onCreateDeck: () => void;
  isSearching: boolean;
  totalCount: number;
}

interface DecksTableProps {
  decks: DeckListItem[];
  sort: SortConfig;
  onSort: (field: DecksFilters['sortBy']) => void;
  onRowClick: (slug: string) => void;
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
  onEdit: (deck: DeckListItem) => void;
  onDelete: (deck: DeckListItem) => void;
}

interface DeckRowProps {
  deck: DeckListItem;
  onEdit: (deck: DeckListItem) => void;
  onDelete: (deck: DeckListItem) => void;
  onStudy: (deck: DeckListItem) => void;
  isUpdating: boolean;
}

interface CreateDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateDeckRequest) => Promise<void>;
  isLoading: boolean;
}

// Request dla tworzenia talii
interface CreateDeckRequest {
  name: string;
  description?: string;
}

// Infinite scroll state
interface InfiniteScrollState {
  items: DeckListItem[];
  hasMore: boolean;
  isLoading: boolean;
  error: string | null;
  nextCursor: string | null;
}
```

### Istniejące typy API (z types.ts)

- `DeckListItem` - element listy talii z podstawowymi metrykami
- `DeckListResponseDTO` - response z API dla listy talii
- `CreateDeckResponseDTO` - response po utworzeniu talii
- `PaginationDTO` - standardowa paginacja
- `ErrorResponseDTO` - standardowy format błędów

## 6. Zarządzanie stanem

### Custom Hook: useDecks

```typescript
interface UseDecksReturn {
  state: DecksPageState;
  actions: {
    searchDecks: (query: string) => void;
    applyFilters: (filters: Partial<DecksFilters>) => void;
    sortDecks: (field: DecksFilters['sortBy']) => void;
    loadMore: () => Promise<void>;
    refreshDecks: () => Promise<void>;
    createDeck: (data: CreateDeckRequest) => Promise<void>;
    deleteDeck: (id: string) => Promise<void>;
  };
  computed: {
    filteredDecks: DeckListItem[];
    hasActiveFilters: boolean;
    isSearchActive: boolean;
  };
}
```

### Custom Hook: useInfiniteScroll

```typescript
interface UseInfiniteScrollReturn {
  items: DeckListItem[];
  loadMore: () => Promise<void>;
  hasMore: boolean;
  isLoading: boolean;
  error: string | null;
  reset: () => void;
}
```

### Custom Hook: useDecksFilters

```typescript
interface UseDecksFiltersReturn {
  filters: DecksFilters;
  setFilter: (key: keyof DecksFilters, value: any) => void;
  clearFilters: () => void;
  getAPIQuery: () => URLSearchParams;
  syncWithURL: () => void;
  presets: {
    newest: () => void;
    alphabetical: () => void;
    mostActive: () => void;
    hasOverdue: () => void;
  };
}
```

**Funkcjonalności hooków:**

- React Query dla cache'owania API responses
- Infinite scroll z cursor-based pagination
- URL synchronization dla deep linking filters
- Debounced search z cancellation
- Optimistic updates dla create/delete operations
- Real-time stats updates

**Stan lokalny w komponentach:**

- DecksContainer: główny stan aplikacji + UI state
- SearchBar: temporary search state przed debouncing
- CreateDeckModal: form state + validation errors
- DeleteConfirmDialog: confirmation state

## 7. Integracja API

### Endpoint: GET /api/decks

**Request Type**: `DecksFilters + PaginationParams`

```typescript
// Query parameters
{
  search?: string;
  sortBy?: 'name' | 'created_at' | 'updated_at' | 'flashcard_count' | 'due_count';
  sortOrder?: 'asc' | 'desc';
  limit?: number; // 1-50, default 20
  cursor?: string; // dla infinite scroll
}
```

**Response Type**: `DeckListResponseDTO`

```typescript
{
  data: DeckListItem[];
  pagination: {
    nextCursor: string | null;
    hasMore: boolean;
    totalCount: number;
  };
}
```

### Endpoint: POST /api/decks

**Request Type**: `CreateDeckRequest`

```typescript
{
  name: string; // required, max 100 chars
  description?: string; // optional, max 500 chars
}
```

**Response Type**: `CreateDeckResponseDTO`

```typescript
{
  data: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    created_at: string;
  }
}
```

### Endpoint: DELETE /api/decks/{id}

**Request Type**: `{ id: string }`
**Response Type**: `{ success: boolean }`

**Obsługa odpowiedzi:**

- **200 OK**: Parse data, update state, show success feedback
- **401 Unauthorized**: Redirect to login, clear auth state
- **400 Bad Request**: Show validation errors inline
- **409 Conflict**: Handle slug conflicts dla create
- **429 Rate Limited**: Show cooldown timer, disable actions
- **500 Internal Server Error**: Show error state z retry option

**React Query configuration:**

- Cache keys: `['decks', filters]`, `['deck-stats']`
- Stale time: 2 minutes dla deck list, 5 minutes dla stats
- Background refetch on window focus
- Automatic retries: 3 attempts z exponential backoff
- Optimistic updates dla create/delete z rollback

## 8. Interakcje użytkownika

### Scenariusze nawigacji

1. **Wejście na stronę talii:**
   - URL `/decks` → load deck list z default sorting
   - Show loading skeletons, progressive reveal content
   - Auto-focus na search input dla accessibility
   - Update document title: "Twoje talie"

2. **Wyszukiwanie talii:**
   - Type w search bar → debounced search (500ms delay)
   - Show search results z highlight matched text
   - Clear search → return to full list
   - Empty search results → show "Brak wyników" state

### Scenariusze filtrowania i sortowania

3. **Sortowanie listy:**
   - Click column header → toggle sort direction
   - Select z dropdown → apply new sort immediately
   - Visual feedback: sort direction indicators
   - URL update z sort parameters

4. **Filtrowanie statusu:**
   - Select "Tylko z zaległościami" → filter hasOverdue=true
   - Select "Puste talie" → filter flashcard_count=0
   - Combine filters → logical AND operations
   - Clear filters → return to default view

### Scenariusze zarządzania taliami

5. **Tworzenie nowej talii:**
   - Click "Utwórz talię" → open CreateDeckModal
   - Fill form fields → real-time validation
   - Submit → optimistic update, API call, navigate to deck
   - Error handling → show errors, keep modal open

6. **Nawigacja do talii:**
   - Click row/card → navigate to `/decks/:slug`
   - Click "Ucz się" → navigate to `/study?deck=:slug`
   - Breadcrumb navigation → maintain context
   - Browser back button → restore filters/search state

7. **Usuwanie talii:**
   - Click delete action → open ConfirmDialog
   - Type confirmation text → enable delete button
   - Confirm → optimistic removal, API call, show toast
   - Error → restore item, show error message

### Scenariusze infinite scroll

8. **Ładowanie więcej talii:**
   - Scroll to bottom → automatic load more (if enabled)
   - Click "Załaduj więcej" → manual load more trigger
   - Loading state → show skeleton items
   - Error state → show retry button

9. **Responsywność:**
   - Desktop → table view z full information
   - Mobile → card view z condensed info
   - Viewport change → automatic layout switch
   - Touch gestures → swipe actions on cards

## 9. Warunki i walidacja

### Walidacja po stronie klienta

**Authorization i permissions:**

- User must be authenticated to access /decks
- Each deck action requires ownership verification
- Rate limiting awareness dla bulk operations

**Input validation:**

- Search query: max 100 chars, sanitize special characters
- Create deck name: required, max 100 chars, unique check
- Description: optional, max 500 chars
- Sort parameters: enum validation

**Business rules validation:**

- Deck name uniqueness within user's decks
- Minimum/maximum deck limits per user
- Special characters handling w deck names
- Slug generation validation

### API response validation

**Data integrity checks:**

- Validate deck list structure matches expected schema
- Pagination consistency verification
- Sort order correctness validation
- Stats calculations accuracy

**Error response handling:**

- 400 Bad Request: show field-specific validation errors
- 404 Not Found: handle missing decks gracefully
- 409 Conflict: show "Talia o tej nazwie już istnieje"
- 429 Rate Limited: show cooldown timer, disable creates

**Real-time validation:**

- Deck name availability checking (debounced)
- Slug conflict detection
- Stats consistency across list
- Cache invalidation triggers

## 10. Obsługa błędów

### Kategorie błędów i strategie

1. **API Communication Errors:**
   - Network timeout: Show offline banner, enable retry
   - 401 Unauthorized: Clear auth tokens, redirect to login
   - 500 Server Error: Show "Wystąpił błąd", retry button
   - Handle: Global error boundary + component-specific fallbacks

2. **Data Loading Errors:**
   - Initial load failure: Show error state z refresh option
   - Load more failure: Show "Nie udało się załadować", retry button
   - Search failure: Show "Wyszukiwanie niedostępne", clear search
   - Handle: Partial loading support, graceful degradation

3. **User Action Errors:**
   - Create deck failure: Keep modal open, show specific error
   - Delete failure: Restore item, show retry option
   - Search timeout: Show "Wyszukiwanie zbyt długie", cancel option
   - Handle: Optimistic UI patterns z rollback mechanisms

4. **Validation Errors:**
   - Form validation: Highlight invalid fields, show inline messages
   - Duplicate name: Show "Talia o tej nazwie już istnieje"
   - Character limits: Show remaining characters counter
   - Handle: Real-time validation z user-friendly messaging

5. **State Management Errors:**
   - Filter state corruption: Reset to default filters
   - Pagination state issues: Reset to first page
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
   - `src/pages/decks.astro` - główna strona
   - `src/components/decks/` - folder komponentów
   - `src/hooks/decks/` - custom hooks

2. **Rozszerz typy**
   - Dodaj nowe interfejsy do `src/types.ts`
   - Validate compatibility z istniejącymi API types
   - Setup error handling types

3. **Przygotuj routing**
   - Configure Astro routing dla `/decks`
   - Setup SEO meta tags
   - Implement authorization guards

4. **Utwórz base utilities**
   - Search debouncing utilities
   - Filter query builders
   - URL synchronization helpers
   - Validation utilities

5. **Setup testing infrastructure**
   - Unit test setup dla components
   - Mock API responses
   - Accessibility testing tools

6. **Create base components**
   - LoadingSpinner/Skeleton
   - ErrorBoundary
   - EmptyState
   - Toast notifications

7. **Implement main page structure**
   - DecksPage.astro z layoutem
   - Basic content structure
   - SEO meta tags setup

8. **Setup state management foundation**
   - React Query configuration
   - Error handling setup
   - Cache strategies

### Etap 2: Custom hooks implementation (Kroki 9-16)

9. **Implement useDecks hook**
   - API integration dla deck loading
   - Loading i error states
   - React Query cache management

10. **Create useDecksFilters hook**
    - Filter state management
    - URL synchronization
    - Preset filters logic

11. **Build useInfiniteScroll hook**
    - Cursor-based pagination
    - Load more functionality
    - Error handling

12. **Add useDebouncing helper**
    - Search input debouncing
    - Cancellation logic
    - Loading state coordination

13. **Implement useDeckActions hook**
    - CRUD operations dla decks
    - Optimistic updates
    - Error handling z rollback

14. **Create useResponsiveView hook**
    - Viewport detection
    - Layout switching logic
    - Responsive state management

15. **Add useUrlSync hook**
    - Query parameter synchronization
    - History management
    - Deep linking support

16. **Test all hooks**
    - Unit tests dla each hook
    - Integration tests z mock APIs
    - Error scenario testing

### Etap 3: Core components (Kroki 17-24)

17. **Build DecksContainer**
    - Main state orchestration
    - API integration
    - Error boundary integration

18. **Implement DecksHeader**
    - Search functionality
    - Page title i stats
    - Create deck CTA

19. **Create DecksFilterBar**
    - Sort controls
    - Filter options
    - Clear functionality

20. **Build DecksTable (desktop)**
    - Table layout z sortable columns
    - Row click handling
    - Responsive behavior

21. **Implement DeckRow**
    - Row content display
    - Action buttons
    - Hover states

22. **Create DeckCards (mobile)**
    - Card grid layout
    - Touch interactions
    - Responsive design

23. **Add DeckCard component**
    - Card content layout
    - Touch gestures
    - Action handling

24. **Test core components**
    - Component unit tests
    - Interaction testing
    - Accessibility validation

### Etap 4: Modals i infinite scroll (Kroki 25-32)

25. **Implement CreateDeckModal**
    - Form layout z validation
    - Real-time validation
    - Submit handling

26. **Create DeleteConfirmDialog**
    - Confirmation workflow
    - Safety measures
    - Keyboard handling

27. **Build infinite scroll system**
    - Intersection Observer setup
    - Load more functionality
    - Performance optimization

28. **Add loading states**
    - Skeleton placeholders
    - Loading indicators
    - Progressive loading

29. **Implement search system**
    - Debounced search input
    - Search results highlighting
    - Search state management

30. **Create toast system**
    - Success notifications
    - Error messages
    - Auto-dismiss logic

31. **Add keyboard shortcuts**
    - Search focus (/)
    - Create deck (n)
    - Navigation shortcuts

32. **Test advanced features**
    - Modal workflows testing
    - Infinite scroll testing
    - Search functionality testing

### Etap 5: Polish i optimization (Kroki 33-36)

33. **Implement responsive design**
    - Desktop table view
    - Mobile card view
    - Transition animations

34. **Add empty states**
    - No decks state
    - No search results
    - Error states

35. **Optimize performance**
    - Virtual scrolling dla large lists
    - Image lazy loading
    - Bundle optimization

36. **Complete accessibility**
    - ARIA labels i descriptions
    - Keyboard navigation
    - Screen reader testing
    - Color contrast validation

### Etap 6: Final testing (Kroki 37-40)

37. **Integration testing**
    - End-to-end workflows
    - API integration testing
    - Error scenario testing

38. **Performance testing**
    - Large dataset handling
    - Search performance
    - Infinite scroll performance

39. **Accessibility audit**
    - Screen reader testing
    - Keyboard navigation audit
    - Color contrast validation

40. **Production deployment**
    - Browser compatibility testing
    - Performance monitoring setup
    - Error tracking integration
