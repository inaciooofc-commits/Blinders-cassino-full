import { Banknote, Dice5, Home, Menu, ShoppingBag, User } from 'lucide-react';

interface MobileNavProps {
  onNavigate: (view: string) => void;
}

export const MobileNav = ({ onNavigate }: MobileNavProps) => (
  <nav className="fixed bottom-3 left-3 right-3 z-50 grid grid-cols-5 gap-2 rounded-2xl border border-yellow-400/20 bg-black/80 p-2 backdrop-blur lg:hidden">
    <button onClick={() => onNavigate('home')} className="grid place-items-center text-xs text-yellow-200"><Home className="h-5 w-5" />Home</button>
    <button onClick={() => onNavigate('lobby')} className="grid place-items-center text-xs text-yellow-200"><Dice5 className="h-5 w-5" />Jogos</button>
    <button onClick={() => onNavigate('tables')} className="grid place-items-center text-xs text-yellow-200"><Banknote className="h-5 w-5" />Mesas</button>
    <button onClick={() => onNavigate('shop')} className="grid place-items-center text-xs text-yellow-200"><ShoppingBag className="h-5 w-5" />Loja</button>
    <button onClick={() => onNavigate('profile')} className="grid place-items-center text-xs text-yellow-200"><User className="h-5 w-5" />Perfil</button>
  </nav>
);
