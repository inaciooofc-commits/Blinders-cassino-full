# Subir no GitHub sem CMD

Este pacote foi reduzido para ficar abaixo de 25 MiB.

## Importante

O GitHub limita upload pelo navegador a 25 MiB por arquivo. 
Este ZIP está abaixo disso.

## Melhor forma para Cloudflare Pages

1. Baixe este ZIP.
2. Extraia o ZIP no celular ou PC.
3. No GitHub, crie um repositório novo.
4. Use Add file → Upload files.
5. Arraste os arquivos e pastas extraídos, não o ZIP fechado.
6. Commit changes.
7. No Cloudflare Pages, conecte esse repositório.
8. Configure:
   - Framework: Vite
   - Build command: npm run build
   - Output directory: dist

## Se quiser guardar só o ZIP no GitHub

Também dá para subir o ZIP como arquivo único, porque está abaixo de 25 MiB.
Mas Cloudflare Pages não vai montar o site a partir de um ZIP fechado dentro do repositório.
Para deploy automático, precisa subir os arquivos extraídos.

## Variáveis Cloudflare Pages

VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY

Nunca coloque SUPABASE_SERVICE_ROLE_KEY no frontend.
