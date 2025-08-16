# 🧪 Jak przetestować GitHub Actions workflows

## 📋 Podsumowanie dostępnych scenariuszy

### 1. `quick-test.yml` ⚡

**Jak uruchomić:**

- Ręcznie: GitHub → Actions → Quick Test → Run workflow
- Automatycznie: przy zmianach w `.github/workflows/**`

**Co testuje:** Szybki lint + test + build

### 2. `master-ci.yml` 🚀

**Jak uruchomić:**

- Automatycznie: przy push na master
- Ręcznie: GitHub → Actions → Master Branch CI/CD → Run workflow

**Co testuje:** Pełny pipeline dla mastera

### 3. `pull-request.yml` 🔍

**Jak uruchomić:**

- Automatycznie: przy tworzeniu/aktualizacji PR do mastera
- Ręcznie: GitHub → Actions → Pull Request Validation → Run workflow
- Poprzez PR: <https://github.com/lukaszwojcik89/10devscards/pull/new/test/pr-workflow>

**Co testuje:** Walidacja PR z komentarzem bota

### 4. `release.yml` 🎉

**Jak uruchomić:**

- Automatycznie: przy tworzeniu tagów `v*` (np. `v1.0.0`)
- Ręcznie: GitHub → Actions → Release Pipeline → Run workflow
- Poprzez tagi: `git tag v1.0.0 && git push origin v1.0.0`

**Co testuje:** Pełny release pipeline

## 🔧 Instrukcje testowania

### Testowanie PR workflow

1. **Przez PR (zalecane):**

   ```bash
   # Aktualny branch: test/pr-workflow
   # Idź na: https://github.com/lukaszwojcik89/10devscards/pull/new/test/pr-workflow
   # Stwórz PR i obserwuj Actions
   ```

2. **Ręcznie:**
   - GitHub → Actions → Pull Request Validation
   - Kliknij "Run workflow" → Run workflow

### Testowanie Release workflow

```bash
# Stwórz tag i wypchnij
git tag v1.0.0
git push origin v1.0.0

# Lub ręcznie w GitHub Actions
```

### Testowanie Quick Test

```bash
# Zmień cokolwiek w .github/workflows/ i wypchnij
# Lub uruchom ręcznie w GitHub Actions
```

## ✅ Oczekiwane rezultaty

### Pull Request workflow powinien

- ✅ Przejść linting (ESLint + Prettier)
- ✅ Przejść unit testy (81 testów)
- ✅ Zbudować aplikację
- ✅ Dodać komentarz do PR z statusem
- ✅ Utworzyć artefakty coverage i build

### Master CI workflow powinien

- ✅ Przejść wszystkie testy
- ✅ Zbudować dla produkcji
- ✅ Przejść quality gate
- ✅ Wyświetlić notyfikację sukcesu

### Release workflow powinien

- ✅ Walidować wersję
- ✅ Przejść pełne testy
- ✅ Zbudować release package
- ✅ Wygenerować changelog
- ✅ Utworzyć GitHub release

## 🎯 Status certyfikacji

Nasze scenariusze CI/CD spełniają wszystkie wymogi:

- ✅ **Automatyczne uruchamianie testów** - wszystkie workflow mają testy
- ✅ **Integracja z GitHub** - 4 różne scenariusze
- ✅ **Quality gates** - linting, testy, build
- ✅ **Artefakty** - coverage, build packages
- ✅ **Notyfikacje** - komentarze PR, statusy

## 🔗 Przydatne linki

- [Repository Actions](https://github.com/lukaszwojcik89/10devscards/actions)
- [Create PR](https://github.com/lukaszwojcik89/10devscards/pull/new/test/pr-workflow)
- [Security alerts](https://github.com/lukaszwojcik89/10devscards/security/dependabot)
