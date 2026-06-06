-- ============================================================
-- BLINDERS V12 — BINGO FIX + PERFORMANCE
--
-- Corrige o erro no Bingo:
-- "query returned more than one row"
--
-- Causa:
-- versões antigas usavam to_jsonb(generate_series(1,100))
-- dentro de jsonb_build_object. generate_series retorna várias linhas.
--
-- Correção:
-- usar SELECT jsonb_agg(gs) FROM generate_series(1,100) gs.
--
-- Resultado esperado:
-- BLINDERS_NETLIFY_V12_BINGO_FIX_PERFORMANCE_OK
-- ============================================================

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

-- ------------------------------------------------------------
-- Bingo corrigido: cartela 1..100 como array JSON único
-- ------------------------------------------------------------
drop function if exists public.app_v12_bingo_result(text);
create or replace function public.app_v12_bingo_result(p_choice text)
returns jsonb
language plpgsql
security definer
set search_path=public,extensions
as $$
declare
  selected int[] := '{}';
  drawn int[] := '{}';
  hit_nums int[] := '{}';
  raw text;
  n int;
  hits int := 0;
  mult numeric := 0;
  win boolean := false;
  card_json jsonb := '[]'::jsonb;
begin
  -- cartela como um único JSON array, sem retornar múltiplas linhas
  select jsonb_agg(gs order by gs)
  into card_json
  from generate_series(1,100) as gs;

  -- números escolhidos pelo jogador
  foreach raw in array regexp_split_to_array(coalesce(p_choice,''), '[^0-9]+') loop
    if raw <> '' then
      n := raw::int;
      if n between 1 and 100 and not n = any(selected) then
        selected := array_append(selected, n);
      end if;
    end if;
  end loop;

  if array_length(selected,1) is null or array_length(selected,1) < 3 then
    raise exception 'Escolha pelo menos 3 números no Bingo.';
  end if;

  if array_length(selected,1) > 10 then
    selected := selected[1:10];
  end if;

  -- sorteio: 25 números únicos, ordem do array = ordem do sorteio
  while coalesce(array_length(drawn,1),0) < 25 loop
    n := 1 + floor(random()*100)::int;
    if not n = any(drawn) then
      drawn := array_append(drawn,n);
    end if;
  end loop;

  foreach n in array selected loop
    if n = any(drawn) then
      hits := hits + 1;
      hit_nums := array_append(hit_nums,n);
    end if;
  end loop;

  if hits >= 8 then mult := 12; win := true;
  elsif hits >= 7 then mult := 8; win := true;
  elsif hits >= 6 then mult := 5; win := true;
  elsif hits >= 5 then mult := 3; win := true;
  elsif hits >= 4 then mult := 2; win := true;
  elsif hits >= 3 then mult := 1.5; win := true;
  else mult := 0; win := false;
  end if;

  return jsonb_build_object(
    'card', card_json,
    'selected', to_jsonb(selected),
    'drawn', to_jsonb(drawn),
    'hitNumbers', to_jsonb(hit_nums),
    'matched', hits,
    'hits', hits,
    'win', win,
    'multiplier', mult,
    'oneByOne', true,
    'noRepeat', true,
    'engine', 'pixi-v12',
    'rule','Sorteio: 1 número por vez, aleatório, sem repetição. 3 acertos = 1.5x; 4 = 2x; 5 = 3x; 6 = 5x; 7 = 8x; 8+ = 12x.'
  );
end;
$$;

-- Compatibilidade: alguns builds chamam app_v9_bingo_result
drop function if exists public.app_v9_bingo_result(text);
create or replace function public.app_v9_bingo_result(p_choice text)
returns jsonb
language sql
security definer
set search_path=public
as $$
  select public.app_v12_bingo_result(p_choice)
$$;

-- Compatibilidade: alguns builds chamam app_real_animation_make_result
drop function if exists public.app_real_animation_make_result(text,text);
create or replace function public.app_real_animation_make_result(p_game_key text, p_choice text)
returns jsonb
language plpgsql
security definer
set search_path=public,extensions
as $$
declare
  key text := lower(coalesce(p_game_key,''));
  win boolean := false;
  mult numeric := 0;
  n int;
begin
  if key='bingo' then
    return public.app_v12_bingo_result(p_choice);

  elsif key='blackjack' and to_regprocedure('public.app_v9_blackjack_preview()') is not null then
    return public.app_v9_blackjack_preview() || jsonb_build_object('win',false,'multiplier',0);

  elsif key='memory' and to_regprocedure('public.app_v8_cards_memory()') is not null then
    return public.app_v8_cards_memory() || jsonb_build_object('win',false,'multiplier',0);

  elsif key='roulette' then
    n := floor(random()*37)::int;
    return jsonb_build_object(
      'number', n,
      'color', case when n=0 then 'green' when n%2=0 then 'black' else 'red' end,
      'win', false,
      'multiplier', 0
    );

  elsif key='dice' then
    return jsonb_build_object(
      'dice', jsonb_build_array(1 + floor(random()*6)::int, 1 + floor(random()*6)::int),
      'win', false,
      'multiplier', 0
    );

  elsif key='slots' then
    return jsonb_build_object(
      'reels', jsonb_build_array('🍒','🔔','⭐'),
      'win', false,
      'multiplier', 0
    );

  elsif key='coin' then
    win := random() > .5;
    mult := case when win then 2 else 0 end;
    return jsonb_build_object('side', case when random()>.5 then 'heads' else 'tails' end, 'win', win, 'multiplier', mult);

  elsif key='crash' then
    return jsonb_build_object('crashAt', round((1.1 + random()*4.5)::numeric, 2), 'win', false, 'multiplier', 0);

  elsif key='scratch' then
    n := floor(random()*100)::int;
    if n>=97 then mult:=20; win:=true;
    elsif n>=88 then mult:=5; win:=true;
    elsif n>=68 then mult:=2; win:=true;
    else mult:=0; win:=false;
    end if;
    return jsonb_build_object('symbol', case when win then '⭐' else '❌' end, 'win', win, 'multiplier', mult);

  else
    n := floor(random()*100)::int;
    win := n >= 55;
    mult := case when win then 2 else 0 end;
    return jsonb_build_object('roll', n, 'win', win, 'multiplier', mult);
  end if;
end;
$$;

-- ------------------------------------------------------------
-- Tabela leve de flags de performance
-- ------------------------------------------------------------
create table if not exists public.app_performance_flags (
  key text primary key,
  value jsonb not null default '{}',
  updated_at timestamptz default now()
);

insert into public.app_performance_flags(key,value)
values
('pixi', jsonb_build_object(
  'maxResolutionMobile', 1.25,
  'maxResolutionDesktop', 2,
  'pauseWhenHidden', true,
  'reduceParticlesOnMobile', true,
  'bingoOneByOne', true,
  'bingoNoRepeat', true
)),
('assets', jsonb_build_object(
  'lazyPreload', true,
  'criticalOnlyOnWeakDevices', true,
  'disableFixedBackgroundOnMobile', true
))
on conflict(key) do update set
  value=excluded.value,
  updated_at=now();

grant execute on function public.app_v12_bingo_result(text) to anon, authenticated;
grant execute on function public.app_v9_bingo_result(text) to anon, authenticated;
grant execute on function public.app_real_animation_make_result(text,text) to anon, authenticated;

notify pgrst, 'reload schema';

select 'BLINDERS_NETLIFY_V12_BINGO_FIX_PERFORMANCE_OK' as status;
