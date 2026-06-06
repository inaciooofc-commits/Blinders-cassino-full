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
