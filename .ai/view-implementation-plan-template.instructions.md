# Instrukcje tworzenia planów implementacji widoków

## Cel

Jako starszy programista frontendu Twoim zadaniem jest stworzenie szczegółowego planu wdrożenia nowego widoku w aplikacji internetowej. Plan ten powinien być kompleksowy i wystarczająco jasny dla innego programisty frontendowego, aby mógł poprawnie i wydajnie wdrożyć widok.

## Dane wejściowe

Najpierw przejrzyj następujące informacje:

1. **Product Requirements Document (PRD):**

```
{{prd}} <- zamień na referencję do pliku @prd.md
```

2. **Opis widoku:**

```
{{view-description}} <- wklej opis implementowanego widoku z ui-plan.md
```

3. **User Stories:**

```
{{user-stories}} <- wklej historyjki użytkownika z @prd.md, które będą adresowane przez widok
```

4. **Endpoint Description:**

```
{{endpoint-description}} <- wklej opisy endpointów z api-plan.md, z których będzie korzystał widok
```

5. **Endpoint Implementation:**

```
{{endpoint-implementation}} <- zamień na referencję do implementacji endpointów, z których będzie korzystał widok (np. @generations.ts, @flashcards.ts)
```

6. **Type Definitions:**

```
{{types}} <- zamień na referencję do pliku z definicjami DTOsów (np. @types.ts)
```

7. **Tech Stack:**

```
{{tech-stack}} <- zamień na referencję do pliku @tech-stack.md
```

## Proces analizy

Przed utworzeniem ostatecznego planu wdrożenia przeprowadź analizę i planowanie wewnątrz tagów `<implementation_breakdown>` w swoim bloku myślenia. Ta sekcja może być dość długa, ponieważ ważne jest, aby być dokładnym.

W swoim podziale implementacji wykonaj następujące kroki:

1. **Analiza sekcji wejściowych** - Dla każdej sekcji (PRD, User Stories, Endpoint Description, Endpoint Implementation, Type Definitions, Tech Stack):

   - Podsumuj kluczowe punkty
   - Wymień wszelkie wymagania lub ograniczenia
   - Zwróć uwagę na wszelkie potencjalne wyzwania lub ważne kwestie

2. **Wyodrębnienie kluczowych wymagań** z PRD

3. **Komponenty główne** - Wypisanie wszystkich potrzebnych głównych komponentów, wraz z krótkim opisem ich opisu, potrzebnych typów, obsługiwanych zdarzeń i warunków walidacji

4. **Diagram drzewa komponentów** - Stworzenie wysokopoziomowego diagramu hierarchii komponentów

5. **Typy i DTOs** - Zidentyfikuj wymagane DTO i niestandardowe typy ViewModel dla każdego komponentu widoku. Szczegółowo wyjaśnij te nowe typy, dzieląc ich pola i powiązane typy.

6. **Stan i hooki** - Zidentyfikuj potencjalne zmienne stanu i niestandardowe hooki, wyjaśniając ich cel i sposób ich użycia

7. **Integracja API** - Wymień wymagane wywołania API i odpowiadające im akcje frontendowe

8. **Mapowanie User Stories** - Zmapuj każdej historii użytkownika do konkretnych szczegółów implementacji, komponentów lub funkcji

9. **Interakcje użytkownika** - Wymień interakcje użytkownika i ich oczekiwane wyniki

10. **Walidacja** - Wymień warunki wymagane przez API i jak je weryfikować na poziomie komponentów

11. **Obsługa błędów** - Zidentyfikuj potencjalne scenariusze błędów i zasugeruj, jak sobie z nimi poradzić

12. **Wyzwania implementacyjne** - Wymień potencjalne wyzwania związane z wdrożeniem tego widoku i zasugeruj możliwe rozwiązania

## Format planu implementacji

Po przeprowadzeniu analizy dostarcz plan wdrożenia w formacie Markdown z następującymi sekcjami:

### 1. Przegląd

Krótkie podsumowanie widoku i jego celu.

### 2. Routing widoku

Określenie ścieżki, na której widok powinien być dostępny.

### 3. Struktura komponentów

Zarys głównych komponentów i ich hierarchii w formacie drzewa.

### 4. Szczegóły komponentów

Dla każdego komponentu należy opisać:

- **Opis**: Komponentu, jego przeznaczenie i z czego się składa
- **Główne elementy**: HTML i komponenty dzieci, które budują komponent
- **Obsługiwane interakcje**: Lista obsługiwanych zdarzeń
- **Obsługiwana walidacja**: Szczegółowe warunki, zgodnie z API
- **Typy**: DTO i ViewModel wymagane przez komponent
- **Propsy**: Interfejs komponentu - jakie propsy przyjmuje od rodzica

### 5. Typy

Szczegółowy opis typów wymaganych do implementacji widoku, w tym dokładny podział wszelkich nowych typów lub modeli widoku według pól i typów.

### 6. Zarządzanie stanem

Szczegółowy opis sposobu zarządzania stanem w widoku, określenie, czy wymagany jest customowy hook.

### 7. Integracja API

Wyjaśnienie sposobu integracji z dostarczonym punktem końcowym. Precyzyjnie wskazuje typy żądania i odpowiedzi.

### 8. Interakcje użytkownika

Szczegółowy opis interakcji użytkownika i sposobu ich obsługi.

### 9. Warunki i walidacja

Opisz jakie warunki są weryfikowane przez interfejs, których komponentów dotyczą i jak wpływają one na stan interfejsu.

### 10. Obsługa błędów

Opis sposobu obsługi potencjalnych błędów lub przypadków brzegowych.

### 11. Kroki implementacji

Przewodnik krok po kroku dotyczący implementacji widoku (minimum 30-40 kroków podzielonych na etapy).

## Wymagania jakościowe

- Plan musi być zgodny z PRD, historyjkami użytkownika i uwzględniać dostarczony stack technologiczny
- Wszystkie opisy w języku polskim
- Szczegółowość wystarczająca dla innego programisty do implementacji
- Jasna struktura i logiczny podział na sekcje
- Uwzględnienie best practices dla accessibility (WCAG AA)
- Optimistic updates tam gdzie to możliwe
- Proper error handling i loading states

## Przykład nazewnictwa pliku

Zapisz plan w pliku: `.ai/{view-name}-view-implementation-plan.md`

Przykłady:

- `.ai/login-view-implementation-plan.md`
- `.ai/dashboard-view-implementation-plan.md`
- `.ai/lista-talii-view-implementation-plan.md`

## Template pliku wyjściowego

```markdown
# Plan implementacji widoku [Nazwa widoku]

## 1. Przegląd

[Krótki opis widoku i jego celu]

## 2. Routing widoku

[Ścieżka, na której widok powinien być dostępny]

## 3. Struktura komponentów

[Zarys głównych komponentów i ich hierarchii]

## 4. Szczegóły komponentów

### [Nazwa komponentu 1]

- **Opis**: [opis komponentu]
- **Główne elementy**: [opis elementów HTML i child komponentów]
- **Obsługiwane interakcje**: [lista interakcji]
- **Obsługiwana walidacja**: [lista walidacji, szczegółowa]
- **Typy**: [lista typów]
- **Propsy**: [lista propsów]

### [Nazwa komponentu 2]

[...]

## 5. Typy

[Szczegółowy opis wymaganych typów z podziałem na pola]

## 6. Zarządzanie stanem

[Opis zarządzania stanem w widoku, custom hooki]

## 7. Integracja API

[Wyjaśnienie integracji z endpointami, typy request/response]

## 8. Interakcje użytkownika

[Szczegółowy opis scenariuszy interakcji]

## 9. Warunki i walidacja

[Szczegółowy opis warunków i ich walidacji]

## 10. Obsługa błędów

[Opis obsługi potencjalnych błędów]

## 11. Kroki implementacji

### Etap 1: [Nazwa etapu] (Kroki 1-X)

1. [Krok 1]
2. [Krok 2]
   [...]

### Etap 2: [Nazwa etapu] (Kroki X-Y)

[...]
```

## Uwagi końcowe

- Nie uwzględniaj analizy `<implementation_breakdown>` w ostatecznym pliku
- Ostateczny wynik powinien składać się wyłącznie z planu implementacji
- Plan powinien być praktyczny i gotowy do użycia przez programistę
- Uwzględnij specyfikę aplikacji AI Flashcards (Supabase, Astro, React, TypeScript)

Rozpocznij analizę i planowanie już teraz. Twój ostateczny wynik powinien składać się wyłącznie z planu wdrożenia w języku polskim w formacie markdown, który zapiszesz w pliku .ai/{view-name}-view-implementation-plan.md i nie powinien powielać ani powtarzać żadnej pracy wykonanej w podziale implementacj
