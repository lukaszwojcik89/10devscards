# Plan implementacji widoku Tryb nauki (Study Session)

## 1. Przegląd

Widok trybu nauki to główna funkcjonalność aplikacji AI Flashcards umożliwiająca użytkownikom wykonywanie codziennych powtórek fiszek w systemie Spaced Repetition (SRS) opartym na metodzie Leitner. Widok działa w trybie pełnoekranowym z obsługą skrótów klawiszowych, zapewnia interaktywną naukę z systemem oceniania 1-3 oraz implementuje mechanizm catch-up dla zaległych fiszek. Po zakończeniu sesji użytkownik przekierowywany jest do widoku podsumowania z wynikami nauki.

## 2. Routing widoku

**Ścieżka**: `/study`

**Query parameters**:

- `deck` (string, opcjonalny) - slug talii do nauki
- `catchup` (boolean, opcjonalny) - włączenie trybu catch-up dla zaległych fiszek

**Przykłady URL**:

- `/study` - sesja nauki ze wszystkich talii
- `/study?deck=javascript-basics` - sesja nauki z konkretnej talii
- `/study?catchup=true` - sesja nauki z włączonym catch-up
- `/study?deck=python-advanced&catchup=true` - kombinacja obydwu opcji

## 3. Struktura komponentów

```
StudySessionView (src/pages/study.astro - główny layout)
├── StudyContainer (React, full-screen wrapper)
    ├── StudyToolbar
    │   ├── ProgressIndicator (X/Y fiszek)
    │   ├── CatchupToggle (jeśli dostępne)
    │   ├── SessionTimer
    │   └── ExitButton (Esc)
    ├── FlashcardContainer
    │   ├── QuestionCard
    │   ├── AnswerCard (conditional render)
    │   └── CardActions
    │       ├── ShowAnswerButton (Space/Enter)
    │       └── RatingButtons (1-2-3)
    ├── KeyboardShortcuts (invisible event handlers)
    ├── HotkeysHint (floating keyboard help)
    ├── StudyControls (navigation hints)
    └── StudyModals
        ├── ExitConfirmationModal
        ├── SessionCompleteModal
        └── ErrorModal
```

## 4. Szczegóły komponentów

### StudyContainer

- **Opis**: Główny kontener sesji nauki w trybie pełnoekranowym. Zarządza stanem całej sesji, obsługuje keyboard events i koordynuje komunikację z API. Implementuje state machine dla przepływu nauki.
- **Główne elementy**: Pełnoekranowy layout z dark theme, centralized card display, floating toolbar, keyboard event listeners
- **Obsługiwane interakcje**: Keyboard shortcuts (1-3, Space, Enter, Esc), mouse clicks, touch gestures (mobile fallback), window focus/blur handling
- **Obsługiwana walidacja**: Sprawdzenie aktywnej sesji, walidacja ratingu (1-3), sprawdzenie timeout sesji, walidacja response time measurement
- **Typy**: `StudySessionState`, `StudySessionResponseDTO`, `StudyAnswer`, `KeyboardEventHandlers`
- **Propsy**: `deckSlug?: string`, `includeCatchup?: boolean`, `onSessionComplete: () => void`, `onExit: () => void`

### StudyToolbar

- **Opis**: Górny pasek narzędzi z informacjami o postępie sesji, kontrolkami opcji oraz przyciskiem wyjścia. Wyświetla current progress, czas sesji oraz dostępne opcje.
- **Główne elementy**: Progress bar/indicator, session timer, catchup toggle switch, settings dropdown, exit button z ikoną
- **Obsługiwane interakcje**: Toggle catchup option, click exit with confirmation, hover states dla tooltips
- **Obsługiwana walidacja**: Sprawdzenie czy catchup jest dostępny, walidacja limitu dziennego, sprawdzenie uprawnień do opcji
- **Typy**: `StudySessionMetadata`, `CatchupToggleProps`, `ProgressIndicatorProps`
- **Propsy**: `currentIndex: number`, `totalCount: number`, `catchupAvailable: boolean`, `onCatchupToggle: (enabled: boolean) => void`, `onExit: () => void`

### FlashcardContainer

- **Opis**: Kontener dla wyświetlania fiszek z płynnymi animacjami przejść między pytaniem a odpowiedzią. Obsługuje stan wyświetlania (question/answer) i smooth transitions.
- **Główne elementy**: Question card display, answer card (conditional), flip animation container, card content with proper typography
- **Obsługiwane interakcje**: Card flip animation, smooth transitions between states, responsive layout adjustments
- **Obsługiwana walidacja**: Sprawdzenie czy odpowiedź jest dostępna, walidacja długości content (scroll for long text)
- **Typy**: `StudyFlashcard`, `CardDisplayState`, `AnimationProps`
- **Propsy**: `flashcard: StudyFlashcard`, `showAnswer: boolean`, `isAnimating: boolean`, `onAnimationComplete: () => void`

### QuestionCard

- **Opis**: Komponent wyświetlający pytanie z fiszki. Obsługuje formatowanie tekstu, syntax highlighting dla kodu oraz responsive design dla różnych długości pytań.
- **Główne elementy**: Question text container, code syntax highlighting (jeśli applicable), scroll container dla długich pytań, deck name indicator
- **Obsługiwane interakcje**: Text selection, scroll dla długiego content, focus management dla accessibility
- **Obsługiwana walidacja**: Sanitization HTML content, sprawdzenie długości text (auto-scroll), walidacja encoding
- **Typy**: `StudyFlashcard`, `TextFormattingOptions`, `ScrollProps`
- **Propsy**: `question: string`, `deckName: string`, `className?: string`, `onContentLoad: () => void`

### AnswerCard

- **Opis**: Komponent wyświetlający odpowiedź po wciśnięciu "Show Answer". Obsługuje highlighting, formatowanie kodu oraz markdown rendering dla rich content.
- **Główne elementy**: Answer text container, markdown rendering, code highlighting, related links/references (jeśli available)
- **Obsługiwane interakcje**: Text selection, scroll, copy answer content, expand/collapse dla długich odpowiedzi
- **Obsługiwana walidacja**: Markdown sanitization, sprawdzenie XSS, walidacja code highlighting syntax
- **Typy**: `StudyFlashcard`, `MarkdownRenderProps`, `CodeHighlightProps`
- **Propsy**: `answer: string`, `isVisible: boolean`, `onReveal: () => void`, `className?: string`

### CardActions

- **Opis**: Sekcja z przyciskami akcji - "Show Answer" oraz rating buttons (1-2-3). Obsługuje state-dependent visibility oraz keyboard shortcuts hints.
- **Główne elementy**: Show Answer button (conditional), rating buttons grid (1-2-3), keyboard hints, loading states
- **Obsługiwane interakcje**: Click actions, keyboard shortcuts (Space, 1-3), hover effects, disabled states during API calls
- **Obsługiwana walidacja**: Sprawdzenie czy answer jest widoczna, walidacja rating range (1-3), debouncing multiple clicks
- **Typy**: `CardActionState`, `RatingButtonProps`, `ActionHandlers`
- **Propsy**: `showAnswer: boolean`, `isSubmitting: boolean`, `onShowAnswer: () => void`, `onRate: (rating: 1|2|3) => void`

### KeyboardShortcuts

- **Opis**: Invisible komponent zarządzający global keyboard event handlers dla sesji nauki. Implementuje wszystkie skróty klawiszowe zgodnie z UI specification.
- **Główne elementy**: Event listeners dla keyboard events, shortcut mapping object, prevent default handling, focus management
- **Obsługiwane interakcje**: Space/Enter (show answer/submit), 1-2-3 (rating), Esc (exit), arrow keys (navigation hints)
- **Obsługiwana walidacja**: Sprawdzenie focus context, walidacja allowed keys, preventing conflicts z form inputs
- **Typy**: `KeyboardShortcutMap`, `KeyboardEventHandler`, `ShortcutContext`
- **Propsy**: `isActive: boolean`, `currentState: StudySessionState`, `handlers: KeyboardHandlers`, `disabled: boolean`

### HotkeysHint

- **Opis**: Floating component wyświetlający dostępne skróty klawiszowe w zależności od aktualnego stanu sesji. Auto-hide po kilku sekundach użytkowania.
- **Główne elementy**: Floating overlay, keyboard shortcuts list, contextual hints (show answer vs rate), auto-hide timer
- **Obsługiwane interakcje**: Manual show/hide toggle, auto-hide on user activity, responsive positioning
- **Obsługiwana walidacja**: Sprawdzenie aktualnego context, walidacja visibility timing, responsive breakpoint handling
- **Typy**: `HotkeysHintProps`, `ShortcutDisplayInfo`, `VisibilityState`
- **Propsy**: `currentState: StudySessionState`, `isVisible: boolean`, `onToggle: () => void`, `autoHideDelay: number`

## 5. Typy

```typescript
// API Response Types (dodać do types.ts)
interface StudySessionResponseDTO {
  data: {
    session_id: string;
    flashcards: StudyFlashcard[];
    metadata: StudySessionMetadata;
  };
}

interface StudyFlashcard {
  id: string;
  question: string;
  answer: string; // dodane dla complete data
  deck_name: string;
  box: "box1" | "box2" | "box3";
  due_date: string;
}

interface StudySessionMetadata {
  total_due: number;
  session_limit: number;
  catchup_available: number;
  daily_reviews_completed: number;
  daily_limit: number;
}

// Local State Management Types
interface StudySessionState {
  sessionId: string;
  flashcards: StudyFlashcard[];
  currentIndex: number;
  showAnswer: boolean;
  isSubmitting: boolean;
  isComplete: boolean;
  error: string | null;
  metadata: StudySessionMetadata;
  startTime: number;
  responseStartTime: number;
}

interface StudyAnswer {
  flashcard_id: string;
  rating: 1 | 2 | 3;
  response_time_ms: number;
  session_id: string;
}

// Component Props Types
interface StudyContainerProps {
  deckSlug?: string;
  includeCatchup?: boolean;
  onSessionComplete: () => void;
  onExit: () => void;
}

interface StudyToolbarProps {
  currentIndex: number;
  totalCount: number;
  catchupAvailable: boolean;
  sessionTimer: number;
  onCatchupToggle: (enabled: boolean) => void;
  onExit: () => void;
}

interface FlashcardContainerProps {
  flashcard: StudyFlashcard;
  showAnswer: boolean;
  isAnimating: boolean;
  onAnimationComplete: () => void;
}

interface CardActionProps {
  showAnswer: boolean;
  isSubmitting: boolean;
  onShowAnswer: () => void;
  onRate: (rating: 1 | 2 | 3) => void;
}

// Keyboard & Interaction Types
interface KeyboardHandlers {
  onShowAnswer: () => void;
  onRate: (rating: 1 | 2 | 3) => void;
  onExit: () => void;
  onToggleHelp: () => void;
}

interface KeyboardShortcut {
  key: string;
  description: string;
  action: () => void;
  enabled: boolean;
}

// Error & Loading States
type StudySessionStatus = "loading" | "ready" | "question" | "answer" | "submitting" | "complete" | "error";

interface StudyError {
  type: "network" | "session_expired" | "daily_limit" | "no_cards" | "server_error";
  message: string;
  retryable: boolean;
  details?: Record<string, any>;
}
```

## 6. Zarządzanie stanem

Widok używa lokalnego stanu zarządzanego przez custom hook `useStudySession` wraz z dodatkowymi hooks dla keyboard handling i timer management. Stan jest izolowany do sesji nauki i nie jest przechowywany w globalnym store.

### Custom Hook: useStudySession

```typescript
function useStudySession(deckSlug?: string, includeCatchup?: boolean) {
  const [sessionState, setSessionState] = useState<StudySessionState | null>(null);
  const [status, setStatus] = useState<StudySessionStatus>("loading");
  const [error, setError] = useState<StudyError | null>(null);

  // API integration
  const fetchSession = async () => {
    // GET /api/study/session with params
  };

  const submitAnswer = async (answer: StudyAnswer) => {
    // POST /api/reviews
  };

  // Actions
  const showAnswer = () => {
    /* reveal answer + start response timer */
  };
  const rateCard = async (rating: 1 | 2 | 3) => {
    /* submit + move to next */
  };
  const exitSession = () => {
    /* cleanup + navigate */
  };

  return {
    sessionState,
    status,
    error,
    showAnswer,
    rateCard,
    exitSession,
    retrySession,
  };
}
```

### Supporting Hooks

- **useKeyboardShortcuts**: Zarządzanie global keyboard events
- **useSessionTimer**: Tracking czasu sesji i response time
- **useStudyNavigation**: Handle navigation between cards
- **useOptimisticUpdates**: Immediate UI updates z rollback on error

### State Persistence

- **localStorage backup**: Zapisanie aktualnego stanu w przypadku refresh/close tab
- **Session recovery**: Możliwość kontynuacji sesji po unexpected interruption
- **Progress tracking**: Continuous save current progress dla analytics

## 7. Integracja API

### GET /api/study/session (Inicjalizacja sesji)

**Request**:

```typescript
const params = new URLSearchParams({
  deck_slug: deckSlug || "",
  include_catchup: includeCatchup?.toString() || "false",
  limit: "50",
});
```

**Response**: `StudySessionResponseDTO` z listą fiszek i metadanymi

**Error handling**:

- 404: Brak fiszek → przekierowanie do Dashboard z komunikatem
- 429: Dzienny limit → pokazanie limitu i czasu reset
- 401: Session expired → redirect do /login

### POST /api/reviews (Submission odpowiedzi)

**Request**:

```typescript
interface ReviewSubmissionRequest {
  flashcard_id: string;
  rating: 1 | 2 | 3;
  response_time_ms: number;
  session_id: string;
}
```

**Response**: Confirmation z info o box advancement

**Optimistic updates**: Lokalnie przejście do następnej fiszki, rollback on API error

### Error Recovery

- **Network timeouts**: Auto-retry z exponential backoff
- **Temporary failures**: Queue submissions for retry
- **Session invalidation**: Graceful logout i redirect
- **Data corruption**: Clear local state i restart session

## 8. Interakcje użytkownika

### Przepływ podstawowy

1. **Wejście do sesji**: Użytkownik klika "Do nauki dziś" w Dashboard lub bezpośredni URL
2. **Ładowanie sesji**: API fetch z loading skeleton, sprawdzenie dostępności fiszek
3. **Wyświetlenie pytania**: Show question card z deck name i progress indicator
4. **Odsłonięcie odpowiedzi**: Space/Enter lub click "Show Answer" → flip animation
5. **Ocena odpowiedzi**: 1-3 rating (keyboard lub click) → submit do API
6. **Następna fiszka**: Automatic transition do next card lub session summary
7. **Zakończenie sesji**: Redirect do `/study/summary` z results

### Keyboard Navigation

- **Space/Enter**:
  - W stanie "question": odsłonięcie odpowiedzi
  - W stanie "answer": submit ostatniego ratingu (default 2)
- **1, 2, 3**: Rating odpowiedzi (tylko gdy answer visible)
- **Esc**: Exit sesji z confirmation modal
- **?**: Toggle keyboard shortcuts help
- **Tab**: Standard focus navigation (fallback)

### Touch/Mobile Interactions

- **Tap card**: Show answer (gdy question visible)
- **Swipe gestures**:
  - Swipe up: Show answer
  - Swipe left: Rate 1 (Again)
  - Swipe right: Rate 3 (Easy)
  - Swipe down: Rate 2 (Good)
- **Long press**: Show keyboard shortcuts help

### Catch-up Functionality

- **Toggle dostępny**: Gdy `catchup_available > 0` w metadata
- **Visual indicator**: Inny kolor dla catch-up cards
- **Limit enforcement**: Auto-disable gdy catch-up wyczerpany
- **Progress separation**: Osobne liczniki dla regular vs catch-up cards

## 9. Warunki i walidacja

### Session Validation

- **Session aktywność**: Sprawdzenie czy session_id jest valid przed każdym submit
- **Timing validation**: Response time w rozsądnych granicach (100ms - 5min)
- **Rating validation**: Tylko wartości 1-3, reject invalid inputs
- **Sequence validation**: Sprawdzenie czy flashcard_id należy do aktualnej sesji

### Daily Limits

- **Check przed session**: Sprawdzenie daily_reviews_completed vs daily_limit
- **Real-time monitoring**: Update limitu po każdej odpowiedzi
- **Limit enforcement**: Disable nowe sesje gdy limit reached
- **Catch-up limits**: Separate tracking dla catch-up vs regular reviews

### Content Validation

- **XSS protection**: Sanitization question/answer content przed display
- **Length limits**: Auto-scroll dla długich questions/answers
- **Encoding validation**: Proper UTF-8 handling dla international content
- **Code highlighting**: Safe parsing code blocks w answers

### User Permissions

- **Authentication**: Sprawdzenie JWT token przed każdym API call
- **Deck ownership**: RLS enforcement na poziomie API
- **Feature access**: Sprawdzenie czy user ma dostęp do catch-up
- **Rate limiting**: Respect API rate limits dla user actions

## 10. Obsługa błędów

### Network Errors

**Scenario**: Brak połączenia internetowego lub API niedostępne
**Handling**:

- Retry mechanism z exponential backoff (3 próby)
- Offline indicator w UI
- Queue pending submissions dla later retry
- Graceful degradation z local state preservation

### Session Errors

**Scenario**: Session expired lub invalid session_id
**Handling**:

- Clear local session state
- Redirect do Dashboard z komunikatem
- Auto-login attempt jeśli refresh token available
- Loss prevention: localStorage backup current progress

### Daily Limit Errors

**Scenario**: 429 Too Many Requests - dzienny limit przekroczony
**Handling**:

- Display limit reached modal z reset time
- Disable session start buttons
- Show alternative actions (browse decks, settings)
- Cache limit status dla performance

### Content Errors

**Scenario**: Malformed question/answer content lub missing data
**Handling**:

- Skip corrupted flashcard z logging
- Continue z next card w session
- Report error do analytics
- Fallback content display "Content unavailable"

### API Validation Errors

**Scenario**: 400 Bad Request - invalid submission data
**Handling**:

- Display detailed error message
- Allow user correction (re-rate card)
- Log validation errors dla debugging
- Prevent submission przy known invalid states

### Critical Errors

**Scenario**: 500 Internal Server Error lub unexpected exceptions
**Handling**:

- Display generic error modal z retry option
- Save current session state do localStorage
- Provide error reporting mechanism
- Graceful exit z preservation progress

### Error Recovery Patterns

```typescript
interface ErrorRecoveryStrategy {
  retryable: boolean;
  maxRetries: number;
  backoffMs: number;
  fallbackAction: () => void;
  userMessage: string;
  logLevel: "warn" | "error" | "critical";
}
```

## 11. Kroki implementacji

### Etap 1: Przygotowanie infrastruktury (Kroki 1-8)

1. **Dodaj brakujące typy do src/types.ts**

   - `StudySessionResponseDTO`, `StudyFlashcard`, `StudySessionMetadata`
   - `StudySessionState`, `StudyAnswer`, `StudyError`
   - Component props interfaces, keyboard handling types

2. **Utwórz hook useStudySession w src/lib/hooks/**

   - Podstawowa struktura z state management
   - API integration placeholder functions
   - Error handling infrastructure

3. **Utwórz API client functions w src/lib/services/study.service.ts**

   - `fetchStudySession(params)` → GET /api/study/session
   - `submitStudyAnswer(answer)` → POST /api/reviews
   - Error mapping i response formatting

4. **Skonfiguruj routing w src/pages/study.astro**

   - Podstawowy Astro layout z React island
   - Query parameters extraction (deck, catchup)
   - SEO meta tags i page title

5. **Utwórz główny layout StudyContainer w src/components/study/**

   - React component z full-screen layout
   - Podstawowy state management setup
   - Props interface i TypeScript setup

6. **Utwórz komponenty StudyToolbar i FlashcardContainer**

   - Podstawowe struktury komponentów
   - Props interfaces i placeholder content
   - Tailwind styling foundation

7. **Utwórz hook useKeyboardShortcuts**

   - Global keyboard event listeners
   - Shortcut mapping object
   - Focus management i prevent default handling

8. **Setup Tailwind styles dla study mode**
   - Full-screen layout utilities
   - Dark theme variables
   - Animation classes dla card transitions

### Etap 2: Core Functionality - API Integration (Kroki 9-16)

9. **Implementuj fetchStudySession w useStudySession**

   - API call z proper query parameters
   - Loading state management
   - Response data transformation

10. **Implementuj error handling dla session loading**

    - Network error detection i retry logic
    - API error code mapping
    - User-friendly error messages

11. **Implementuj submitStudyAnswer w useStudySession**

    - POST request z answer data
    - Response handling i state updates
    - Optimistic update pattern

12. **Dodaj session state transitions**

    - Loading → Ready → Question → Answer → Submitting cycle
    - State validation i transition guards
    - Error state handling

13. **Implementuj session initialization w StudyContainer**

    - useEffect hook dla API call on mount
    - Query parameters processing
    - Initial state setup

14. **Dodaj loading states do UI komponentów**

    - Skeleton screens dla loading session
    - Loading indicators dla API calls
    - Smooth transition animations

15. **Implementuj basic error recovery**

    - Retry mechanisms dla failed API calls
    - Error modal z user actions
    - Graceful fallback states

16. **Dodaj session completion handling**
    - Detection gdy wszystkie fiszki completed
    - Navigation do summary page
    - Session cleanup procedures

### Etap 3: Flashcard Display & Interaction (Kroki 17-24)

17. **Implementuj QuestionCard component**

    - Question text display z proper formatting
    - Deck name indicator
    - Responsive layout dla different question lengths

18. **Implementuj AnswerCard component**

    - Conditional rendering based on showAnswer state
    - Answer text z markdown support
    - Code syntax highlighting (jeśli needed)

19. **Implementuj card flip animation**

    - CSS transitions między question i answer
    - Smooth animation performance
    - Accessibility-friendly reduced motion support

20. **Implementuj CardActions component**

    - Show Answer button z proper states
    - Rating buttons (1-2-3) z visual feedback
    - Loading states podczas API submission

21. **Dodaj response time tracking**

    - Timer start na question display
    - Timer stop na answer submission
    - Response time calculation i storage

22. **Implementuj navigation między cards**

    - Automatic transition po successful rating
    - Previous/next card handling (jeśli needed)
    - Session progress management

23. **Dodaj visual feedback dla user actions**

    - Button hover i active states
    - Success/error feedback animations
    - Progress indicator updates

24. **Implementuj card content sanitization**
    - XSS protection dla question/answer text
    - Safe HTML rendering
    - Code highlighting security

### Etap 4: Keyboard Shortcuts & Accessibility (Kroki 25-32)

25. **Implementuj podstawowe keyboard shortcuts**

    - Space/Enter dla show answer i submit
    - Number keys (1-3) dla rating
    - Escape dla exit session

26. **Dodaj keyboard shortcuts context awareness**

    - Different shortcuts w different states
    - Disable shortcuts podczas loading/submitting
    - Focus management dla proper key handling

27. **Implementuj HotkeysHint component**

    - Floating overlay z current shortcuts
    - Auto-hide functionality po user activity
    - Responsive positioning

28. **Dodaj focus management**

    - Proper tab order dla keyboard navigation
    - Auto-focus na relevant elements
    - Focus visible indicators

29. **Implementuj ARIA attributes**

    - aria-live regions dla dynamic content updates
    - aria-labels dla all interactive elements
    - aria-describedby dla help text

30. **Dodaj screen reader support**

    - Proper heading structure (h1-h6)
    - Descriptive text dla images i icons
    - Status announcements dla state changes

31. **Implementuj high contrast mode support**

    - CSS custom properties dla colors
    - Proper contrast ratios (WCAG AA)
    - Alternative styling dla low vision users

32. **Dodaj reduced motion support**
    - @media (prefers-reduced-motion) queries
    - Alternative non-animated transitions
    - Instant state changes option

### Etap 5: Toolbar & Progress Management (Kroki 33-36)

33. **Implementuj ProgressIndicator w StudyToolbar**

    - Current card / total cards display
    - Visual progress bar
    - Separate indicators dla regular vs catch-up

34. **Implementuj CatchupToggle functionality**

    - Toggle switch z proper states
    - API integration dla catch-up mode
    - Visual indicators dla catch-up cards

35. **Implementuj SessionTimer**

    - Real-time timer display
    - Pause/resume functionality (jeśli needed)
    - Time formatting (MM:SS)

36. **Implementuj ExitButton z confirmation**
    - Exit session z user confirmation
    - Save current progress before exit
    - Navigation do appropriate page

### Etap 6: Advanced Error Handling (Kroki 37-40)

37. **Implementuj comprehensive error scenarios**

    - Network timeout handling
    - API rate limiting responses
    - Session expiration detection

38. **Dodaj error recovery mechanisms**

    - Automatic retry z exponential backoff
    - Manual retry options dla users
    - Session state restoration

39. **Implementuj localStorage backup**

    - Save session state periodically
    - Restore session on page reload
    - Clear backup on successful completion

40. **Dodaj error reporting i analytics**
    - Error logging dla debugging
    - User-friendly error messages
    - Analytics events dla error tracking

### Etap 7: Polish & Testing (Kroki 41-42)

41. **Performance optimization**

    - React.memo dla expensive components
    - useCallback/useMemo dla expensive calculations
    - Image/content preloading dla smooth UX

42. **Final testing i bug fixes**
    - Cross-browser compatibility testing
    - Mobile responsiveness verification
    - Accessibility testing z screen readers
    - End-to-end user flow testing
