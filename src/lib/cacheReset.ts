const RELEASE_KEY = 'blinders_release_cache_reset_4.1.0';

export const resetLegacyBlindersCache = async () => {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem(RELEASE_KEY) === 'done') return;

  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(registration => registration.unregister()));
    }

    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter(key => key.toLowerCase().includes('blinders') || key.toLowerCase().includes('vite') || key.toLowerCase().includes('casino'))
          .map(key => caches.delete(key))
      );
    }

    localStorage.setItem(RELEASE_KEY, 'done');
  } catch (error) {
    console.warn('Cache antigo não pôde ser limpo automaticamente.', error);
  }
};
