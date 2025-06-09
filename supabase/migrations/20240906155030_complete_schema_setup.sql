-- Migration: complete_schema_setup
-- Description: Creates the complete database schema for AI Flashcards application
-- Created at: 2024-09-06 15:50:30
-- Author: Database Architect

-- ================================================
-- ENUM TYPES
-- ================================================

-- Create enum types if they don't already exist
do $$ 
begin
    -- Only create if they don't exist
    if not exists (select 1 from pg_type where typname = 'flashcard_status_enum') then
        create type flashcard_status_enum as enum ('pending', 'accepted', 'rejected');
    end if;
    
    if not exists (select 1 from pg_type where typname = 'leitner_box_enum') then
        create type leitner_box_enum as enum ('box1', 'box2', 'box3', 'graduated');
    end if;
end $$;

-- ================================================
-- TABLES
-- ================================================

-- Drop tables if they exist (in reverse dependency order)
drop table if exists reviews;
drop table if exists kpi_monthly;
drop table if exists kpi_daily;
drop table if exists budget_events;
drop table if exists flashcards;
drop table if exists decks;

-- Decks table: Stores collections of flashcards
create table decks (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null references auth.users(id) on delete cascade,
    slug text not null,
    name text not null,
    description text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    is_deleted boolean not null default false,
    deleted_at timestamptz,
    
    constraint unique_owner_slug unique(owner_id, slug),
    constraint valid_slug check(slug ~* '^[a-z0-9-]+$'),
    constraint valid_name check(length(name) between 1 and 100)
);

-- Add comment to table and columns
comment on table decks is 'Collections of flashcards owned by users';
comment on column decks.owner_id is 'The user who owns this deck';
comment on column decks.slug is 'URL-friendly identifier, unique per owner';
comment on column decks.is_deleted is 'Soft-delete flag';

-- Flashcards table: Stores individual flashcards
create table flashcards (
    id uuid primary key default gen_random_uuid(),
    deck_id uuid not null references decks(id) on delete cascade,
    question text not null,
    answer text not null,
    status flashcard_status_enum not null default 'pending',
    box leitner_box_enum not null default 'box1',
    next_due_date timestamptz not null default now(),
    model text,
    tokens_used integer,
    price_usd numeric(10,6),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    updated_by uuid references auth.users(id),
    
    constraint valid_question_length check(length(question) <= 256),
    constraint valid_answer_length check(length(answer) <= 512)
);

-- Add comment to table and columns
comment on table flashcards is 'Individual flashcards belonging to decks';
comment on column flashcards.deck_id is 'The deck this flashcard belongs to';
comment on column flashcards.next_due_date is 'When this card should next be reviewed';
comment on column flashcards.model is 'AI model used for generation, if applicable';
comment on column flashcards.tokens_used is 'Number of tokens used for AI generation';
comment on column flashcards.price_usd is 'Cost of AI generation in USD';

-- Reviews table: Stores flashcard review history with partitioning
-- Note: For partitioned tables, the primary key must include the partition column
create table reviews (
    id uuid default gen_random_uuid(),
    flashcard_id uuid not null references flashcards(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    is_correct boolean not null,
    response_time_ms integer not null,
    created_at timestamptz not null default now(),
    -- Primary key must include the partition key column
    primary key (id, created_at)
) partition by range (created_at);

-- Add comment to table and columns
comment on table reviews is 'Review history for flashcards (partitioned by created_at)';
comment on column reviews.flashcard_id is 'The flashcard that was reviewed';
comment on column reviews.user_id is 'The user who performed the review';
comment on column reviews.is_correct is 'Whether the user answered correctly';
comment on column reviews.response_time_ms is 'Time taken to respond in milliseconds';

-- Budget events table: Tracks AI generation costs and budget thresholds
create table budget_events (
    id uuid primary key default gen_random_uuid(),
    event_time timestamptz not null default now(),
    cost_usd numeric(10,6) not null,
    cumulative_usd numeric(10,6) not null,
    threshold_reached boolean not null default false,
    model text,
    tokens_used integer,
    user_id uuid references auth.users(id)
);

-- Add comment to table and columns
comment on table budget_events is 'Tracking of AI generation costs and budget thresholds';
comment on column budget_events.cost_usd is 'Cost of this specific AI generation event';
comment on column budget_events.cumulative_usd is 'Running total cost for the current period';
comment on column budget_events.threshold_reached is 'Whether this event triggered a budget threshold';

-- KPI daily table: Daily aggregated metrics
create table kpi_daily (
    date date primary key,
    accepted_count integer not null default 0,
    rejected_count integer not null default 0,
    accepted_pct numeric(5,2),
    ai_generated_count integer not null default 0,
    manual_created_count integer not null default 0,
    ai_share_pct numeric(5,2),
    active_users integer not null default 0,
    total_users integer not null default 0,
    retention_pct numeric(5,2),
    cost_usd numeric(10,6) not null default 0,
    tokens_used integer not null default 0
);

-- Add comment to table
comment on table kpi_daily is 'Daily aggregated metrics for platform performance';

-- KPI monthly table: Monthly aggregated metrics
create table kpi_monthly (
    year_month text primary key,
    accepted_count integer not null default 0,
    rejected_count integer not null default 0,
    accepted_pct numeric(5,2),
    ai_generated_count integer not null default 0,
    manual_created_count integer not null default 0,
    ai_share_pct numeric(5,2),
    mau integer not null default 0,
    mau_retention_pct numeric(5,2),
    cost_usd numeric(10,6) not null default 0,
    tokens_used integer not null default 0
);

-- Add comment to table
comment on table kpi_monthly is 'Monthly aggregated metrics for platform performance';

-- ================================================
-- INDEXES
-- ================================================

-- Indexes for decks table
create index idx_decks_owner_id on decks(owner_id);
create index idx_decks_is_deleted on decks(is_deleted) where is_deleted = false;

-- Indexes for flashcards table
create index idx_flashcards_deck_id on flashcards(deck_id);
create index idx_flashcards_status on flashcards(status);
create index idx_flashcards_due_date on flashcards(next_due_date) where status = 'accepted';
create index idx_flashcards_deck_due_date on flashcards(deck_id, next_due_date) where status = 'accepted';

-- Indexes for reviews table
create index idx_reviews_flashcard_id on reviews(flashcard_id, created_at);
create index idx_reviews_user_id on reviews(user_id, created_at);
create index idx_reviews_created_at on reviews(created_at);
create index idx_reviews_user_created on reviews(user_id, created_at desc);

-- Indexes for budget_events table
create index idx_budget_events_event_time on budget_events(event_time);
create index idx_budget_cumulative on budget_events(cumulative_usd desc);

-- ================================================
-- FUNCTIONS & TRIGGERS
-- ================================================

-- Function to update flashcard after review based on Leitner system
create or replace function update_flashcard_after_review()
returns trigger as $$
begin
    -- Update box and next_due_date based on review correctness
    if new.is_correct = true then
        -- Correct answer - advance to next box
        update flashcards
        set 
            box = case 
                when box = 'box1' then 'box2'
                when box = 'box2' then 'box3'
                when box = 'box3' then 'graduated'
                else box
            end,
            next_due_date = case 
                when box = 'box1' then now() + interval '3 days'
                when box = 'box2' then now() + interval '7 days'
                when box = 'box3' then now() + interval '30 days'
                else now() + interval '30 days'
            end,
            updated_at = now()
        where id = new.flashcard_id;
    else
        -- Incorrect answer - move back to box1
        update flashcards
        set 
            box = 'box1',
            next_due_date = now() + interval '1 day',
            updated_at = now()
        where id = new.flashcard_id;
    end if;
    
    return new;
end;
$$ language plpgsql security definer;

comment on function update_flashcard_after_review() is 'Implements Leitner system logic to update flashcard box and due date after review';

-- Trigger to update flashcard after review
create trigger update_flashcard_leitner_box
after insert on reviews
for each row
execute function update_flashcard_after_review();

-- Function to update pending flashcards to accepted after 5 days
create or replace function update_pending_flashcards()
returns void as $$
begin
    update flashcards
    set 
        status = 'accepted',
        updated_at = now()
    where 
        status = 'pending' 
        and created_at < now() - interval '5 days';
end;
$$ language plpgsql security definer;

comment on function update_pending_flashcards() is 'Automatically accepts pending flashcards after 5 days';

-- Function to automatically update timestamps on update
create or replace function update_updated_at_timestamp()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

comment on function update_updated_at_timestamp() is 'Updates the updated_at timestamp when a row is updated';

-- Trigger for decks updated_at
create trigger update_decks_timestamp
before update on decks
for each row
execute function update_updated_at_timestamp();

-- Trigger for flashcards updated_at
create trigger update_flashcards_timestamp
before update on flashcards
for each row
execute function update_updated_at_timestamp();

-- ================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================

-- Enable RLS on all tables
alter table decks enable row level security;
alter table flashcards enable row level security;
alter table reviews enable row level security;
alter table budget_events enable row level security;
alter table kpi_daily enable row level security;
alter table kpi_monthly enable row level security;

-- RLS policies for decks

-- Anonymous users can't access any decks
create policy decks_anon_select_policy
    on decks for select
    to anon
    using (false);

-- Authenticated users can only access their own decks
create policy decks_auth_select_policy
    on decks for select
    to authenticated
    using (owner_id = auth.uid());

create policy decks_auth_insert_policy
    on decks for insert
    to authenticated
    with check (owner_id = auth.uid());

create policy decks_auth_update_policy
    on decks for update
    to authenticated
    using (owner_id = auth.uid())
    with check (owner_id = auth.uid());

create policy decks_auth_delete_policy
    on decks for delete
    to authenticated
    using (owner_id = auth.uid());

-- RLS policies for flashcards

-- Anonymous users can't access any flashcards
create policy flashcards_anon_select_policy
    on flashcards for select
    to anon
    using (false);

-- Authenticated users can only access flashcards in their own decks
create policy flashcards_auth_select_policy
    on flashcards for select
    to authenticated
    using (deck_id in (select id from decks where owner_id = auth.uid()));

create policy flashcards_auth_insert_policy
    on flashcards for insert
    to authenticated
    with check (deck_id in (select id from decks where owner_id = auth.uid()));

create policy flashcards_auth_update_policy
    on flashcards for update
    to authenticated
    using (deck_id in (select id from decks where owner_id = auth.uid()))
    with check (deck_id in (select id from decks where owner_id = auth.uid()));

create policy flashcards_auth_delete_policy
    on flashcards for delete
    to authenticated
    using (deck_id in (select id from decks where owner_id = auth.uid()));

-- RLS policies for reviews

-- Anonymous users can't access any reviews
create policy reviews_anon_select_policy
    on reviews for select
    to anon
    using (false);

-- Authenticated users can only access their own reviews
create policy reviews_auth_select_policy
    on reviews for select
    to authenticated
    using (user_id = auth.uid());

create policy reviews_auth_insert_policy
    on reviews for insert
    to authenticated
    with check (
        user_id = auth.uid() and
        flashcard_id in (
            select flashcards.id from flashcards
            join decks on flashcards.deck_id = decks.id
            where decks.owner_id = auth.uid()
        )
    );

-- No update or delete policies for reviews as they should be immutable records

-- RLS policies for budget_events - accessible only to service_role (admin)

-- Anonymous users can't access budget events
create policy budget_events_anon_select_policy
    on budget_events for select
    to anon
    using (false);

-- Authenticated regular users can't access budget events
create policy budget_events_auth_select_policy
    on budget_events for select
    to authenticated
    using (auth.jwt() ->> 'role' = 'service_role');

-- Insert policy for authenticating system to record budget events
create policy budget_events_auth_insert_policy
    on budget_events for insert
    to authenticated
    with check (auth.jwt() ->> 'role' = 'service_role');

-- RLS policies for KPI tables - accessible only to service_role (admin)

-- Anonymous users can't access KPI data
create policy kpi_daily_anon_select_policy
    on kpi_daily for select
    to anon
    using (false);

-- Only admins can access KPI data
create policy kpi_daily_auth_select_policy
    on kpi_daily for select
    to authenticated
    using (auth.jwt() ->> 'role' = 'service_role');

create policy kpi_daily_auth_insert_policy
    on kpi_daily for insert
    to authenticated
    with check (auth.jwt() ->> 'role' = 'service_role');

create policy kpi_daily_auth_update_policy
    on kpi_daily for update
    to authenticated
    using (auth.jwt() ->> 'role' = 'service_role')
    with check (auth.jwt() ->> 'role' = 'service_role');

-- Policies for monthly KPIs
create policy kpi_monthly_anon_select_policy
    on kpi_monthly for select
    to anon
    using (false);

create policy kpi_monthly_auth_select_policy
    on kpi_monthly for select
    to authenticated
    using (auth.jwt() ->> 'role' = 'service_role');

create policy kpi_monthly_auth_insert_policy
    on kpi_monthly for insert
    to authenticated
    with check (auth.jwt() ->> 'role' = 'service_role');

create policy kpi_monthly_auth_update_policy
    on kpi_monthly for update
    to authenticated
    using (auth.jwt() ->> 'role' = 'service_role')
    with check (auth.jwt() ->> 'role' = 'service_role');

-- Grant necessary permissions to authenticated users
grant usage on schema public to authenticated;
grant select on all tables in schema public to authenticated;
grant insert, update on decks, flashcards, reviews to authenticated;
grant usage on all sequences in schema public to authenticated;

-- End of migration
