# Plan implementacji widoku Generator AI

## 1. Przegląd

Generator AI stanowi modal overlay umożliwiający błyskawiczne generowanie fiszek z tekstu przy użyciu sztucznej inteligencji w aplikacji AI Flashcards. Modal może być wywołany z różnych widoków aplikacji (dashboard, lista talii, szczegóły talii) i zapewnia kompleksowy workflow od wprowadzenia tekstu, przez wybór lub utworzenie talii docelowej, po podgląd i zatwierdzenie wygenerowanych fiszek. System implementuje zaawansowane funkcje takie jak real-time walidacja budżetu, inline tworzenie nowych talii, progress tracking oraz preview mode zgodnie z wymogami WCAG AA.

## 2. Routing widoku

- **Ścieżka**: `/generate` (modal overlay, nie standalone page)
- **Trigger mechanism**: Global modal state zarządzany przez Context API
- **URL integration**: Deep linking z parametrem `?modal=generate&deck=:slug`
- **Modal triggers**:
  - Dashboard quick action "Generuj fiszki"
  - Deck list action button
  - Deck detail header action
  - Navbar global "+" dropdown option
- **Context awareness**: Preselection deck based na current view context
- **Close behavior**: Return to triggering view, optional refresh parent data

## 3. Struktura komponentów

```
GenerateAIModal (React Modal/Dialog)
├── ModalOverlay (backdrop z focus trap)
├── ModalContainer (responsive sizing)
│   ├── ModalHeader
│   │   ├── ModalTitle "Generuj fiszki AI"
│   │   └── CloseButton (X icon)
│   ├── ModalContent (scrollable)
│   │   ├── StepIndicator (Input → Generowanie → Podgląd)
│   │   ├── DeckSelectionSection
│   │   │   ├── DeckSelector (dropdown existing decks)
│   │   │   ├── InlineCreateToggle
│   │   │   └── InlineCreateDeck (conditional)
│   │   │       ├── DeckNameInput
│   │   │       ├── DeckDescriptionTextarea
│   │   │       └── CreateDeckButton
│   │   ├── TextInputSection
│   │   │   ├── InputLabel + CharacterCounter
│   │   │   ├── TextInputTextarea (max 2000 chars)
│   │   │   └── ValidationMessages
│   │   ├── GenerationSettingsSection
│   │   │   ├── MaxCardsSlider (1-10 range)
│   │   │   ├── DifficultySelect (dropdown)
│   │   │   └── LanguageSelect (pl/en)
│   │   ├── BudgetWarningBanner (conditional)
│   │   │   ├── CurrentUsageIndicator
│   │   │   ├── EstimatedCostDisplay
│   │   │   └── UpgradeLink
│   │   ├── GenerationProgressSection (when generating)
│   │   │   ├── ProgressSpinner
│   │   │   ├── ProgressBar (if available)
│   │   │   ├── StatusMessage
│   │   │   └── CancelButton
│   │   ├── PreviewResultsSection (when completed)
│   │   │   ├── GenerationSummary
│   │   │   │   ├── MetadataDisplay (count, cost, tokens)
│   │   │   │   └── RegenerateButton
│   │   │   └── FlashcardsPreviewList
│   │   │       ├── SelectAllToggle
│   │   │       └── FlashcardPreviewItem[]
│   │   │           ├── CardContent (question/answer)
│   │   │           ├── AcceptRejectToggle
│   │   │           └── InlineEditButton
│   │   └── ErrorDisplaySection (when error)
│   │       ├── ErrorIcon + ErrorMessage
│   │       ├── ErrorDetails (technical info)
│   │       └── RetryActionButton
│   └── ModalFooter
│       ├── HelpText (keyboard shortcuts)
│       ├── ActionButtons
│       │   ├── CancelButton (always visible)
│       │   ├── GenerateButton (step 1)
│       │   └── SaveButton (step 3, shows count)
│       └── SecondaryActions
│           ├── ResetFormButton
│           └── ExportPreviewButton
```

## 4. Szczegóły komponentów

### GenerateAIModal (React)

- **Opis**: Główny kontener modal z overlay, focus management i step-based workflow zarządzaniem
- **Główne elementy**: Modal wrapper, responsive container, step management, keyboard shortcuts, focus trap
- **Obsługiwane interakcje**: Open/close modal, step navigation, escape key handling, backdrop clicks, keyboard shortcuts
- **Obsługiwana walidacja**: Modal state validation, step transition rules, unsaved changes confirmation
- **Typy**: `GenerateAIModalState`, `ModalStep`, `ErrorResponseDTO`
- **Propsy**: `isOpen`, `onClose`, `preselectedDeckId?`, `triggerSource`, `onSuccess`

### DeckSelector (React)

- **Opis**: Dropdown selection dla existing decks z opcją inline tworzenia nowej talii
- **Główne elementy**: Select dropdown z user decks, loading state, empty state, inline create toggle
- **Obsługiwane interakcje**: Deck selection z dropdown, toggle inline create mode, search/filter decks
- **Obsługiwana walidacja**: Required deck selection, deck ownership validation, deck existence check
- **Typy**: `DeckWithCounts[]`, `DeckSelectorProps`
- **Propsy**: `decks`, `selectedDeckId`, `onSelect`, `showInlineCreate`, `onToggleInlineCreate`, `isLoading`

### InlineCreateDeck (React)

- **Opis**: Inline form do szybkiego tworzenia nowej talii bez opuszczania modal
- **Główne elementy**: Deck name input, description textarea, create button, validation messages
- **Obsługiwane interakcje**: Form input, real-time validation, create submission, error handling
- **Obsługiwana walidacja**: Name required (max 100 chars), description optional (max 500), slug uniqueness
- **Typy**: `CreateDeckData`, `CreateDeckCommand`, `DeckWithCounts`
- **Propsy**: `onDeckCreated`, `isCreating`, `onCancel`

### TextInputSection (React)

- **Opis**: Główna sekcja input tekstu z real-time character counting i walidacją
- **Główne elementy**: Large textarea, character counter, validation indicators, paste detection
- **Obsługiwane interakcje**: Text typing, paste events, drag-drop text, clear text action
- **Obsługiwana walidacja**: Required non-empty text, max 2000 characters, no markdown formatting, text sanitization
- **Typy**: `TextInputProps`, `ValidationResult`
- **Propsy**: `inputText`, `onTextChange`, `maxLength`, `placeholder`, `isDisabled`

### GenerationSettingsSection (React)

- **Opis**: Panel ustawień generacji AI z kontrolami max cards, difficulty i language
- **Główne elementy**: Max cards slider z label, difficulty dropdown, language selector, cost estimation
- **Obsługiwane interakcje**: Slider value changes, dropdown selections, settings reset, cost updates
- **Obsługiwana walidacja**: Max cards 1-10 range, difficulty enum validation, language enum validation
- **Typy**: `GenerationSettings`, `DifficultyLevel`, `LanguageCode`
- **Propsy**: `settings`, `onSettingsChange`, `estimatedCost`, `maxAllowedCards`

### BudgetWarningBanner (React)

- **Opis**: Conditional banner showing budget usage warnings i cost estimates
- **Główne elementy**: Warning icon, current usage bar, estimated cost display, upgrade link
- **Obsługiwane interakcje**: Dismiss warning, upgrade link click, cost breakdown expansion
- **Obsługiwana walidacja**: Budget threshold calculation, cost estimation accuracy
- **Typy**: `BudgetInfo`, `BudgetWarningProps`
- **Propsy**: `budgetInfo`, `estimatedCost`, `onDismiss`, `onUpgrade`, `warningLevel`

### GenerationProgressSection (React)

- **Opis**: Progress tracking podczas generacji AI z cancel option
- **Główne elementy**: Progress spinner, status messages, estimated time remaining, cancel button
- **Obsługiwane interakcje**: Cancel generation request, progress updates, time estimation
- **Obsługiwana walidacja**: Generation timeout handling, cancel confirmation
- **Typy**: `GenerationProgress`, `GenerationStatus`
- **Propsy**: `isGenerating`, `progress`, `statusMessage`, `onCancel`, `estimatedTime`

### PreviewResultsSection (React)

- **Opis**: Sekcja podglądu wygenerowanych fiszek z selection i editing capabilities
- **Główne elementy**: Generation summary, flashcards preview list, select all toggle, individual card controls
- **Obsługiwane interakcje**: Select/deselect cards, inline editing, regenerate action, export preview
- **Obsługiwana walidacja**: Minimum selection requirement, card content validation, edited content limits
- **Typy**: `FlashcardPreview[]`, `GenerationSummary`, `PreviewResultsProps`
- **Propsy**: `flashcards`, `summary`, `selectedCards`, `onSelectionChange`, `onCardEdit`, `onRegenerate`

### ErrorDisplaySection (React)

- **Opis**: Comprehensive error display z specific error handling i recovery actions
- **Główne elementy**: Error icon, error message, technical details, retry button, help links
- **Obsługiwane interakcje**: Retry failed operation, view error details, contact support, dismiss error
- **Obsługiwana walidacja**: Error type classification, retry eligibility check
- **Typy**: `GenerationError`, `ErrorDisplayProps`
- **Propsy**: `error`, `onRetry`, `onDismiss`, `showDetails`, `canRetry`

## 5. Typy

### Nowe typy ViewModel

```typescript
// Stan głównego modal Generator AI
interface GenerateAIModalState {
  // Modal control
  isOpen: boolean;
  step: "input" | "generating" | "preview" | "error";
  triggerSource: "dashboard" | "decks" | "deck-detail" | "navbar";

  // Form data
  selectedDeckId: string | null;
  newDeckData: CreateDeckData | null;
  inputText: string;
  generationSettings: GenerationSettings;

  // Generation state
  isGenerating: boolean;
  generationProgress: GenerationProgress | null;

  // Results data
  generatedFlashcards: FlashcardPreview[];
  generationSummary: GenerationSummary | null;
  selectedCards: string[];

  // Error handling
  error: GenerationError | null;
  validationErrors: ValidationErrors;

  // UI state
  showInlineCreate: boolean;
  budgetWarningDismissed: boolean;
}

// Ustawienia generacji AI
interface GenerationSettings {
  maxCards: number; // 1-10
  difficulty: "beginner" | "intermediate" | "advanced";
  language: "pl" | "en";
  context?: string; // dodatkowy kontekst dla AI
}

// Dane nowej talii (inline create)
interface CreateDeckData {
  name: string;
  description?: string;
  slug?: string; // auto-generated if not provided
}

// Preview fiszki przed zapisem
interface FlashcardPreview {
  id: string; // temporary ID for preview
  question: string;
  answer: string;
  isSelected: boolean;
  isEdited: boolean;
  originalQuestion?: string; // backup for undo
  originalAnswer?: string;
}

// Podsumowanie generacji
interface GenerationSummary {
  totalGenerated: number;
  totalCost: number;
  totalTokens: number;
  modelUsed: string;
  generationTime: number; // ms
  acceptanceRate?: number; // if user has history
}

// Progress tracking
interface GenerationProgress {
  current: number;
  total: number;
  status: "initializing" | "processing" | "generating" | "finalizing";
  statusMessage: string;
  estimatedTimeRemaining?: number; // seconds
}

// Informacje budżetu
interface BudgetInfo {
  currentSpend: number;
  monthlyLimit: number;
  usagePercentage: number;
  estimatedCost: number;
  warningThreshold: number; // 80% default
  isBlocked: boolean; // 100% exceeded
}

// Błędy generacji
interface GenerationError {
  type: "validation" | "budget" | "rate_limit" | "api" | "network" | "unknown";
  code: string;
  message: string;
  details?: Record<string, unknown>;
  isRetryable: boolean;
  retryAfter?: number; // seconds for rate limits
}

// Walidacja input
interface ValidationErrors {
  deckSelection?: string;
  inputText?: string;
  maxCards?: string;
  difficulty?: string;
  budgetExceeded?: string;
  general?: string;
}

// Props dla głównych komponentów
interface DeckSelectorProps {
  decks: DeckWithCounts[];
  selectedDeckId: string | null;
  onSelect: (deckId: string) => void;
  showInlineCreate: boolean;
  onToggleInlineCreate: () => void;
  isLoading: boolean;
}

interface TextInputProps {
  inputText: string;
  onTextChange: (text: string) => void;
  maxLength: number;
  placeholder: string;
  isDisabled: boolean;
  validationError?: string;
}

interface PreviewResultsProps {
  flashcards: FlashcardPreview[];
  summary: GenerationSummary;
  selectedCards: string[];
  onSelectionChange: (cardIds: string[]) => void;
  onCardEdit: (cardId: string, updates: Partial<FlashcardPreview>) => void;
  onRegenerate: () => void;
}
```

### Istniejące typy API (z types.ts)

- `GenerateFlashcardsRequest` - request do API generacji
- `GenerateFlashcardsResponse` - response z API generacji
- `FlashcardListItem` - standardowy format fiszki
- `DeckWithCounts` - informacje o talii z licznikami
- `CreateDeckCommand` - komenda tworzenia talii
- `ErrorResponseDTO` - standardowy format błędów API
- `PaginationDTO` - paginacja dla list

## 6. Zarządzanie stanem

### Custom Hook: useGenerateAIModal

```typescript
interface UseGenerateAIModalReturn {
  modalState: GenerateAIModalState;
  actions: {
    openModal: (triggerSource?: string, preselectedDeck?: string) => void;
    closeModal: (confirmUnsaved?: boolean) => void;
    setStep: (step: ModalStep) => void;
    setDeck: (deckId: string | null) => void;
    setInputText: (text: string) => void;
    setGenerationSettings: (settings: Partial<GenerationSettings>) => void;
    toggleInlineCreate: () => void;
    resetForm: () => void;
  };
  computed: {
    canGenerate: boolean;
    estimatedCost: number;
    selectedCardsCount: number;
    hasUnsavedChanges: boolean;
  };
}
```

### Custom Hook: useFlashcardGeneration

```typescript
interface UseFlashcardGenerationReturn {
  generateFlashcards: (request: GenerateFlashcardsRequest) => Promise<GenerateFlashcardsResponse>;
  isGenerating: boolean;
  progress: GenerationProgress | null;
  cancelGeneration: () => void;
  estimateGenerationTime: (textLength: number) => number;
  validateGenerationRequest: (request: GenerateFlashcardsRequest) => ValidationResult;
}
```

### Custom Hook: useBudgetMonitoring

```typescript
interface UseBudgetMonitoringReturn {
  budgetInfo: BudgetInfo;
  checkBudget: () => Promise<void>;
  calculateEstimatedCost: (textLength: number, maxCards: number) => number;
  getBudgetWarning: () => string | null;
  isBudgetExceeded: boolean;
  canAffordGeneration: (estimatedCost: number) => boolean;
}
```

### Custom Hook: useModalKeyboardShortcuts

```typescript
interface UseModalKeyboardShortcutsReturn {
  setupShortcuts: () => void;
  cleanupShortcuts: () => void;
  shortcuts: {
    generate: "Ctrl+Enter";
    cancel: "Escape";
    selectAll: "Ctrl+A";
    save: "Ctrl+S";
  };
}
```

**Funkcjonalności hooków:**

- React Query integration dla API caching
- Real-time budget monitoring z periodic updates
- Step-based state machine z validation
- Keyboard shortcuts handling
- Form state persistence podczas errors
- Optimistic updates dla deck creation
- Focus management podczas step transitions

**Stan lokalny w komponentach:**

- GenerateAIModal: główny workflow state + UI preferences
- DeckSelector: loading states + search filtering
- TextInputSection: debounced input + validation states
- PreviewResultsSection: card selection state + editing state
- InlineCreateDeck: form validation + submission state

## 7. Integracja API

### Endpoint: GET /api/decks

**Request Type**: Query parameters dla user decks

```typescript
// Tylko Authorization header
Headers: {
  Authorization: "Bearer <access_token>"
}
Query: {
  limit?: number; // for dropdown performance
  include_deleted?: false;
}
```

**Response Type**: `DeckListResponseDTO`

```typescript
{
  data: DeckWithCounts[];
  pagination: PaginationDTO;
}
```

### Endpoint: POST /api/decks

**Request Type**: `CreateDeckCommand`

```typescript
{
  name: string;
  description?: string;
  slug?: string; // auto-generated if empty
}
```

**Response Type**: `DeckDetailResponseDTO`

```typescript
{
  data: DeckWithCounts;
}
```

### Endpoint: POST /api/flashcards/generate

**Request Type**: `GenerateFlashcardsRequest`

```typescript
{
  deck_id: string;
  input_text: string;
  max_cards: number; // 1-10
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  language?: 'pl' | 'en';
  context?: string;
}
```

**Response Type**: `GenerateFlashcardsResponse`

```typescript
{
  generated_flashcards: FlashcardListItem[];
  generation_summary: {
    total_generated: number;
    total_tokens: number;
    total_cost_usd: number;
    model_used: string;
  };
}
```

### Endpoint: GET /api/budget/current (if exists)

**Request Type**: User budget info
**Response Type**: Current budget usage data

**Obsługa odpowiedzi:**

- **200/201 OK**: Success flow, update state, proceed to next step
- **400 Bad Request**: Show validation errors, highlight problematic fields
- **401 Unauthorized**: Close modal, redirect to login
- **402 Payment Required**: Show budget exceeded error, disable generation
- **404 Not Found**: Handle deck not found, refresh deck list
- **429 Too Many Requests**: Show rate limit error z countdown timer
- **500 Internal Server Error**: Show generic error z retry option

**React Query integration:**

- Cache keys: `['user-decks']`, `['budget-info']`, `['generation', requestHash]`
- Stale time: 5 minutes dla decks, 1 minute dla budget
- Background refetch on modal open
- Mutation handling dla deck creation i flashcard generation

## 8. Interakcje użytkownika

### Scenariusze otwierania modal

1. **Trigger z Dashboard:**

   - Click "Generuj fiszki" quick action → open modal, no preselected deck
   - Modal state: step='input', triggerSource='dashboard'
   - Focus management: auto-focus na deck selector

2. **Trigger z Deck List:**

   - Click "Generuj" przy konkretnej talii → open modal, preselect deck
   - Modal state: selectedDeckId=deckId, triggerSource='decks'
   - Skip deck selection step jeśli valid preselection

3. **Trigger z Deck Detail:**
   - Click "Generuj fiszki" w deck header → open modal, current deck preselected
   - Modal state: selectedDeckId=currentDeck, triggerSource='deck-detail'
   - Return to deck detail po successful generation

### Scenariusze wyboru talii

4. **Existing deck selection:**

   - Open deck dropdown → load user decks, show loading state
   - Select deck → validate ownership, enable next step
   - Clear selection → reset to no deck selected state

5. **Inline deck creation:**
   - Toggle "Utwórz nową talię" → show inline create form
   - Fill deck name/description → real-time validation
   - Submit create → API call, loading state, auto-select created deck
   - Cancel create → hide form, return to deck selection

### Scenariusze input tekstu

6. **Text input handling:**

   - Type w textarea → real-time character counting, validate ≤2000
   - Paste large text → auto-trim do 2000 chars, show warning
   - Drag-drop text file → extract text content, validate format
   - Clear text → reset counter, disable generation

7. **Settings configuration:**
   - Adjust max cards slider → update cost estimation
   - Change difficulty → update generation parameters
   - Select language → update AI prompt parameters
   - Reset settings → return to defaults

### Scenariusze generacji i preview

8. **AI Generation flow:**

   - Click "Generuj" → validate form, check budget, start generation
   - Show progress → spinner, status messages, cancel option
   - Generation complete → transition to preview step
   - Generation error → show error display, retry option

9. **Preview i selection:**

   - Review generated cards → show question/answer preview
   - Select/deselect cards → update save button counter
   - Edit card inline → modify content, mark as edited
   - Select all/none → bulk selection toggles

10. **Zapisywanie results:**
    - Click "Zapisz" → validate selection, bulk create flashcards
    - Show success → toast notification, close modal, refresh parent
    - Save error → show error, allow retry
    - Cancel unsaved → confirm dialog, discard changes

### Scenariusze error handling

11. **Budget i rate limit errors:**

    - Budget warning → show banner, disable generation przy 100%
    - Rate limit hit → show cooldown timer, disable actions
    - Service unavailable → show maintenance message

12. **Modal navigation:**
    - Escape key → confirm unsaved changes, close modal
    - Backdrop click → same as escape behavior
    - Step navigation → validate current step przed transition

## 9. Warunki i walidacja

### Walidacja input użytkownika

**Deck selection validation:**

- Required: deck must be selected OR new deck created successfully
- Deck ownership: validate user owns selected deck
- Deck existence: verify deck still exists before generation
- New deck name: required, 1-100 chars, unique per user, no special chars
- New deck description: optional, max 500 chars

**Text input validation:**

- Required: input_text non-empty po trim
- Length limit: exactly ≤2000 characters (not bytes)
- Content restrictions: no HTML tags, no markdown formatting
- Text quality: minimum 50 chars dla meaningful generation
- Language detection: warn if language mismatch z settings

**Generation settings validation:**

- max_cards: integer w range 1-10, default 5
- difficulty: enum ['beginner', 'intermediate', 'advanced'], default 'intermediate'
- language: enum ['pl', 'en'], default 'pl'
- Settings combination: validate logical combinations

### Walidacja biznesowa

**Budget constraints:**

- Monthly limit: $10 per user, track cumulative spend
- Estimated cost: calculate przed generation based na text length
- Warning threshold: show warning przy ≥80% spend ($8)
- Block threshold: prevent generation przy ≥100% spend ($10)
- Real-time updates: refresh budget info co 5 minut

**Rate limiting:**

- Generation frequency: max 20 generations per hour per user
- Concurrent requests: max 1 active generation per user
- Cooldown periods: enforce waiting time po rate limit hit
- Fair usage: detect i prevent abuse patterns

**Content quality:**

- Text complexity: ensure sufficient content dla AI processing
- Duplication detection: warn if similar text recently processed
- Language consistency: verify text language matches settings
- Topic relevance: AI confidence scoring dla generated content

### API alignment validation

**Request format validation:**

- Match GenerateFlashcardsRequest schema exactly
- Required fields presence: deck_id, input_text, max_cards
- Field types: string/number/enum validation
- Field lengths: comply z API limits

**Response handling validation:**

- Validate GenerateFlashcardsResponse structure
- Check flashcard content limits: question ≤256, answer ≤512 chars
- Verify generation summary accuracy
- Handle partial generation failures gracefully

## 10. Obsługa błędów

### Kategorie błędów i recovery strategies

1. **User Input Errors:**

   - Empty text: "Wklej tekst do generacji fiszek"
   - Text too long: "Tekst przekracza 2000 znaków (obecne: X)"
   - No deck selected: "Wybierz talię lub utwórz nową"
   - Invalid deck name: "Nazwa talii jest wymagana (1-100 znaków)"
   - Markdown detected: "Usuń formatowanie markdown z tekstu"
   - Handle: Inline validation messages, field highlighting, auto-correction suggestions

2. **Budget i Rate Limiting Errors:**

   - Budget warning: "Wykorzystano X% miesięcznego limitu ($Y z $10)"
   - Budget exceeded: "Przekroczony miesięczny limit generacji AI"
   - Rate limited: "Zbyt wiele generacji. Spróbuj ponownie za X minut"
   - Service quota: "Usługa tymczasowo niedostępna - globalny limit"
   - Handle: Clear countdown timers, upgrade prompts, alternative suggestions

3. **API Communication Errors:**

   - 401 Unauthorized: Close modal, redirect to login z return URL
   - 404 Deck Not Found: "Wybrana talia została usunięta", refresh deck list
   - 500 Server Error: "Wystąpił błąd serwera", retry button z exponential backoff
   - Network timeout: "Sprawdź połączenie internetowe", offline mode indicator
   - Handle: Automatic retries, manual retry buttons, graceful degradation

4. **Generation Specific Errors:**

   - AI service unavailable: "Generacja AI tymczasowo niedostępna"
   - Low quality input: "Tekst za krótki lub nieczytelny dla AI"
   - Generation timeout: "Generacja przekroczyła limit czasu (5s)"
   - Partial generation: "Wygenerowano tylko X z Y fiszek"
   - Handle: Specific error messages, suggestions dla improvement, retry options

5. **State Management Errors:**
   - Modal state corruption: Reset to initial state z confirmation
   - Form data loss: Restore from localStorage backup
   - Step transition failure: Allow manual step navigation
   - Preview data inconsistency: Regenerate preview from API response
   - Handle: State recovery mechanisms, data persistence, user notifications

### Error recovery patterns

- **Progressive enhancement**: Graceful degradation when features fail
- **Automatic retry**: Exponential backoff dla network/server errors
- **Manual intervention**: Retry buttons dla user-triggered actions
- **State persistence**: localStorage backup dla form data
- **Alternative flows**: Offer different paths when primary fails
- **User guidance**: Clear instructions dla resolving issues
- **Support escalation**: Contact options dla unresolvable errors

## 11. Kroki implementacji

### Etap 1: Infrastruktura i podstawy (Kroki 1-8)

1. **Przygotowanie struktury plików**

   - Utwórz `src/components/generate-ai/` folder structure
   - Setup modal components hierarchy
   - Create index files dla clean imports

2. **Rozszerzenie typów**

   - Dodaj GenerateAI ViewModel types do `src/types.ts`
   - Extend istniejące API types jeśli potrzebne
   - Create validation error types

3. **Setup base modal infrastructure**

   - Implement base Modal/Dialog component z shadcn/ui
   - Add focus trap z react-focus-trap
   - Setup keyboard event handling

4. **Create utility functions**

   - Text processing i validation helpers
   - Character counting z performance optimization
   - Cost estimation calculations

5. **Setup state management**

   - Create Context dla modal state sharing
   - Setup React Query integration
   - Add localStorage utilities dla form persistence

6. **Implement routing integration**

   - Add modal trigger system
   - Setup URL parameter handling dla deep linking
   - Create trigger functions dla different views

7. **Add accessibility foundation**

   - ARIA roles i properties setup
   - Keyboard navigation base implementation
   - Screen reader announcements structure

8. **Setup testing infrastructure**
   - Unit testing framework dla modal components
   - Mock API responses dla generation
   - Accessibility testing tools integration

### Etap 2: Custom hooks implementation (Kroki 9-16)

9. **Implement useGenerateAIModal hook**

   - Core modal state management
   - Step-based workflow control
   - Form data persistence

10. **Create useFlashcardGeneration hook**

    - API integration dla generation endpoint
    - Progress tracking i cancellation
    - Error handling z retry logic

11. **Build useBudgetMonitoring hook**

    - Real-time budget checking
    - Cost estimation calculations
    - Warning threshold management

12. **Add useModalKeyboardShortcuts hook**

    - Keyboard shortcuts handling
    - Focus management between steps
    - Accessibility key bindings

13. **Implement useDeckManagement hook**

    - Deck loading dla selection
    - Inline deck creation logic
    - Deck validation i caching

14. **Create useFormValidation hook**

    - Real-time input validation
    - Error message management
    - Validation state coordination

15. **Add useTextProcessing hook**

    - Character counting z debouncing
    - Text sanitization i formatting
    - Markdown detection i removal

16. **Test all hooks thoroughly**
    - Unit tests dla each hook
    - Integration tests z mock data
    - Edge case handling verification

### Etap 3: Core modal components (Kroki 17-24)

17. **Build GenerateAIModal main container**

    - Modal wrapper z responsive sizing
    - Step management i navigation
    - Global error boundary

18. **Implement ModalHeader component**

    - Title display z step indication
    - Close button z confirmation logic
    - Progress indicator integration

19. **Create DeckSelectionSection**

    - Dropdown z user decks
    - Loading i empty states
    - Inline create toggle

20. **Build InlineCreateDeck component**

    - Form fields z validation
    - Real-time deck name checking
    - Submission handling

21. **Implement TextInputSection**

    - Large textarea z performance optimization
    - Character counter z visual feedback
    - Validation messages display

22. **Create GenerationSettingsSection**

    - Settings controls layout
    - Real-time cost estimation
    - Settings persistence

23. **Add BudgetWarningBanner**

    - Conditional display logic
    - Usage visualization
    - Upgrade call-to-action

24. **Test core components integration**
    - Component interaction testing
    - State synchronization verification
    - Responsive design validation

### Etap 4: Generation flow components (Kroki 25-32)

25. **Implement GenerationProgressSection**

    - Progress spinner i status display
    - Real-time updates handling
    - Cancellation functionality

26. **Create PreviewResultsSection**

    - Flashcards preview layout
    - Generation summary display
    - Selection management

27. **Build FlashcardsPreviewList**

    - Virtual scrolling dla performance
    - Individual card components
    - Bulk selection controls

28. **Add FlashcardPreviewItem**

    - Card content display
    - Inline editing capabilities
    - Selection state management

29. **Implement ErrorDisplaySection**

    - Error categorization i display
    - Retry action handling
    - Technical details toggle

30. **Create ActionButtons component**

    - Step-specific button logic
    - Loading states handling
    - Keyboard shortcuts integration

31. **Add ModalFooter**

    - Help text i shortcuts display
    - Secondary actions
    - Status information

32. **Test generation flow end-to-end**
    - Complete workflow testing
    - Error scenario validation
    - Performance optimization

### Etap 5: Advanced features i polish (Kroki 33-38)

33. **Implement advanced keyboard shortcuts**

    - Step navigation shortcuts
    - Quick actions (Ctrl+Enter, Ctrl+A)
    - Accessibility improvements

34. **Add drag-and-drop functionality**

    - Text file drag-drop support
    - Visual feedback podczas drag
    - File content extraction

35. **Create export preview functionality**

    - Preview results export
    - Multiple format support
    - Sharing capabilities

36. **Implement form state persistence**

    - localStorage integration
    - Session recovery
    - Cross-tab synchronization

37. **Add animation i transitions**

    - Step transition animations
    - Loading state animations
    - Micro-interactions polish

38. **Optimize performance**
    - Component memoization
    - Bundle size optimization
    - Runtime performance tuning

### Etap 6: Testing, accessibility i deployment (Kroki 39-40)

39. **Complete accessibility implementation**

    - WCAG AA compliance verification
    - Screen reader testing
    - Keyboard navigation polish
    - Color contrast validation
    - Focus management refinement

40. **Final integration i deployment**
    - End-to-end testing w różnych scenariuszach
    - Cross-browser compatibility testing
    - Mobile responsiveness verification
    - Performance benchmarking
    - Production deployment z monitoring
