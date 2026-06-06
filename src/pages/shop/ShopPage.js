import { shell, bindShellActions, escapeHtml, toast } from '../../core/UI.js';
import { rpc } from '../../api/rpc.js';

const fallback = [
  { icon:'◈', title:'Moldura Prata', description:'Visual seguro para perfil', priceLabel:'1.5T', rarity:'rare' },
  { icon:'♛', title:'Título VIP', description:'Título exibido no perfil', priceLabel:'2T', rarity:'rare' },
  { icon:'✦', title:'Badge Evento', description:'Insígnia rara', priceLabel:'3T', rarity:'epic' },
  { icon:'▣', title:'Fundo Perfil', description:'Fundo visual seguro', priceLabel:'2.5T', rarity:'rare' }
];

export function ShopPage() {
  return shell(`
    <section class="shop-hero premium-card">
      <h2>🛒 Loja Visual</h2>
      <p>Itens seguros: títulos, molduras, badges e fundos. Sem troca de ícones para não quebrar o site.</p>
    </section>
    <section class="shop-grid" id="shopGrid">
      ${renderItems(fallback)}
    </section>
  `, { title: 'Loja Visual', subtitle: 'Itens seguros com visual premium.', bg: 'lobby' });
}

export function bindShopPage() {
  bindShellActions();
  loadShop();
}

async function loadShop() {
  try {
    const data = await rpc('app_public_shop_visual', {});
    const items = data.items?.length ? data.items : fallback;
    document.querySelector('#shopGrid').innerHTML = renderItems(items);
  } catch (error) {
    toast('Loja em modo local. Rode SQL V13 para dados reais.', 'bad');
  }
}

function renderItems(items) {
  return items.map(item => `
    <article class="shop-item visual-shop-item">
      <div class="shop-icon">${escapeHtml(item.icon || '◈')}</div>
      <h2>${escapeHtml(item.title || item.name || 'Item')}</h2>
      <p>${escapeHtml(item.description || '')}</p>
      <span class="rarity ${escapeHtml(item.rarity || 'common')}">${escapeHtml(item.rarity || 'common')}</span>
      <b>${escapeHtml(item.priceLabel || item.price || '0')}</b>
      <button class="primary">🛒 Comprar</button>
    </article>
  `).join('');
}
