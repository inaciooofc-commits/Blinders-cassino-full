-- BLINDERS CASINO — SUPABASE SCHEMA V4 TRIGGER SAFE
-- Corrige:
-- ERROR 2BP01: cannot drop function handle_new_user() because other objects depend on it
--
-- Motivo:
-- Já existe outro trigger usando public.handle_new_user(), por exemplo:
-- on_auth_user_created_blinders
--
-- Este SQL remove com segurança todos os triggers em auth.users que dependem
-- de public.handle_new_user(), antes de recriar função e trigger.

create extension if not exists pgcrypto;

-- =========================
-- TABELAS
-- =========================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Shinobi',
  avatar_url text,
  vip_tier text not null default 'Genin',
  balance numeric not null default 1000 check (balance >= 0),
  energy integer not null default 100 check (energy >= 0 and energy <= 100),
  created_at timestamptz not null default now()
);

create table if not exists public.bets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  game_key text not null check (game_key in ('slots', 'blackjack', 'roulette', 'poker', 'dice')),
  bet_amount numeric not null check (bet_amount > 0),
  payout numeric not null default 0,
  result text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  tx_type text not null check (tx_type in ('deposit', 'withdraw', 'bet', 'payout', 'bonus')),
  amount numeric not null,
  note text,
  created_at timestamptz not null default now()
);

-- =========================
-- RLS
-- =========================

alter table public.profiles enable row level security;
alter table public.bets enable row level security;
alter table public.wallet_transactions enable row level security;

-- =========================
-- POLICIES SEGURAS
-- =========================

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;

drop policy if exists "bets_select_own" on public.bets;
drop policy if exists "bets_insert_own" on public.bets;

drop policy if exists "tx_select_own" on public.wallet_transactions;
drop policy if exists "tx_insert_own" on public.wallet_transactions;

create policy "profiles_select_own"
on public.profiles
for select
using (auth.uid() = id);

create policy "profiles_update_own"
on public.profiles
for update
using (auth.uid() = id);

create policy "profiles_insert_own"
on public.profiles
for insert
with check (auth.uid() = id);

create policy "bets_select_own"
on public.bets
for select
using (auth.uid() = user_id);

create policy "bets_insert_own"
on public.bets
for insert
with check (auth.uid() = user_id);

create policy "tx_select_own"
on public.wallet_transactions
for select
using (auth.uid() = user_id);

create policy "tx_insert_own"
on public.wallet_transactions
for insert
with check (auth.uid() = user_id);

-- =========================
-- TRIGGERS/FUNÇÃO DE PERFIL
-- =========================
-- Remove triggers conhecidos.
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists on_auth_user_created_blinders on auth.users;

-- Remove qualquer outro trigger em auth.users que chame public.handle_new_user().
do $$
declare
  r record;
begin
  for r in
    select tg.tgname
    from pg_trigger tg
    join pg_class c on c.oid = tg.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    join pg_proc p on p.oid = tg.tgfoid
    join pg_namespace pn on pn.oid = p.pronamespace
    where n.nspname = 'auth'
      and c.relname = 'users'
      and pn.nspname = 'public'
      and p.proname = 'handle_new_user'
      and tg.tgisinternal = false
  loop
    execute format('drop trigger if exists %I on auth.users', r.tgname);
  end loop;
end $$;

drop function if exists public.handle_new_user();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', 'Shinobi'))
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created_blinders
after insert on auth.users
for each row execute function public.handle_new_user();

-- =========================
-- REALTIME SEGURO
-- =========================

do $$
begin
  if to_regclass('public.profiles') is not null
     and exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1
       from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'profiles'
     )
  then
    alter publication supabase_realtime add table public.profiles;
  end if;

  if to_regclass('public.bets') is not null
     and exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1
       from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'bets'
     )
  then
    alter publication supabase_realtime add table public.bets;
  end if;
end $$;

select 'BLINDERS_SUPABASE_SCHEMA_V4_TRIGGER_SAFE_OK' as status;
