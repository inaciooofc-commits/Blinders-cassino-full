const fs = require('fs');
const path = require('path');

const dist = path.join(process.cwd(), 'dist');
const index = path.join(dist, 'index.html');
const fallback = path.join(dist, '404.html');

if (!fs.existsSync(index)) {
  console.error('dist/index.html não encontrado.');
  process.exit(1);
}

fs.copyFileSync(index, fallback);

for (const name of ['_redirects', '_headers']) {
  const file = path.join(dist, name);
  if (fs.existsSync(file)) fs.rmSync(file, { force: true });
}

console.log('Cloudflare SPA fallback OK: dist/404.html');
