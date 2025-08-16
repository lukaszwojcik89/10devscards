# Pomoc/FAQ View Implementation Plan

## 1. Analiza wymagań i kontekstu

### Źródła wymagań

- **UI Plan:** `/help` - wsparcie i wyjaśnienia (Leitner, limity, catch-up)
- **PRD User Stories:** US-013 (Dostępność WCAG)
- **Tech Stack:** Astro 5 + React 19 + TypeScript 5, Tailwind CSS 4, shadcn/ui

### Cel widoku

Komprehensywny system pomocy z FAQ, tutorialami i wsparciem technicznym, objaśniający system Leitner, limity dzienne i funkcjonalność catch-up.

### Kluczowe wymagania

- FAQ z kategoryzacją tematyczną (Leitner/SRS, limity, catch-up, interfejs)
- Wyszukiwarka w czasie rzeczywistym z filtrowaniem
- Tutoriale krok-po-kroku z interaktywnymi elementami
- System kontaktu i zgłaszania problemów
- Compliance WCAG AA (dostępność)
- Responsywny design z optymalizacją mobile

## 2. Architektura komponentów

### Główne komponenty React

```typescript
// Główny kontener widoku
HelpView: React.FC
  ├── SearchBar: React.FC<{ onSearch: (query: string) => void }>
  ├── CategoryFilter: React.FC<{ categories: Category[], onFilter: (id: string) => void }>
  ├── FAQAccordion: React.FC<{ items: FAQItem[], searchQuery: string }>
  ├── TutorialSection: React.FC<{ tutorials: Tutorial[] }>
  ├── QuickLinks: React.FC<{ links: QuickLink[] }>
  └── ContactCTA: React.FC<{ showFeedback: boolean }>

// Komponenty pomocnicze
SearchHighlight: React.FC<{ text: string, query: string }>
TutorialCard: React.FC<{ tutorial: Tutorial, onStart: () => void }>
FeedbackButton: React.FC<{ itemId: string, onFeedback: (helpful: boolean) => void }>
```

### Struktura danych

```typescript
interface FAQItem {
  id: string;
  category: "leitner" | "limits" | "catchup" | "interface" | "troubleshooting";
  question: string;
  answer: string;
  tags: string[];
  priority: number;
  lastUpdated: Date;
}

interface Tutorial {
  id: string;
  title: string;
  description: string;
  steps: TutorialStep[];
  estimatedTime: number;
  difficulty: "beginner" | "intermediate" | "advanced";
}

interface TutorialStep {
  id: string;
  title: string;
  content: string;
  interactive?: boolean;
  media?: { type: "image" | "video"; url: string };
}
```

## 3. Routing i nawigacja

### URL Structure

- `/help` - główna strona pomocy
- `/help#category` - jump do określonej kategorii
- `/help/search?q=query` - deep-linkable search results
- `/help/tutorial/[id]` - dedykowana strona tutoriala

### Breadcrumb Navigation

```astro
---
// src/pages/help.astro
const breadcrumbs = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Pomoc", href: "/help" },
];
---
```

### Meta tags i SEO

```typescript
const helpMetadata = {
  title: "10DevsCards - Pomoc i FAQ",
  description:
    "Pomoc, FAQ i tutoriale dla aplikacji 10DevsCards. Wyjaśnienia systemu Leitner, limitów dziennych i funkcji catch-up.",
  keywords: "pomoc, FAQ, system Leitner, fiszki, nauka, tutoriale",
};
```

## 4. State Management

### Local State (React useState)

```typescript
const [searchQuery, setSearchQuery] = useState("");
const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
const [filteredFAQ, setFilteredFAQ] = useState<FAQItem[]>([]);
const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
const [tutorialProgress, setTutorialProgress] = useState<Record<string, number>>({});
```

### Search Logic

```typescript
const searchFAQ = useMemo(() => {
  return (query: string, items: FAQItem[]) => {
    if (!query.trim()) return items;

    const normalizedQuery = query.toLowerCase();
    return items
      .map((item) => ({
        ...item,
        relevance: calculateRelevance(normalizedQuery, item),
      }))
      .filter((item) => item.relevance > 0)
      .sort((a, b) => b.relevance - a.relevance);
  };
}, []);

const calculateRelevance = (query: string, item: FAQItem): number => {
  let score = 0;
  const queryWords = query.split(/\s+/);

  queryWords.forEach((word) => {
    if (item.question.toLowerCase().includes(word)) score += 10;
    if (item.answer.toLowerCase().includes(word)) score += 5;
    if (item.tags.some((tag) => tag.toLowerCase().includes(word))) score += 3;
  });

  return score;
};
```

## 5. Styling i responsywność

### Tailwind CSS Classes

```typescript
const helpStyles = {
  container: "max-w-4xl mx-auto px-4 py-8",
  searchSection: "mb-8 space-y-4",
  searchInput:
    "w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",
  categoryFilters: "flex flex-wrap gap-2 mb-6",
  categoryButton: "px-4 py-2 rounded-full border transition-colors hover:bg-gray-50",
  categoryButtonActive: "bg-blue-100 border-blue-300 text-blue-700",
  faqSection: "space-y-4",
  accordionItem: "border border-gray-200 rounded-lg overflow-hidden",
  accordionHeader:
    "w-full px-6 py-4 text-left bg-gray-50 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500",
  accordionContent: "px-6 py-4 bg-white border-t border-gray-200",
  tutorialGrid: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8",
  tutorialCard: "p-6 border border-gray-200 rounded-lg hover:shadow-md transition-shadow",
  contactSection: "mt-12 p-6 bg-gray-50 rounded-lg",
};
```

### Mobile Optimizations

```css
@media (max-width: 768px) {
  .search-section {
    position: sticky;
    top: 0;
    z-index: 10;
    background: white;
    padding: 1rem;
    margin: -1rem -1rem 1rem -1rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .category-filters {
    overflow-x: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .category-filters::-webkit-scrollbar {
    display: none;
  }
}
```

## 6. Integracja z API

### Brak dedykowanych API endpoints

Widok FAQ wykorzystuje statyczne dane, ale może integrować się z:

```typescript
// Opcjonalne API calls dla analytics
const trackFAQInteraction = async (action: string, itemId: string) => {
  try {
    await fetch("/api/analytics/faq", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, itemId, timestamp: Date.now() }),
    });
  } catch (error) {
    console.warn("Failed to track FAQ interaction:", error);
  }
};

// Feedback submission
const submitFeedback = async (type: "helpful" | "not-helpful", itemId: string) => {
  try {
    await fetch("/api/feedback/faq", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, itemId, userId: user?.id }),
    });
  } catch (error) {
    console.warn("Failed to submit feedback:", error);
  }
};
```

### Content Management

```typescript
// FAQ content as structured data
export const faqData: FAQItem[] = [
  {
    id: "leitner-basic",
    category: "leitner",
    question: "Co to jest system Leitner?",
    answer: "System Leitner to metoda nauki oparta na interwałach czasowych...",
    tags: ["system leitner", "srs", "algorytm", "nauka"],
    priority: 1,
    lastUpdated: new Date("2024-12-01"),
  },
  // ... więcej elementów FAQ
];
```

## 7. Obsługa błędów i loading states

### Error Boundaries

```typescript
const FAQErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ErrorBoundary
      fallback={
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">Wystąpił błąd podczas ładowania pomocy.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Odśwież stronę
          </button>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
};
```

### Loading States

```typescript
const SearchResults: React.FC = () => {
  const [isSearching, setIsSearching] = useState(false);

  if (isSearching) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Wyszukiwanie...</span>
      </div>
    );
  }

  // ... reszta komponentu
};
```

### No Results State

```typescript
const NoResultsMessage: React.FC<{ query: string }> = ({ query }) => (
  <div className="text-center py-8">
    <div className="mb-4">
      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </div>
    <h3 className="text-lg font-medium text-gray-900 mb-2">Brak wyników dla "{query}"</h3>
    <p className="text-gray-600 mb-4">Spróbuj innych słów kluczowych lub przejrzyj popularne tematy:</p>
    <div className="flex flex-wrap gap-2 justify-center">
      {['system leitner', 'limity dzienne', 'catch-up', 'eksport danych'].map(suggestion => (
        <button
          key={suggestion}
          onClick={() => setSearchQuery(suggestion)}
          className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200"
        >
          {suggestion}
        </button>
      ))}
    </div>
  </div>
);
```

## 8. Testowanie

### Unit Tests (Vitest)

```typescript
// src/components/SearchBar.test.tsx
describe('SearchBar', () => {
  it('should filter FAQ items based on search query', () => {
    const mockItems = [
      { id: '1', question: 'System Leitner', answer: 'Opis systemu...', category: 'leitner', tags: [], priority: 1, lastUpdated: new Date() },
      { id: '2', question: 'Limity dzienne', answer: 'Opis limitów...', category: 'limits', tags: [], priority: 1, lastUpdated: new Date() }
    ];

    const { getByPlaceholderText } = render(<SearchBar items={mockItems} onResults={jest.fn()} />);
    const searchInput = getByPlaceholderText('Wyszukaj w pomocy...');

    fireEvent.change(searchInput, { target: { value: 'leitner' } });

    expect(mockOnResults).toHaveBeenCalledWith([mockItems[0]]);
  });
});
```

### Integration Tests

```typescript
// src/pages/help.test.tsx
describe('Help Page', () => {
  it('should display all FAQ categories', async () => {
    render(<HelpPage />);

    expect(screen.getByText('System Leitner')).toBeInTheDocument();
    expect(screen.getByText('Limity dzienne')).toBeInTheDocument();
    expect(screen.getByText('Catch-up')).toBeInTheDocument();
    expect(screen.getByText('Interfejs')).toBeInTheDocument();
  });

  it('should filter results when category is selected', async () => {
    render(<HelpPage />);

    fireEvent.click(screen.getByText('System Leitner'));

    await waitFor(() => {
      expect(screen.queryByText('Limity dzienne FAQ')).not.toBeInTheDocument();
    });
  });
});
```

### Accessibility Tests

```typescript
// src/components/FAQAccordion.a11y.test.tsx
describe('FAQAccordion Accessibility', () => {
  it('should support keyboard navigation', () => {
    render(<FAQAccordion items={mockFAQItems} />);

    const firstAccordionButton = screen.getAllByRole('button')[0];
    firstAccordionButton.focus();

    fireEvent.keyDown(firstAccordionButton, { key: 'Enter' });
    expect(screen.getByRole('region')).toBeVisible();

    fireEvent.keyDown(firstAccordionButton, { key: 'Escape' });
    expect(screen.queryByRole('region')).not.toBeVisible();
  });

  it('should have proper ARIA attributes', () => {
    render(<FAQAccordion items={mockFAQItems} />);

    const accordionButton = screen.getAllByRole('button')[0];
    expect(accordionButton).toHaveAttribute('aria-expanded', 'false');
    expect(accordionButton).toHaveAttribute('aria-controls');
  });
});
```

## 9. Performance i optymalizacja

### Memoization

```typescript
const MemoizedFAQItem: React.FC<{ item: FAQItem, isExpanded: boolean, onToggle: () => void }> = memo(({ item, isExpanded, onToggle }) => {
  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-controls={`faq-content-${item.id}`}
        className="w-full px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <div className="flex justify-between items-center">
          <h3 className="font-medium">{item.question}</h3>
          <ChevronDownIcon className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </button>
      {isExpanded && (
        <div id={`faq-content-${item.id}`} className="px-4 py-3 bg-white border-t">
          <div dangerouslySetInnerHTML={{ __html: item.answer }} />
        </div>
      )}
    </div>
  );
});
```

### Virtual Scrolling dla dużych list

```typescript
import { FixedSizeList as List } from 'react-window';

const VirtualizedFAQList: React.FC<{ items: FAQItem[] }> = ({ items }) => {
  const Row = ({ index, style }: { index: number, style: React.CSSProperties }) => (
    <div style={style}>
      <MemoizedFAQItem
        item={items[index]}
        isExpanded={expandedItems.has(items[index].id)}
        onToggle={() => toggleExpanded(items[index].id)}
      />
    </div>
  );

  return (
    <List
      height={600}
      itemCount={items.length}
      itemSize={80}
      className="border rounded-lg"
    >
      {Row}
    </List>
  );
};
```

### Search Optimization

```typescript
// Debounced search
const debouncedSearch = useMemo(
  () =>
    debounce((query: string) => {
      setIsSearching(true);
      const results = searchFAQ(query, faqData);
      setFilteredFAQ(results);
      setIsSearching(false);
    }, 300),
  [searchFAQ]
);

// Search index dla szybszego wyszukiwania
const searchIndex = useMemo(() => {
  const index = new Map<string, Set<string>>();

  faqData.forEach((item) => {
    const words = [...item.question.toLowerCase().split(/\s+/), ...item.tags];
    words.forEach((word) => {
      if (!index.has(word)) index.set(word, new Set());
      index.get(word)!.add(item.id);
    });
  });

  return index;
}, [faqData]);
```

## 10. Accessibility (WCAG AA)

### Keyboard Navigation

```typescript
const useKeyboardNavigation = (items: FAQItem[]) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target === document.body) return;

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          focusNextItem();
          break;
        case "ArrowUp":
          event.preventDefault();
          focusPrevItem();
          break;
        case "Home":
          event.preventDefault();
          focusFirstItem();
          break;
        case "End":
          event.preventDefault();
          focusLastItem();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [items]);
};
```

### Screen Reader Support

```typescript
const ScreenReaderAnnouncement: React.FC<{ message: string }> = ({ message }) => (
  <div
    role="status"
    aria-live="polite"
    aria-atomic="true"
    className="sr-only"
  >
    {message}
  </div>
);

// Użycie w komponencie search
const [srMessage, setSrMessage] = useState('');

useEffect(() => {
  if (filteredFAQ.length === 0 && searchQuery) {
    setSrMessage(`Brak wyników dla zapytania: ${searchQuery}`);
  } else if (filteredFAQ.length > 0) {
    setSrMessage(`Znaleziono ${filteredFAQ.length} wyników dla zapytania: ${searchQuery}`);
  }
}, [filteredFAQ, searchQuery]);
```

### Color Contrast i Focus Indicators

```css
/* Wysokie kontrasty dla lepszej czytelności */
.faq-question {
  color: #1f2937; /* >= 4.5:1 contrast ratio */
}

.faq-answer {
  color: #374151; /* >= 4.5:1 contrast ratio */
}

/* Wyraźne focus indicators */
.focusable:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .faq-item {
    border: 2px solid;
  }

  .search-input {
    border: 2px solid;
  }
}
```

## 11. Plan implementacji - 42 kroki

### Faza 1: Podstawowa struktura (Kroki 1-10)

1. **Konfiguracja podstawowa**

   - Utworzenie `src/pages/help.astro` z podstawowym layoutem
   - Import Layout.astro i ustawienie meta tags

2. **Struktura danych FAQ**

   - Utworzenie `src/data/faq.ts` z typami TypeScript
   - Implementacja podstawowej struktury FAQItem i Category

3. **Główny komponent HelpView**

   - Utworzenie `src/components/HelpView.tsx` jako głównego kontenera
   - Implementacja podstawowego state management z useState

4. **Komponent SearchBar**

   - Implementacja search input z debounced handling
   - Dodanie podstawowej walidacji i sanitization

5. **Struktura CSS i stylowanie**

   - Konfiguracja Tailwind classes dla help view
   - Implementacja responsive grid layout

6. **Podstawowa nawigacja**

   - Implementacja breadcrumb navigation
   - Dodanie skip-to-content link dla accessibility

7. **CategoryFilter komponent**

   - Implementacja horizontal scrollable category filters
   - Dodanie keyboard navigation support

8. **Podstawowy FAQ content**

   - Utworzenie pierwszych 10 FAQ items dla kategorii "leitner"
   - Implementacja podstawowej struktury pytanie/odpowiedź

9. **Search functionality - podstawy**

   - Implementacja podstawowego text matching algoritmu
   - Dodanie real-time filtering w miarę typing

10. **Error boundary setup**
    - Implementacja FAQErrorBoundary z fallback UI
    - Dodanie basic error logging

### Faza 2: Zaawansowane funkcje wyszukiwania (Kroki 11-20)

11. **Zaawansowany search algorithm**

    - Implementacja relevance scoring systemu
    - Dodanie support dla częściowych dopasowań

12. **Search highlighting**

    - Komponent SearchHighlight dla oznaczania znalezionych termów
    - Implementacja bezpiecznego HTML rendering

13. **Search suggestions**

    - Implementacja autocomplete z popularnymi zapytaniami
    - Dodanie search history w localStorage

14. **No results handling**

    - Komponent NoResultsMessage z suggested searches
    - Implementacja fallback content dla empty states

15. **Search performance optimization**

    - Implementacja search index dla szybszego wyszukiwania
    - Dodanie memoization dla expensive operations

16. **Category-specific search**

    - Implementacja filtered search w obrębie kategorii
    - Dodanie category badges w search results

17. **Search analytics preparation**

    - Implementacja tracking search queries
    - Dodanie most searched terms analytics

18. **Keyboard shortcuts dla search**

    - Implementacja Ctrl+K / Cmd+K global search shortcut
    - Dodanie Escape dla clear search

19. **Search accessibility**

    - Implementacja proper ARIA labels i descriptions
    - Dodanie screen reader announcements dla results

20. **Search state management**
    - Implementacja URL-based search state
    - Dodanie deep-linkable search results

### Faza 3: FAQ Accordion i content (Kroki 21-30)

21. **FAQAccordion komponent**

    - Implementacja collapsible accordion z smooth animations
    - Dodanie keyboard navigation (Arrow keys, Home, End)

22. **FAQ content - System Leitner**

    - Kompletna implementacja 8-10 FAQ items o systemie Leitner
    - Dodanie diagramów i przykładów SRS intervals

23. **FAQ content - Limity dzienne**

    - Implementacja FAQ o limitach dziennych (50+20 catch-up)
    - Wyjaśnienie reset timing i optymalizacji nauki

24. **FAQ content - Catch-up system**

    - Szczegółowe FAQ o funkcjonalności catch-up
    - Implementacja przykładów użycia i best practices

25. **FAQ content - Interfejs aplikacji**

    - FAQ o nawigacji, skrótach klawiszowych, funkcjach
    - Dodanie interaktywnych przykładów gdzie możliwe

26. **FAQ content - Troubleshooting**

    - Implementacja FAQ dla typowych problemów
    - Dodanie kroków diagnozy i rozwiązań

27. **Rich content support**

    - Implementacja Markdown rendering w answers
    - Dodanie support dla code blocks i syntax highlighting

28. **FAQ multimedia integration**

    - Implementacja embedded images i videos w answers
    - Dodanie lazy loading dla media content

29. **FAQ feedback system**

    - Komponent FeedbackButton z "Was this helpful?"
    - Implementacja basic analytics dla helpful/not helpful

30. **FAQ print optimization**
    - Implementacja print-friendly CSS styles
    - Dodanie "Print FAQ" functionality

### Faza 4: Tutorial system (Kroki 31-36)

31. **TutorialSection komponent**

    - Implementacja tutorial cards grid layout
    - Dodanie tutorial preview z estimated time

32. **Tutorial content structure**

    - Implementacja Tutorial i TutorialStep interfaces
    - Utworzenie pierwszych 3 podstawowych tutoriali

33. **Interactive tutorial player**

    - Komponent TutorialPlayer ze step-by-step navigation
    - Implementacja progress tracking w localStorage

34. **Tutorial media integration**

    - Support dla embedded images i videos w steps
    - Implementacja responsive media containers

35. **Tutorial completion tracking**

    - Implementacja progress badges i completion status
    - Dodanie "Resume tutorial" functionality

36. **Tutorial accessibility**
    - Implementacja keyboard navigation dla tutorial steps
    - Dodanie screen reader support z proper headings

### Faza 5: Support i kontakt (Kroki 37-42)

37. **ContactCTA komponent**

    - Implementacja multiple contact methods (email, Discord, GitHub)
    - Dodanie response time expectations

38. **Bug report integration**

    - Formularz bug report z automatic environment info
    - Implementacja structured data collection

39. **Feature request system**

    - Implementacja feature request form
    - Dodanie category selection i priority voting

40. **Community links**

    - Implementacja links do Discord, forum, GitHub discussions
    - Dodanie community guidelines i etiquette

41. **Help desk integration**

    - Implementacja ticket system integration (jeśli będzie)
    - Dodanie knowledge base cross-references

42. **Final optimization i testing**
    - Performance audit i optimization
    - Comprehensive accessibility testing z automated tools
    - Cross-browser testing i mobile optimization

### Post-implementacja

- Analytics dashboard dla FAQ usage
- Content management system dla easy updates
- User feedback analysis i content improvements
- Multilingual support preparation
- SEO optimization dla help content

## Zależności implementacyjne

### Zewnętrzne zależności

- **Brak API endpoints** - statyczny content tylko
- **Layout.astro** - musi być już zaimplementowany
- **UserNav.astro** - dla nawigacji w header
- **shadcn/ui components** - Button, Input, Accordion

### Techniczne wymagania

- **React 19** - server components support
- **TypeScript 5** - dla type safety
- **Tailwind CSS 4** - dla responsive styling
- **Astro 5** - dla SSG optimization

### Kolejność implementacji

1. Faza 1 (struktura) → Faza 2 (search) → Faza 3 (content)
2. Faza 4 (tutorials) może być równolegle z Fazą 3
3. Faza 5 (support) na końcu, może być iteracyjnie rozwijana

Ten plan zapewnia komprehensywny system pomocy z zaawansowaną funkcjonalnością wyszukiwania, dostępnym interfejsem i bogatym contentem edukacyjnym.
