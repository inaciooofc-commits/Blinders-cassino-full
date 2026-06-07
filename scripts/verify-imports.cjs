const fs = require('fs');
const path = require('path');

const root = process.cwd();
const src = path.join(root, 'src');
const exts = ['', '.js', '.jsx', '.ts', '.tsx', '.css', '.json'];
const importRegex = /(?:import\s+(?:[^'"]+\s+from\s+)?|import\s*\(|export\s+[^'"]+\s+from\s+)['"](\.[^'"]+)['"]/g;

let missing = [];
let checked = 0;

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  let files = [];
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) files = files.concat(walk(full));
    else if (/\.(js|jsx|ts|tsx|css)$/.test(full)) files.push(full);
  }
  return files;
}

function existsImport(baseFile, spec) {
  const base = path.resolve(path.dirname(baseFile), spec);
  for (const ext of exts) {
    if (fs.existsSync(base + ext) && fs.statSync(base + ext).isFile()) return true;
  }
  if (fs.existsSync(base) && fs.statSync(base).isDirectory()) {
    for (const ext of exts) {
      const idx = path.join(base, 'index' + ext);
      if (fs.existsSync(idx) && fs.statSync(idx).isFile()) return true;
    }
  }
  return false;
}

for (const file of walk(src)) {
  const text = fs.readFileSync(file, 'utf8');
  let match;
  while ((match = importRegex.exec(text))) {
    checked++;
    const spec = match[1];
    if (!existsImport(file, spec)) {
      missing.push({ from: path.relative(root, file).replaceAll('\\\\','/'), import: spec });
    }
  }
}

if (missing.length) {
  console.error('\\nBLINDERS VERIFY: imports faltando.\\n');
  for (const m of missing) console.error(`- ${m.from} importa ${m.import}`);
  process.exit(1);
}

console.log(`BLINDERS VERIFY OK: ${checked} imports verificados.`);
