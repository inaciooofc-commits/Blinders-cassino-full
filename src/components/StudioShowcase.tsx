import { motion } from 'framer-motion';
import { PixiStage } from './PixiStage';
import { ThreeShowcase } from './ThreeShowcase';
import { studioAssets } from '../lib/studioAssets';

export const StudioShowcase = () => (
  <section className="grid gap-4 xl:grid-cols-[1.1fr_.9fr]">
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel overflow-hidden rounded-[2rem] p-5"
      style={{
        backgroundImage: `linear-gradient(90deg, rgba(5,2,10,.82), rgba(5,2,10,.35)), url(${studioAssets.backgrounds.lounge})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="mb-4">
        <p className="text-sm font-bold tracking-[0.22em] text-orange-300">MOTOR 3D INDEPENDENTE</p>
        <h2 className="text-3xl font-black tracking-[0.14em] text-yellow-200">Mesa AAA Procedural</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-200">
          Modelo 3D em Three.js com mesa, roleta, fichas, cartas, cristal e selo orbital renderizados sem depender do backend.
        </p>
      </div>
      <ThreeShowcase className="model-frame min-h-[420px] border border-yellow-400/20 bg-black/35" />
    </motion.article>

    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: .08 }}
      className="glass-panel rounded-[2rem] p-5"
    >
      <p className="text-sm font-bold tracking-[0.22em] text-orange-300">MOTOR 2D WEBGL</p>
      <h2 className="text-3xl font-black tracking-[0.14em] text-yellow-200">Pixi Casino Stage</h2>
      <p className="mt-2 text-sm leading-6 text-stone-300">
        Cena 2D isolada em PixiJS para lobby, roleta, slots e blackjack.
      </p>
      <PixiStage kind="lobby" className="mt-4 border border-yellow-400/20 bg-black/35" />
      <div className="mt-4 grid grid-cols-6 gap-2">
        {Object.entries(studioAssets.icons).slice(0, 18).map(([name, src]) => (
          <img key={name} src={src} alt={name} className="rounded-xl border border-yellow-400/10 bg-black/35 p-1" />
        ))}
      </div>
    </motion.article>
  </section>
);
