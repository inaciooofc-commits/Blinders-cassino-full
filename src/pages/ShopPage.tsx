import { motion } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';

const items = [
  ['Pergaminho do Vento', 'Skin de mesa', 1200],
  ['Kunai Neon', 'Ícone de perfil', 800],
  ['Manto Vermelho', 'Cosmético VIP', 2400],
  ['Selo Dourado', 'Badge raro', 1800],
  ['Orbe de Chakra', 'Boost visual', 950],
  ['Máscara Anbu', 'Avatar premium', 3100]
];

export const ShopPage = () => (
  <section className="grid gap-5">
    <header>
      <p className="text-sm font-bold tracking-[0.22em] text-orange-300">PERGAMINHOS & ITENS</p>
      <h2 className="text-3xl font-black tracking-[0.14em] text-yellow-200">Loja Shinobi</h2>
    </header>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map(([name, desc, price], index) => (
        <motion.article
          whileHover={{ y: -6 }}
          key={name}
          className="glass-panel rounded-[2rem] p-5"
        >
          <div className="mb-4 grid h-36 place-items-center rounded-3xl border border-yellow-400/20 bg-black/25">
            <ShoppingBag className="h-16 w-16 text-yellow-300" />
          </div>
          <h3 className="text-xl font-black text-yellow-200">{name}</h3>
          <p className="mt-2 text-sm text-stone-300">{desc}</p>
          <div className="mt-4 flex items-center justify-between">
            <span className="font-bold text-orange-200">{price} moedas</span>
            <button className="btn-primary px-4 py-2 text-sm">Comprar</button>
          </div>
        </motion.article>
      ))}
    </div>
  </section>
);
