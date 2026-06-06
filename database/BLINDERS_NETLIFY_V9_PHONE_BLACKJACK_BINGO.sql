-- ============================================================
-- BLINDERS V9 — TELEFONE + BLACKJACK + BINGO
--
-- Implementa:
-- - telefone no formato xx xxxxx-xxxx;
-- - função para registrar/atualizar telefone;
-- - criação de conta admin com telefone;
-- - Blackjack: 21 ganha na hora; ao parar, vence quem fica mais perto de 21;
-- - Bingo: sorteio aleatório, um número por vez, sem repetição.
--
-- Resultado esperado:
-- BLINDERS_NETLIFY_V9_PHONE_BLACKJACK_BINGO_OK
-- ============================================================

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

-- -----------------------------
-- Base membros e telefone
-- -----------------------------
create table if not exists public.app_members (
  id uuid primary key default extensions.gen_random_uuid()
);

alter table public.app_members add column if not exists nick text;
alter table public.app_members add column if not exists phone text;
alter table public.app_members add column if not exists phone_digits text;
alter table public.app_members add column if not exists phone_verified boolean not null default false;
alter table public.app_members add column if not exists phone_registered_at timestamptz;
alter table public.app_members add column if not exists updated_at timestamptz default now();

create index if not exists ix_app_members_phone_digits
on public.app_members(phone_digits);

drop function if exists public.app_normalize_phone(text);
create or replace function public.app_normalize_phone(p_phone text)
returns text
language plpgsql
immutable
as $$
declare d text;
begin
  d := regexp_replace(coalesce(p_phone,''), '\D', '', 'g');

  if length(d) <> 11 then
    raise exception 'Telefone inválido. Use o formato xx xxxxx-xxxx.';
  end if;

  return substr(d,1,2) || ' ' || substr(d,3,5) || '-' || substr(d,8,4);
end;
$$;

drop function if exists public.app_phone_digits(text);
create or replace function public.app_phone_digits(p_phone text)
returns text
language sql
immutable
as $$
  select regexp_replace(coalesce(p_phone,''), '\D', '', 'g')
$$;

-- depende de v25_current existir nas versões anteriores
drop function if exists public.app_member_register_phone(text,text);
create or replace function public.app_member_register_phone(
  p_token text,
  p_phone text
)
returns jsonb
language plpgsql
security definer
set search_path=public,extensions
as $$
declare
  m public.app_members;
  formatted text;
  digits text;
begin
  m := public.v25_current(p_token);
  formatted := public.app_normalize_phone(p_phone);
  digits := public.app_phone_digits(formatted);

  update public.app_members
  set phone=formatted,
      phone_digits=digits,
      phone_verified=false,
      phone_registered_at=now(),
      updated_at=now()
  where id=m.id;

  return jsonb_build_object(
    'ok',true,
    'message','Telefone registrado.',
    'phone',formatted
  );
end;
$$;

-- -----------------------------
-- Admin execute com telefone e compatibilidade
-- -----------------------------
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
  target text := coalesce(p_payload->>'target', p_payload->>'nick', p_payload->>'code', p_payload->>'item_key', '');
  clean_nick text;
  login_nick text;
  role_value text;
  status_value text;
  phone_formatted text;
  phone_digits_value text;
  amount numeric := 0;
  new_id uuid;
begin
  admin := public.app_assert_admin(p_token);

  if p_module='accounts' and p_action='create' then
    clean_nick := trim(coalesce(p_payload->>'nick',''));
    if clean_nick='' then raise exception 'Informe o nick da conta.'; end if;

    if lower(clean_nick) like 'admin@%' then
      clean_nick := substr(clean_nick, 7);
      role_value := 'admin';
    else
      role_value := coalesce(nullif(p_payload->>'role',''),'user');
    end if;

    login_nick := clean_nick;
    status_value := coalesce(nullif(p_payload->>'status',''),'active');
    amount := public.v25_parse(coalesce(p_payload->>'balance','0'));

    if coalesce(p_payload->>'phone','') <> '' then
      phone_formatted := public.app_normalize_phone(p_payload->>'phone');
      phone_digits_value := public.app_phone_digits(phone_formatted);
    end if;

    if exists(select 1 from public.app_members where lower(nick)=lower(login_nick)) then
      raise exception 'Já existe uma conta com esse nick.';
    end if;

    insert into public.app_members(
      nick,
      zarcovi_account,
      password_hash,
      role,
      status,
      iris_member_id,
      balance_virtual_units,
      friend_code,
      phone,
      phone_digits,
      phone_verified,
      phone_registered_at,
      created_at,
      updated_at
    )
    values(
      login_nick,
      nullif(p_payload->>'zarcovi_account',''),
      extensions.crypt(coalesce(nullif(p_payload->>'password',''),'1234'), extensions.gen_salt('bf')),
      role_value,
      status_value,
      coalesce(nullif(p_payload->>'zarcovi_account',''), 'IRIS-'||upper(substr(encode(extensions.gen_random_bytes(5),'hex'),1,10))),
      amount,
      'FR-'||upper(substr(encode(extensions.gen_random_bytes(5),'hex'),1,10)),
      phone_formatted,
      phone_digits_value,
      false,
      case when phone_formatted is not null then now() else null end,
      now(),
      now()
    )
    returning id into new_id;

    result := jsonb_build_object(
      'ok',true,
      'message','Conta criada.',
      'memberId',new_id,
      'nick',login_nick,
      'role',role_value,
      'status',status_value,
      'phone',phone_formatted,
      'balanceLabel',public.v25_format(amount)
    );

  elsif p_module='accounts' and p_action='phone' then
    if target='' then raise exception 'Informe nick ou ID da conta.'; end if;
    phone_formatted := public.app_normalize_phone(coalesce(p_payload->>'phone',''));
    phone_digits_value := public.app_phone_digits(phone_formatted);

    update public.app_members
    set phone=phone_formatted,
        phone_digits=phone_digits_value,
        phone_verified=false,
        phone_registered_at=now(),
        updated_at=now()
    where lower(nick)=lower(target) or id::text=target;

    result := jsonb_build_object('ok',true,'message','Telefone atualizado.','target',target,'phone',phone_formatted);

  else
    -- fallback seguro para ações existentes
    create table if not exists public.admin_audit_logs (
      id bigint generated by default as identity primary key
    );
    alter table public.admin_audit_logs add column if not exists admin_id uuid;
    alter table public.admin_audit_logs add column if not exists action text;
    alter table public.admin_audit_logs add column if not exists target text;
    alter table public.admin_audit_logs add column if not exists payload jsonb default '{}'::jsonb;
    alter table public.admin_audit_logs add column if not exists result jsonb default '{}'::jsonb;
    alter table public.admin_audit_logs add column if not exists created_at timestamptz default now();

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
  values(admin.id, p_module||':'||p_action, target, coalesce(p_payload,'{}'::jsonb), result);

  return result || jsonb_build_object('admin',admin.nick,'at',now());
end;
$$;

-- -----------------------------
-- Bingo e Blackjack server preview
-- -----------------------------
drop function if exists public.app_v9_bingo_result(text);
create or replace function public.app_v9_bingo_result(p_choice text)
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
begin
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

  -- Sorteia 25 números, 1 por vez, todos únicos. A ordem do array é a ordem do sorteio.
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
    'card', to_jsonb(generate_series(1,100)),
    'selected', to_jsonb(selected),
    'drawn', to_jsonb(drawn),
    'hitNumbers', to_jsonb(hit_nums),
    'matched', hits,
    'win', win,
    'multiplier', mult,
    'oneByOne', true,
    'noRepeat', true,
    'rule','Sorteio: 1 número por vez, aleatório, sem repetição. 3 acertos = 1.5x; 4 = 2x; 5 = 3x; 6 = 5x; 7 = 8x; 8+ = 12x.'
  );
end;
$$;

drop function if exists public.app_v9_blackjack_preview();
create or replace function public.app_v9_blackjack_preview()
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
    'rule','21 ganha na hora. Ao parar antes de 21, ganha quem ficar mais perto de 21 sem estourar.'
  );
end;
$$;

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
    return public.app_v9_bingo_result(p_choice);
  elsif key='blackjack' then
    return public.app_v9_blackjack_preview() || jsonb_build_object('win',false,'multiplier',0);
  elsif key='memory' then
    return public.app_v8_cards_memory() || jsonb_build_object('win',false,'multiplier',0);
  else
    n := floor(random()*100)::int;
    win := n >= 55;
    mult := case when win then 2 else 0 end;
    return jsonb_build_object('roll',n,'win',win,'multiplier',mult);
  end if;
end;
$$;

-- Finish blackjack depende do client_result calculado pelo jogo real.
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

  if s.game_key='blackjack' then
    player_total := coalesce((p_client_result->>'playerTotal')::int, 0);
    dealer_total := coalesce((p_client_result->>'dealerTotal')::int, 0);

    if player_total = 21 then
      win := true;
      mult := coalesce((p_client_result->>'multiplier')::numeric, 2);
    elsif player_total > 21 then
      win := false; mult := 0;
    elsif dealer_total > 21 then
      win := true; mult := 2;
    elsif coalesce((p_client_result->>'push')::boolean,false) then
      win := true; mult := 1;
    elsif coalesce((p_client_result->>'win')::boolean,false) then
      win := true; mult := coalesce((p_client_result->>'multiplier')::numeric, 2);
    else
      win := false; mult := 0;
    end if;

    return public.app_real_animation_finish_internal(
      p_session_id,
      m.id,
      mult,
      win,
      p_client_result || jsonb_build_object('gameMode','blackjack_21_or_closest')
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

grant execute on function public.app_normalize_phone(text) to anon, authenticated;
grant execute on function public.app_phone_digits(text) to anon, authenticated;
grant execute on function public.app_member_register_phone(text,text) to anon, authenticated;
grant execute on function public.app_admin_execute_action(text,text,text,jsonb) to anon, authenticated;
grant execute on function public.app_v9_bingo_result(text) to anon, authenticated;
grant execute on function public.app_v9_blackjack_preview() to anon, authenticated;
grant execute on function public.app_real_animation_make_result(text,text) to anon, authenticated;
grant execute on function public.app_real_animation_finish_game(text,uuid,jsonb) to anon, authenticated;

notify pgrst, 'reload schema';

select 'BLINDERS_NETLIFY_V9_PHONE_BLACKJACK_BINGO_OK' as status;
