export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[c]));
}

export function money(value) {
  const n = Number(value || 0);
  return 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function number(value) {
  return Number(value || 0).toLocaleString('pt-BR');
}

export function parseAmount(value) {
  const raw = String(value || '').trim().toUpperCase().replace(/\s/g, '').replace(',', '.');
  if (!raw) return 0;
  const num = Number(raw.replace(/[^0-9.]/g, ''));
  if (!Number.isFinite(num)) return 0;
  if (raw.endsWith('T')) return num * 1000000000000;
  if (raw.endsWith('B')) return num * 1000000000;
  return num;
}

export function now() {
  return new Date().toLocaleString('pt-BR');
}
