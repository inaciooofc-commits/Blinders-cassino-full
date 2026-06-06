export const Performance = {
  timers: new Set(),
  lowMode: false,

  detect() {
    const cores = navigator.hardwareConcurrency || 4;
    const memory = navigator.deviceMemory || 4;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches || false;
    const android = /Android/i.test(navigator.userAgent);
    this.lowMode = reduced || cores <= 2 || memory <= 2 || (android && memory <= 4);
    document.documentElement.classList.toggle('low-performance', this.lowMode);
    return this.lowMode;
  },

  interval(fn, ms) {
    const safeMs = this.lowMode ? Math.max(ms, 1800) : ms;
    const id = setInterval(() => {
      if (document.hidden) return;
      try { fn(); } catch (error) { console.warn('[Performance interval]', error); }
    }, safeMs);
    this.timers.add(id);
    return id;
  },

  timeout(fn, ms) {
    const id = setTimeout(() => {
      this.timers.delete(id);
      try { fn(); } catch (error) { console.warn('[Performance timeout]', error); }
    }, ms);
    this.timers.add(id);
    return id;
  },

  cleanup() {
    for (const id of this.timers) {
      clearInterval(id);
      clearTimeout(id);
    }
    this.timers.clear();
  },

  idle(fn) {
    if ('requestIdleCallback' in window) {
      return requestIdleCallback(fn, { timeout: 1200 });
    }
    return this.timeout(fn, 80);
  }
};

Performance.detect();
window.addEventListener('visibilitychange', () => {
  document.documentElement.classList.toggle('tab-hidden', document.hidden);
});
