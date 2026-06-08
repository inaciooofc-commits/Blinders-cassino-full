import { useEffect, useMemo, useRef, useState } from 'react';
import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import { gsap } from 'gsap';
import { slotPayout } from '../lib/casinoMath';
import { slotSymbols } from '../data/games';
import type { UserProfile } from '../types';

interface SlotMachineProps {
  profile: UserProfile;
  onSettle: (bet: number, payout: number, result: string) => Promise<void>;
}

const symbolColor: Record<string, number> = {
  chakra: 0x29a9ff,
  kunai: 0xc0c0c0,
  scroll: 0xffd700,
  leaf: 0x228b22,
  fox: 0xff4500,
  eye: 0x8b0000,
  ramen: 0xf7c56a
};

export const SlotMachine = ({ profile, onSettle }: SlotMachineProps) => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<Application | null>(null);
  const reelTexts = useRef<Text[]>([]);
  const [bet, setBet] = useState(25);
  const [spinning, setSpinning] = useState(false);
  const [message, setMessage] = useState('Escolha sua aposta e gire os reels de chakra.');

  const safeBet = useMemo(() => Math.max(1, Math.min(bet, profile.balance)), [bet, profile.balance]);

  useEffect(() => {
    let destroyed = false;

    const setup = async () => {
      if (!hostRef.current) return;

      const app = new Application();
      await app.init({
        width: Math.min(900, hostRef.current.clientWidth || 900),
        height: 360,
        backgroundAlpha: 0,
        antialias: true,
        resolution: Math.min(window.devicePixelRatio, 2)
      });

      if (destroyed || !hostRef.current) {
        app.destroy(true);
        return;
      }

      hostRef.current.innerHTML = '';
      hostRef.current.appendChild(app.canvas);
      appRef.current = app;

      const stage = new Container();
      app.stage.addChild(stage);

      const frame = new Graphics();
      frame.roundRect(40, 35, app.screen.width - 80, 270, 24);
      frame.fill({ color: 0x080410, alpha: 0.72 });
      frame.stroke({ color: 0xffd700, alpha: 0.35, width: 3 });
      stage.addChild(frame);

      const style = new TextStyle({
        fill: '#fff7df',
        fontSize: 34,
        fontWeight: '900',
        letterSpacing: 2
      });

      reelTexts.current = [];

      [0, 1, 2].forEach(index => {
        const reel = new Graphics();
        const x = app.screen.width / 2 - 240 + index * 240;
        reel.roundRect(x, 80, 160, 160, 18);
        reel.fill({ color: 0x13081f, alpha: 0.95 });
        reel.stroke({ color: 0xff4500, alpha: 0.5, width: 3 });
        stage.addChild(reel);

        const label = new Text({
          text: 'chakra',
          style
        });
        label.anchor.set(0.5);
        label.x = x + 80;
        label.y = 160;
        stage.addChild(label);
        reelTexts.current.push(label);
      });

      app.ticker.add(() => {
        stage.rotation = Math.sin(performance.now() / 1800) * 0.003;
      });
    };

    setup();

    return () => {
      destroyed = true;
      appRef.current?.destroy(true);
      appRef.current = null;
      reelTexts.current = [];
    };
  }, []);

  const spin = async () => {
    if (spinning) return;
    if (safeBet <= 0) return;
    setSpinning(true);
    setMessage('Reels carregando chakra...');

    const result = Array.from({ length: 3 }, () => slotSymbols[Math.floor(Math.random() * slotSymbols.length)]);

    reelTexts.current.forEach((text, index) => {
      gsap.to(text, {
        y: text.y + 60,
        alpha: 0.2,
        duration: 0.18,
        repeat: 8 + index * 4,
        yoyo: true,
        ease: 'power2.inOut',
        onRepeat: () => {
          const randomSymbol = slotSymbols[Math.floor(Math.random() * slotSymbols.length)];
          text.text = randomSymbol;
          text.style.fill = symbolColor[randomSymbol] ? `#${symbolColor[randomSymbol].toString(16).padStart(6, '0')}` : '#fff7df';
        },
        onComplete: async () => {
          text.text = result[index];
          text.style.fill = `#${symbolColor[result[index]].toString(16).padStart(6, '0')}`;
          if (index === 2) {
            const { payout, result: resultLabel } = slotPayout(result, safeBet);
            setMessage(payout > 0 ? `Vitória: ${payout.toFixed(2)} moedas ninja.` : 'Sem combinação. Tente novamente.');
            await onSettle(safeBet, payout, resultLabel);
            setSpinning(false);
          }
        }
      });
    });
  };

  return (
    <section className="glass-panel rounded-[2rem] p-5">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-bold tracking-[0.22em] text-orange-300">FOREST OF TRIALS</p>
          <h2 className="text-3xl font-black tracking-[0.14em] text-yellow-200">Rasengan Reels</h2>
        </div>
        <div className="flex gap-2">
          <input className="input-ninja w-32" type="number" value={bet} min={1} onChange={e => setBet(Number(e.target.value))} />
          <button disabled={spinning} onClick={spin} className="btn-primary disabled:opacity-50">
            {spinning ? 'Girando...' : 'Girar'}
          </button>
        </div>
      </div>
      <div ref={hostRef} className="min-h-[360px] overflow-hidden rounded-3xl border border-yellow-400/20 bg-black/25" />
      <p className="mt-4 rounded-2xl border border-white/5 bg-black/25 p-4 text-stone-200">{message}</p>
    </section>
  );
};
