-- ============================================================
-- BLINDERS V11 — PIXI ENGINE GAMES
--
-- Corrige:
-- - PIXI is not defined no frontend;
-- - todos os jogos passam a usar PixiJS no canvas;
-- - regras visíveis atualizadas para refletir animação Pixi.
--
-- Resultado esperado:
-- BLINDERS_NETLIFY_V11_PIXI_ENGINE_GAMES_OK
-- ============================================================

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

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
('crash','Crash Pixi','PixiJS anima o gráfico subindo em tempo real. Retire antes do crash para ganhar.',1,true,'crash','📈'),
('roulette','Roleta Pixi','PixiJS anima a roda e a bolinha. Cores/par/ímpar pagam 2x; número cheio paga 36x.',1,true,'roulette','🎡'),
('slots','Slots Pixi','PixiJS anima os rolos em sequência. Dois símbolos iguais pagam; três iguais pagam mais.',1,true,'slots','🎰'),
('blackjack','Blackjack Pixi','PixiJS anima as cartas. 21 ganha automaticamente; ao parar, vence quem fica mais perto de 21.',1,true,'blackjack','🃏'),
('dice','Dados Pixi','PixiJS anima os dados rolando e parando no resultado sorteado.',1,true,'dice','🎲'),
('bingo','Bingo Pixi 100','PixiJS anima uma bola por vez. Sorteio aleatório, sem repetição, cartela de 1 a 100.',1,true,'bingo','🔢'),
('coin','Cara ou Coroa Pixi','PixiJS anima a moeda girando no eixo até revelar cara ou coroa.',1,true,'coin','🪙'),
('scratch','Raspadinha Pixi','PixiJS cria efeitos de brilho e partículas enquanto o usuário raspa o bilhete.',1,true,'scratch','🎫'),
('memory','Memória Pixi','PixiJS cria a mesa e efeitos; jogador escolhe pares com até 3 erros permitidos.',1,true,'memory','🧠')
on conflict(game_key) do update set
  game_name=excluded.game_name,
  rule_text=excluded.rule_text,
  active=true,
  background=excluded.background,
  icon=excluded.icon,
  updated_at=now();

notify pgrst, 'reload schema';

select 'BLINDERS_NETLIFY_V11_PIXI_ENGINE_GAMES_OK' as status;
