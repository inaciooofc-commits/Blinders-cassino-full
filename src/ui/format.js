export function esc(v){ return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])); }
export function parseMoney(value){ const raw=String(value||'').trim().toLowerCase().replace(',','.').replace(/\s/g,''); const n=Number(raw.replace(/[^0-9.]/g,'')); if(!Number.isFinite(n)) return 0; if(raw.endsWith('t')) return n*1000; if(raw.endsWith('b')) return n; return n; }
export function oldMoney(value){ const b=Number(value||0); if(!Number.isFinite(b)) return '0b'; if(Math.abs(b)>=1000) return `${trim(b/1000)}T`; return `${trim(b)}b`; }
function trim(n){ return Number(n).toLocaleString('pt-BR',{maximumFractionDigits:2}); }
