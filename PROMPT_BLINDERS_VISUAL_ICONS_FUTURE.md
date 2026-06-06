# Prompt — Blinders Cassino: Visual Icons Future

Continue o projeto Blinders Cassino a partir da versão Netlify Engine Build com Vite, PixiJS, GSAP, Chart.js, Howler, Supabase SDK e Netlify Functions.

## Objetivo visual
Criar uma nova fase do site com identidade mais madura, limpa e premium, usando preto, cinza, branco, pequenos brilhos metálicos, fontes personalizadas, ícones próprios, animações suaves, telas centralizadas e menus menos poluídos.

## Fontes
Usar Google Fonts via CSS:
```css
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700;800;900&family=Oswald:wght@400;500;600;700&display=swap');
```
Uso: Bebas Neue para títulos grandes, Oswald para subtítulos/cards/menus e Inter para textos, inputs e informações de sistema. Não baixar nem redistribuir arquivos de fonte.

## Ícones
Criar pack próprio em SVG em `/public/assets/icons/actions/` com dashboard, accounts, approve, create, delete, vault, transfers, withdraw, deposit, rules, rounds, media, music, shop, announce, health, logs, lock, maintenance, graphics, crash, roulette, slots, blackjack, dice, bingo, coin, scratch, memory, home, login, profile, iris, back e play. Todos com fundo preto/cinza, borda branca suave, símbolo claro e tamanho consistente.

## Correções obrigatórias
1. Nenhum botão admin deve abrir `/graphics` por engano. Cada botão deve ter rota própria: `/admin/accounts`, `/admin/approve-accounts`, `/admin/create-account`, `/admin/delete-account`, `/admin/iris-control`, `/admin/deposits`, `/admin/transfers`, `/admin/withdraws`, `/admin/game-rules`, `/admin/game-history`, `/admin/media`, `/admin/music`, `/admin/shop`, `/admin/announcements`, `/admin/health`, `/admin/logs`, `/admin/settings`.
2. Corrigir os botões da aba jogos: cada card abre `/game?game=nome`, com ícone, texto proporcional e sem estourar no celular.
3. Corrigir conflito de CSS: carta do blackjack usa `.playing-card`; card do lobby usa `.game-card`.
4. Melhorar animações: cards com hover leve, entrada suave no canvas, botões com elevação, hero com aura lenta, menus com transição suave e loader sem travar.

## Ideias futuras
- editor de temas no admin;
- editor de home;
- permissões por cargo;
- logs inteligentes;
- teste automático do sistema;
- Crash com rastro e histórico;
- roleta com mesa de apostas visual;
- blackjack com deck real;
- slots com linhas de pagamento;
- central de notificações;
- PWA com splash, cache seguro e limpar cache.

## Resultado esperado
Visual novo, fontes personalizadas, ícones próprios, Admin Center corrigido, jogos com botões corrigidos, tema preto/cinza/branco, animações suaves, rotas administrativas separadas, menu mais limpo e base pronta para melhorias futuras.
