import { useState } from 'react';
import { LeafParticles } from '../components/LeafParticles';
import { Sidebar } from '../components/Sidebar';
import { MobileNav } from '../components/MobileNav';
import { TopTicker } from '../components/TopTicker';
import { Hero } from '../components/Hero';
import { GameLobby } from '../components/GameLobby';
import { Dashboard } from '../components/Dashboard';
import { SlotMachine } from '../games/SlotMachine';
import { RouletteGame } from '../games/RouletteGame';
import { BlackjackGame } from '../games/BlackjackGame';
import { SimpleGame } from '../games/SimpleGame';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { useCasinoActions } from '../hooks/useCasinoActions';
import type { GameKey } from '../types';
import { ShopPage } from './ShopPage';
import { VipPage } from './VipPage';
import { EventsPage } from './EventsPage';
import { AuthModal } from '../components/AuthModal';
import { StudioShowcase } from '../components/StudioShowcase';
import { ReleaseBadge } from '../components/ReleaseBadge';
import { isSupabaseConfigured } from '../lib/supabase';

export const MainApp = () => {
  const auth = useAuth();
  const [view, setView] = useState('home');
  const [activeGame, setActiveGame] = useState<GameKey>('slots');
  const { profile, bets, setProfile } = useProfile(auth.user?.id);
  const actions = useCasinoActions(profile, setProfile);

  const openGame = (game: GameKey) => {
    setActiveGame(game);
    setView(game === 'slots' ? 'slots' : 'game');
  };

  const settle = async (gameKey: GameKey, bet: number, payout: number, result: string) => {
    await actions.settleBet(gameKey, bet, payout, result);
  };

  if (!auth.loading && !auth.session && isSupabaseConfigured) {
    return <AuthModal onSignIn={auth.signIn} onSignUp={auth.signUp} onGoogle={auth.signInWithGoogle} />;
  }

  const renderContent = () => {
    if (view === 'home') return <><Hero profile={profile} onPlay={() => setView('lobby')} /><StudioShowcase /><Dashboard profile={profile} bets={bets} /></>;
    if (view === 'lobby') return <GameLobby onOpenGame={openGame} />;
    if (view === 'slots') return <SlotMachine profile={profile} onSettle={(bet, payout, result) => settle('slots', bet, payout, result)} />;
    if (view === 'game' && activeGame === 'roulette') return <RouletteGame profile={profile} onSettle={(bet, payout, result) => settle('roulette', bet, payout, result)} />;
    if (view === 'game' && activeGame === 'blackjack') return <BlackjackGame profile={profile} onSettle={(bet, payout, result) => settle('blackjack', bet, payout, result)} />;
    if (view === 'game') return <SimpleGame gameKey={activeGame} profile={profile} onSettle={(bet, payout, result) => settle(activeGame, bet, payout, result)} />;
    if (view === 'tables') return <GameLobby onOpenGame={openGame} />;
    if (view === 'vip') return <VipPage />;
    if (view === 'shop') return <ShopPage />;
    if (view === 'profile') return <Dashboard profile={profile} bets={bets} />;
    if (view === 'events') return <EventsPage />;
    if (view === 'studio') return <StudioShowcase />;
    return <Hero profile={profile} onPlay={() => setView('lobby')} />;
  };

  return (
    <main className="studio-lobby-bg v4-force-layout min-h-screen">
      <ReleaseBadge />
      <LeafParticles />
      <Sidebar active={view} profile={profile} onNavigate={setView} onSignOut={auth.signOut} />
      <MobileNav onNavigate={setView} />
      <section className="relative z-10 min-h-screen lg:pl-[284px]">
        <TopTicker />
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-yellow-500/10 bg-black/45 px-4 backdrop-blur lg:px-8">
          <div>
            <p className="text-xs text-stone-400">Bem-vindo</p>
            <h2 className="font-black tracking-[0.14em] text-yellow-200">{profile.display_name}</h2>
          </div>
          <button onClick={() => setView('lobby')} className="btn-primary hidden md:block">Jogar Agora</button>
        </header>
        <div className="grid gap-6 p-4 pb-24 md:p-8">
          {!isSupabaseConfigured && (
            <div className="rounded-2xl border border-yellow-400/25 bg-yellow-950/20 p-4 text-sm text-yellow-100">
              Supabase ainda não está configurado. O app está rodando em modo demo local; configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para ativar Auth e DB.
            </div>
          )}
          {renderContent()}
        </div>
      </section>
    </main>
  );
};
