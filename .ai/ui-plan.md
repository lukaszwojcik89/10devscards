# Architektura UI dla „MVP Fiszki z AI”

## 1. Przegląd struktury UI

Aplikacja desktop-first z prostą nawigacją top-level: **Dashboard**, **Talie**, **Generuj AI**, **Powtórki**, **Ustawienia**, **Pomoc**. Widoki oparte o dane z API (patrz @api-plan.md) z React Query (fetch/cache) i globalnym store (sesja nauki, limity). Minimalne wymagania WCAG 2.2 AA dla całej aplikacji. Rejestracja wymaga potwierdzenia e-mail; do czasu weryfikacji blokujemy logowanie (bez osobnego widoku „verify-email”). Podczas rejestracji obowiązkowy checkbox potwierdzający wiek ≥16 lat (RODO, US‑003). Akceptacja fiszek wyłącznie pojedynczo. Tryb nauki full-screen, z blokadą zmiany talii, opcją catch-up i podsumowaniem sesji. Infinite scroll z fallbackiem „Load more”. Elementy administracyjne ukryte dla użytkowników bez roli.

## 2. Lista widoków

### 2.1. Ekran logowania

* **Ścieżka**: `/login`
* **Cel**: uwierzytelnienie istniejącego użytkownika.
* **Kluczowe informacje**: pola e-mail/hasło; link do rejestracji; możliwość wyświetlenia bannera, jeśli backend zwróci, że e-mail nie został jeszcze potwierdzony.
* **Komponenty**: `Form(Login)`, `Button`, `AlertInline` (błędy), `Banner(EmailUnverified)`, `Link`.
* **UX/a11y/bezpieczeństwo**: maskowanie hasła, a11y dla labeli i błędów, brak autofill tokenów; błędy walidacji inline; blokada logowania dla kont z niezweryfikowanym e-mailem.

### 2.2. Ekran rejestracji

* **Ścieżka**: `/register`
* **Cel**: utworzenie konta.
* **Kluczowe informacje**: formularz rejestracji z obowiązkowym checkboxem „Mam ≥ 16 lat”; po sukcesie komunikat, że logowanie możliwe po potwierdzeniu e‑mail (bez przekierowania do osobnego widoku).
* **Komponenty**: `Form(Register)`, `Button`, `AlertInfo`.
* **UX/a11y/bezpieczeństwo**: walidacja po stronie klienta (w tym obowiązkowy checkbox wieku), jasne komunikaty o konieczności weryfikacji e‑mail.

### 2.3. Dashboard

* **Ścieżka**: `/`
* **Cel**: szybki wgląd w aktywności i skróty.
* **Kluczowe informacje**: KPI: **Do nauki dziś**, **Zaległe**, **Streak**; ostatnio używane talie; szybkie akcje.
* **Komponenty**: `KpiTile`, `DeckList(Recent)`, `QuickActions`, `Banner` (limity), `Skeleton` (loading).
* **UX/a11y/bezpieczeństwo**: jednorazowy toast po zalogowaniu o limitach (neutralny ton); kontrast dla kafli.

### 2.4. Lista talii

* **Ścieżka**: `/decks`
* **Cel**: przegląd i wybór talii.
* **Kluczowe informacje**: nazwa, liczba fiszek, due/overdue per talia, data modyfikacji.
* **Komponenty**: `DataTable(Decks)` z **infinite scroll** + `LoadMore` fallback, `FilterBar` (wyszukiwarka).
* **UX/a11y/bezpieczeństwo**: klikalne wiersze, focus-ring, aria-labels; przewidywalne ładowanie.

### 2.5. Szczegóły talii (Tabs)

* **Ścieżka**: `/decks/:slug`
* **Cel**: zarządzanie pojedynczą talią.
* **Kluczowe informacje**:
  * **Fiszki**: lista z filtrami i presetami (Do akceptacji, Overdue, Najnowsze) z endpointu `/api/decks/{slug}/flashcards`.
  * **Statystyki**: liczba fiszek, rozkład po boxach, due/overdue.
  * **Ustawienia**: nazwa, opis, usunięcie talii.
* **Komponenty**: `Tabs(Fiszki|Statystyki|Ustawienia)`, `DataTable(Flashcards)`, `FilterBar(status|box|due_date)`, `Badge(Auto-accept in X dni)`, `ConfirmDialog`.
* **UX/a11y/bezpieczeństwo**: pojedyncza akceptacja/odrzucenie w wierszu i w panelu szczegółów; optimistic update z rollbackiem; czytelny focus; dostępne dialogi.

### 2.6. Generator AI (modal)

* **Ścieżka**: `/generate` (otwierany jako modal nad aktualnym widokiem)
* **Cel**: wygenerowanie fiszek z tekstu.
* **Kluczowe informacje**: wybór docelowej talii lub **utworzenie nowej w locie**; licznik znaków; podgląd wyników przed akceptacją.
* **Komponenty**: `Dialog`, `Textarea` z licznikiem, `Select(Deck)`, `InlineCreateDeck`, `PreviewList`, `Button(Generuj|Zapisz)`, `Progress` (jeśli async).
* **UX/a11y/bezpieczeństwo**: walidacja długości; jasne komunikaty błędów (RATE_LIMITED, BUDGET_EXCEEDED); focus trap; brak markdown.

### 2.7. Tryb nauki (full-screen)

* **Ścieżka**: `/study?deck=:slug&catchup=:bool`
* **Cel**: wykonywanie powtórek.
* **Kluczowe informacje**: pytanie, odpowiedź po odsłonięciu, ocena (1/2/3), postęp sesji, przełącznik catch-up.
* **Komponenty**: `AppFullScreen`, `StudyToolbar` (progress, catch-up), `Card(Q/A)`, `KeyboardShortcuts`, `HotkeysHint`.
* **UX/a11y/bezpieczeństwo**: skróty: `1/2/3`, `Space`, `Enter`, `Esc`, strzałki; aria-live dla wyników; **blokada zmiany talii** podczas sesji.

### 2.8. Podsumowanie sesji

* **Ścieżka**: `/study/summary`
* **Cel**: feedback po sesji.
* **Kluczowe informacje**: trafność, czas reakcji, zmiany boxów, „co dalej”.
* **Komponenty**: `ResultStats`, `List(ChangedCards)`, `Button(Następna sesja|Powrót do talii)`.
* **UX/a11y/bezpieczeństwo**: czytelne KPI i CTA; aria-landmarks.

### 2.9. Ustawienia

* **Ścieżka**: `/settings`
* **Cel**: zarządzanie kontem i danymi.
* **Kluczowe informacje**:
  * **Profil**: e-mail (readonly), zmiana hasła.
  * **Twoje dane**: eksport z zakresem (całość/wybrane talie/tylko zaakceptowane).
  * **Usuwanie konta**: dwukrotne potwierdzenie.
* **Komponenty**: `Tabs(Profil|Dane|Bezpieczeństwo)`, `ExportModal`, `DangerZone`, `ConfirmDialog`.
* **UX/a11y/bezpieczeństwo**: jasne komunikaty, wymóg wpisania frazy przy usuwaniu; link do pliku po eksporcie; dostępne dialogi.

### 2.10. Pomoc / FAQ

* **Ścieżka**: `/help`
* **Cel**: wsparcie i wyjaśnienia (Leitner, limity, catch-up).
* **Kluczowe informacje**: FAQ, definicje, krótkie tutoriale.
* **Komponenty**: `Accordion`, `Linki`, `ContactCTA`.
* **UX/a11y/bezpieczeństwo**: struktura nagłówków, wyszukiwarka.

### 2.11. Ekrany błędów

* **Ścieżki**: `/error/403`, `/error/404`, `/error/500`
* **Cel**: spójne obsłużenie błędów nawigacji/serwera.
* **Kluczowe informacje**: opis, możliwe działania.
* **Komponenty**: `ErrorState`, `Button(Retry|Powrót)`.
* **UX/a11y/bezpieczeństwo**: przyjazny ton, brak wycieków szczegółów systemowych.

## 3. Mapa podróży użytkownika

### 3.1. Pierwsze użycie (rejestracja i start)

1. `/register` → wysłanie formularza → komunikat o konieczności potwierdzenia e-maila (bez przekierowania).
2. Użytkownik klika link w e-mailu → następnie loguje się.
3. `/login` → `/` (Dashboard) z jednorazowym toastem o limitach.
4. Pusty stan: skróty „Utwórz talię” lub „Generuj z tekstu”.

### 3.2. Codzienna sesja nauki

1. Dashboard: klik „Do nauki dziś” → `/study?deck=:slug` (lub wybór talii).
2. Odsłonięcie odpowiedzi → ocena (`1/2/3`) → postęp.
3. Po wyczerpaniu puli: `/study/summary` z wynikami.
4. Powrót: do talii lub Dashboard.

### 3.3. Generowanie fiszek z tekstu

1. Z dowolnego miejsca: „Generuj AI” → modal `/generate`.
2. Wklejenie tekstu, wybór istniejącej talii lub utworzenie nowej w locie.
3. Podgląd → zapis → przekierowanie do `/decks/:slug` (zakładka Fiszki, preset „Do akceptacji”).
4. Pojedyncza akceptacja/odrzucenie fiszek.

### 3.4. Eksport i usuwanie konta

1. `/settings` → zakładka „Twoje dane” → `ExportModal` → link do pobrania.
2. `/settings` → „Danger Zone” → podwójne potwierdzenie → usunięcie konta.

## 4. Układ i struktura nawigacji

* **AppShell**: top-nav z sekcjami: Dashboard, Talie, Generuj AI, Powtórki, Ustawienia, Pomoc.
* **Breadcrumbs**: na podstronach talii i ustawień.
* **Drawer (opcjonalny)**: dla mniejszych szerokości, ta sama hierarchia.
* **Routing**:
  * Public: `/login`, `/register`, `/help`.
  * Private (po auth): `/`, `/decks`, `/decks/:slug`, `/study`, `/study/summary`, `/settings`.
* **Stany globalne i gating**:
  * Gate dla ról: elementy admina ukryte.
  * Gate dla „email_verified”: bez weryfikacji blokada logowania.

## 5. Kluczowe komponenty

1. **AppShell**: layout, top-nav, slot na treść, `Banner` globalny.
2. **KpiTile**: kafle KPI na Dashboard (Do nauki dziś, Zaległe, Streak).
3. **DataTable**: listy talii i fiszek; sortowanie, filtry, **infinite scroll** + `LoadMore`.
4. **FilterBar**: pola status/box/due_date, presety (Do akceptacji, Overdue, Najnowsze).
5. **Dialog / ConfirmDialog**: generator AI, potwierdzenia (usuwanie konta/talii).
6. **ExportModal**: zakres: całość/wybrane talie/tylko zaakceptowane; postęp; link do pliku.
7. **StudyToolbar**: licznik postępu, przełącznik catch-up, przyciski nawigacji.
8. **Card(Q/A)**: karta pytanie/odpowiedź; przycisk „Pokaż odpowiedź”.
9. **KeyboardShortcuts**: mapowanie skrótów (1/2/3, Space, Enter, Esc, strzałki).
10. **Badge(Auto-accept)**: licznik dni do auto-akceptacji w wierszu fiszki.
11. **Sonner/Notifications**: jednorazowy toast o limitach, błędy sieciowe, sukces eksportu.
12. **Skeleton/EmptyState**: stany ładowania i puste.
13. **ErrorState**: spójne ekrany 403/404/500.
14. **Forms**: logowanie, rejestracja, zmiana hasła, edycja fiszki (tekst + licznik znaków).

## 6. Przypadki brzegowe i stany błędów

* **Age gate (US‑003)**: brak zaznaczenia checkboxa wieku blokuje rejestrację; wyświetl błąd pod polem oraz podsumowanie formularza.

* **Email not verified**: próba logowania → komunikat blokujący w bannerze, bez osobnego widoku.
* **RATE_LIMITED / DAILY_LIMIT_EXCEEDED**: banner/sonner; na Dashboard skrót „Wróć jutro” lub „Tryb catch-up”.
* **BUDGET_EXCEEDED** (globalne generowanie): informacja w generatorze AI i na Dashboard; CTA „Spróbuj później”.
* **NETWORK_ERROR**: retry z przyciskiem; zachowanie scroll-position po odświeżeniu.
* **VALIDATION_ERROR**: błędy inline w polach, podsumowanie nad formularzem.
* **Brak danych**: Empty states na listach i w statystykach.

## 7. Zgodność z planem API

* **Dashboard**: `GET /api/dashboard` – KPI i ostatnie talie.
* **Decks**: `GET /api/decks` (lista/paginacja), `GET /api/decks/{slug}` (szczegóły), `PUT`/`DELETE` na `/api/decks/{slug}`; lista fiszek przez `GET /api/decks/{slug}/flashcards` (presety).
* **Generator AI**: `POST /api/flashcards/generate` do wybranej/nowej talii.
* **Akceptacja/Odrzucenie**: `PATCH /api/flashcards/{id}/status`; optimistic update + invalidacja listy.
* **Edycja/Usuwanie fiszki**: `PUT`/`DELETE /api/flashcards/{id}`; podgląd `GET /api/flashcards/{id}`.
* **Study Session**: `GET /api/study/session`, `POST /api/reviews` (wyniki dla podsumowania).
* **Settings/Export/Delete**: `GET /api/user/export`; `DELETE /api/user/account`.

## 8. Mapowanie historyjek z PRD na UI

| ID    | Widok / funkcja                                 | Powiązany endpoint (skrót)                           | Elementy UI / Notatki                                                                 |
|-------|--------------------------------------------------|------------------------------------------------------|---------------------------------------------------------------------------------------|
| US‑001| Rejestracja                                      | POST /auth/register                                  | Formularz rejestracji + **checkbox ≥16**; komunikat o konieczności potwierdzenia e‑mail |
| US‑002| Logowanie                                        | POST /auth/login, POST /auth/refresh, GET /auth/me   | Formularz loginu; sesja wygasa po 30 min nieaktywności (idle timer + refresh)         |
| US‑003| Bramka wiekowa                                   | — (UI)                                               | **Obowiązkowy** checkbox wieku; walidacja klienta; błąd inline + podsumowanie         |
| US‑004| Wklej tekst i generuj                            | POST /flashcards/generate                            | Modal „Generuj AI”; licznik znaków ≤2000; podgląd; zapis do talii                      |
| US‑005| Akceptacja fiszki                                | PATCH /flashcards/{id}/status                        | Akcje w wierszu i w szczegółach; optimistic update; brak batch                         |
| US‑006| Manualne dodanie                                 | POST /flashcards                                     | Formularz ręcznej fiszki; default Box 1                                               |
| US‑007| Sesja powtórkowa                                 | GET /study/session, POST /reviews                    | Tryb full‑screen; selekcja ≤50 fiszek; skróty klawiaturowe                             |
| US‑008| Catch‑up                                         | GET /study/session?include_catchup=true              | Przełącznik catch‑up (+20); komunikaty o limitach                                      |
| US‑009| Eksport danych                                   | GET /user/export                                     | `ExportModal`; link do pobrania                                                        |
| US‑010| Usunięcie konta                                  | DELETE /user/account                                 | „Danger Zone”; podwójne potwierdzenie                                                 |
| US‑011| Alert budżetu (admin)                            | GET /admin/budget/status                             | Tylko rola admin; widget/badge ukryty dla zwykłych użytkowników                        |
| US‑012| Blokada AI przy 100%                             | POST /flashcards/generate → błąd                     | Komunikat w modalu „tymczasowo niedostępne”; CTA „Spróbuj później”                     |
| US‑013| Dostępność WCAG                                  | —                                                    | Focus‑visible, aria‑label, kontrasty ≥4.5:1, dialogi z focus trap                      |

## 9. Potencjalne punkty bólu i ich adresowanie

* **Niejasne limity/komunikaty** → jednorazowy, neutralny toast po zalogowaniu + sekcja w Pomocy.
* **Przeciążenie listą fiszek** → filtry z presetami, infinite scroll + „Load more”, skeletony.
* **Zgubienie kontekstu podczas generacji** → modal zamiast osobnej strony, podgląd wyników.
* **Utrata pracy przy błędach sieci** → optimistic update + rollback, przyciski retry, zachowanie pozycji.
* **Dostępność** → pełny focus-management, aria-live, klawiszologia w trybie nauki.

## 10. Responsywność i dostępność

* **Desktop-first**: target ≥1280 px; breakpointy: `md` (≥768), `lg` (≥1280).
* **Tabele → listy kart** na `md`.
* **WCAG 2.2 AA**: focus-visible, aria-labels, dialogi z focus trap, aria-live dla feedbacku, semantyczne nagłówki i landmarki.

## 11. Bezpieczeństwo w UI

* **Auth gating**: dostęp do widoków prywatnych po zalogowaniu i weryfikacji e-mail.
* **Feature gating ról**: elementy admin ukryte.
* **Ostrożność w komunikatach błędów**: bez ujawniania szczegółów systemowych.
* **Potwierdzenia akcji wrażliwych**: usuwanie konta/talii z podwójnym potwierdzeniem.

---

## 12. Metryki sukcesu

| Metryka               | Cel            | Sposób pomiaru                                  | Miejsce w UI / Instrumentacja                  |
|-----------------------|----------------|-----------------------------------------------|-----------------------------------------------|
| Akceptacja fiszek AI  | ≥ 75 %         | zaakceptowane ÷ wygenerowane                   | Dashboard (kafelek), eventy „accept/reject”   |
| Udział AI w tworzeniu | ≥ 75 %         | wygenerowane ÷ wszystkie nowe                  | Dashboard/Statystyki talii, event „source”    |
| Retencja nauki        | ≥ 50 % MAU     | ≥3 sesje/tydz. per user                        | Telemetria sesji (start/finish), streak       |
| Koszt LLM             | ≤ 10 USD/mies. | dane Openrouter/Supabase (admin)               | Widok admin (ukryty), alerty budżetu          |
| Uptime backendu       | ≥ 99 %         | monitoring Supabase/DO                         | Poza UI użytkownika (informacyjne w Pomocy)   |
