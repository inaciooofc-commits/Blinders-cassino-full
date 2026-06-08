import { useEffect, useRef } from 'react';
import { PixiCasinoEngine, type PixiSceneKind } from '../engines/PixiCasinoEngine';

interface PixiStageProps {
  kind?: PixiSceneKind;
  className?: string;
}

export const PixiStage = ({ kind = 'lobby', className = '' }: PixiStageProps) => {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const engine = new PixiCasinoEngine(ref.current);
    engine.mount(kind);
    return () => {
      engine.destroy();
    };
  }, [kind]);

  return <div ref={ref} className={`min-h-[320px] overflow-hidden rounded-[2rem] ${className}`} />;
};
