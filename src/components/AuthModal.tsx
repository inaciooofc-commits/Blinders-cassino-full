import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Shield, UserPlus } from 'lucide-react';
import { studioAssets } from '../lib/studioAssets';
import { ReleaseBadge } from './ReleaseBadge';

interface AuthModalProps {
  onSignIn: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string, displayName: string) => Promise<void>;
  onGoogle: () => Promise<void>;
}

export const AuthModal = ({ onSignIn, onSignUp, onGoogle }: AuthModalProps) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('shinobi@blinders.local');
  const [password, setPassword] = useState('chakra123');
  const [displayName, setDisplayName] = useState('ShinobiMaster');
  const [error, setError] = useState('');

  const submit = async () => {
    setError('');
    try {
      if (mode === 'login') await onSignIn(email, password);
      else await onSignUp(email, password, displayName);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha na autenticação.');
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-8" style={{ backgroundImage: `linear-gradient(90deg, rgba(5,2,10,.86), rgba(5,2,10,.38), rgba(5,2,10,.86)), url(${studioAssets.backgrounds.control})`, backgroundSize: "cover", backgroundPosition: "center" }}>
      <ReleaseBadge />
      <div className="absolute inset-0 opacity-40" style={{ background: 'radial-gradient(circle at center, transparent 0 18%, rgba(255,69,0,.18) 19%, transparent 20%, transparent 30%, rgba(255,215,0,.12) 31%, transparent 32%)', animation: 'sealPulse 4s ease-in-out infinite' }} />
      <motion.section initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel relative z-10 mx-auto mt-10 max-w-[520px] rounded-[2rem] p-6 md:mt-20 md:p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto grid h-24 w-24 place-items-center rounded-full border border-yellow-300/40 bg-red-950/60 chakra-glow">
            <img src={studioAssets.icons.login} alt="Login" className="h-16 w-16 object-contain" />
          </div>
          <h1 className="mt-4 text-4xl font-black tracking-[0.24em] text-yellow-200">BLINDERS</h1>
          <p className="tracking-[0.3em] text-orange-300">NINJA CASINO</p>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-2 rounded-2xl bg-black/30 p-1">
          <button onClick={() => setMode('login')} className={`rounded-xl py-3 text-sm font-bold ${mode === 'login' ? 'bg-orange-600/40 text-yellow-200' : 'text-stone-300'}`}>Login</button>
          <button onClick={() => setMode('register')} className={`rounded-xl py-3 text-sm font-bold ${mode === 'register' ? 'bg-orange-600/40 text-yellow-200' : 'text-stone-300'}`}>Registro</button>
        </div>

        <div className="grid gap-3">
          {mode === 'register' && (
            <label className="grid gap-1 text-sm text-stone-300">
              Nome Shinobi
              <input className="input-ninja" value={displayName} onChange={e => setDisplayName(e.target.value)} />
            </label>
          )}
          <label className="grid gap-1 text-sm text-stone-300">
            Email
            <input className="input-ninja" type="email" value={email} onChange={e => setEmail(e.target.value)} />
          </label>
          <label className="grid gap-1 text-sm text-stone-300">
            Senha
            <input className="input-ninja" type="password" value={password} onChange={e => setPassword(e.target.value)} />
          </label>
          {error && <p className="rounded-xl border border-red-500/30 bg-red-950/30 p-3 text-sm text-red-200">{error}</p>}
          <button className="btn-primary" onClick={submit}>
            {mode === 'login' ? 'Entrar na Vila' : 'Criar Registro Shinobi'}
          </button>
          <button className="btn-ghost flex items-center justify-center gap-2" onClick={onGoogle}>
            <Mail className="h-4 w-4" />
            Entrar com Google
          </button>
        </div>

        <p className="mt-5 text-center text-xs text-stone-400">
          Use credenciais próprias do app. Não use senhas reais de outros serviços.
        </p>
      </motion.section>
    </main>
  );
};
