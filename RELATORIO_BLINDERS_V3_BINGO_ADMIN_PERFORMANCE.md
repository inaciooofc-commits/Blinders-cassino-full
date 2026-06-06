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
