-- Blinders Casino — schema base para Supabase free tier
-- Rode no SQL editor do Supabase.

create extension if not exists pgcrypto;

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

alter table public.profiles enable row level security;
alter table public.bets enable row level security;
alter table public.wallet_transactions enable row level security;

create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);

create policy "bets_select_own" on public.bets for select using (auth.uid() = user_id);
create policy "bets_insert_own" on public.bets for insert with check (auth.uid() = user_id);

create policy "tx_select_own" on public.wallet_transactions for select using (auth.uid() = user_id);
create policy "tx_insert_own" on public.wallet_transactions for insert with check (auth.uid() = user_id);

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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter publication supabase_realtime add table public.profiles;
alter publication supabase_realtime add table public.bets;
