export interface ChakraParticleOptions {
  maxParticles?: number;
  redRatio?: number;
  speed?: number;
  glow?: number;
}

type Particle = {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
};

export class ChakraParticleEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private raf = 0;
  private running = false;
  private options: Required<ChakraParticleOptions>;

  constructor(canvas: HTMLCanvasElement, options: ChakraParticleOptions = {}) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D indisponível.');
    this.canvas = canvas;
    this.ctx = ctx;
    this.options = {
      maxParticles: options.maxParticles ?? 54,
      redRatio: options.redRatio ?? 0.65,
      speed: options.speed ?? 0.42,
      glow: options.glow ?? 18
    };
    this.resize = this.resize.bind(this);
    this.tick = this.tick.bind(this);
  }

  start() {
    if (this.running) return;
    this.running = true;
    window.addEventListener('resize', this.resize, { passive: true });
    this.resize();
    this.raf = requestAnimationFrame(this.tick);
  }

  stop() {
    this.running = false;
    window.removeEventListener('resize', this.resize);
    cancelAnimationFrame(this.raf);
  }

  private resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    this.canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.spawn();
  }

  private spawn() {
    const rect = this.canvas.getBoundingClientRect();
    this.particles = Array.from({ length: this.options.maxParticles }, () => this.createParticle(rect.width, rect.height));
  }

  private createParticle(width: number, height: number): Particle {
    const red = Math.random() < this.options.redRatio;
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      r: 1.2 + Math.random() * 3.8,
      vx: (-0.25 + Math.random() * 0.5) * this.options.speed,
      vy: (-0.15 - Math.random() * 0.75) * this.options.speed,
      alpha: 0.18 + Math.random() * 0.52,
      color: red ? '255,69,0' : '41,169,255'
    };
  }

  private tick() {
    if (!this.running) return;
    const rect = this.canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    this.ctx.clearRect(0, 0, width, height);
    this.ctx.globalCompositeOperation = 'lighter';

    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.y < -12 || p.x < -12 || p.x > width + 12) {
        Object.assign(p, this.createParticle(width, height), { y: height + 8 });
      }
      const gradient = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * this.options.glow);
      gradient.addColorStop(0, `rgba(${p.color},${p.alpha})`);
      gradient.addColorStop(1, `rgba(${p.color},0)`);
      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.r * this.options.glow, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.globalCompositeOperation = 'source-over';
    this.raf = requestAnimationFrame(this.tick);
  }
}
