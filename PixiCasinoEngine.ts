import { useEffect, useRef } from 'react';
import { ChakraParticleEngine } from '../engines/ChakraParticleEngine';

interface StudioCanvasProps {
  className?: string;
  maxParticles?: number;
}

export const StudioCanvas = ({ className = '', maxParticles = 54 }: StudioCanvasProps) => {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const engine = new ChakraParticleEngine(ref.current, { maxParticles });
    engine.start();
    return () => engine.stop();
  }, [maxParticles]);

  return <canvas ref={ref} className={`pointer-events-none absolute inset-0 h-full w-full ${className}`} />;
};
