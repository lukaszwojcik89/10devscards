# Tech Stack – AI Flashcards

## Frontend

- **Astro 5** – statyczny rendering z wyspami interaktywności  
- **React 19** – komponenty UI z typami i hookami Server/Client  
- **TypeScript 5** – ścisłe typowanie oraz lepsze DX  
- **Tailwind CSS 4** – narzędzie utility‑first do stylowania (WCAG AA)  
- **shadcn/ui** – dostępne komponenty React oparte na Radix UI

## Backend

- **Supabase**  
  - PostgreSQL (hostowane, snapshoty + RLS)  
  - Supabase Auth (e‑mail, OAuth; polityka haseł ≥ 12 znaków)  
  - Edge Functions (TypeScript) do logiki AI, SRS i cronów  
  - Storage na przyszłe uploady (roadmapa)

## AI Integration

- **Openrouter.ai**  
  - Domyślny model: GPT‑4o‑Mini (≈0,3 ¢/1k tokenów)  
  - Limity finansowe = 10 USD/mies., alert przy 80 %  
  - Możliwość swappingu modelu bez zmian w kodzie

## CI/CD

- **GitHub Actions**  
  - Lint → Unit (Vitest) → e2e (Playwright) → Build Docker → Deploy  
  - commitlint + Conventional Commits, semantic‑release do changelogów

## Hosting & Infra

- **DigitalOcean App Platform** (container runtime)  
- Prywatny **DO Container Registry** na obrazy  
- CDN dla plików statycznych z Spaces + HTTPS  
- Sentry (error track) i Grafana/Metabase (KPI, koszt Openrouter)

## Powody wyboru

1. Szybkie MVP: Supabase i Astro redukują kod backendu i bundle JS.  
2. Skalowalność: uprade planów Supabase + auto‑scale DO App Platform.  
3. Koszt startowy niski (free tier + 5 USD droplet na Edge).  
4. Bezpieczeństwo out‑of‑the‑box (Auth, RLS, HTTPS).  
5. Możliwość łatwej migracji komponentów (np. Edge → własny kontener) w miarę rozwoju projektu.
