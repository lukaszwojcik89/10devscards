# Plan implementacji widoku FAQ/Pomoc

## 1. Przegląd

Widok FAQ/Pomoc stanowi kompleksowy system wsparcia użytkowników aplikacji AI Flashcards. Jego głównym celem jest dostarczenie łatwo dostępnych wyjaśnień dotyczących systemu Leitner, limitów dziennych, funkcjonalności catch-up oraz rozwiązywanie typowych problemów. Widok zawiera wyszukiwarkę FAQ, kategoryzowane sekcje pomocy, przewodniki krok-po-kroku oraz opcje kontaktu z wsparciem technicznym.

## 2. Routing widoku

Widok dostępny pod ścieżką `/help` jako strona publiczna (dostępna bez logowania).

Dodatkowe routing patterns:
- `/help#kategoria` - bezpośredni link do kategorii FAQ
- `/help?search=query` - deep-linkable search results
- `/help/tutorial/[id]` - dedykowane strony tutoriali (opcjonalne w przyszłości)

## 3. Struktura komponentów

```
HelpView
├── SearchBar
├── CategoryFilter
├── QuickLinks  
├── FAQAccordion
│   ├── FAQSection (System Leitner)
│   ├── FAQSection (Limity dzienne)
│   ├── FAQSection (Catch-up)
│   ├── FAQSection (Interfejs)
│   └── FAQSection (Troubleshooting)
├── TutorialSection
│   ├── TutorialCard
│   ├── TutorialCard
│   └── TutorialCard
└── ContactCTA
    ├── ContactMethod
    ├── FeedbackForm
    └── SupportLinks
```

## 4. Szczegóły komponentów

### HelpView

- **Opis**: Główny kontener widoku FAQ/Pomoc, zarządza stanem wyszukiwania i filtrowaniem treści. Odpowiada za layout i koordynację między komponentami.
- **Główne elementy**: `<main>` container z proper landmarks, SearchBar na górze, content sections, sticky navigation dla długich stron
- **Obsługiwane interakcje**: Keyboard shortcuts (Ctrl+K dla search), scroll tracking dla sticky elements, URL state management
- **Obsługiwana walidacja**: Search query sanitization, category parameter validation, URL fragment handling
- **Typy**: `HelpViewProps`, `SearchState`, `FilterState`
- **Propsy**: Brak (główny widok) - otrzymuje dane z URL params i local state

### SearchBar

- **Opis**: Komponent wyszukiwarki z real-time filtering FAQ items. Zawiera input field, loading indicator i clear button.
- **Główne elementy**: `<input>` z proper labels, search icon, clear button, loading spinner, results counter
- **Obsługiwane interakcje**: Typing z debounced search, Enter dla search, Escape dla clear, arrow keys dla navigation
- **Obsługiwana walidacja**: Minimum 2 znaki dla search, HTML tags sanitization, rate limiting dla rapid typing
- **Typy**: `SearchBarProps`, `SearchQuery`, `SearchResults`
- **Propsy**: `onSearch: (query: string) => void`, `isLoading: boolean`, `resultsCount: number`, `placeholder?: string`

### FAQAccordion

- **Opis**: Główny komponent wyświetlający FAQ w formie rozwijalnych sekcji. Zarządza stanem expanded/collapsed i highlighting search terms.
- **Główne elementy**: Accordion container, FAQSection components, search highlighting wrapper, "Was this helpful?" buttons
- **Obsługiwane interakcje**: Click to expand/collapse, keyboard navigation (Arrow keys, Home, End), search term highlighting
- **Obsługiwana walidacja**: FAQ content structure validation, expand state persistence w sessionStorage
- **Typy**: `FAQAccordionProps`, `FAQItem`, `AccordionState`
- **Propsy**: `items: FAQItem[]`, `searchQuery: string`, `onFeedback: (itemId: string, helpful: boolean) => void`

### FAQSection

- **Opis**: Pojedyncza sekcja FAQ dla określonej kategorii. Zawiera pytanie, odpowiedź i opcjonalne media/przykłady kodu.
- **Główne elementy**: Accordion header z question, collapsible content z answer, optional code blocks, images, links
- **Obsługiwane interakcje**: Toggle expand/collapse, copy code to clipboard, link navigation, feedback submission
- **Obsługiwana walidacja**: Content length limits, XSS protection dla rich content, link validation
- **Typy**: `FAQSectionProps`, `FAQContent`, `MediaAsset`
- **Propsy**: `item: FAQItem`, `isExpanded: boolean`, `onToggle: () => void`, `searchQuery?: string`

### TutorialSection

- **Opis**: Sekcja zawierająca karty z przewodnikami krok-po-kroku. Wyświetla preview tutoriali z możliwością uruchomienia.
- **Główne elementy**: Grid layout z TutorialCard components, section header, "Zobacz wszystkie" link
- **Obsługiwane interakcje**: Click na tutorial card, progress tracking, bookmark tutorials
- **Obsługiwana walidacja**: Tutorial completeness check, user progress validation
- **Typy**: `TutorialSectionProps`, `Tutorial`, `TutorialProgress`
- **Propsy**: `tutorials: Tutorial[]`, `userProgress?: TutorialProgress`, `onStartTutorial: (id: string) => void`

### ContactCTA

- **Opis**: Sekcja kontaktowa z różnymi metodami wsparcia (email, Discord, GitHub) oraz formularzem feedback.
- **Główne elementy**: Contact methods grid, feedback form, response time expectations, community links
- **Obsługiwane interakcje**: Form submission, external link navigation, copy contact info
- **Obsługiwana walidacja**: Email validation, message length limits, spam protection (honeypot)
- **Typy**: `ContactCTAProps`, `ContactMethod`, `FeedbackFormData`
- **Propsy**: `methods: ContactMethod[]`, `onSubmitFeedback: (data: FeedbackFormData) => void`, `isSubmitting: boolean`

## 5. Typy

```typescript
// Core FAQ types
export interface FAQItem {
  id: string;
  category: FAQCategory;
  question: string;
  answer: string;
  tags: string[];
  priority: number;
  lastUpdated: Date;
  helpful: number;
  notHelpful: number;
}

export type FAQCategory = 'leitner' | 'limits' | 'catchup' | 'interface' | 'troubleshooting';

export interface FAQSection {
  category: FAQCategory;
  title: string;
  description: string;
  items: FAQItem[];
  icon: string;
}

// Tutorial types
export interface Tutorial {
  id: string;
  title: string;
  description: string;
  estimatedTime: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  steps: TutorialStep[];
  completedBy: number;
}

export interface TutorialStep {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'code' | 'interactive' | 'video';
  media?: MediaAsset;
}

export interface TutorialProgress {
  tutorialId: string;
  currentStep: number;
  completed: boolean;
  startedAt: Date;
  completedAt?: Date;
}

// Search types
export interface SearchState {
  query: string;
  isLoading: boolean;
  results: FAQItem[];
  totalResults: number;
  selectedCategory?: FAQCategory;
}

export interface SearchResult {
  item: FAQItem;
  relevanceScore: number;
  matchedTerms: string[];
}

// Contact types
export interface ContactMethod {
  type: 'email' | 'discord' | 'github' | 'documentation';
  label: string;
  value: string;
  icon: string;
  responseTime?: string;
}

export interface FeedbackFormData {
  type: 'bug' | 'feature' | 'general' | 'improvement';
  title: string;
  description: string;
  email?: string;
  priority: 'low' | 'medium' | 'high';
}

// Component props
export interface HelpViewProps {
  initialSearchQuery?: string;
  initialCategory?: FAQCategory;
}

export interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
  resultsCount: number;
  placeholder?: string;
  value?: string;
}

export interface FAQAccordionProps {
  sections: FAQSection[];
  searchQuery: string;
  selectedCategory?: FAQCategory;
  onFeedback: (itemId: string, helpful: boolean) => void;
}

export interface CategoryFilterProps {
  categories: FAQCategory[];
  selectedCategory?: FAQCategory;
  onCategoryChange: (category?: FAQCategory) => void;
  resultCounts: Record<FAQCategory, number>;
}
```

## 6. Zarządzanie stanem

### Local State w HelpView:
```typescript
const [searchState, setSearchState] = useState<SearchState>({
  query: '',
  isLoading: false,
  results: [],
  totalResults: 0,
  selectedCategory: undefined
});

const [accordionState, setAccordionState] = useState<{
  expandedItems: Set<string>;
  feedbackSubmitted: Set<string>;
}>({
  expandedItems: new Set(),
  feedbackSubmitted: new Set()
});
```

### Custom Hook useSearchFAQ:
```typescript
const useSearchFAQ = (faqData: FAQItem[]) => {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const debouncedSearch = useMemo(
    () => debounce((query: string, category?: FAQCategory) => {
      setIsSearching(true);
      const results = performSearch(query, faqData, category);
      setSearchResults(results);
      setIsSearching(false);
    }, 300),
    [faqData]
  );
  
  return { searchResults, isSearching, search: debouncedSearch };
};
```

### Custom Hook useAccordionState:
```typescript
const useAccordionState = (itemIds: string[]) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  
  const toggle = useCallback((id: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);
  
  const expandAll = () => setExpandedItems(new Set(itemIds));
  const collapseAll = () => setExpandedItems(new Set());
  
  return { expandedItems, toggle, expandAll, collapseAll };
};
```

## 7. Integracja API

Widok FAQ/Pomoc jest głównie statyczny z opcjonalnymi integracjami:

### Analytics tracking (opcjonalne):
```typescript
// Request type
interface FAQAnalyticsRequest {
  action: 'view' | 'search' | 'expand' | 'feedback';
  itemId?: string;
  query?: string;
  helpful?: boolean;
}

// Response type
interface FAQAnalyticsResponse {
  success: boolean;
  message?: string;
}

// Usage
const trackFAQInteraction = async (data: FAQAnalyticsRequest) => {
  try {
    await fetch('/api/analytics/faq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  } catch (error) {
    console.warn('Analytics tracking failed:', error);
  }
};
```

### Feedback submission:
```typescript
// Request type
interface FeedbackSubmissionRequest {
  formData: FeedbackFormData;
  userAgent: string;
  page: string;
}

// Response type
interface FeedbackSubmissionResponse {
  success: boolean;
  ticketId?: string;
  message: string;
}

// Usage
const submitFeedback = async (data: FeedbackFormData): Promise<FeedbackSubmissionResponse> => {
  const response = await fetch('/api/support/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      formData: data,
      userAgent: navigator.userAgent,
      page: '/help'
    })
  });
  
  if (!response.ok) {
    throw new Error('Failed to submit feedback');
  }
  
  return response.json();
};
```

## 8. Interakcje użytkownika

### Scenariusze wyszukiwania:
1. Użytkownik wpisuje zapytanie w SearchBar
2. System wykonuje debounced search po 300ms
3. FAQ items są filtrowane w real-time
4. Wyniki są highlight'owane z matched terms
5. User może wyczyścić search lub wybrać kategorię

### Scenariusze nawigacji FAQ:
1. User klika na pytanie w accordion
2. Sekcja się rozwija z smooth animation
3. Answer jest wyświetlana z rich formatting
4. User może kliknąć "Was this helpful?" feedback
5. User może skopiować link do konkretnego FAQ

### Scenariusze tutoriali:
1. User przegląda dostępne tutorials w TutorialSection
2. Klika na tutorial card żeby zobaczyć szczegóły
3. Może rozpocząć tutorial z progress tracking
4. Tutorial steps są wyświetlane sekwencyjnie
5. Progress jest zapisywany w localStorage

### Scenariusze kontaktu:
1. User wypełnia feedback form w ContactCTA
2. Wybiera typ problemu i priority
3. Formularz jest walidowany przed submission
4. Success/error message jest wyświetlany
5. User otrzymuje ticket ID dla follow-up

## 9. Warunki i walidacja

### Search validation:
- **Minimum length**: Zapytanie musi mieć minimum 2 znaki
- **HTML sanitization**: Usuwanie potencjalnie niebezpiecznych tagów
- **Rate limiting**: Maksymalnie 10 searches per minute per user
- **Query normalization**: Trimming whitespace, lowercase conversion

### Content validation:
- **FAQ structure**: Sprawdzenie czy wszystkie required fields są present
- **Link validation**: Weryfikacja czy external links są accessible
- **Image validation**: Sprawdzenie czy media assets są available
- **Code validation**: Syntax checking dla code examples

### Form validation w ContactCTA:
- **Email format**: RFC-compliant email validation
- **Message length**: 10-1000 characters
- **Title length**: 5-100 characters
- **Spam protection**: Honeypot field i basic rate limiting

### Accessibility validation:
- **Heading hierarchy**: Proper h1->h6 structure
- **Color contrast**: Minimum 4.5:1 ratio dla text
- **Focus indicators**: Visible focus rings dla keyboard users
- **Screen reader**: Proper ARIA labels i announcements

## 10. Obsługa błędów

### Search errors:
```typescript
const handleSearchError = (error: Error) => {
  console.warn('Search failed:', error);
  // Fallback to showing all FAQs
  setSearchResults(allFAQItems);
  // Show user-friendly message
  showToast('Wyszukiwarka chwilowo niedostępna. Pokazujemy wszystkie tematy.', 'warning');
};
```

### Content loading errors:
```typescript
const handleContentError = (error: Error) => {
  console.error('FAQ content failed to load:', error);
  // Show minimal help content
  setFAQSections(getBasicHelpContent());
  // Offer retry option
  showErrorBoundary('Nie udało się załadować pomocy', {
    onRetry: () => window.location.reload()
  });
};
```

### Form submission errors:
```typescript
const handleSubmissionError = (error: Error, formData: FeedbackFormData) => {
  console.error('Feedback submission failed:', error);
  // Save form data dla retry
  localStorage.setItem('pendingFeedback', JSON.stringify(formData));
  // Show retry option
  showErrorMessage('Nie udało się wysłać wiadomości. Spróbuj ponownie.', {
    action: 'Ponów',
    onAction: () => retrySubmission(formData)
  });
};
```

### Network connectivity errors:
```typescript
const handleOfflineState = () => {
  // Disable form submissions
  setIsOffline(true);
  // Show offline indicator
  showBanner('Brak połączenia z internetem. Niektóre funkcje mogą być niedostępne.', 'info');
  // Listen dla online event
  window.addEventListener('online', handleOnlineState);
};
```

### Accessibility errors:
```typescript
const handleA11yError = (element: HTMLElement, error: string) => {
  console.warn('Accessibility issue:', error, element);
  // Apply fallback accessibility attributes
  element.setAttribute('aria-label', 'Element pomocy');
  // Report dla monitoring
  reportA11yIssue(error, element.tagName);
};
```

## 11. Kroki implementacji

### Etap 1: Podstawowa struktura (Kroki 1-10)

1. **Konfiguracja Astro page**
   - Utworzenie `src/pages/help.astro` z podstawowym layoutem
   - Konfiguracja meta tags i SEO dla help page

2. **Podstawowe typy TypeScript**
   - Utworzenie `src/types/help.ts` z FAQItem, Tutorial, ContactMethod interfaces
   - Definicja search i state management types

3. **Data structure dla FAQ**
   - Utworzenie `src/data/faq.ts` z kategoryzowanymi FAQ items
   - Strukturyzacja content dla każdej kategorii (Leitner, limity, catch-up, etc.)

4. **HelpView główny komponent**
   - Utworzenie `src/components/HelpView.tsx` jako main container
   - Setup podstawowego layout z responsive grid

5. **SearchBar komponent**
   - Implementacja search input z proper labeling
   - Podstawowa struktura bez search logic

6. **FAQ data content**
   - Wypełnienie FAQ data z comprehensive content dla każdej kategorii
   - System Leitner explanations, daily limits, catch-up functionality

7. **Podstawowy styling**
   - Konfiguracja Tailwind classes dla help page layout
   - Responsive design foundations

8. **CategoryFilter komponent**
   - Implementacja filter buttons dla FAQ categories
   - Visual indication selected category

9. **Accessibility foundations**
   - Proper heading hierarchy (h1, h2, h3)
   - Basic ARIA landmarks i roles

10. **Error boundary setup**
    - Implementacja error boundary dla help page
    - Basic error fallback UI

### Etap 2: Search functionality (Kroki 11-20)

11. **useSearchFAQ custom hook**
    - Implementacja search logic z debouncing
    - Real-time filtering FAQ items based on query

12. **Search algorithm**
    - Text matching z relevance scoring
    - Support dla partial matches i typos

13. **Search highlighting**
    - Highlight matched terms w FAQ content
    - Safe HTML rendering z XSS protection

14. **Search state management**
    - Integration search state z URL parameters
    - Persistent search across page refreshes

15. **Category filtering**
    - Implementacja filtering by selected category
    - Combined search + category filtering

16. **Search performance optimization**
    - Client-side search indexing
    - Memoization dla expensive search operations

17. **Search UI enhancements**
    - Loading states podczas search
    - Results counter i "clear search" functionality

18. **Search accessibility**
    - Screen reader announcements dla search results
    - Keyboard navigation w search results

19. **Search analytics tracking**
    - Track search queries dla content improvement
    - Popular searches identification

20. **Search error handling**
    - Graceful degradation gdy search fails
    - Fallback do displaying all content

### Etap 3: FAQ Accordion (Kroki 21-30)

21. **FAQAccordion base component**
    - Implementacja accordion container z proper ARIA
    - Keyboard navigation support (Arrow keys, Home, End)

22. **FAQSection component**
    - Individual FAQ item z expand/collapse functionality
    - Smooth animations dla content reveal

23. **useAccordionState hook**
    - State management dla expanded/collapsed items
    - Persistence w sessionStorage

24. **Rich content support**
    - Markdown rendering w FAQ answers
    - Code syntax highlighting dla examples

25. **FAQ feedback system**
    - "Was this helpful?" buttons na each FAQ
    - Feedback state management i submission

26. **FAQ multimedia integration**
    - Support dla images i videos w answers
    - Lazy loading dla performance

27. **FAQ deep linking**
    - URL fragments dla direct links do specific FAQs
    - Scroll-to-section functionality

28. **FAQ search result highlighting**
    - Integration z search highlighting w accordion content
    - Smooth scroll do relevant sections

29. **FAQ analytics**
    - Track most viewed FAQ items
    - Measure usefulness z feedback data

30. **FAQ mobile optimization**
    - Touch-friendly accordion interface
    - Optimized layout dla mobile screens

### Etap 4: Tutorials i Contact (Kroki 31-40)

31. **TutorialSection component**
    - Grid layout dla tutorial cards
    - Preview information (time, difficulty, completion rate)

32. **Tutorial data structure**
    - Step-by-step tutorial content
    - Interactive elements where applicable

33. **Tutorial progress tracking**
    - localStorage-based progress saving
    - Visual progress indicators

34. **ContactCTA component**
    - Multiple contact methods display
    - Response time expectations

35. **Feedback form implementation**
    - Form validation z proper error handling
    - Spam protection mechanisms

36. **Form submission handling**
    - Integration z backend feedback endpoint
    - Success/error state management

37. **Contact methods integration**
    - External links do Discord, GitHub, email
    - Copy-to-clipboard functionality dla contact info

38. **Comprehensive testing**
    - Unit tests dla all components
    - Integration tests dla search i form functionality

39. **Performance optimization**
    - Bundle size optimization
    - Lazy loading dla non-critical components

40. **Final accessibility audit**
    - WCAG AA compliance verification
    - Screen reader testing i fixes

### Post-implementacja:
- Content management system setup dla easy FAQ updates
- Analytics dashboard dla help page metrics
- User feedback analysis i content improvements
- SEO optimization dla help content discoverability

## Zależności implementacyjne

### Zewnętrzne komponenty:
- **Layout.astro** - podstawowy layout aplikacji
- **shadcn/ui Accordion** - base accordion component
- **Lucide React icons** - ikony dla categories i actions

### Techniczne wymagania:
- **Astro 5** - statyczna generacja z React islands
- **React 19** - component interactivity  
- **TypeScript 5** - type safety
- **Tailwind CSS 4** - styling framework

### API endpoints (opcjonalne):
- **POST /api/analytics/faq** - FAQ interaction tracking
- **POST /api/support/feedback** - user feedback submission

### Kolejność implementacji:
1. **Etap 1-2** (struktura + search) może być implemented równolegle
2. **Etap 3** (accordion) depends on completed search functionality
3. **Etap 4** (tutorials + contact) może być implemented independently
4. **Testing i optimization** throughout all phases

Ten plan zapewnia comprehensive help system z intuitive search, organized content i multiple support channels zgodnie z wymaganiami UI plan i PRD.
