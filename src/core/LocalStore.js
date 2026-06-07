const KEY = 'blinders_final_local_state';

const initialState = {
  sqlConnected: false,
  sqlMessage: 'Modo local ativo.',
  member: {
    nick: 'KageShinobi',
    iris: 'IRIS-KAGE-777',
    friendCode: 'KS-777',
    phone: '',
    role: 'admin'
  },
  balance: 25430.75,
  locked: 0,
  vipPoints: 12870,
  jackpot: 125347.89,
  transactions: [],
  inventory: ['VIP Diamante', 'Badge Blinders', 'Moldura Neon'],
  ranking: [
    ['Shinigami_7', 245780],
    ['KageShinobi', 189430],
    ['AzulNeon', 153920],
    ['ShadowBR', 99875],
    ['IrisQueen', 87610]
  ],
  missions: {},
  audit: []
};

export function loadLocal() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (!raw) return clone(initialState);
    return {
      ...clone(initialState),
      ...raw,
      member: { ...initialState.member, ...(raw.member || {}) },
      transactions: Array.isArray(raw.transactions) ? raw.transactions : [],
      inventory: Array.isArray(raw.inventory) ? raw.inventory : clone(initialState.inventory),
      ranking: Array.isArray(raw.ranking) ? raw.ranking : clone(initialState.ranking),
      missions: raw.missions && typeof raw.missions === 'object' ? raw.missions : {},
      audit: Array.isArray(raw.audit) ? raw.audit : []
    };
  } catch {
    return clone(initialState);
  }
}

export function saveLocal(state) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function resetLocal() {
  localStorage.removeItem(KEY);
  return loadLocal();
}

function clone(value) {
  try { return structuredClone(value); }
  catch { return JSON.parse(JSON.stringify(value)); }
}
