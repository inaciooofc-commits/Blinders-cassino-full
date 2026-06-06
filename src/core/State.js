export const State = {
  token: localStorage.getItem('BLINDERS_TOKEN_V25') || '',
  member: safeJson(localStorage.getItem('BLINDERS_MEMBER_V25')),
  route: location.pathname,
  game: new URLSearchParams(location.search).get('game') || 'crash',
  metrics: {
    tx: 0,
    bank: 0,
    fps: 60,
    load: 0,
    errors: 0
  },
  announcements: [
    '🏆 Blinders Cassino online — Banco IRIS ativo.',
    '🎮 Jogos com animação real rodando na engine.',
    '🏦 Depósito: EMSHBY.',
    '📱 Suporte/Admin WhatsApp: 5511951289502.'
  ]
};

function safeJson(value) {
  try { return JSON.parse(value || 'null'); } catch { return null; }
}

export function setSession(token, member) {
  State.token = token;
  State.member = member;
  localStorage.setItem('BLINDERS_TOKEN_V25', token || '');
  localStorage.setItem('BLINDERS_MEMBER_V25', JSON.stringify(member || null));
}

export function clearSession() {
  State.token = '';
  State.member = null;
  localStorage.removeItem('BLINDERS_TOKEN_V25');
  localStorage.removeItem('BLINDERS_MEMBER_V25');
}

export function isAdmin() {
  return Boolean(State.member && ['admin', 'owner'].includes(State.member.role));
}
