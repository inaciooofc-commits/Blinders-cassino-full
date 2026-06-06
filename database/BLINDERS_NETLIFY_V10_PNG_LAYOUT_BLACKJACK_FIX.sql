-- ============================================================
-- BLINDERS V10 — PNG LAYOUT + BLACKJACK 21 FIX
--
-- Corrige o erro visto no PDF:
-- jogador com 21 não pode perder no Blackjack.
--
-- Também registra assets PNG para backgrounds, vitrines, mesas,
-- botões de jogos e ícones.
--
-- Resultado esperado:
-- BLINDERS_NETLIFY_V10_PNG_LAYOUT_BLACKJACK_FIX_OK
-- ============================================================

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

-- -----------------------------
-- Registry de assets PNG
-- -----------------------------
create table if not exists public.app_png_assets (
  asset_key text primary key,
  asset_type text not null,
  asset_path text not null,
  title text,
  active boolean not null default true,
  metadata jsonb not null default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

insert into public.app_png_assets(asset_key, asset_type, asset_path, title)
values
('bg_lobby','background','/assets/png/backgrounds/main-lobby-wide.png','Lobby principal'),
('bg_admin','background','/assets/png/backgrounds/admin-dashboard-wide.png','Painel admin'),
('bg_games','background','/assets/png/backgrounds/games-panel.png','Página de jogos'),
('bg_iris','background','/assets/png/backgrounds/iris-panel.png','Banco IRIS'),
('game_roulette','game-card','/assets/png/games/roulette.png','Roleta'),
('game_blackjack','game-card','/assets/png/games/blackjack.png','Blackjack'),
('game_bingo','game-card','/assets/png/games/bingo.png','Bingo'),
('game_dice','game-card','/assets/png/games/dice.png','Dados'),
('game_slots','game-card','/assets/png/games/slots.png','Slots'),
('game_memory','game-card','/assets/png/games/memory.png','Memória'),
('game_crash','game-card','/assets/png/games/crash.png','Crash'),
('icon_home','icon','/assets/png/icons/home.png','Home'),
('icon_menu','icon','/assets/png/icons/menu.png','Menu'),
('icon_blackjack','icon','/assets/png/icons/blackjack.png','Blackjack'),
('icon_bingo','icon','/assets/png/icons/bingo.png','Bingo'),
('icon_iris','icon','/assets/png/icons/iris-bank.png','Banco IRIS'),
('icon_radio','icon','/assets/png/icons/radio-music.png','Rádio')
on conflict(asset_key) do update set
  asset_path=excluded.asset_path,
  title=excluded.title,
  active=true,
  updated_at=now();

drop function if exists public.app_public_png_assets();
create or replace function public.app_public_png_assets()
returns jsonb
language sql
security definer
set search_path=public
as $$
  select coalesce(jsonb_object_agg(asset_key, jsonb_build_object(
    'type', asset_type,
    'path', asset_path,
    'title', title
  )), '{}'::jsonb)
  from public.app_png_assets
  where active=true;
$$;

-- -----------------------------
-- Blackjack server fix
-- -----------------------------
drop function if exists public.app_v10_blackjack_result_from_client(jsonb);
create or replace function public.app_v10_blackjack_result_from_client(p_client_result jsonb)
returns jsonb
language plpgsql
immutable
as $$
declare
  player_total int := coalesce((p_client_result->>'playerTotal')::int, 0);
  dealer_total int := coalesce((p_client_result->>'dealerTotal')::int, 0);
  player_cards_count int := coalesce(jsonb_array_length(coalesce(p_client_result->'playerCards','[]'::jsonb)), 0);
  win boolean := false;
  push boolean := false;
  mult numeric := 0;
  reason text := '';
begin
  if player_total = 21 then
    win := true;
    mult := case when player_cards_count = 2 then 2.5 else 2 end;
    reason := case when player_cards_count = 2 then 'Blackjack natural: 21 com 2 cartas.' else 'Jogador atingiu 21.' end;
  elsif player_total > 21 then
    win := false;
    mult := 0;
    reason := 'Jogador estourou.';
  elsif dealer_total > 21 then
    win := true;
    mult := 2;
    reason := 'Banca estourou.';
  elsif player_total > 0 and dealer_total > 0 then
    if (21 - player_total) < (21 - dealer_total) then
      win := true;
      mult := 2;
      reason := 'Jogador ficou mais perto de 21.';
    elsif (21 - player_total) = (21 - dealer_total) then
      win := true;
      push := true;
      mult := 1;
      reason := 'Empate: aposta devolvida.';
    else
      win := false;
      mult := 0;
      reason := 'Banca ficou mais perto de 21.';
    end if;
  else
    win := coalesce((p_client_result->>'win')::boolean, false);
    mult := case when win then coalesce((p_client_result->>'multiplier')::numeric, 2) else 0 end;
    reason := 'Resultado client fallback.';
  end if;

  return p_client_result || jsonb_build_object(
    'win', win,
    'push', push,
    'multiplier', mult,
    'reason', reason,
    'serverRule', '21 ganha automaticamente; se parar antes de 21, vence quem fica mais perto.'
  );
end;
$$;

-- Sobrescreve finish para garantir que 21 nunca vire derrota por preview antigo.
drop function if exists public.app_real_animation_finish_game(text,uuid,jsonb);
create or replace function public.app_real_animation_finish_game(
  p_token text,
  p_session_id uuid,
  p_client_result jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path=public,extensions
as $$
declare
  m public.app_members;
  s public.unified_game_sessions;
  fixed jsonb;
  mult numeric;
  win boolean;
begin
  m := public.v25_current(p_token);

  select * into s
  from public.unified_game_sessions
  where id=p_session_id;

  if s.id is null then
    raise exception 'Sessão não encontrada.';
  end if;

  if s.member_id <> m.id then
    raise exception 'Sessão não pertence ao usuário.';
  end if;

  if s.game_key='blackjack' then
    fixed := public.app_v10_blackjack_result_from_client(p_client_result);
    mult := coalesce((fixed->>'multiplier')::numeric,0);
    win := coalesce((fixed->>'win')::boolean,false);

    return public.app_real_animation_finish_internal(
      p_session_id,
      m.id,
      mult,
      win,
      fixed || jsonb_build_object('gameMode','blackjack_v10_21_fix')
    );
  end if;

  if s.game_key='bingo' then
    return public.app_real_animation_finish_internal(
      p_session_id,
      m.id,
      null,
      null,
      p_client_result || jsonb_build_object('gameMode','bingo_one_by_one_no_repeat')
    );
  end if;

  return public.app_real_animation_finish_internal(p_session_id,m.id,null,null,p_client_result);
end;
$$;

grant execute on function public.app_public_png_assets() to anon, authenticated;
grant execute on function public.app_v10_blackjack_result_from_client(jsonb) to anon, authenticated;
grant execute on function public.app_real_animation_finish_game(text,uuid,jsonb) to anon, authenticated;

notify pgrst, 'reload schema';

select 'BLINDERS_NETLIFY_V10_PNG_LAYOUT_BLACKJACK_FIX_OK' as status;
