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
