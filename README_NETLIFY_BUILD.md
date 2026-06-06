# Blinders Cassino — Netlify Engine Build

Versão com Node modules e build profissional.

## Stack

- Vite
- PixiJS
- GSAP
- Chart.js
- Howler.js
- Supabase SDK
- Netlify Functions

## Como publicar no Netlify

Use **Netlify conectado ao Git**, não Netlify Drop estático.

Configuração:

```text
Build command: npm run build
Publish directory: dist
Functions directory: netlify/functions
Node version: 20
```

## Variáveis de ambiente

Configure no Netlify:

```env
VITE_SUPABASE_URL=https://lbmmqfgcyimijaqnvvpx.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_public
SUPABASE_URL=https://lbmmqfgcyimijaqnvvpx.supabase.co
SUPABASE_ANON_KEY=sua_anon_public
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_rotacionada
BLINDERS_ADMIN_SECRET=um_segredo_forte
```

## Supabase

Rode:

```text
database/BLINDERS_NETLIFY_ENGINE_BUILD_SUPABASE.sql
```

Resultado esperado:

```text
BLINDERS_NETLIFY_ENGINE_BUILD_OK
```

## Rotas

```text
/login
/register
/menu
/games
/game?game=crash
/game?game=roulette
/game?game=slots
/game?game=blackjack
/game?game=dice
/game?game=bingo
/game?game=coin
/game?game=scratch
/game?game=memory
/graphics
/admin
```

## Login dono

```text
GE9502
950200
```

## Segurança

A service_role fica somente nas Netlify Functions. Nunca coloque service_role no frontend.


## Atualização Visual Icons V2
- tema preto/cinza/branco;
- Google Fonts: Inter, Oswald e Bebas Neue via CSS import;
- pack de ícones próprios em `/public/assets/icons/actions/`;
- backgrounds monocromáticos;
- Admin Center corrigido com rotas separadas;
- botões da aba de jogos corrigidos;
- conflito `.game-card` x carta de blackjack corrigido com `.playing-card`;
- nova página `AdminActionPage`;
- prompt de próximas melhorias em `PROMPT_BLINDERS_VISUAL_ICONS_FUTURE.md`.


# Relatório — Blinders Cassino Netlify Evolution Full

## Entrega

Esta atualização executa a evolução do projeto Netlify Build com foco em:

- Admin Center definitivo;
- módulos futuros separados;
- rotas reais para cada função admin;
- bônus e eventos;
- clãs e comissárias;
- loja e inventário;
- comunidade/chat;
- relatórios;
- segurança;
- PWA;
- Netlify Functions sensíveis;
- SQL de suporte.

## Novas rotas públicas

- `/bonus`
- `/clans`
- `/shop`
- `/community`
- `/reports`
- `/security`

## Novas rotas admin

- `/admin/accounts`
- `/admin/approve-accounts`
- `/admin/create-account`
- `/admin/delete-account`
- `/admin/permissions`
- `/admin/iris-control`
- `/admin/deposits`
- `/admin/transfers`
- `/admin/withdraws`
- `/admin/vault`
- `/admin/sangria`
- `/admin/game-rules`
- `/admin/game-history`
- `/admin/game-limits`
- `/admin/bonus-codes`
- `/admin/events`
- `/admin/clans`
- `/admin/chat-control`
- `/admin/shop`
- `/admin/inventory`
- `/admin/media`
- `/admin/music`
- `/admin/announcements`
- `/admin/health`
- `/admin/logs`
- `/admin/settings`
- `/admin/maintenance`
- `/admin/backup`

## Novas funções Netlify

- `secure-action`
- `confirm-deposit`
- `confirm-withdraw`
- `audit-log`

## Novas tabelas Supabase

- `admin_audit_logs`
- `security_events`
- `system_settings`
- `bonus_codes`
- `bonus_redemptions`
- `events_calendar`
- `shop_items`
- `member_inventory`
- `clans`
- `clan_members`
- `clan_transactions`
- `chat_messages`
- `friendships`
- `reports`
- `daily_reports`
- `version_backups`

## Resultado SQL esperado

`BLINDERS_NETLIFY_EVOLUTION_FULL_OK`

## Observação honesta

Nem todas as telas são integrações finais de produção; muitas foram entregues como telas funcionais/separadas e prontas para receber RPC específica. As bases, rotas, tabelas e funções principais foram criadas para permitir evolução real sem deixar tudo preso no painel de gráficos.


# Blinders Cassino — V3 Bingo/Admin/Performance

## Corrigido

- Corrigido erro SQL: `column "id" does not exist`.
- A correção agora cria/adiciona a coluna `id` antes de usar `id::text`.
- A loja não depende mais de `on conflict` frágil; os itens padrão entram com `where not exists`.

## Bingo

- Bingo agora usa cartela de 100 números.
- O jogador escolhe até 10 números antes do sorteio.
- Precisa escolher pelo menos 3 números.
- O sorteio revela 25 números.
- Prêmios começam com 3 acertos:
  - 3 acertos: 1.5x
  - 4 acertos: 2x
  - 5 acertos: 3x
  - 6 acertos: 5x
  - 7 acertos: 8x
  - 8+ acertos: 12x

## Admin

- A tela "Ação principal" agora executa chamadas reais para Netlify Functions:
  - `secure-action`
  - `confirm-deposit`
  - `confirm-withdraw`
- O resultado aparece na própria tela.
- O botão copiar resumo continua disponível.

## Performance

- Adicionado `Performance.js`.
- O sistema limpa timers ao trocar de rota.
- Gráficos não rodam tudo de uma vez.
- Atualizações pausam quando a aba fica oculta.
- Modo leve automático para Android/dispositivo fraco.
- Redução de blur, sombras e animações em modo leve.

## Resultado SQL esperado

- Patch: `BLINDERS_V3_FIX_ID_BINGO_ADMIN_PERFORMANCE_OK`
- SQL completo: `BLINDERS_NETLIFY_EVOLUTION_FULL_V3_CORRIGIDO_OK`


# Blinders Cassino — V5 Admin Supabase Fix

## Problema corrigido

Erro informado: **Supabase não configurado no Netlify**.

A causa era que as Netlify Functions dependiam de variáveis do Netlify. Agora elas possuem fallback público seguro para:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

A `service_role` continua **fora do frontend** e **não é necessária** para as ações corrigidas.

## Segurança

As ações admin continuam protegidas porque:

- usam token de sessão;
- a RPC `v25_current` valida sessão;
- a RPC `app_assert_admin` exige cargo `admin` ou `owner`;
- tudo é registrado em `admin_audit_logs`;
- `service_role` não é exposta ao navegador.

## Corrigido no projeto

- `_supabase.cjs` não trava mais com “Supabase não configurado”.
- `secure-action` usa anon + RPC segura.
- `confirm-deposit` usa anon + RPC segura.
- `confirm-withdraw` usa anon + RPC segura.
- Admin Center tem fallback direto por RPC se a Function falhar.
- Mensagens de erro aparecem na tela.
- Ação principal volta a executar.

## Ordem

1. Rode o SQL V5 no Supabase.
2. Suba o ZIP V5 no Netlify Build.
3. Teste:
   - `/admin/deposits`
   - `/admin/withdraws`
   - `/admin/settings`
   - `/.netlify/functions/health`

## Resultado SQL esperado

`BLINDERS_NETLIFY_EVOLUTION_FULL_V5_ADMIN_SUPABASE_FIX_OK`


# Blinders Cassino — V6 Admin Forms + Carousel

## Corrigido

- O Admin não fica mais preso na tela genérica "Ação principal".
- Cada rota admin agora mostra campos próprios para a função.
- Criar conta mostra nick, conta Zarcovi, senha, cargo, status e saldo.
- Confirmar contas mostra campo de conta/código e status.
- Depósitos mostram código/conta, valor e observação.
- Saques mostram código e observação.
- Loja, bônus, anúncios, regras dos jogos e manutenção têm formulários próprios.
- As ações chamam a Netlify Function `admin-execute`.
- Se a Function falhar, usa RPC direta segura `app_admin_execute_action`.
- O SQL cria `app_admin_execute_action` com validação de admin/dono.

## Anúncio do topo

- O ticker do servidor agora roda por `requestAnimationFrame`.
- A animação não depende só de CSS.
- O texto é duplicado várias vezes e anda continuamente.

## Tela principal

- Adicionada vitrine estilo Steam.
- Cards com imagens passam da direita para a esquerda em loop.
- Destaques: Crash, Bingo 100, Roleta, Blackjack, Admin Center e Banco IRIS.

## Segurança

- Service Role continua fora do navegador.
- Ação admin exige token válido.
- Ação admin exige cargo `admin` ou `owner`.
- Tudo registra em `admin_audit_logs`.

## Resultado SQL esperado

`BLINDERS_NETLIFY_V6_ADMIN_FORMS_CAROUSEL_OK`


# Blinders Cassino — V8 Games + Announcements + YouTube

## Memória

- Jogo da memória agora é manual.
- Jogador escolhe dois cards por vez.
- Pode errar até 3 vezes.
- Completar todos os pares paga melhor.
- Com 3+ pares ainda pode pagar prêmio menor.
- Resultado é finalizado com `matchedPairs` e `errors`.

## Blackjack

- Blackjack agora é manual.
- O jogador recebe 2 cartas.
- Mesmo com 17, escolhe se para ou pede mais uma.
- Botões:
  - Pedir carta
  - Parar
- A banca compra até 17 depois que o jogador para.
- Resultado é calculado por total do jogador e total da banca.

## Anúncios

- Criada RPC `app_public_announcements`.
- O ticker busca anúncios ativos no Supabase.
- O ticker atualiza o DOM e roda com requestAnimationFrame.

## YouTube

- Criado player de rádio/trilha YouTube no canto inferior.
- Aceita link de vídeo ou playlist.
- Usa embed oficial do YouTube.
- Não baixa áudio.
- O som começa após clique do usuário, respeitando regra do navegador.
- Admin `/admin/music` salva e atualiza a rádio no dispositivo.

## Resultado SQL esperado

`BLINDERS_NETLIFY_V8_GAMES_ANNOUNCEMENTS_YOUTUBE_OK`


# Blinders Cassino — V9 Phone + Blackjack + Bingo

## Telefone

- Adicionado campo de telefone no Admin → Criar conta.
- Formato obrigatório: `xx xxxxx-xxxx`.
- Máscara automática no frontend.
- SQL adiciona:
  - `phone`
  - `phone_digits`
  - `phone_verified`
  - `phone_registered_at`
- Criada função `app_member_register_phone`.
- Criada função `app_normalize_phone`.

## Blackjack

- Blackjack corrigido.
- Se o jogador atingir 21, ganha na hora.
- Se parar antes de 21, a banca joga e ganha quem chegar mais perto de 21 sem estourar.
- Empate devolve aposta com multiplicador 1x.
- Blackjack natural paga 2.5x.
- 21 com mais de 2 cartas paga 2x.

## Bingo

- Bingo sorteia um número por vez.
- Sorteio é aleatório.
- Não repete números.
- SQL gera 25 números únicos.
- Frontend tem defesa extra para remover repetidos caso o servidor mande algo antigo.
- A bola sorteada aparece no centro com animação.

## Resultado SQL esperado

`BLINDERS_NETLIFY_V9_PHONE_BLACKJACK_BINGO_OK`


# Blinders Cassino — V10 PNG Layout + Blackjack Fix

## Erro do PDF corrigido

No PDF, o Blackjack mostrou:
- Você: 21
- Resultado: Perdeu

Isso estava errado. A V10 corrige no frontend e no Supabase:
- Se o jogador atinge 21, vence automaticamente.
- Blackjack natural com 2 cartas paga 2.5x.
- 21 com mais cartas paga 2x.
- Se parar antes de 21, vence quem ficar mais perto de 21 sem estourar.
- Empate devolve aposta.

## PNG em todo o site

Foram colocadas PNGs reais em:

- fundos do lobby;
- fundo do admin;
- fundo dos jogos;
- vitrine estilo Steam;
- cards de jogos;
- botões/cards do menu;
- ícones principais;
- mesas/cenas de jogo;
- cartas e molduras visuais.

## Arquivos criados

- `public/assets/png/backgrounds`
- `public/assets/png/games`
- `public/assets/png/icons`
- `public/assets/png/showcase`
- `public/assets/png/png-manifest.json`
- `src/core/PngAssets.js`
- `src/styles/png-skin.css`

## Visual

A V10 também força tema escuro para corrigir a tela branca/lavada vista no PDF, mantendo o estilo preto, dourado, premium e cassino.

## Resultado SQL esperado

`BLINDERS_NETLIFY_V10_PNG_LAYOUT_BLACKJACK_FIX_OK`


# Blinders Cassino — V11 Pixi Engine Games

## Erro corrigido

- Corrigido `PIXI is not defined`.
- O PixiJS agora é importado de forma explícita em `BaseGame.js`.
- `globalThis.PIXI = PIXI` é definido por compatibilidade.
- O jogo Crash não depende mais de uma variável global solta.
- O botão de jogar aguarda `this.ready` antes de iniciar a animação.

## Motor Pixi centralizado

`BaseGame.js` agora possui helpers:

- `drawPixiTable`
- `pixiPanel`
- `pixiText`
- `pixiCard`
- `pixiDie`
- `pixiBingoBall`
- `particleBurst`
- `clearPixi`
- `addTicker`
- `removeTicker`

## Jogos com Pixi

- Crash: gráfico, foguete, rastro e partículas.
- Roleta: roda Pixi, bolinha e número vencedor.
- Slots: rolos Pixi com parada em sequência.
- Blackjack: cartas Pixi, pedir/parar, 21 automático.
- Dados: dados Pixi com pips reais.
- Bingo: bola Pixi sorteada uma por uma.
- Cara ou Coroa: moeda Pixi girando.
- Raspadinha: efeitos Pixi e partículas.
- Memória: mesa Pixi e efeitos ao acertar/errar pares.

## Resultado SQL esperado

`BLINDERS_NETLIFY_V11_PIXI_ENGINE_GAMES_OK`


# Blinders Cassino — V12 Bingo Fix + Performance

## Erro do Bingo corrigido

Erro informado:

`query returned more than one row`

Causa encontrada:
versões antigas geravam a cartela usando `to_jsonb(generate_series(1,100))`.
`generate_series` retorna várias linhas, e isso quebra dentro de `jsonb_build_object`.

Correção:
a V12 usa:

`select jsonb_agg(gs order by gs) from generate_series(1,100) as gs`

Assim a cartela vira um único array JSON.

## Bingo

- Sorteia 25 números únicos.
- Um número por vez.
- Ordem do array é a ordem real do sorteio.
- Sem repetição.
- Continua usando PixiJS para a bola sorteada.
- Frontend mostra aviso claro se o SQL V12 não foi rodado.

## Otimização aplicada

- PixiJS reduz resolução em celular/aparelho fraco.
- Antialias desliga em modo ultra leve.
- Partículas reduzem em dispositivos fracos.
- Tickers Pixi pausam quando a aba fica oculta.
- Vitrine Steam fica mais lenta em dispositivos fracos.
- CSS remove blur pesado em aparelhos fracos.
- Background fixo desativa em modo leve.
- Preload de PNGs críticos roda no idle.
- Mantém visual preto/dourado, PNG e Pixi.

## Resultado SQL esperado

`BLINDERS_NETLIFY_V12_BINGO_FIX_PERFORMANCE_OK`


# Blinders Cassino — V13 Módulo de Comando

## Implementado

- Módulo de Comando admin em `/admin/command`.
- Diagnóstico do Supabase.
- Auto-repair seguro do banco.
- Malena oculta: eventos internos, sugestões e saúde do sistema.
- Perfil do membro em `/profile`.
- Rankings em `/rankings`.
- Missões em `/missions`.
- Eventos em `/events`.
- Loja visual atualizada em `/shop`.
- Bônus com RPC real `app_bonus_redeem`.
- Admin Center reorganizado com área de comando no topo.
- Menu principal atualizado com Perfil, Missões, Eventos e Rankings.

## Segurança

- O auto-repair exige sessão admin/dono.
- Diagnóstico admin exige sessão admin/dono.
- Malena continua oculta para membros comuns.
- Ações continuam registradas em `admin_audit_logs`.
- Nenhuma service_role foi exposta no frontend.

## SQL principal

Resultado esperado:

`BLINDERS_NETLIFY_V13_MODULO_COMANDO_OK`

## Rotas novas

- `/admin/command`
- `/profile`
- `/rankings`
- `/missions`
- `/events`
