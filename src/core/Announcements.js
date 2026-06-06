import { supabase } from '../config/supabase.js';
import { State } from './State.js';
import { escapeHtml, startTicker } from './UI.js';

let loading = false;

export async function loadAnnouncements() {
  if (loading) return State.announcements;
  loading = true;

  try {
    const { data, error } = await supabase.rpc('app_public_announcements');
    if (!error && Array.isArray(data) && data.length) {
      State.announcements = data.map(item => item.message || String(item)).filter(Boolean);
      updateTickerDom();
    }
  } catch (error) {
    console.warn('[Announcements]', error);
  } finally {
    loading = false;
  }

  return State.announcements;
}

export function updateTickerDom() {
  const messages = State.announcements?.length ? State.announcements : [
    '🏆 Blinders Cassino online — Banco IRIS ativo.',
    '🎮 Jogos com animação real rodando na engine.',
    '🏦 Depósito: EMSHBY.',
    '📱 Suporte/Admin WhatsApp: 5511951289502.'
  ];

  const html = [...messages, ...messages, ...messages, ...messages]
    .map(msg => `<span>${escapeHtml(msg)}</span>`)
    .join('');

  document.querySelectorAll('[data-ticker-track]').forEach(track => {
    track.innerHTML = html;
    track.style.transform = 'translate3d(0,0,0)';
    track.closest('[data-ticker]')?.removeAttribute('data-ready');
  });

  startTicker();
}
