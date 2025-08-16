# Test PR Workflow

Ten plik został utworzony aby przetestować workflow Pull Request w GitHub Actions.

## Co testujemy

1. ✅ Linting kodu (ESLint)
2. ✅ Formatowanie (Prettier)
3. ✅ Testy jednostkowe (Vitest)
4. ✅ Build aplikacji (Astro)
5. ✅ Komentarz z statusem do PR

## Oczekiwane rezultaty

- Wszystkie joby powinny przejść z sukcesem
- Bot powinien dodać komentarz z podsumowaniem
- Artifakty pokrycia testami i build powinny być dostępne

Ten test powinien potwierdzić że nasze scenariusze CI/CD działają poprawnie.
