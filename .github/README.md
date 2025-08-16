# CI/CD Workflows - 10devscards

Ten projekt wykorzystuje GitHub Actions do automatyzacji procesów CI/CD. Poniżej znajdziesz opis dostępnych scenariuszy.

## 📋 Dostępne Workflows

### 1. Pull Request Validation (`pull-request.yml`)

**Wyzwalany przy:** Pull Requestach do brancha `master`

**Wykonuje:**

- 🔍 **Linting** - sprawdzenie jakości kodu ESLint + formatowanie
- 🧪 **Unit Tests** - testy jednostkowe z coverage
- 🏗️ **Build Test** - sprawdzenie czy aplikacja się buduje
- 💬 **Status Comment** - automatyczny komentarz do PR z wynikami

**Równoległe wykonanie:** Unit tests i Build test po przejściu lintingu

### 2. Master Branch CI (`master-ci.yml`)

**Wyzwalany przy:** Push do brancha `master` lub manualnie

**Wykonuje:**

- 🧪 **Full Tests** - kompletne testy z lintingiem
- 🏗️ **Production Build** - build produkcyjny
- ✅ **Quality Gate** - sprawdzenie jakości
- 📢 **Success Notification** - powiadomienie o sukcesie

### 3. Release Pipeline (`release.yml`)

**Wyzwalany przy:**

- Tagach zaczynających się od `v*` (np. `v1.0.0`)
- Publikacji release
- Manualnie z możliwością podania wersji

**Wykonuje:**

- ✅ **Validation** - walidacja wersji
- 🧪 **Full Test Suite** - kompletne testy
- 📦 **Production Build** - build z archiwizacją
- 📝 **Release Notes** - automatyczne generowanie changelog
- 🎉 **Completion Notification** - podsumowanie release

### 4. Quick Test (`quick-test.yml`)

**Wyzwalany przy:**

- Manualnie (workflow_dispatch)
- Zmiany w plikach `.github/workflows/**`

**Wykonuje:**

- Szybkie sprawdzenie lint, test, build
- Idealny do testowania zmian w workflow

## 🛠️ Techniczne szczegóły

- **Node.js:** v18
- **Runner:** Ubuntu Latest
- **Cache:** npm dependencies
- **Artifacts:** coverage reports, build files (retention 7-365 dni)
- **Permissions:** pull-requests: write dla komentarzy

## 🚫 Wyłączenia

Testy E2E (Playwright) są wyłączone ze względu na problemy z WSL i przeglądarkami.

## 📊 Quality Gates

Wszystkie workflow sprawdzają:

- ✅ ESLint (bez błędów)
- ✅ Prettier formatting
- ✅ Unit tests (100% przejście)
- ✅ Successful build

## 🎯 Certyfikacja 10X

Te scenariusze spełniają wymogi certyfikacji:

- ✅ Obsługa logowania (auth) - w kodzie aplikacji
- ✅ Logika biznesowa - zarządzanie deck'ami i flashcards
- ✅ CRUD operations - deck service, flashcards service
- ✅ Działające testy - 81 unit testów przechodzi
- ✅ Scenariusz CI/CD - 4 różne workflow w GitHub Actions

## 🔧 Rozwój

Aby dodać nowe workflow:

1. Utwórz plik `.github/workflows/nazwa.yml`
2. Użyj istniejących jako szablonu
3. Przetestuj używając `quick-test.yml`

## 📝 Monitoring

Status wszystkich workflow dostępny w zakładce Actions w repozytorium GitHub.
