import { toast } from './UI.js';

const STORAGE_KEY = 'BLINDERS_YOUTUBE_RADIO_V8';

let mounted = false;
let player = null;

export function mountYouTubeRadio() {
  if (mounted || document.querySelector('#youtubeRadioDock')) return;
  mounted = true;

  const saved = getSavedTrack();
  const dock = document.createElement('section');
  dock.id = 'youtubeRadioDock';
  dock.className = 'youtube-radio-dock collapsed';
  dock.innerHTML = `
    <button class="youtube-radio-toggle" id="youtubeRadioToggle" type="button">♪ Rádio</button>
    <div class="youtube-radio-panel">
      <div>
        <b>♪ Rádio / Fundo YouTube</b>
        <small>Use vídeo/playlist do YouTube. O som começa após clique do usuário.</small>
      </div>
      <label>URL do YouTube
        <input id="youtubeRadioUrl" value="${escapeAttr(saved.url || '')}" placeholder="https://www.youtube.com/watch?v=...">
      </label>
      <div class="youtube-radio-actions">
        <button class="primary" id="youtubeRadioPlay" type="button">▶ Tocar</button>
        <button class="ghost" id="youtubeRadioStop" type="button">⏸ Parar</button>
        <button class="ghost" id="youtubeRadioSave" type="button">💾 Salvar</button>
      </div>
      <div id="youtubePlayerHost" class="youtube-player-host"></div>
    </div>
  `;

  document.body.appendChild(dock);

  dock.querySelector('#youtubeRadioToggle')?.addEventListener('click', () => {
    dock.classList.toggle('collapsed');
  });

  dock.querySelector('#youtubeRadioSave')?.addEventListener('click', () => {
    const url = dock.querySelector('#youtubeRadioUrl')?.value || '';
    saveTrack({ url });
    toast('Rádio salva neste dispositivo', 'good');
  });

  dock.querySelector('#youtubeRadioPlay')?.addEventListener('click', () => {
    const url = dock.querySelector('#youtubeRadioUrl')?.value || '';
    saveTrack({ url });
    playYouTube(url);
  });

  dock.querySelector('#youtubeRadioStop')?.addEventListener('click', () => {
    stopYouTube();
  });

  window.addEventListener('blinders:music-updated', event => {
    const url = event.detail?.url || '';
    if (url) {
      const input = dock.querySelector('#youtubeRadioUrl');
      if (input) input.value = url;
      saveTrack({ url });
      dock.classList.remove('collapsed');
      toast('Rádio YouTube atualizada pelo Admin', 'good');
    }
  });
}

export function saveTrack(track) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(track || {}));
}

export function getSavedTrack() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
  catch { return {}; }
}

function playYouTube(url) {
  const id = parseYouTube(url);
  if (!id) {
    toast('URL do YouTube inválida.', 'bad');
    return;
  }

  const host = document.querySelector('#youtubePlayerHost');
  if (!host) return;

  const isPlaylist = id.type === 'playlist';
  const src = isPlaylist
    ? `https://www.youtube.com/embed/videoseries?list=${encodeURIComponent(id.value)}&autoplay=1&loop=1&controls=1`
    : `https://www.youtube.com/embed/${encodeURIComponent(id.value)}?autoplay=1&loop=1&playlist=${encodeURIComponent(id.value)}&controls=1`;

  host.innerHTML = `
    <iframe
      title="Blinders Rádio YouTube"
      src="${src}"
      allow="autoplay; encrypted-media; picture-in-picture"
      allowfullscreen
      loading="lazy"></iframe>
  `;

  player = host.querySelector('iframe');
  toast('Rádio YouTube iniciada', 'good');
}

function stopYouTube() {
  const host = document.querySelector('#youtubePlayerHost');
  if (host) host.innerHTML = '';
  player = null;
  toast('Rádio parada', 'good');
}

function parseYouTube(url) {
  try {
    const value = String(url || '').trim();
    if (!value) return null;

    if (/^[a-zA-Z0-9_-]{11}$/.test(value)) return { type: 'video', value };

    const u = new URL(value);
    const list = u.searchParams.get('list');
    if (list) return { type: 'playlist', value: list };

    if (u.hostname.includes('youtu.be')) {
      const v = u.pathname.split('/').filter(Boolean)[0];
      if (v) return { type: 'video', value: v };
    }

    const v = u.searchParams.get('v');
    if (v) return { type: 'video', value: v };

    const embed = u.pathname.match(/\/embed\/([a-zA-Z0-9_-]+)/);
    if (embed?.[1]) return { type: 'video', value: embed[1] };
  } catch {}
  return null;
}

function escapeAttr(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[c]));
}
