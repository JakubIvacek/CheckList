# Stride - Weekly Task Management PWA

Vue 3 + Supabase aplikácia na spravovanie úloh s offline podporou (PWA).

## Setup Supabase

1. Vytvor projekt na https://supabase.com
2. Skopíruj URL a ANON_KEY z Project Settings → API
3. Vlož do `.env.local`:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

## DB Setup

Spusti SQL v Supabase SQL Editor:

```sql
create table categories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade default auth.uid(),
  name        text not null,
  color       text not null default '#8E8E93',
  created_at  timestamptz not null default now()
);

create table tasks (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade default auth.uid(),
  title        text not null,
  task_date    date not null,
  status       text not null default 'todo' check (status in ('todo','done')),
  category_id  uuid references categories (id) on delete set null,
  note         text,
  position     int not null default 0,
  created_at   timestamptz not null default now(),
  completed_at timestamptz
);

create index tasks_user_date_idx on tasks (user_id, task_date);

alter table tasks      enable row level security;
alter table categories enable row level security;

create policy "tasks owner only" on tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "categories owner only" on categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

### Migrácia pre existujúcu DB (drag & drop poradie)

Ak už máš `tasks` bez stĺpca `position`, spusti:

```sql
alter table tasks add column if not exists position int not null default 0;

-- backfill poradia podľa created_at v rámci dňa
with ordered as (
  select id, row_number() over (partition by user_id, task_date order by created_at) - 1 as rn
  from tasks
)
update tasks t set position = o.rn from ordered o where o.id = t.id;
```

## Inštalácia a spustenie

```bash
npm install
npm run dev
```

Dev server běží na `http://localhost:5173`.

## Build

```bash
npm run build
```

## Štruktúra

- `src/main.ts` - Entry point
- `src/stores/` - Pinia stores (auth, tasks)
- `src/views/` - Stránky (Home, Calendar, Stats)
- `src/components/` - Komponenty (TabBar, DayList)
- `src/lib/supabase.ts` - Supabase client
- `src/types/index.ts` - TypeScript typy

## Autentifikácia

Aplikácia používa Google OAuth cez Supabase Auth. Nastav OAuth app v Supabase Authentication → Providers → Google.

## PWA

Aplikácia sa dá nainštalovať ako PWA a pracuje offline (service worker cachuje app shell). Ikony PWA: `pwa-192.png`, `pwa-512.png`.
