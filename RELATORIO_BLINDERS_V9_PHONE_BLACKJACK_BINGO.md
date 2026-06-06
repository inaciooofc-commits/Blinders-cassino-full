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
