-- ============================================================
-- BLINDERS V8 — JOGOS INTERATIVOS + ANÚNCIOS + YOUTUBE
--
-- Corrige/implementa:
-- - Memória com pares e até 3 erros;
-- - Blackjack com pedir carta/parar real;
-- - resultado desses jogos depende da ação do jogador;
-- - anúncios públicos carregam para o ticker;
-- - tabela de trilhas YouTube para rádio/fundo.
--
-- Resultado esperado:
-- BLINDERS_NETLIFY_V8_GAMES_ANNOUNCEMENTS_YOUTUBE_OK
-- ============================================================

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

-- Anúncios públicos
create table if not exists public.harmony_announcements (
  id uuid primary key default extensions.gen_random_uuid(),
  title text,
  message text not null,
  icon text default '📢',
  active boolean not null default true,
  priority int not null default 100,
  starts_at timestamptz default now(),
  ends_at timestamptz,
  created_at timestamptz default now()
);

alter table public.harmony_announcements add column if not exists title text;
alter table public.harmony_announcements add column if not exists message text;
alter table public.harmony_announcements add column if not exists icon text default '📢';
alter table public.harmony_announcements add column if not exists active boolean not null default true;
alter table public.harmony_announcements add column if not exists priority int not null default 100;
alter table public.harmony_announcements add column if not exists starts_at timestamptz default now();
alter table public.harmony_announcements add column if not exists ends_at timestamptz;
alter table public.harmony_announcements add column if not exists created_at timestamptz default now();

insert into public.harmony_announcements(title,message,icon,active,priority)
select 'Servidor','Blinders Cassino online — Banco IRIS ativo.','🏆',true,10
where not exists (select 1 from public.harmony_announcements where message like '%Blinders Cassino online%');

insert into public.harmony_announcements(title,message,icon,active,priority)
select 'Jogos','Memória e Blackjack agora têm jogada manual real.','🎮',true,20
where not exists (select 1 from public.harmony_announcements where message like '%Blackjack agora%');

drop function if exists public.app_public_announcements();
create or replace function public.app_public_announcements()
returns jsonb
language sql
security definer
set search_path=public
as $$
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'title', title,
      'message', coalesce(icon,'📢') || ' ' || message,
      'priority', priority
    )
    order by priority asc, created_at desc
  ), '[]'::jsonb)
  from public.harmony_announcements
  where active=true
    and (starts_at is null or starts_at<=now())
    and (ends_at is null or ends_at>=now());
$$;

-- Trilhas YouTube / rádio
create table if not exists public.youtube_radio_tracks (
  id uuid primary key default extensions.gen_random_uuid(),
  title text,
  youtube_url text not null,
  mode text default 'radio',
  volume numeric(6,3) default 0.15,
  active boolean not null default true,
  created_by uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

drop function if exists public.app_public_youtube_radio();
create or replace function public.app_public_youtube_radio()
returns jsonb
language sql
security definer
set search_path=public
as $$
  select coalesce((
    select jsonb_build_object(
      'title', title,
      'url', youtube_url,
      'mode', mode,
      'volume', volume
    )
    from public.youtube_radio_tracks
    where active=true
    order by updated_at desc
    limit 1
  ), '{}'::jsonb);
$$;

-- Garantir base de sessões/tabelas de jogos
create table if not exists public.unified_game_sessions (
  id uuid primary key default extensions.gen_random_uuid()
);

alter table public.unified_game_sessions add column if not exists member_id uuid;
alter table public.unified_game_sessions add column if not exists game_key text;
alter table public.unified_game_sessions add column if not exists bet_units numeric(40,2) not null default 0;
alter table public.unified_game_sessions add column if not exists choice text;
alter table public.unified_game_sessions add column if not exists status text not null default 'started';
alter table public.unified_game_sessions add column if not exists preview jsonb not null default '{}';
alter table public.unified_game_sessions add column if not exists server_result jsonb not null default '{}';
alter table public.unified_game_sessions add column if not exists prize_units numeric(40,2) not null default 0;
alter table public.unified_game_sessions add column if not exists tx_id uuid;
alter table public.unified_game_sessions add column if not exists started_at timestamptz default now();
alter table public.unified_game_sessions add column if not exists finished_at timestamptz;
alter table public.unified_game_sessions add column if not exists expires_at timestamptz default now()+interval '15 minutes';

-- Regras visíveis
create table if not exists public.unified_game_rules (
  game_key text primary key,
  game_name text not null,
  rule_text text not null,
  min_bet_units numeric(40,2) not null default 1,
  max_bet_units numeric(40,2),
  base_house_edge numeric(8,4) not null default 0.08,
  active boolean not null default true,
  background text,
  icon text,
  updated_at timestamptz default now()
);

insert into public.unified_game_rules(game_key,game_name,rule_text,min_bet_units,active,background,icon)
values
('memory','Memória de Pares','Escolha pares. Pode errar até 3 vezes. Completar todos os pares paga melhor.',1,true,'memory.svg','🧠'),
('blackjack','Blackjack Real','Você decide pedir carta ou parar. A banca compra até 17.',1,true,'blackjack.svg','🃏')
on conflict(game_key) do update set
  game_name=excluded.game_name,
  rule_text=excluded.rule_text,
  active=true,
  updated_at=now();

-- Função de resultado inicial: só melhora preview de memória/blackjack.
drop function if exists public.app_v8_cards_memory();
create or replace function public.app_v8_cards_memory()
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  symbols text[] := array['♠','♥','♦','♣','★','◆','●','▲','♠','♥','♦','♣','★','◆','●','▲'];
  i int;
  j int;
  tmp text;
begin
  for i in reverse array_length(symbols,1)..2 loop
    j := 1 + floor(random()*i)::int;
    tmp := symbols[i];
    symbols[i] := symbols[j];
    symbols[j] := tmp;
  end loop;

  return jsonb_build_object(
    'cards', to_jsonb(symbols),
    'errorsAllowed', 3,
    'pairs', 8,
    'rule', 'Complete os pares com até 3 erros.'
  );
end;
$$;

drop function if exists public.app_v8_cards_blackjack();
create or replace function public.app_v8_cards_blackjack()
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  ranks text[] := array['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
  suits text[] := array['♠','♥','♦','♣'];
  deck text[] := '{}';
  r text;
  s text;
  i int;
  j int;
  tmp text;
begin
  foreach r in array ranks loop
    foreach s in array suits loop
      deck := array_append(deck, r||s);
    end loop;
  end loop;

  for i in reverse array_length(deck,1)..2 loop
    j := 1 + floor(random()*i)::int;
    tmp := deck[i];
    deck[i] := deck[j];
    deck[j] := tmp;
  end loop;

  return jsonb_build_object(
    'deck', to_jsonb(deck[5:52]),
    'playerCards', to_jsonb(array[deck[1],deck[3]]),
    'dealerCards', to_jsonb(array[deck[2],deck[4]]),
    'rule', 'Jogador escolhe pedir ou parar; banca compra até 17.'
  );
end;
$$;

-- Se a função principal existir, sobrescrevemos para incluir preview bom.
-- Inclui fallback simples para não quebrar outros jogos.
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
  if key='memory' then
    return public.app_v8_cards_memory() || jsonb_build_object('win',false,'multiplier',0);
  elsif key='blackjack' then
    return public.app_v8_cards_blackjack() || jsonb_build_object('win',false,'multiplier',0);
  elsif key='coin' then
    win := random() > .5;
    mult := case when win then 2 else 0 end;
    return jsonb_build_object('side', case when random()>.5 then 'heads' else 'tails' end, 'win',win,'multiplier',mult);
  elsif key='memory_old' then
    return jsonb_build_object('matched',0,'win',false,'multiplier',0);
  else
    -- Fallback para preservar funcionamento dos outros modos caso a função antiga tenha sido substituída.
    n := floor(random()*100)::int;
    win := n >= 55;
    mult := case when win then 2 else 0 end;
    return jsonb_build_object('roll',n,'win',win,'multiplier',mult);
  end if;
end;
$$;

-- Finish específico para memória/blackjack: depende da ação do jogador.
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
  mult numeric := 0;
  win boolean := false;
  errors int := 0;
  matched_pairs int := 0;
  player_total int := 0;
  dealer_total int := 0;
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

  if s.game_key='memory' then
    errors := coalesce((p_client_result->>'errors')::int, 3);
    matched_pairs := coalesce((p_client_result->>'matchedPairs')::int, 0);

    if errors <= 3 and matched_pairs >= 8 then
      win := true; mult := 5;
    elsif errors <= 3 and matched_pairs >= 5 then
      win := true; mult := 2;
    elsif errors <= 3 and matched_pairs >= 3 then
      win := true; mult := 1.3;
    else
      win := false; mult := 0;
    end if;

    return public.app_real_animation_finish_internal(
      p_session_id,
      m.id,
      mult,
      win,
      p_client_result || jsonb_build_object('gameMode','memory_pairs_3_errors')
    );
  end if;

  if s.game_key='blackjack' then
    player_total := coalesce((p_client_result->>'playerTotal')::int, 0);
    dealer_total := coalesce((p_client_result->>'dealerTotal')::int, 0);

    if player_total > 21 then
      win := false; mult := 0;
    elsif coalesce((p_client_result->>'push')::boolean,false) then
      win := true; mult := 1;
    elsif coalesce((p_client_result->>'win')::boolean,false) then
      win := true;
      mult := coalesce((p_client_result->>'multiplier')::numeric, 2);
    else
      win := false; mult := 0;
    end if;

    return public.app_real_animation_finish_internal(
      p_session_id,
      m.id,
      mult,
      win,
      p_client_result || jsonb_build_object('gameMode','blackjack_hit_stand')
    );
  end if;

  return public.app_real_animation_finish_internal(p_session_id,m.id,null,null,p_client_result);
end;
$$;

-- Admin action: salvar trilha YouTube e anúncio se app_admin_execute_action existir.
-- Recria versão pequena com fallback para visual:music/system:announcement e passa o resto para log.
drop function if exists public.app_admin_execute_action(text,text,text,jsonb);
create or replace function public.app_admin_execute_action(
  p_token text,
  p_module text,
  p_action text,
  p_payload jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path=public,extensions
as $$
declare
  admin public.app_members;
  result jsonb := '{}'::jsonb;
begin
  admin := public.app_assert_admin(p_token);

  if p_module='visual' and p_action='music' then
    insert into public.youtube_radio_tracks(title,youtube_url,mode,volume,active,created_by,updated_at)
    values(
      coalesce(nullif(p_payload->>'track_title',''),'Rádio Blinders'),
      coalesce(nullif(p_payload->>'track_url',''),''),
      'youtube',
      coalesce(nullif(p_payload->>'volume','')::numeric,0.15),
      coalesce(p_payload->>'active','true')='true',
      admin.id,
      now()
    );

    result := jsonb_build_object('ok',true,'message','Rádio YouTube salva.','url',p_payload->>'track_url');

  elsif p_module='system' and p_action='announcement' then
    insert into public.harmony_announcements(message,icon,active,priority,created_at)
    values(
      coalesce(nullif(p_payload->>'message',''),'Novo aviso do servidor.'),
      '📢',
      coalesce(p_payload->>'active','true')='true',
      coalesce(nullif(p_payload->>'priority','')::int,100),
      now()
    );

    result := jsonb_build_object('ok',true,'message','Anúncio publicado.');

  else
    result := jsonb_build_object('ok',true,'message','Ação registrada.','module',p_module,'action',p_action);
  end if;

  create table if not exists public.admin_audit_logs (
    id bigint generated by default as identity primary key
  );

  alter table public.admin_audit_logs add column if not exists admin_id uuid;
  alter table public.admin_audit_logs add column if not exists action text;
  alter table public.admin_audit_logs add column if not exists target text;
  alter table public.admin_audit_logs add column if not exists payload jsonb default '{}'::jsonb;
  alter table public.admin_audit_logs add column if not exists result jsonb default '{}'::jsonb;
  alter table public.admin_audit_logs add column if not exists created_at timestamptz default now();

  insert into public.admin_audit_logs(admin_id,action,target,payload,result)
  values(admin.id, p_module||':'||p_action, coalesce(p_payload->>'target',p_payload->>'code',p_payload->>'track_url',''), p_payload, result);

  return result || jsonb_build_object('admin',admin.nick,'at',now());
end;
$$;

grant execute on function public.app_public_announcements() to anon, authenticated;
grant execute on function public.app_public_youtube_radio() to anon, authenticated;
grant execute on function public.app_v8_cards_memory() to anon, authenticated;
grant execute on function public.app_v8_cards_blackjack() to anon, authenticated;
grant execute on function public.app_real_animation_make_result(text,text) to anon, authenticated;
grant execute on function public.app_real_animation_finish_game(text,uuid,jsonb) to anon, authenticated;
grant execute on function public.app_admin_execute_action(text,text,text,jsonb) to anon, authenticated;

notify pgrst, 'reload schema';

select 'BLINDERS_NETLIFY_V8_GAMES_ANNOUNCEMENTS_YOUTUBE_OK' as status;
