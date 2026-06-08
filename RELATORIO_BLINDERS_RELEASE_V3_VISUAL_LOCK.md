# BLINDERS RELEASE V3 — VISUAL LOCK

Atualização executada com foco em lançamento.

## O que mudou
- Home em Visual Lock usando a imagem exata de referência como base.
- Vitrine/carrossel de jogos funcional sobre a vitrine do layout.
- Cards dos jogos em PNG real extraídos do grid premium.
- Fundo anime/cassino azul aplicado nas telas internas.
- Admin antigo restaurado com menu completo por categorias.
- Gráficos com Chart.js para dashboard, atividade, financeiro e jogos.
- Mantidas as funções SQL existentes da versão V2.
- Mantido dinheiro antigo: 1 = 1b, 1000 = 1T.
- Mantido SQL only mode para ações reais.
- Mantida manutenção individual por jogo.
- Mantida rádio global com YouTube e popup.
- Nomes internos de ferramentas/engines não aparecem para membros comuns.

## Arquivos principais alterados
- src/core/Router.js
- src/styles/v3-visual-lock.css
- src/main.js
- public/assets/v15/*

## Deploy
Build command: npm run build
Output directory: dist

## SQL
Use o SQL V2 já corrigido:
database/BLINDERS_RELEASE_LAUNCH_SQL_V2_FUNCTION_DROP.sql
