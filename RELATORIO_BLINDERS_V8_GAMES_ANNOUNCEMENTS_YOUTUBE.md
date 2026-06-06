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
