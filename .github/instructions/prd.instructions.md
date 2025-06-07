---
applyTo: "**"
---

Coding standards, domain knowledge, and preferences that AI should follow.

# Dokument wymagań produktu (PRD) - AI Flashcards

## 1. Przegląd produktu

AI Flashcards to web‑owa aplikacja umożliwiająca błyskawiczne generowanie i naukę fiszek programistycznych (Python, JavaScript – trzy poziomy zaawansowania).  
Frontend budujemy w Astro 5 z komponentami React 19 oraz TypeScript 5, stylowanymi Tailwind 4 i shadcn/ui.  
Backend zapewnia Supabase (PostgreSQL + Edge Functions + Auth), a komunikacja z modelami AI przebiega przez Openrouter.ai.  
Aplikacja dostarczana jest w jednym obrazie Docker hostowanym na DigitalOcean; ciągły deployment realizuje GitHub Actions.

## 2. Problem użytkownika

Ręczne przygotowanie fiszek jest żmudne i zniechęca do stosowania spaced repetition. Skutkiem jest niższa retencja wiedzy i mniejsze zaangażowanie w naukę nowych technologii. AI Flashcards minimalizuje czas tworzenia kart, dzięki czemu użytkownicy mogą skupić się na regularnej nauce.

## 3. Wymagania funkcjonalne

1. Generowanie fiszek przez AI z wklejonego tekstu (Markdown/Plain) do 2 000 znaków; ~100 tokenów/fiszka; do 10 fiszek na jedno wywołanie Openrouter.
2. Manualne dodawanie fiszek oraz pełny CRUD (przeglądanie, edycja, usuwanie).
3. Akceptacja lub odrzucenie wygenerowanej fiszki; brak decyzji po 5 dniach ustawia status pending.
4. System powtórek Leitner 3‑box (1 d, 3 d, 7 d) z limitem 50 powtórek/dzień + jednorazowy catch‑up 20.
5. Konta użytkowników za pomocą Supabase Auth (e‑mail + hasło ≥ 12 znaków z A1#); weryfikacja e‑mail; checkbox „mam ≥ 16 lat”.
6. Panel administracyjny (Supabase Studio) z KPI i alertem 80 % budżetu Openrouter; automatyczna blokada generacji przy 100 %.
7. Eksport danych użytkownika do pliku JSON oraz trwałe usunięcie konta i fiszek.
8. Edge Function harmonogramu powtórek wywoływana po każdej odpowiedzi; wyniki cache’owane w Supabase KV (TTL 12 h).
9. CI/CD GitHub Actions: lint → unit testy ≥ 50 % → Playwright e2e → build & push Docker → deploy do DigitalOcean.
10. UI desktop‑first, Tailwind z WCAG AA i atrybutami ARIA.

## 4. Granice produktu

- Brak aplikacji mobilnych, importu PDF/DOCX, współdzielenia zestawów i integracji z innymi platformami edukacyjnymi.
- Brak własnego zaawansowanego algorytmu SRS; wykorzystujemy prosty Leitner.
- WCAG AAA i tryb wysokiego kontrastu zapisane w roadmapie poza MVP.

## 5. Historyjki użytkowników

| ID     | Tytuł                 | Opis                                                                            | Kryteria akceptacji                                                                                                    |
| ------ | --------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| US‑001 | Rejestracja konta     | Jako nowy użytkownik chcę założyć konto, aby zapisywać moje fiszki.             | • Formularz Supabase Auth przyjmuje e‑mail i hasło spełniające politykę. • Użytkownik musi kliknąć link weryfikacyjny. |
| US‑002 | Logowanie             | Jako zarejestrowany użytkownik loguję się, aby uzyskać dostęp do swoich fiszek. | • Poprawne dane logują; niepoprawne zwracają błąd. • Sesja wygasa po 30 min nieaktywności.                             |
| US‑003 | Bram­ka wiekowa       | Jako serwis potrzebuję potwierdzenia ≥ 16 lat, aby spełnić RODO.                | • Checkbox „mam ≥ 16 lat” jest obowiązkowy przy rejestracji.                                                           |
| US‑004 | Wklej tekst i generuj | Jako student wklejam fragment notatek, aby AI utworzyło fiszki.                 | • Przy wklejeniu ≤ 2 000 znaków pojawia się maks. 10 fiszek. • Czas generacji ≤ 5 s.                                   |
| US‑005 | Akceptacja fiszki     | Jako użytkownik decyduję, czy wygenerowana fiszka jest użyteczna.               | • Kliknięcie Zaakceptuj zapisuje fiszkę i zwiększa KPI. • Kliknięcie Odrzuć usuwa fiszkę.                              |
| US‑006 | Manualne dodanie      | Jako hobbysta dodaję własną fiszkę ręcznie.                                     | • Formularz pozwala wpisać pytanie/odpowiedź. • Fiszka trafia od razu do Box 1.                                        |
| US‑007 | Sesja powtórkowa      | Jako użytkownik chcę powtarzać zaplanowane fiszki.                              | • System selekcjonuje ≤ 50 fiszek z najbliższą datą. • Poprawna odpowiedź przenosi fiszkę do następnego boxu.          |
| US‑008 | Catch‑up              | Jako użytkownik nadrabiam niewykorzystane fiszki (max +20).                     | • Po włączeniu opcji system dodaje zaległe fiszki z wczoraj.                                                           |
| US‑009 | Eksport danych        | Jako użytkownik eksportuję swoje fiszki i statystyki.                           | • Kliknięcie „Eksport JSON” generuje plik do pobrania.                                                                 |
| US‑010 | Usunięcie konta       | Jako użytkownik usuwam konto i wszystkie dane.                                  | • Po potwierdzeniu konto, fiszki i logi są trwale usuwane.                                                             |
| US‑011 | Alert budżetu         | Jako admin widzę alert, gdy wydatki AI przekroczą 80 %.                         | • Supabase dashboard wyświetla banner przy ≥ 80 %.                                                                     |
| US‑012 | Blokada AI            | Jako system blokuję nowe generacje po 100 % budżetu.                            | • Próba nowej generacji zwraca komunikat „tymczasowo niedostępne”.                                                     |
| US‑013 | Dostępność WCAG       | Jako użytkownik z niepełnosprawnością korzystam z czytnika ekranu.              | • Wszystkie przyciski mają aria‑label. • Kontrast tekstu ≥ 4.5:1.                                                      |

## 6. Metryki sukcesu

| Metryka               | Cel            | Sposób pomiaru                                  |
| --------------------- | -------------- | ----------------------------------------------- |
| Akceptacja fiszek AI  | ≥ 75 %         | Liczba fiszek zaakceptowanych ÷ wygenerowanych. |
| Udział AI w tworzeniu | ≥ 75 %         | Fiszki wygenerowane ÷ wszystkie nowe.           |
| Retencja nauki        | ≥ 50 % MAU     | Użytkownicy z ≥ 3 sesjami/tydz.                 |
| Koszt LLM             | ≤ 10 USD/mies. | Dashboard kosztów Openrouter.                   |
| Uptime backendu       | ≥ 99 %         | Supabase monitor + DigitalOcean status.         |
