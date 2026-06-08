import { useEffect, useRef } from 'react';
import { ThreeShowcaseEngine } from '../engines/ThreeShowcaseEngine';

interface ThreeShowcaseProps {
  className?: string;
}

export const ThreeShowcase = ({ className = '' }: ThreeShowcaseProps) => {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const engine = new ThreeShowcaseEngine(ref.current);
    engine.mount();
    return () => {
      engine.destroy();
    };
  }, []);

  return <div ref={ref} className={`min-h-[360px] overflow-hidden rounded-[2rem] ${className}`} />;
};
