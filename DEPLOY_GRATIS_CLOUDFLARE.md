# Deploy grátis — passo a passo

1. Suba esta pasta no GitHub.
2. Entre no Cloudflare Dashboard.
3. Vá em Workers & Pages.
4. Clique em Create application.
5. Escolha Pages.
6. Conecte o repositório do GitHub.
7. Configure:
   - Framework: Vite
   - Build command: npm run build
   - Output directory: dist
8. Em Environment variables, coloque:
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY
9. Clique em Deploy.
10. Teste:
   - /menu
   - /games
   - /admin/command
   - /profile
   - /missions
   - /rankings

Observação:
Não coloque SUPABASE_SERVICE_ROLE_KEY no Cloudflare Pages frontend.
