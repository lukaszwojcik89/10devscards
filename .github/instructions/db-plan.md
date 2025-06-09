# Schemat bazy danych dla AI Flashcards

Na podstawie wymagań produktowych oraz notatek z sesji planowania, przedstawiam schemat bazy danych PostgreSQL dla aplikacji AI Flashcards.

## 1. Tabele bazy danych

### Tabela `users` (zarządzana przez Supabase Auth)

Tabela użytkowników jest automatycznie tworzona przez Supabase Auth.

### Tabela `decks`

```sql
CREATE TABLE decks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    slug TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,

    CONSTRAINT unique_owner_slug UNIQUE(owner_id, slug),
    CONSTRAINT valid_slug CHECK(slug ~* '^[a-z0-9-]+$'),
    CONSTRAINT valid_name CHECK(LENGTH(name) BETWEEN 1 AND 100)
);
```

### Typy ENUM

```sql
CREATE TYPE flashcard_status_enum AS ENUM ('pending', 'accepted', 'rejected');
CREATE TYPE leitner_box_enum AS ENUM ('box1', 'box2', 'box3', 'graduated');
```

### Tabela `flashcards`

```sql
CREATE TABLE flashcards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deck_id UUID NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    status flashcard_status_enum NOT NULL DEFAULT 'pending',
    box leitner_box_enum NOT NULL DEFAULT 'box1',
    next_due_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    model TEXT,
    tokens_used INTEGER,
    price_usd NUMERIC(10,6),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id),

    CONSTRAINT valid_question_length CHECK(LENGTH(question) <= 256),
    CONSTRAINT valid_answer_length CHECK(LENGTH(answer) <= 512)
);
```

### Tabela `reviews`

```sql
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flashcard_id UUID NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_correct BOOLEAN NOT NULL,
    response_time_ms INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- Partycje będą tworzone miesięcznie po osiągnięciu 10M wierszy
-- Przykładowa partycja:
-- CREATE TABLE reviews_y2023m10 PARTITION OF reviews
--     FOR VALUES FROM ('2023-10-01') TO ('2023-11-01');
```

### Tabela `budget_events`

```sql
CREATE TABLE budget_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    cost_usd NUMERIC(10,6) NOT NULL,
    cumulative_usd NUMERIC(10,6) NOT NULL,
    threshold_reached BOOLEAN NOT NULL DEFAULT FALSE,
    model TEXT,
    tokens_used INTEGER,
    user_id UUID REFERENCES auth.users(id)
);
```

### Tabela `kpi_daily`

```sql
CREATE TABLE kpi_daily (
    date DATE PRIMARY KEY,
    accepted_count INTEGER NOT NULL DEFAULT 0,
    rejected_count INTEGER NOT NULL DEFAULT 0,
    accepted_pct NUMERIC(5,2),
    ai_generated_count INTEGER NOT NULL DEFAULT 0,
    manual_created_count INTEGER NOT NULL DEFAULT 0,
    ai_share_pct NUMERIC(5,2),
    active_users INTEGER NOT NULL DEFAULT 0,
    total_users INTEGER NOT NULL DEFAULT 0,
    retention_pct NUMERIC(5,2),
    cost_usd NUMERIC(10,6) NOT NULL DEFAULT 0,
    tokens_used INTEGER NOT NULL DEFAULT 0
);
```

### Tabela `kpi_monthly`

```sql
CREATE TABLE kpi_monthly (
    year_month TEXT PRIMARY KEY,
    accepted_count INTEGER NOT NULL DEFAULT 0,
    rejected_count INTEGER NOT NULL DEFAULT 0,
    accepted_pct NUMERIC(5,2),
    ai_generated_count INTEGER NOT NULL DEFAULT 0,
    manual_created_count INTEGER NOT NULL DEFAULT 0,
    ai_share_pct NUMERIC(5,2),
    mau INTEGER NOT NULL DEFAULT 0,
    mau_retention_pct NUMERIC(5,2),
    cost_usd NUMERIC(10,6) NOT NULL DEFAULT 0,
    tokens_used INTEGER NOT NULL DEFAULT 0
);
```

## 2. Relacje między tabelami

- `users` (1) → (N) `decks` (właściciel wielu zestawów)
- `decks` (1) → (N) `flashcards` (zestaw zawiera wiele fiszek)
- `flashcards` (1) → (N) `reviews` (fiszka ma wiele historycznych powtórek)
- `users` (1) → (N) `reviews` (użytkownik wykonuje wiele powtórek)
- `users` (1) → (N) `budget_events` (użytkownik generuje wiele zdarzeń kosztowych)

## 3. Indeksy

```sql
-- Indeksy dla tabeli decks
CREATE INDEX idx_decks_owner_id ON decks(owner_id);
CREATE INDEX idx_decks_is_deleted ON decks(is_deleted) WHERE is_deleted = FALSE;

-- Indeksy dla tabeli flashcards
CREATE INDEX idx_flashcards_deck_id ON flashcards(deck_id);
CREATE INDEX idx_flashcards_status ON flashcards(status);
CREATE INDEX idx_flashcards_due_date ON flashcards(next_due_date) WHERE status = 'accepted';
CREATE INDEX idx_flashcards_deck_due_date ON flashcards(deck_id, next_due_date) WHERE status = 'accepted';

-- Indeks złożony dla szybkiej selekcji fiszek na sesje powtórkowe
CREATE INDEX idx_flashcards_user_due_date ON flashcards(
    (SELECT owner_id FROM decks WHERE decks.id = flashcards.deck_id),
    next_due_date
) WHERE status = 'accepted';

-- Indeksy dla tabeli reviews
CREATE INDEX idx_reviews_flashcard_id ON reviews(flashcard_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_created_at ON reviews(created_at);
CREATE INDEX idx_reviews_user_created ON reviews(user_id, created_at DESC);

-- Indeksy dla tabeli budget_events
CREATE INDEX idx_budget_events_event_time ON budget_events(event_time);
CREATE INDEX idx_budget_cumulative ON budget_events(cumulative_usd DESC);
```

## 4. Zasady Row Level Security

```sql
-- RLS dla tabeli decks
ALTER TABLE decks ENABLE ROW LEVEL SECURITY;
CREATE POLICY decks_owner_policy ON decks
    USING (owner_id = auth.uid());

-- RLS dla tabeli flashcards
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
CREATE POLICY flashcards_owner_policy ON flashcards
    USING (deck_id IN (SELECT id FROM decks WHERE owner_id = auth.uid()));

-- RLS dla tabeli reviews
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY reviews_owner_policy ON reviews
    USING (user_id = auth.uid());

-- RLS dla tabeli budget_events (tylko admini)
ALTER TABLE budget_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY budget_events_admin_policy ON budget_events
    USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS dla tabel KPI (tylko admini)
ALTER TABLE kpi_daily ENABLE ROW LEVEL SECURITY;
CREATE POLICY kpi_daily_admin_policy ON kpi_daily
    USING (auth.jwt() ->> 'role' = 'service_role');

ALTER TABLE kpi_monthly ENABLE ROW LEVEL SECURITY;
CREATE POLICY kpi_monthly_admin_policy ON kpi_monthly
    USING (auth.jwt() ->> 'role' = 'service_role');
```

## 5. Triggery i funkcje

### 5.1. Funkcja aktualizacji fiszek po odpowiedzi

```sql
CREATE OR REPLACE FUNCTION update_flashcard_after_review()
RETURNS TRIGGER AS $$
BEGIN
    -- Aktualizacja pola box i next_due_date w zależności od poprawności odpowiedzi
    IF NEW.is_correct = TRUE THEN
        -- Poprawna odpowiedź - awans do kolejnego boxa
        UPDATE flashcards
        SET
            box = CASE
                WHEN box = 'box1' THEN 'box2'
                WHEN box = 'box2' THEN 'box3'
                WHEN box = 'box3' THEN 'graduated'
                ELSE box
            END,
            next_due_date = CASE
                WHEN box = 'box1' THEN NOW() + INTERVAL '3 days'
                WHEN box = 'box2' THEN NOW() + INTERVAL '7 days'
                WHEN box = 'box3' THEN NOW() + INTERVAL '30 days'
                ELSE NOW() + INTERVAL '30 days'
            END,
            updated_at = NOW()
        WHERE id = NEW.flashcard_id;
    ELSE
        -- Niepoprawna odpowiedź - powrót do box1
        UPDATE flashcards
        SET
            box = 'box1',
            next_due_date = NOW() + INTERVAL '1 day',
            updated_at = NOW()
        WHERE id = NEW.flashcard_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_flashcard_leitner_box
AFTER INSERT ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_flashcard_after_review();
```

### 5.2. Funkcja automatycznego ustawiania pending jako accepted po 5 dniach

```sql
CREATE OR REPLACE FUNCTION update_pending_flashcards()
RETURNS VOID AS $$
BEGIN
    UPDATE flashcards
    SET
        status = 'accepted',
        updated_at = NOW()
    WHERE
        status = 'pending'
        AND created_at < NOW() - INTERVAL '5 days';
END;
$$ LANGUAGE plpgsql;

-- Ta funkcja będzie uruchamiana przez Edge Function co 12h
```

### 5.3. Trigger do aktualizacji timestamps

```sql
CREATE OR REPLACE FUNCTION update_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_decks_timestamp
BEFORE UPDATE ON decks
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_timestamp();

CREATE TRIGGER update_flashcards_timestamp
BEFORE UPDATE ON flashcards
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_timestamp();
```

## 6. Dodatkowe uwagi

1. **System Leitner:**

   - Box1: powtórka po 1 dniu
   - Box2: powtórka po 3 dniach
   - Box3: powtórka po 7 dniach
   - Graduated: ukończona fiszka (powtórka po 30 dniach, można zmodyfikować)

2. **Mechanizm budżetowania:**

   - Tabela `budget_events` śledzi wszystkie wydatki na API AI
   - Alert przy 80% miesięcznego budżetu
   - Blokada generacji przy 100% budżetu

3. **Agregacja KPI:**

   - Edge Function będzie uruchamiać cron co 24h w celu agregarowania danych do `kpi_daily` i `kpi_monthly`

4. **Partycjonowanie reviews:**

   - Partition by Range według daty utworzenia
   - Włączenie partycjonowania przy 10M wierszy
   - Pozwoli to na łatwą archiwizację starych danych

5. **Soft delete:**

   - Flagi is_deleted + deleted_at w tabeli decks
   - ON DELETE CASCADE zapewnia usunięcie powiązanych fiszek i powtórek

6. **Limity danych:**

   - Question ≤ 256 znaków
   - Answer ≤ 512 znaków
   - Wymuszenie przez ograniczenia CHECK

7. **Migracje bazy danych:**
   - Zalecane wykorzystanie Supabase CLI do zarządzania migracjami
