export const RuntimePerformance = {
  low: false,
  ultraLow: false,
  visibilityPaused: false,

  init() {
    const cores = navigator.hardwareConcurrency || 4;
    const memory = navigator.deviceMemory || 4;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches || false;
    const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    this.low = reduced || cores <= 4 || memory <= 4 || mobile;
    this.ultraLow = reduced || cores <= 2 || memory <= 2;

    document.documentElement.classList.toggle('perf-low', this.low);
    document.documentElement.classList.toggle('perf-ultra-low', this.ultraLow);

    document.addEventListener('visibilitychange', () => {
      this.visibilityPaused = document.hidden;
      document.documentElement.classList.toggle('tab-hidden', document.hidden);
      window.dispatchEvent(new CustomEvent('blinders:visibility-performance', {
        detail: { hidden: document.hidden }
      }));
    });

    return this;
  },

  pixiResolution() {
    if (this.ultraLow) return 1;
    if (this.low) return Math.min(devicePixelRatio || 1, 1.25);
    return Math.min(devicePixelRatio || 1, 2);
  },

  pixiAntialias() {
    return !this.ultraLow;
  },

  animationDelay(base) {
    if (this.ultraLow) return Math.round(base * 1.65);
    if (this.low) return Math.round(base * 1.25);
    return base;
  },

  particleCount(base) {
    if (this.ultraLow) return Math.max(2, Math.floor(base * 0.25));
    if (this.low) return Math.max(4, Math.floor(base * 0.5));
    return base;
  }
};

RuntimePerformance.init();
